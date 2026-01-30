import re
from typing import List, Dict
from app.core.logging import logger
from app.utils.model_cache import get_summarization_pipeline


def chunk_text(text: str, max_tokens: int = 900) -> List[str]:
    """
    Naive text chunking by sentences/paragraphs to keep token count manageable.
    """
    if not text:
        return []

    # Split by sentences (simple regex on punctuation) then re-group into chunks
    sentences = re.split(r"(?<=[.!?])\s+", text.strip())
    chunks: List[str] = []
    current: List[str] = []

    for sentence in sentences:
        # rough token estimate: words count
        est_tokens = len(" ".join(current + [sentence]).split())
        if est_tokens > max_tokens and current:
            chunks.append(" ".join(current))
            current = [sentence]
        else:
            current.append(sentence)

    if current:
        chunks.append(" ".join(current))

    return chunks


def summarize_text(text: str) -> Dict:
    """
    Summarize text using BART model. Returns short bullets and detailed summary.
    """
    if not text:
        return {"short_bullets": [], "detailed": ""}

    logger.info("Running summarization with BART (facebook/bart-large-cnn)")
    summarizer = get_summarization_pipeline()

    # Summarize full text into one detailed summary
    detailed_summary = summarizer(
        text,
        max_length=200,
        min_length=60,
        do_sample=False,
    )[0]["summary_text"]

    # Generate short bullet-style summaries by chunking
    chunks = chunk_text(text)
    bullets: List[str] = []
    for chunk in chunks:
        short_sum = summarizer(
            chunk,
            max_length=60,
            min_length=20,
            do_sample=False,
        )[0]["summary_text"]
        bullets.append(short_sum)

    # Trim to 5-7 bullets
    bullets = bullets[:7]
    return {
        "short_bullets": bullets,
        "detailed": detailed_summary,
    }


def extract_topics(text: str) -> List[str]:
    """
    Simple heuristic topic extraction: pick top nouns/keywords by frequency/length.
    """
    if not text:
        return []

    words = re.findall(r"[A-Za-z]{4,}", text.lower())
    stop = {"this", "that", "with", "have", "will", "from", "they", "them", "were", "would", "could", "there"}
    freq: Dict[str, int] = {}
    for w in words:
        if w in stop:
            continue
        freq[w] = freq.get(w, 0) + 1

    # sort by frequency then alphabetically
    topics = sorted(freq.items(), key=lambda kv: (-kv[1], kv[0]))
    return [t[0] for t in topics[:5]]


def extract_decisions(text: str) -> List[str]:
    """
    Extract decision-like sentences by matching common decision phrases.
    """
    if not text:
        return []

    decision_phrases = [
        "we decided",
        "final decision",
        "we will",
        "we agreed",
        "plan is",
        "we choose",
        "agreement is",
    ]
    sentences = re.split(r"(?<=[.!?])\s+", text.strip())
    decisions: List[str] = []
    for sentence in sentences:
        lower = sentence.lower()
        if any(phrase in lower for phrase in decision_phrases):
            decisions.append(sentence.strip())
    return decisions
