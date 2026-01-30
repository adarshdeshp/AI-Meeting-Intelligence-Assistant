from pathlib import Path
from typing import Tuple
from fastapi import UploadFile, HTTPException
from app.core.config import settings
from app.core.logging import logger


def get_file_extension(filename: str) -> str:
    """Extract file extension from filename."""
    return Path(filename).suffix.lower()


def validate_file(file: UploadFile) -> str:
    """
    Validate uploaded file.
    Returns: extension
    Raises: HTTPException if validation fails
    """
    # Check extension
    ext = get_file_extension(file.filename)
    if ext not in settings.allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"File type not allowed. Allowed types: {', '.join(settings.allowed_extensions)}"
        )
    
    # Check content type (basic validation)
    content_type = file.content_type or ""
    if not any(allowed in content_type for allowed in ["audio", "video"]):
        logger.warning(f"Unexpected content type: {content_type} for file: {file.filename}")
    
    return ext


async def save_uploaded_file(file: UploadFile, meeting_id: str) -> Tuple[str, int]:
    """
    Save uploaded file to storage.
    Returns: (local_path, size_bytes)
    """
    # Validate file
    ext = validate_file(file)
    
    # Create meeting directory
    meeting_dir = Path(settings.storage_base_path) / meeting_id
    meeting_dir.mkdir(parents=True, exist_ok=True)
    
    # Generate filename
    filename = f"original{ext}"
    file_path = meeting_dir / filename
    
    # Read file content and save
    content = await file.read()
    size_bytes = len(content)
    
    # Check file size (25MB limit)
    max_size_bytes = settings.max_file_size_mb * 1024 * 1024
    if size_bytes > max_size_bytes:
        raise HTTPException(
            status_code=400,
            detail=f"File size exceeds maximum allowed size of {settings.max_file_size_mb}MB"
        )
    
    # Write file
    with open(file_path, "wb") as f:
        f.write(content)
    
    logger.info(f"Saved file: {file_path} ({size_bytes} bytes)")
    
    return str(file_path), size_bytes


def get_title_from_filename(filename: str) -> str:
    """Extract title from filename (without extension)."""
    return Path(filename).stem
