import uuid
from pathlib import Path
from typing import List, Dict
import chromadb
from chromadb.config import Settings
from app.core.logging import logger
from app.utils.model_cache import get_sentence_transformer


def chunk_segments(segments: List[Dict], max_words: int = 220, overlap_words: int = 40) -> List[Dict]:
    """
    Build chunks by concatenating segment texts until max_words.
    Keep overlap by reusing last overlap_words words in next chunk.
    """
    if not segments:
        return []
    
    logger.info(f"Chunking {len(segments)} segments (max_words={max_words}, overlap={overlap_words})")
    
    chunks = []
    current_chunk_words = []
    current_start = None
    current_end = None
    chunk_id = 0
    
    for segment in segments:
        text = segment.get("text", "").strip()
        if not text:
            continue
        
        start = segment.get("start", 0.0)
        end = segment.get("end", 0.0)
        
        # Set initial start time
        if current_start is None:
            current_start = start
        
        words = text.split()
        
        for word in words:
            current_chunk_words.append(word)
            current_end = end
            
            # Check if we've reached max_words
            if len(current_chunk_words) >= max_words:
                # Create chunk
                chunk_text = " ".join(current_chunk_words)
                chunks.append({
                    "chunk_id": f"chunk_{chunk_id}",
                    "text": chunk_text,
                    "start": current_start,
                    "end": current_end
                })
                chunk_id += 1
                
                # Keep overlap words for next chunk
                if overlap_words > 0 and len(current_chunk_words) > overlap_words:
                    current_chunk_words = current_chunk_words[-overlap_words:]
                    # Update start time to approximate position of overlap
                    current_start = start  # Approximate: use segment start
                else:
                    current_chunk_words = []
                    current_start = None
    
    # Add remaining words as final chunk
    if current_chunk_words:
        chunk_text = " ".join(current_chunk_words)
        chunks.append({
            "chunk_id": f"chunk_{chunk_id}",
            "text": chunk_text,
            "start": current_start if current_start is not None else 0.0,
            "end": current_end if current_end is not None else 0.0
        })
    
    logger.info(f"Created {len(chunks)} chunks")
    return chunks


def get_chroma_client() -> chromadb.PersistentClient:
    """Get persistent ChromaDB client, ensuring storage directory exists."""
    storage_path = Path("storage/chroma")
    storage_path.mkdir(parents=True, exist_ok=True)
    
    client = chromadb.PersistentClient(
        path=str(storage_path),
        settings=Settings(anonymized_telemetry=False)
    )
    return client


def build_vector_index(meeting_id: str, segments: List[Dict]) -> str:
    """
    Build vector index from transcript segments.
    Returns collection name.
    """
    logger.info(f"Building vector index for meeting: {meeting_id}")
    
    # Chunk segments
    chunks = chunk_segments(segments)
    if not chunks:
        raise ValueError("No chunks created from segments")
    
    # Get ChromaDB client
    client = get_chroma_client()
    
    # Collection name
    collection_name = f"meeting_{meeting_id}_v1"
    
    # Get or create collection
    try:
        collection = client.get_collection(name=collection_name)
        # Delete existing collection to rebuild
        client.delete_collection(name=collection_name)
        logger.info(f"Deleted existing collection: {collection_name}")
    except Exception:
        pass  # Collection doesn't exist, which is fine
    
    collection = client.create_collection(name=collection_name)
    
    # Get cached embedding model
    model = get_sentence_transformer()
    
    # Prepare data for upsert
    ids = []
    documents = []
    metadatas = []
    embeddings = []
    
    for chunk in chunks:
        chunk_id = f"{meeting_id}_{chunk['chunk_id']}"
        ids.append(chunk_id)
        documents.append(chunk["text"])
        metadatas.append({
            "start": chunk["start"],
            "end": chunk["end"]
        })
    
    # Generate embeddings in batch
    logger.info(f"Generating embeddings for {len(documents)} chunks")
    embeddings = model.encode(documents, show_progress_bar=False).tolist()
    
    # Upsert into ChromaDB
    collection.add(
        ids=ids,
        embeddings=embeddings,
        documents=documents,
        metadatas=metadatas
    )
    
    logger.info(f"Vector index built successfully. Collection: {collection_name}")
    return collection_name


def retrieve_context(meeting_id: str, question: str, top_k: int = 5) -> Dict:
    """
    Retrieve relevant context chunks for a question.
    """
    logger.info(f"Retrieving context for question (top_k={top_k})")
    
    # Get ChromaDB client
    client = get_chroma_client()
    collection_name = f"meeting_{meeting_id}_v1"
    
    try:
        collection = client.get_collection(name=collection_name)
    except Exception as e:
        raise ValueError(f"Collection {collection_name} not found. Meeting may not be indexed yet.") from e
    
    # Get cached embedding model
    model = get_sentence_transformer()
    
    # Embed question
    question_embedding = model.encode([question], show_progress_bar=False).tolist()[0]
    
    # Query ChromaDB
    results = collection.query(
        query_embeddings=[question_embedding],
        n_results=top_k
    )
    
    # Format results
    chunks = []
    if results["ids"] and len(results["ids"]) > 0:
        for i in range(len(results["ids"][0])):
            chunks.append({
                "start": results["metadatas"][0][i]["start"],
                "end": results["metadatas"][0][i]["end"],
                "text": results["documents"][0][i]
            })
    
    logger.info(f"Retrieved {len(chunks)} chunks")
    return {"chunks": chunks}


def answer_question_extractive(meeting_id: str, question: str) -> Dict:
    """
    Answer question using extractive approach from retrieved chunks.
    """
    logger.info(f"Answering question for meeting: {meeting_id}")
    
    # Retrieve context
    context = retrieve_context(meeting_id, question, top_k=5)
    chunks = context.get("chunks", [])
    
    if not chunks:
        return {
            "answer": "No relevant information found in the meeting transcript.",
            "sources": []
        }
    
    # Get top chunk
    top_chunk = chunks[0]
    top_text = top_chunk["text"]
    
    # Form answer based on question type
    question_lower = question.lower()
    
    if any(word in question_lower for word in ["what", "summary", "discussed", "talked about", "covered"]):
        # For "what" questions, create a concise paraphrase
        # Simple heuristic: take first 1-2 sentences or first 150 chars
        sentences = top_text.split(". ")
        if len(sentences) >= 2:
            answer = ". ".join(sentences[:2])
            if not answer.endswith("."):
                answer += "."
        else:
            # Take first 150 chars
            answer = top_text[:150]
            if len(top_text) > 150:
                answer += "..."
    else:
        # For other questions, use the chunk text directly
        answer = f"Based on the meeting: {top_text}"
    
    # Format sources
    sources = [
        {
            "start": chunk["start"],
            "end": chunk["end"],
            "text": chunk["text"]
        }
        for chunk in chunks
    ]
    
    return {
        "answer": answer,
        "sources": sources
    }
