from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""
    
    # MongoDB settings
    mongodb_url: str = "mongodb://localhost:27017"
    mongodb_db_name: str = "meeting_intelligence"
    
    # File upload settings
    max_file_size_mb: int = 25
    allowed_extensions: list[str] = [".mp3", ".wav", ".m4a", ".mp4", ".webm"]
    storage_base_path: str = "storage/uploads"
    
    # CORS settings
    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://localhost:5173",
    ]
    
    # API settings
    api_title: str = "AI Meeting Intelligence Assistant API"
    api_version: str = "1.0.0"
    
    model_config = SettingsConfigDict(
        env_file=".env",
        case_sensitive=False,
    )


settings = Settings()
