"""
In-memory model cache to avoid reloading models on every request.
"""
import whisper
from sentence_transformers import SentenceTransformer
from transformers import pipeline
from app.core.logging import logger

# Global model cache
_whisper_model = None
_sentence_transformer = None
_sentiment_pipeline = None
_summarization_pipeline = None


def get_whisper_model():
    """Get or load cached Whisper model."""
    global _whisper_model
    if _whisper_model is None:
        logger.info("Loading Whisper model (base) - first time only")
        _whisper_model = whisper.load_model("base")
        logger.info("Whisper model loaded and cached")
    return _whisper_model


def get_sentence_transformer():
    """Get or load cached SentenceTransformer model."""
    global _sentence_transformer
    if _sentence_transformer is None:
        logger.info("Loading SentenceTransformer model (all-MiniLM-L6-v2) - first time only")
        _sentence_transformer = SentenceTransformer('all-MiniLM-L6-v2')
        logger.info("SentenceTransformer model loaded and cached")
    return _sentence_transformer


def get_sentiment_pipeline():
    """Get or load cached sentiment analysis pipeline."""
    global _sentiment_pipeline
    if _sentiment_pipeline is None:
        logger.info("Loading sentiment pipeline (distilbert-base-uncased-finetuned-sst-2-english) - first time only")
        _sentiment_pipeline = pipeline(
            "sentiment-analysis",
            model="distilbert-base-uncased-finetuned-sst-2-english"
        )
        logger.info("Sentiment pipeline loaded and cached")
    return _sentiment_pipeline


def get_summarization_pipeline():
    """Get or load cached summarization pipeline."""
    global _summarization_pipeline
    if _summarization_pipeline is None:
        logger.info("Loading summarization pipeline (facebook/bart-large-cnn) - first time only")
        _summarization_pipeline = pipeline(
            "summarization",
            model="facebook/bart-large-cnn"
        )
        logger.info("Summarization pipeline loaded and cached")
    return _summarization_pipeline
