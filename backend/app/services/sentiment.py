import librosa
import numpy as np
from typing import List, Dict
from app.core.logging import logger
from app.utils.model_cache import get_sentiment_pipeline


def analyze_text_sentiment(segments: List[Dict]) -> Dict:
    """
    Analyze sentiment of text segments using DistilBERT model.
    Returns overall sentiment and per-segment analysis.
    """
    if not segments:
        return {
            "overall_label": "NEUTRAL",
            "overall_score": 0.0,
            "segments": []
        }
    
    logger.info(f"Analyzing sentiment for {len(segments)} segments")
    
    # Get cached sentiment analysis pipeline
    sentiment_analyzer = get_sentiment_pipeline()
    
    analyzed_segments = []
    scores = []
    
    for segment in segments:
        text = segment.get("text", "")
        if not text or len(text.strip()) < 3:
            continue
        
        # Analyze sentiment
        result = sentiment_analyzer(text)[0]
        label = result["label"].upper()
        score = result["score"]
        
        # Convert POSITIVE/NEGATIVE to our format
        # DistilBERT returns POSITIVE/NEGATIVE, we need to map to our scale
        if label == "POSITIVE":
            sentiment_score = score  # 0 to 1, positive
        elif label == "NEGATIVE":
            sentiment_score = -score  # -1 to 0, negative
        else:
            sentiment_score = 0.0
        
        # Map to our labels
        if sentiment_score > 0.05:
            final_label = "POSITIVE"
        elif sentiment_score < -0.05:
            final_label = "NEGATIVE"
        else:
            final_label = "NEUTRAL"
        
        analyzed_segments.append({
            "text": text,
            "label": final_label,
            "score": round(sentiment_score, 4)
        })
        
        scores.append(sentiment_score)
    
    # Calculate overall sentiment
    if scores:
        avg_score = np.mean(scores)
        if avg_score > 0.05:
            overall_label = "POSITIVE"
        elif avg_score < -0.05:
            overall_label = "NEGATIVE"
        else:
            overall_label = "NEUTRAL"
    else:
        avg_score = 0.0
        overall_label = "NEUTRAL"
    
    logger.info(f"Sentiment analysis complete. Overall: {overall_label} ({avg_score:.4f})")
    
    return {
        "overall_label": overall_label,
        "overall_score": round(avg_score, 4),
        "segments": analyzed_segments
    }


def analyze_tone(wav_path: str) -> Dict:
    """
    Analyze tone features from audio file using librosa.
    Returns average pitch and energy.
    """
    try:
        logger.info(f"Analyzing tone from audio: {wav_path}")
        
        # Load audio file
        y, sr = librosa.load(wav_path, sr=None)
        
        # Calculate average pitch using PYIN (probabilistic YIN)
        # PYIN is librosa's implementation of YIN algorithm, better for speech
        f0, voiced_flag, voiced_probs = librosa.pyin(
            y,
            fmin=librosa.note_to_hz('C2'),
            fmax=librosa.note_to_hz('C7')
        )
        
        # Extract valid pitch values (non-NaN)
        pitch_values = f0[~np.isnan(f0)]
        avg_pitch = float(np.mean(pitch_values)) if len(pitch_values) > 0 else 0.0
        
        # Calculate RMS energy (average energy)
        rms = librosa.feature.rms(y=y)[0]
        avg_energy = float(np.mean(rms))
        
        logger.info(f"Tone analysis complete. Pitch: {avg_pitch:.2f} Hz, Energy: {avg_energy:.4f}")
        
        return {
            "avg_pitch": round(avg_pitch, 2),
            "avg_energy": round(avg_energy, 4)
        }
    
    except Exception as e:
        logger.error(f"Error analyzing tone: {e}", exc_info=True)
        # Return default values on error
        return {
            "avg_pitch": 0.0,
            "avg_energy": 0.0
        }
