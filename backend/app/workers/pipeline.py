import asyncio
from pathlib import Path
from app.db.mongo import get_database
from app.core.logging import logger
from app.services.transcription import preprocess_audio, transcribe_with_whisper
from app.services.summarization import (
    summarize_text,
    extract_topics,
    extract_decisions,
)
from app.services.tasks import extract_task_candidates, refine_tasks_with_llm
from app.services.sentiment import analyze_text_sentiment, analyze_tone
from app.services.rag import build_vector_index
from app.utils.pipeline_utils import (
    get_trace_id,
    update_meeting,
    mark_failed,
    run_stage_with_timing,
)
from app.workers.executor import get_executor


async def start_pipeline(meeting_id: str):
    """
    Background processing pipeline for a meeting.
    Performs audio transcription, summarization, task extraction, sentiment analysis, and RAG indexing.
    """
    db = get_database()
    trace_id = get_trace_id()
    trace_prefix = f"[{trace_id}] "
    
    logger.info(f"{trace_prefix}Starting pipeline for meeting: {meeting_id}")
    
    try:
        # Load meeting from MongoDB
        meeting = await db.meetings.find_one({"_id": meeting_id})
        if not meeting:
            logger.error(f"{trace_prefix}Meeting {meeting_id} not found")
            return
        
        # Get local uploaded file path
        file_info = meeting.get("file", {})
        local_path = file_info.get("local_path")
        
        if not local_path:
            raise ValueError(f"No file path found for meeting {meeting_id}")
        
        logger.info(f"{trace_prefix}Processing file: {local_path}")
        executor = get_executor()
        
        # Stage 1: Preprocess audio
        try:
            processed_wav_path = await run_stage_with_timing(
                "preprocess",
                trace_id,
                preprocess_audio,
                local_path,
                meeting_id,
                executor=executor
            )
        except Exception as e:
            await mark_failed(db, meeting_id, "preprocess", e, trace_id)
            return
        
        # Stage 2: Transcribe
        try:
            transcript = await run_stage_with_timing(
                "transcribe",
                trace_id,
                transcribe_with_whisper,
                processed_wav_path,
                executor=executor
            )
        except Exception as e:
            await mark_failed(db, meeting_id, "transcribe", e, trace_id)
            return
        
        # Update meeting with transcription results
        success = await update_meeting(
            db,
            meeting_id,
            {
                "status": "TRANSCRIBED",
                "progress": 60,
                "transcript": transcript,
            },
            trace_id
        )
        if not success:
            return
        
        logger.info(f"{trace_prefix}Transcription completed for meeting: {meeting_id}")

        # Stage 3: Summarization
        try:
            full_text = transcript.get("full_text", "")
            
            summary_result = await run_stage_with_timing(
                "summarize",
                trace_id,
                summarize_text,
                full_text,
                executor=executor
            )
            topics_result = await run_stage_with_timing(
                "extract_topics",
                trace_id,
                extract_topics,
                full_text,
                executor=executor
            )
            decisions_result = await run_stage_with_timing(
                "extract_decisions",
                trace_id,
                extract_decisions,
                full_text,
                executor=executor
            )

            summary_payload = {
                "short_bullets": summary_result.get("short_bullets", []),
                "detailed": summary_result.get("detailed", ""),
                "topics": topics_result,
                "decisions": decisions_result,
            }

            success = await update_meeting(
                db,
                meeting_id,
                {
                    "status": "SUMMARIZED",
                    "progress": 80,
                    "summary": summary_payload,
                },
                trace_id
            )
            if not success:
                return

            logger.info(f"{trace_prefix}Summarization completed for meeting: {meeting_id}")

            # Stage 4: Task Extraction
            try:
                candidates_result = await run_stage_with_timing(
                    "extract_task_candidates",
                    trace_id,
                    extract_task_candidates,
                    full_text,
                    executor=executor
                )
                refined_tasks = await run_stage_with_timing(
                    "refine_tasks",
                    trace_id,
                    refine_tasks_with_llm,
                    candidates_result,
                    executor=executor
                )

                success = await update_meeting(
                    db,
                    meeting_id,
                    {
                        "status": "TASKS_EXTRACTED",
                        "progress": 90,
                        "tasks": refined_tasks,
                    },
                    trace_id
                )
                if not success:
                    return

                logger.info(f"{trace_prefix}Task extraction completed for meeting: {meeting_id}")

                # Stage 5: Sentiment Analysis
                try:
                    # Get processed WAV path
                    processed_wav_path_obj = Path("storage/uploads") / meeting_id / "processed.wav"
                    
                    if not processed_wav_path_obj.exists():
                        raise FileNotFoundError(f"Processed WAV file not found: {processed_wav_path_obj}")
                    
                    # Analyze text sentiment
                    transcript_segments = transcript.get("segments", [])
                    text_sentiment = await run_stage_with_timing(
                        "analyze_sentiment",
                        trace_id,
                        analyze_text_sentiment,
                        transcript_segments,
                        executor=executor
                    )
                    
                    # Analyze tone
                    tone = await run_stage_with_timing(
                        "analyze_tone",
                        trace_id,
                        analyze_tone,
                        str(processed_wav_path_obj),
                        executor=executor
                    )
                    
                    # Build sentiment payload
                    sentiment_payload = {
                        "overall_label": text_sentiment["overall_label"],
                        "overall_score": text_sentiment["overall_score"],
                        "by_speaker": [
                            {
                                "speaker": "ALL",
                                "label": text_sentiment["overall_label"],
                                "score": text_sentiment["overall_score"]
                            }
                        ],
                        "tone_features": {
                            "ALL": {
                                "avg_pitch": tone["avg_pitch"],
                                "avg_energy": tone["avg_energy"]
                            }
                        }
                    }
                    
                    success = await update_meeting(
                        db,
                        meeting_id,
                        {
                            "status": "SENTIMENT_ANALYZED",
                            "progress": 95,
                            "sentiment": sentiment_payload,
                        },
                        trace_id
                    )
                    if not success:
                        return
                    
                    logger.info(f"{trace_prefix}Sentiment analysis completed for meeting: {meeting_id}")

                    # Stage 6: RAG Vector Indexing
                    try:
                        collection_name = await run_stage_with_timing(
                            "rag_indexing",
                            trace_id,
                            build_vector_index,
                            meeting_id,
                            transcript_segments,
                            executor=executor
                        )
                        
                        success = await update_meeting(
                            db,
                            meeting_id,
                            {
                                "status": "READY",
                                "progress": 100,
                                "vector_index": {
                                    "provider": "chroma",
                                    "collection": collection_name
                                },
                            },
                            trace_id
                        )
                        if not success:
                            return
                        
                        logger.info(f"{trace_prefix}Vector index built and meeting marked as READY: {meeting_id}")

                    except Exception as e:
                        await mark_failed(db, meeting_id, "rag_indexing", e, trace_id)
                        return

                except Exception as e:
                    await mark_failed(db, meeting_id, "sentiment", e, trace_id)
                    return

            except Exception as e:
                await mark_failed(db, meeting_id, "task_extraction", e, trace_id)
                return

        except Exception as e:
            await mark_failed(db, meeting_id, "summarization", e, trace_id)
            return
    
    except Exception as e:
        logger.error(f"{trace_prefix}Error in pipeline for meeting {meeting_id}: {e}", exc_info=True)
        await mark_failed(db, meeting_id, "transcription", e, trace_id)
