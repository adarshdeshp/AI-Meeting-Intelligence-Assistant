from motor.motor_asyncio import AsyncIOMotorClient
from typing import Optional
from app.core.config import settings
from app.core.logging import logger


class MongoDB:
    """MongoDB connection manager."""
    
    client: Optional[AsyncIOMotorClient] = None
    database = None


mongodb = MongoDB()


async def connect_to_mongo():
    """Create database connection."""
    try:
        mongodb.client = AsyncIOMotorClient(settings.mongodb_url)
        mongodb.database = mongodb.client[settings.mongodb_db_name]
        # Test connection
        await mongodb.client.admin.command("ping")
        logger.info(f"Connected to MongoDB: {settings.mongodb_db_name}")
    except Exception as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        raise


async def close_mongo_connection():
    """Close database connection."""
    if mongodb.client:
        mongodb.client.close()
        logger.info("Disconnected from MongoDB")


def get_database():
    """Get database instance."""
    return mongodb.database
