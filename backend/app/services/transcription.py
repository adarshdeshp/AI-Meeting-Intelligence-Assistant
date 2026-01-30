from pathlib import Path
from pydub import AudioSegment
from app.core.logging import logger
from app.utils.model_cache import get_whisper_model
from typing import Dict, List


def preprocess_audio(input_path: str, meeting_id: str) -> str:
    """
    Convert input audio file to 16kHz mono WAV format.
    
    Args:
        input_path: Path to the original audio file
        meeting_id: Meeting ID for output directory
        
    Returns:
        Path to the processed WAV file
    """
    try:
        logger.info(f"Preprocessing audio: {input_path}")
        
        # Load audio file
        audio = AudioSegment.from_file(input_path)
        
        # Convert to mono and 16kHz
        audio = audio.set_channels(1)  # Mono
        audio = audio.set_frame_rate(16000)  # 16kHz
        
        # Create output directory if it doesn't exist
        output_dir = Path("storage/uploads") / meeting_id
        output_dir.mkdir(parents=True, exist_ok=True)
        
        # Save as processed.wav
        output_path = output_dir / "processed.wav"
        audio.export(str(output_path), format="wav")
        
        logger.info(f"Audio preprocessed and saved to: {output_path}")
        return str(output_path)
    
    except Exception as e:
        logger.error(f"Error preprocessing audio: {e}", exc_info=True)
        raise


def transcribe_with_whisper(wav_path: str) -> Dict:
    """
    Transcribe audio file using OpenAI Whisper.
    
    Args:
        wav_path: Path to the WAV audio file
        
    Returns:
        Dictionary with transcription results:
        {
            "language": str,
            "full_text": str,
            "segments": [
                {"start": float, "end": float, "text": str}
            ]
        }
    """
    try:
        logger.info(f"Starting Whisper transcription: {wav_path}")
        
        # Get cached Whisper model
        model = get_whisper_model()
        
        # Transcribe with timestamps
        result = model.transcribe(wav_path, word_timestamps=False)
        
        # Extract segments
        segments = [
            {
                "start": float(segment["start"]),
                "end": float(segment["end"]),
                "text": segment["text"].strip()
            }
            for segment in result.get("segments", [])
        ]
        
        # Build structured output
        transcript = {
            "language": result.get("language", "unknown"),
            "full_text": result.get("text", "").strip(),
            "segments": segments
        }
        
        logger.info(f"Transcription completed. Language: {transcript['language']}, Segments: {len(segments)}")
        return transcript
    
    except Exception as e:
        logger.error(f"Error transcribing with Whisper: {e}", exc_info=True)
        raise
