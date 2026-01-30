from fastapi import APIRouter, UploadFile, File, HTTPException, BackgroundTasks, Body
from typing import List, Dict
from datetime import datetime
from uuid import uuid4
from pydantic import BaseModel
import asyncio

from app.db.mongo import get_database
from app.models.meeting import (
    Meeting,
    MeetingListItem,
    MeetingStatus,
    FileInfo,
)
from app.utils.files import save_uploaded_file, get_title_from_filename, get_file_extension
from app.core.logging import logger
from app.workers.pipeline import start_pipeline
from app.services.rag import answer_question_extractive

router = APIRouter(prefix="/meetings", tags=["meetings"])


class QuestionRequest(BaseModel):
    """Request model for asking a question."""
    question: str


@router.post("/upload")
async def upload_meeting(file: UploadFile = File(...)):
    """
    Upload a meeting audio/video file.
    Creates a new meeting record in MongoDB.
    """
    try:
        # Generate meeting ID
        meeting_id = str(uuid4())
        
        # Save file
        local_path, size_bytes = await save_uploaded_file(file, meeting_id)
        
        # Extract file info
        ext = get_file_extension(file.filename)
        file_info = FileInfo(
            original_filename=file.filename,
            local_path=local_path,
            size_bytes=size_bytes,
            ext=ext
        )
        
        # Create meeting document
        now = datetime.utcnow().isoformat() + "Z"
        meeting_doc = {
            "_id": meeting_id,
            "created_at": now,
            "updated_at": now,
            "status": "UPLOADED",
            "progress": 10,
            "title": get_title_from_filename(file.filename),
            "file": file_info.dict(),
            "transcript": None,
            "summary": None,
            "tasks": [],
            "sentiment": None,
            "vector_index": None,
            "error": None,
        }
        
        # Insert into MongoDB
        db = get_database()
        await db.meetings.insert_one(meeting_doc)
        
        logger.info(f"Created meeting: {meeting_id}")
        
        return {
            "meeting_id": meeting_id,
            "status": "UPLOADED",
            "progress": 10,
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading meeting: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to upload meeting: {str(e)}"
        )


@router.post("/{meeting_id}/process")
async def process_meeting(meeting_id: str, background_tasks: BackgroundTasks):
    """
    Start background processing for a meeting.
    Updates status to PROCESSING and triggers background job.
    """
    try:
        db = get_database()
        meeting = await db.meetings.find_one({"_id": meeting_id})
        
        if not meeting:
            raise HTTPException(
                status_code=404,
                detail=f"Meeting {meeting_id} not found"
            )
        
        current_status = meeting.get("status", "UNKNOWN")
        
        # Check if already processing or ready
        if current_status == "PROCESSING":
            return {
                "message": "Meeting is already being processed",
                "meeting_id": meeting_id,
                "status": current_status,
            }
        
        if current_status == "READY":
            return {
                "message": "Meeting has already been processed",
                "meeting_id": meeting_id,
                "status": current_status,
            }
        
        # Update meeting to PROCESSING
        now = datetime.utcnow().isoformat() + "Z"
        await db.meetings.update_one(
            {"_id": meeting_id},
            {
                "$set": {
                    "status": "PROCESSING",
                    "progress": 20,
                    "updated_at": now,
                }
            }
        )
        
        # Trigger background task
        background_tasks.add_task(start_pipeline, meeting_id)
        
        logger.info(f"Started processing for meeting: {meeting_id}")
        
        return {
            "message": "Processing started",
            "meeting_id": meeting_id,
            "status": "PROCESSING",
            "progress": 20,
        }
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error starting processing for meeting {meeting_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to start processing: {str(e)}"
        )


@router.get("/{meeting_id}/status")
async def get_meeting_status(meeting_id: str):
    """Get meeting status."""
    try:
        db = get_database()
        meeting = await db.meetings.find_one({"_id": meeting_id})
        
        if not meeting:
            raise HTTPException(
                status_code=404,
                detail=f"Meeting {meeting_id} not found"
            )
        
        return MeetingStatus(
            meeting_id=meeting_id,
            status=meeting.get("status", "UNKNOWN"),
            progress=meeting.get("progress", 0),
            updated_at=meeting.get("updated_at"),
            error=meeting.get("error"),
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting meeting status: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get meeting status: {str(e)}"
        )


@router.get("/{meeting_id}")
async def get_meeting(meeting_id: str):
    """Get full meeting document."""
    try:
        db = get_database()
        meeting = await db.meetings.find_one({"_id": meeting_id})
        
        if not meeting:
            raise HTTPException(
                status_code=404,
                detail=f"Meeting {meeting_id} not found"
            )
        
        # Convert _id to meeting_id for response
        meeting["meeting_id"] = meeting.pop("_id")
        
        return Meeting(**meeting)
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting meeting: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to get meeting: {str(e)}"
        )


@router.get("", response_model=List[MeetingListItem])
async def list_meetings():
    """List latest 20 meetings."""
    try:
        db = get_database()
        cursor = db.meetings.find().sort("created_at", -1).limit(20)
        meetings = await cursor.to_list(length=20)
        
        result = []
        for meeting in meetings:
            result.append(MeetingListItem(
                meeting_id=meeting["_id"],
                title=meeting.get("title", ""),
                created_at=meeting.get("created_at", ""),
                status=meeting.get("status", "UNKNOWN"),
                progress=meeting.get("progress", 0),
            ))
        
        return result
    
    except Exception as e:
        logger.error(f"Error listing meetings: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to list meetings: {str(e)}"
        )


@router.post("/{meeting_id}/ask")
async def ask_question(meeting_id: str, request: QuestionRequest = Body(...)):
    """
    Ask a question about the meeting using RAG.
    Returns extractive answer with source chunks.
    """
    try:
        db = get_database()
        meeting = await db.meetings.find_one({"_id": meeting_id})
        
        if not meeting:
            raise HTTPException(
                status_code=404,
                detail=f"Meeting {meeting_id} not found"
            )
        
        # Check if vector index exists
        vector_index = meeting.get("vector_index")
        if not vector_index:
            raise HTTPException(
                status_code=400,
                detail="Meeting not indexed yet. Call /process first."
            )
        
        # Answer question - run in executor to avoid blocking
        from app.workers.executor import get_executor
        executor = get_executor()
        loop = asyncio.get_event_loop()
        result = await loop.run_in_executor(
            executor,
            answer_question_extractive,
            meeting_id,
            request.question
        )
        
        return result
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error answering question for meeting {meeting_id}: {e}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail=f"Failed to answer question: {str(e)}"
        )
