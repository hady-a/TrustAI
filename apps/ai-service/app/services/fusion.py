"""
Fusion Service - Combines multimodal analysis scores into final risk assessment
Implements weighted fusion of face, voice, and text analysis
"""

import logging
from typing import Dict, Any

logger = logging.getLogger(__name__)


class FusionService:
    """Service for fusing multimodal analysis results"""
    
    # Fusion weights - configurable for different analysis modes
    DEFAULT_WEIGHTS = {
        'face': 0.4,      # Face/video deception: 40%
        'voice': 0.35,    # Voice stress: 35%
        'text': 0.25      # Text inconsistency: 25%
    }
    
    # Mode-specific weights for different contexts
    MODE_WEIGHTS = {
        'HR_INTERVIEW': {
            'face': 0.35,
            'voice': 0.45,  # More emphasis on stress in HR
            'text': 0.20
        },
        'CRIMINAL_INVESTIGATION': {
            'face': 0.45,   # More emphasis on facial expressions
            'voice': 0.35,
            'text': 0.20
        },
        'BUSINESS_MEETING': {
            'face': 0.35,
            'voice': 0.40,
            'text': 0.25
        }
    }
    
    def __init__(self, mode: str = 'HR_INTERVIEW'):
        """
        Initialize fusion service
        
        Args:
            mode: Analysis mode (HR_INTERVIEW, CRIMINAL_INVESTIGATION, BUSINESS_MEETING)
        """
        self.mode = mode
        self.weights = self.MODE_WEIGHTS.get(mode, self.DEFAULT_WEIGHTS)
        logger.info(f"FusionService initialized for mode: {mode}")
    
    def fuse_scores(self, face_score: float, voice_score: float, text_score: float) -> Dict[str, Any]:
        """
        Fuse three modality scores into final risk assessment
        
        Args:
            face_score: Deception probability from face analysis (0-100)
            voice_score: Stress probability from voice analysis (0-100)
            text_score: Inconsistency probability from text analysis (0-100)
        
        Returns:
        {
            'risk_score': float - weighted sum (final risk 0-100),
            'confidence': float - average confidence (0-100),
            'modality_scores': dict with individual scores,
            'modality_details': dict with analysis details,
            'risk_level': str - classification (Low, Medium, High, Critical),
            'explanation': str - human-readable explanation
        }
        """
        # Normalize scores to 0-1 range
        face_norm = self._normalize_score(face_score)
        voice_norm = self._normalize_score(voice_score)
        text_norm = self._normalize_score(text_score)
        
        # Calculate weighted risk score
        weights = self.weights
        risk_score = (
            face_norm * weights['face'] +
            voice_norm * weights['voice'] +
            text_norm * weights['text']
        ) * 100.0
        
        # Calculate confidence as average of input confidences
        confidence = (face_score + voice_score + text_score) / 3.0
        
        # Determine risk level
        risk_level = self._classify_risk_level(risk_score)
        
        # Generate explanation
        explanation = self._generate_explanation(
            face_score, voice_score, text_score,
            risk_score, risk_level
        )
        
        return {
            'risk_score': float(max(0.0, min(100.0, risk_score))),
            'confidence': float(max(0.0, min(100.0, confidence))),
            'modality_scores': {
                'face_score': float(face_score),
                'voice_score': float(voice_score),
                'text_score': float(text_score)
            },
            'modality_details': {
                'face': {
                    'weight': weights['face'],
                    'normalized': float(face_norm * 100)
                },
                'voice': {
                    'weight': weights['voice'],
                    'normalized': float(voice_norm * 100)
                },
                'text': {
                    'weight': weights['text'],
                    'normalized': float(text_norm * 100)
                }
            },
            'risk_level': risk_level,
            'explanation': explanation
        }
    
    def fuse_full_analysis(self, analysis_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Fuse complete analysis data from all modalities
        
        Args:
            analysis_data: Complete analysis data with face, voice, and text components
        
        Returns:
            Fused analysis result with risk scores and confidence
        """
        try:
            # Extract scores from analysis data
            face_score = analysis_data.get('face_analysis', {}).get('face_score', 0)
            voice_score = analysis_data.get('voice_analysis', {}).get('voice_score', 0)
            text_score = analysis_data.get('text_analysis', {}).get('text_score', 0)
            
            logger.info(f"Fusing scores - Face: {face_score}, Voice: {voice_score}, Text: {text_score}")
            
            # Perform fusion
            fusion_result = self.fuse_scores(face_score, voice_score, text_score)
            
            # Enhance analysis data with fusion results
            enhanced_analysis = analysis_data.copy()
            enhanced_analysis['fusion_analysis'] = fusion_result
            enhanced_analysis['risk_score'] = fusion_result['risk_score']
            enhanced_analysis['confidence_level'] = fusion_result['confidence']
            
            return enhanced_analysis
        
        except Exception as e:
            logger.error(f"Error in fusion: {e}")
            # Return analysis with default fusion values
            return {
                **analysis_data,
                'fusion_analysis': {
                    'risk_score': 0.0,
                    'confidence': 0.0,
                    'risk_level': 'Unknown',
                    'explanation': 'Fusion error occurred'
                },
                'risk_score': 0.0,
                'confidence_level': 0.0
            }
    
    def _normalize_score(self, score: float) -> float:
        """
        Normalize score from 0-100 range to 0-1 range
        
        Args:
            score: Score in 0-100 range
        
        Returns:
            Normalized score in 0-1 range
        """
        return max(0.0, min(1.0, score / 100.0))
    
    def _classify_risk_level(self, risk_score: float) -> str:
        """
        Classify risk level based on score
        
        Args:
            risk_score: Final risk score (0-100)
        
        Returns:
            Risk level classification
        """
        if risk_score < 20:
            return "Low"
        elif risk_score < 40:
            return "Medium"
        elif risk_score < 70:
            return "High"
        else:
            return "Critical"
    
    def _generate_explanation(self, face: float, voice: float, text: float,
                            risk_score: float, risk_level: str) -> str:
        """
        Generate human-readable explanation of fusion results
        
        Args:
            face: Face analysis score
            voice: Voice analysis score
            text: Text analysis score
            risk_score: Final fused risk score
            risk_level: Risk level classification
        
        Returns:
            English explanation of results
        """
        # Identify dominant modality
        scores = {
            'facial analysis': face,
            'voice analysis': voice,
            'text analysis': text
        }
        dominant_modality = max(scores, key=scores.get)
        dominant_score = scores[dominant_modality]
        
        # Build explanation
        parts = []
        
        # Risk level statement
        if risk_level == "Critical":
            parts.append(f"Critical risk detected (score: {risk_score:.1f})")
        elif risk_level == "High":
            parts.append(f"High risk indicators present (score: {risk_score:.1f})")
        elif risk_level == "Medium":
            parts.append(f"Moderate risk signals detected (score: {risk_score:.1f})")
        else:
            parts.append(f"Low risk profile indicated (score: {risk_score:.1f})")
        
        # Dominant modality explanation
        if dominant_score > 60:
            parts.append(f"Primary concern: {dominant_modality} showed elevated indicators ({dominant_score:.1f})")
        
        # Cross-modality agreement
        high_scores = sum(1 for s in [face, voice, text] if s > 50)
        if high_scores >= 2:
            parts.append("Multiple modalities show concerning patterns - high concordance")
        elif high_scores == 1:
            parts.append("Concern identified in one modality, others appear normal")
        else:
            parts.append("All modalities within normal parameters")
        
        # Mode-specific context
        if self.mode == "HR_INTERVIEW":
            if voice > 60:
                parts.append("Candidate shows elevated stress levels during interview")
        elif self.mode == "CRIMINAL_INVESTIGATION":
            if face > 60:
                parts.append("Facial expressions suggest emotional distress or deception")
        elif self.mode == "BUSINESS_MEETING":
            if risk_score < 40:
                parts.append("Professional demeanor and controlled communication observed")
        
        return ". ".join(parts) + "."
    
    def get_modality_confidence_intervals(self, face: float, voice: float, text: float) -> Dict[str, Dict[str, float]]:
        """
        Calculate confidence intervals for each modality
        
        Args:
            face: Face analysis score
            voice: Voice analysis score
            text: Text analysis score
        
        Returns:
            Confidence intervals for visualization
        """
        # Simple confidence bounds (±15% for each modality)
        bounds = 15.0
        
        return {
            'face': {
                'value': face,
                'lower': max(0, face - bounds),
                'upper': min(100, face + bounds)
            },
            'voice': {
                'value': voice,
                'lower': max(0, voice - bounds),
                'upper': min(100, voice + bounds)
            },
            'text': {
                'value': text,
                'lower': max(0, text - bounds),
                'upper': min(100, text + bounds)
            }
        }
