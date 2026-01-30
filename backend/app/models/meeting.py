from pydantic import BaseModel, Field, ConfigDict
from typing import Optional, List, Dict, Any


class FileInfo(BaseModel):
    """File information model."""
    original_filename: str
    local_path: str
    size_bytes: int
    ext: str


class MeetingCreate(BaseModel):
    """Model for creating a meeting."""
    title: str
    file: FileInfo
    status: str = "UPLOADED"
    progress: int = 10


class MeetingUpdate(BaseModel):
    """Model for updating a meeting."""
    status: Optional[str] = None
    progress: Optional[int] = None
    transcript: Optional[Dict[str, Any]] = None
    summary: Optional[Dict[str, Any]] = None
    tasks: Optional[List[Dict[str, Any]]] = None
    sentiment: Optional[dict] = None
    vector_index: Optional[Dict[str, Any]] = None  # Vector index info dict
    error: Optional[Dict[str, Any]] = None


class Meeting(BaseModel):
    """Meeting document model."""
    model_config = ConfigDict(populate_by_name=True)
    
    meeting_id: str = Field(alias="_id")
    created_at: str
    updated_at: Optional[str] = None
    status: str  # Valid values: UPLOADED, PROCESSING, TRANSCRIBED, SUMMARIZED, TASKS_EXTRACTED, SENTIMENT_ANALYZED, READY, FAILED, ERROR
    progress: int
    title: str
    file: FileInfo
    transcript: Optional[Dict[str, Any]] = None  # Transcription result dict
    summary: Optional[Dict[str, Any]] = None  # Summarization result dict
    tasks: List[Dict[str, Any]] = []  # Task extraction result list
    sentiment: Optional[dict] = None
    vector_index: Optional[Dict[str, Any]] = None  # Vector index info dict
    error: Optional[Dict[str, Any]] = None  # Error info dict


class MeetingListItem(BaseModel):
    """Minimal meeting info for list endpoint."""
    meeting_id: str
    title: str
    created_at: str
    status: str
    progress: int


class MeetingStatus(BaseModel):
    """Meeting status response model."""
    meeting_id: str
    status: str  # Valid values: UPLOADED, PROCESSING, TRANSCRIBED, SUMMARIZED, TASKS_EXTRACTED, SENTIMENT_ANALYZED, READY, FAILED, ERROR
    progress: int
    updated_at: Optional[str] = None
    error: Optional[Dict[str, Any]] = None  # Error info dict
