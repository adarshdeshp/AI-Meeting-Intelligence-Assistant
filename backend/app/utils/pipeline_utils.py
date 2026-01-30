import functools
import time
import asyncio
from datetime import datetime
from uuid import uuid4
from typing import Dict, Any
from app.core.logging import logger


def get_trace_id() -> str:
    """Generate a new trace ID for request tracking."""
    return str(uuid4())


async def update_meeting(db, meeting_id: str, updates: Dict[str, Any], trace_id: str = ""):
    """
    Centralized MongoDB update logic.
    Always sets updated_at to current UTC time.
    """
    now = datetime.utcnow().isoformat() + "Z"
    updates_with_timestamp = {
        **updates,
        "updated_at": now
    }
    
    trace_prefix = f"[{trace_id}] " if trace_id else ""
    logger.info(f"{trace_prefix}Updating meeting {meeting_id} with {list(updates.keys())}")
    
    update_result = await db.meetings.update_one(
        {"_id": meeting_id},
        {"$set": updates_with_timestamp}
    )
    
    if update_result.matched_count == 0:
        logger.warning(f"{trace_prefix}Meeting {meeting_id} not found during update")
        return False
    
    return True


async def mark_failed(db, meeting_id: str, stage: str, error: Exception, trace_id: str = ""):
    """
    Mark meeting as failed with error details.
    Sets status to FAILED, progress to 0, and records error info.
    """
    now = datetime.utcnow().isoformat() + "Z"
    error_info = {
        "stage": stage,
        "message": str(error),
        "trace_id": trace_id,
        "timestamp": now
    }
    
    trace_prefix = f"[{trace_id}] " if trace_id else ""
    logger.error(
        f"{trace_prefix}Stage={stage} FAILED for meeting {meeting_id}: {error}",
        exc_info=True
    )
    
    try:
        await update_meeting(
            db,
            meeting_id,
            {
                "status": "FAILED",
                "progress": 0,
                "error": error_info
            },
            trace_id
        )
    except Exception as update_error:
        logger.error(
            f"{trace_prefix}Failed to update error status for meeting {meeting_id}: {update_error}",
            exc_info=True
        )


async def run_stage_with_timing(
    stage_name: str,
    trace_id: str,
    func,
    *args,
    executor=None,
    **kwargs
):
    """
    Run a stage function with timing and error handling.
    Supports both sync (via executor) and async functions.
    """
    trace_prefix = f"[{trace_id}] "
    logger.info(f"{trace_prefix}Stage={stage_name} START")
    start_time = time.time()
    
    try:
        if executor:
            # Run sync function in executor
            # Use functools.partial to bind args/kwargs
            bound_func = functools.partial(func, *args, **kwargs)
            loop = asyncio.get_event_loop()
            result = await loop.run_in_executor(executor, bound_func)
        else:
            # Run async function directly
            result = await func(*args, **kwargs)
        
        duration = time.time() - start_time
        logger.info(f"{trace_prefix}Stage={stage_name} OK | took={duration:.2f}s")
        return result
    except Exception as e:
        duration = time.time() - start_time
        logger.error(
            f"{trace_prefix}Stage={stage_name} FAILED | took={duration:.2f}s | error={e}",
            exc_info=True
        )
        raise
