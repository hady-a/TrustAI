"""
Mock Analyzer Service - Returns realistic test data without requiring PyTorch/OpenCV
Used when real models are not available (Python version incompatibility, missing dependencies)
"""

import os
import logging
from typing import Dict, Any, Optional
import random

logger = logging.getLogger(__name__)


class MockAnalyzerService:
    """Mock analyzer that returns realistic test data"""
    
    def __init__(self):
        logger.info("MockAnalyzerService initialized (using test generator mode)")
        self.mock_enabled = True
    
    def analyze_audio_file(self, file_path: Optional[str]) -> Dict[str, Any]:
        """Return mock audio analysis with realistic test data"""
        logger.info(f"📊 Generating mock audio analysis (file: {file_path})")
        
        # Generate realistic mock data - always return good test values
        stress_level = random.randint(35, 65)  # Moderate stress range
        voice_score = random.randint(40, 70)   # Moderate voice score range
        confidence = random.randint(65, 85)    # Good confidence range
        
        transcripts = [
            "I am very interested in this opportunity and believe I can contribute significantly to your team.",
            "I have extensive experience in this field and I'm confident I can handle the challenges.",
            "Thank you for considering my application. I'm excited about the possibility of joining your organization.",
            "I take pride in my work and always strive to deliver quality results.",
        ]
        
        emotions = ['calm', 'neutral', 'confident', 'friendly']
        
        return {
            'voice_score': float(voice_score),
            'transcript': random.choice(transcripts),
            'emotion': random.choice(emotions),
            'stress_level': stress_level,
            'confidence': confidence,
            'duration': random.uniform(30, 60)
        }
    
    def analyze_video_file(self, file_path: Optional[str]) -> Dict[str, Any]:
        """Return mock video analysis with realistic test data"""
        logger.info(f"📊 Generating mock video analysis (file: {file_path})")
        
        # Generate realistic mock data - always return good test values
        face_score = random.randint(25, 55)
        
        emotions = ['happy', 'neutral', 'calm']
        dominant_emotion = random.choice(emotions)
        
        return {
            'face_score': float(face_score),
            'dominant_emotion': dominant_emotion,
            'emotion_scores': {
                'happy': random.uniform(0.3, 0.8),
                'neutral': random.uniform(0.3, 0.8),
                'calm': random.uniform(0.3, 0.8),
            },
            'frame_count': random.randint(2400, 3000),
            'duration': random.uniform(40, 60),
            'emotions_detected': [dominant_emotion, 'neutral']
        }
    
    def analyze_text(self, text: str) -> Dict[str, Any]:
        """Return mock text analysis with realistic test data"""
        logger.info(f"📊 Generating mock text analysis (length: {len(text)} chars)")
        
        text_score = random.randint(15, 45)
        
        return {
            'text_score': float(text_score),
            'consistency_score': random.uniform(0.75, 0.95),
            'sentiment': random.choice(['positive', 'neutral']),
            'word_count': len(text.split())
        }


def get_mock_fusion_analysis(mode: str, face_score: float = None, voice_score: float = None, text_score: float = None) -> Dict[str, Any]:
    """Generate mock fusion analysis result"""
    
    # Use provided scores or generate random test values
    if face_score is None:
        face_score = random.randint(25, 55)
    if voice_score is None:
        voice_score = random.randint(35, 65)
    if text_score is None:
        text_score = random.randint(15, 45)
    
    logger.info(f"📊 Generating mock fusion analysis: face={face_score}, voice={voice_score}, text={text_score}")
    
    # Weighted fusion (matching the real fusion logic)
    weights = {
        'HR_INTERVIEW': {'face': 0.35, 'voice': 0.45, 'text': 0.20},
        'CRIMINAL_INVESTIGATION': {'face': 0.45, 'voice': 0.35, 'text': 0.20},
        'BUSINESS_MEETING': {'face': 0.35, 'voice': 0.40, 'text': 0.25},
    }
    
    w = weights.get(mode, weights['HR_INTERVIEW'])
    
    # Normalize to 0-1 and calculate weighted sum
    risk_score = (
        (face_score / 100.0) * w['face'] +
        (voice_score / 100.0) * w['voice'] +
        (text_score / 100.0) * w['text']
    ) * 100.0
    
    confidence = (face_score + voice_score + text_score) / 3.0
    
    # Classify risk level
    if risk_score < 30:
        risk_level = 'Low'
    elif risk_score < 50:
        risk_level = 'Medium'
    elif risk_score < 70:
        risk_level = 'High'
    else:
        risk_level = 'Critical'
    
    result = {
        'risk_score': float(max(0, min(100, risk_score))),
        'confidence': float(max(0, min(100, confidence))),
        'modality_scores': {
            'face_score': float(face_score),
            'voice_score': float(voice_score),
            'text_score': float(text_score)
        },
        'risk_level': risk_level,
        'explanation': f'{risk_level} risk detected. Face analysis: {face_score:.0f}%, Voice stress: {voice_score:.0f}%, Text analysis: {text_score:.0f}%.'
    }
    
    logger.info(f"📊 Mock fusion complete: risk_score={result['risk_score']:.1f}, level={risk_level}")
    return result
