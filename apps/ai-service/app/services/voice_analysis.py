"""
Voice Analysis Service - Analyzes audio for stress, emotion, and stress indicators
Returns: voice_score (stress probability 0-100)
"""

import os
import logging
import numpy as np
from typing import Dict, Any, Optional

try:
    import librosa
    import torch
    from transformers import Wav2Vec2FeatureExtractor, Wav2Vec2ForSequenceClassification
except ImportError as e:
    print(f"Warning: Some voice analysis dependencies not installed: {e}")

logger = logging.getLogger(__name__)


class VoiceAnalysisService:
    """Service for analyzing voice/audio for stress and emotions"""
    
    def __init__(self):
        """Initialize voice analysis service"""
        self.wav2vec_extractor = None
        self.wav2vec_model = None
        self._load_models()
    
    def _load_models(self):
        """Load Wav2Vec2 models for emotion/stress detection"""
        try:
            model_name = "superb/wav2vec2-base-superb-er"
            logger.info(f"Loading {model_name}...")
            self.wav2vec_extractor = Wav2Vec2FeatureExtractor.from_pretrained(model_name)
            self.wav2vec_model = Wav2Vec2ForSequenceClassification.from_pretrained(model_name)
            logger.info("Voice models loaded successfully")
        except Exception as e:
            logger.error(f"Error loading voice models: {e}")
    
    def analyze_audio_file(self, file_path: Optional[str]) -> Dict[str, Any]:
        """
        Analyze audio file for voice stress and emotion
        
        Returns:
        {
            'voice_score': float (0-100) - stress probability,
            'transcript': str,
            'emotion': str,
            'stress_level': int (0-100),
            'confidence': int (0-100),
            'duration': float
        }
        """
        if not file_path or not os.path.exists(file_path):
            logger.warning(f"Audio file not found: {file_path}")
            return {
                'voice_score': 0.0,
                'transcript': '',
                'emotion': 'neutral',
                'stress_level': 0,
                'confidence': 0,
                'duration': 0
            }
        
        try:
            logger.info(f"Analyzing audio: {file_path}")
            
            # Extract audio features
            speech, sr = librosa.load(file_path, sr=16000)
            duration = len(speech) / sr
            
            # Speech-to-text transcription (if whisper available)
            transcript = self._transcribe_audio(file_path)
            
            # Emotion detection from voice
            emotion, emotion_confidence = self._detect_emotion(speech)
            
            # Stress level calculation
            stress_level = self._calculate_stress_level(speech)
            confidence = max(100 - stress_level, 20)
            
            # Calculate voice score (stress probability)
            voice_score = self._calculate_voice_score(stress_level, emotion)
            
            return {
                'voice_score': voice_score,
                'transcript': transcript,
                'emotion': emotion,
                'stress_level': stress_level,
                'confidence': confidence,
                'duration': duration
            }
        
        except Exception as e:
            logger.error(f"Error analyzing audio: {e}")
            return {
                'voice_score': 0.0,
                'transcript': '',
                'emotion': 'neutral',
                'stress_level': 0,
                'confidence': 0,
                'duration': 0
            }
    
    def _transcribe_audio(self, file_path: str) -> str:
        """
        Transcribe audio to text using Whisper
        Returns empty string if transcription fails
        """
        try:
            import whisper
            logger.info(f"Transcribing audio: {file_path}")
            model = whisper.load_model("base")
            result = model.transcribe(file_path)
            return result.get("text", "")
        except Exception as e:
            logger.debug(f"Could not transcribe audio: {e}")
            return ""
    
    def _detect_emotion(self, speech: np.ndarray) -> tuple:
        """
        Detect emotion from speech using Wav2Vec2
        
        Returns:
            Tuple of (emotion, confidence)
        """
        try:
            if self.wav2vec_extractor is None or self.wav2vec_model is None:
                return 'neutral', 0
            
            inputs = self.wav2vec_extractor(
                speech,
                sampling_rate=16000,
                return_tensors="pt",
                padding=True
            )
            
            with torch.no_grad():
                logits = self.wav2vec_model(**inputs).logits
            
            emotion_id = torch.argmax(logits).item()
            emotion = self.wav2vec_model.config.id2label[emotion_id]
            
            # Get confidence as probability
            probs = torch.softmax(logits, dim=-1)
            confidence = float(probs[0][emotion_id].item()) * 100
            
            return emotion, confidence
        
        except Exception as e:
            logger.debug(f"Could not detect emotion: {e}")
            return 'neutral', 0
    
    def _calculate_stress_level(self, speech: np.ndarray) -> int:
        """
        Calculate stress level from audio features
        
        Stress indicators:
        - Higher energy/RMS
        - Higher fundamental frequency
        - More variable pitch
        
        Returns:
            Stress level (0-100)
        """
        try:
            # Calculate RMS energy
            rms = np.mean(librosa.feature.rms(y=speech))
            energy_stress = min(int(rms * 500), 100)
            
            # Calculate spectral centroid (higher = higher stress)
            spec_centroid = np.mean(librosa.feature.spectral_centroid(y=speech)[0])
            centroid_stress = min(int((spec_centroid / 4000) * 100), 100)
            
            # Calculate zero crossing rate (higher = more stress)
            zcr = np.mean(librosa.feature.zero_crossing_rate(speech)[0])
            zcr_stress = min(int(zcr * 1000), 100)
            
            # Combine stress indicators
            stress_level = int((energy_stress * 0.5 + centroid_stress * 0.3 + zcr_stress * 0.2))
            
            return max(0, min(100, stress_level))
        
        except Exception as e:
            logger.debug(f"Error calculating stress level: {e}")
            return 0
    
    def _calculate_voice_score(self, stress_level: int, emotion: str) -> float:
        """
        Calculate voice stress probability score
        
        Combined from:
        - Stress level (main indicator)
        - Emotion (secondary)
        
        Args:
            stress_level: Calculated stress (0-100)
            emotion: Detected emotion string
        
        Returns:
            Voice score (0-100)
        """
        # Stress level directly contributes
        voice_score = float(stress_level)
        
        # Emotion adjustment
        emotion_multipliers = {
            'fear': 1.3,
            'angry': 1.2,
            'sad': 1.1,
            'surprise': 1.0,
            'neutral': 0.9,
            'calm': 0.7,
            'happy': 0.6
        }
        
        multiplier = emotion_multipliers.get(emotion.lower(), 0.9)
        voice_score = voice_score * multiplier
        
        return float(max(0.0, min(100.0, voice_score)))
