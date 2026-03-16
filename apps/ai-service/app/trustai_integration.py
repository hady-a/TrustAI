"""
Integration with TrustAI System for multimodal analysis
Wraps HR Interview, Criminal Investigation, and Business Meeting modes
Uses modular services for face, voice, text analysis and fusion
"""

import os
import logging
from typing import Dict, List, Any, Optional

from app.services.face_analysis import FaceAnalysisService
from app.services.voice_analysis import VoiceAnalysisService
from app.services.text_analysis import TextAnalysisService
from app.services.fusion import FusionService

logger = logging.getLogger(__name__)


class TrustAIAnalyzer:
    """Main analyzer class integrating all TrustAI modes with multimodal fusion"""
    
    def __init__(self):
        """Initialize AI analysis services"""
        self.face_service = None
        self.voice_service = None
        self.text_service = None
        self.fusion_service = None
        self.initialize_services()
    
    def initialize_services(self):
        """Initialize all analysis services"""
        try:
            logger.info("Initializing analysis services...")
            self.face_service = FaceAnalysisService()
            self.voice_service = VoiceAnalysisService()
            self.text_service = TextAnalysisService()
            logger.info("✅ All services initialized successfully")
        except Exception as e:
            logger.error(f"Error initializing services: {e}")
            raise
    
    def analyze_audio_file(self, file_path: str) -> Dict[str, Any]:
        """
        Delegate audio analysis to voice service
        
        Returns: {
            'transcript': str,
            'emotion': str,
            'stress_level': int (0-100),
            'confidence': int (0-100),
            'duration': float,
            'voice_score': float (0-100)
        }
        """
        if self.voice_service is None:
            logger.warning("Voice service not initialized")
            return {}
        
        return self.voice_service.analyze_audio_file(file_path)
    
    def analyze_video_file(self, file_path: str) -> Dict[str, Any]:
        """
        Delegate video analysis to face service
        
        Returns: {
            'dominant_emotion': str,
            'emotion_scores': dict,
            'frame_count': int,
            'duration': float,
            'emotions_detected': list,
            'face_score': float (0-100)
        }
        """
        if self.face_service is None:
            logger.warning("Face service not initialized")
            return {}
        
        return self.face_service.analyze_video_file(file_path)
    
    def hr_interview_analysis(self, audio_path: Optional[str], video_path: Optional[str]) -> Dict[str, Any]:
        """
        HR Interview Mode Analysis with multimodal fusion
        Analyzes candidate for HR interview context
        """
        try:
            results = {
                'mode': 'HR_INTERVIEW',
                'audio_analysis': None,
                'video_analysis': None,
                'text_analysis': None,
                'overall_assessment': {}
            }
            
            # Run voice analysis
            if audio_path and os.path.exists(audio_path):
                logger.info("Running voice analysis for HR interview...")
                voice_result = self.analyze_audio_file(audio_path)
                results['audio_analysis'] = voice_result
                
                # Extract text from transcript if available
                if voice_result.get('transcript'):
                    text_result = self.text_service.analyze_text(voice_result['transcript'])
                    results['text_analysis'] = text_result
            
            # Run face analysis
            if video_path and os.path.exists(video_path):
                logger.info("Running face analysis for HR interview...")
                results['video_analysis'] = self.analyze_video_file(video_path)
            
            # Perform multimodal fusion
            fusion_service = FusionService('HR_INTERVIEW')
            face_score = results['video_analysis'].get('face_score', 0) if results['video_analysis'] else 0
            voice_score = results['audio_analysis'].get('voice_score', 0) if results['audio_analysis'] else 0
            text_score = results['text_analysis'].get('text_score', 0) if results['text_analysis'] else 0
            
            fusion_result = fusion_service.fuse_scores(face_score, voice_score, text_score)
            
            # Calculate overall assessment
            results['overall_assessment'] = self._calculate_hr_assessment(results)
            results['fusion_analysis'] = fusion_result
            results['risk_score'] = fusion_result['risk_score']
            results['confidence_level'] = fusion_result['confidence']
            
            return results
        except Exception as e:
            logger.error(f"Error in HR interview analysis: {e}")
            raise
    
    def criminal_investigation_analysis(self, audio_path: Optional[str], video_path: Optional[str]) -> Dict[str, Any]:
        """
        Criminal Investigation Mode Analysis with multimodal fusion
        Analyzes for deception indicators and suspicious behavior
        """
        try:
            results = {
                'mode': 'CRIMINAL_INVESTIGATION',
                'audio_analysis': None,
                'video_analysis': None,
                'text_analysis': None,
                'deception_indicators': []
            }
            
            # Run voice analysis
            if audio_path and os.path.exists(audio_path):
                logger.info("Running voice analysis for criminal investigation...")
                voice_result = self.analyze_audio_file(audio_path)
                results['audio_analysis'] = voice_result
                
                # Detect deception indicators from voice
                if voice_result.get('stress_level', 0) > 70:
                    results['deception_indicators'].append('high_stress_detected')
                if voice_result.get('emotion') not in ['calm', 'neutral']:
                    results['deception_indicators'].append('emotional_instability')
                
                # Extract text from transcript
                if voice_result.get('transcript'):
                    text_result = self.text_service.analyze_text(voice_result['transcript'])
                    results['text_analysis'] = text_result
            
            # Run face analysis
            if video_path and os.path.exists(video_path):
                logger.info("Running face analysis for criminal investigation...")
                video_result = self.analyze_video_file(video_path)
                results['video_analysis'] = video_result
                
                # Detect suspicious expressions
                if video_result.get('dominant_emotion') in ['fear', 'angry', 'sad']:
                    results['deception_indicators'].append('suspicious_emotion_detected')
            
            # Perform multimodal fusion
            fusion_service = FusionService('CRIMINAL_INVESTIGATION')
            face_score = results['video_analysis'].get('face_score', 0) if results['video_analysis'] else 0
            voice_score = results['audio_analysis'].get('voice_score', 0) if results['audio_analysis'] else 0
            text_score = results['text_analysis'].get('text_score', 0) if results['text_analysis'] else 0
            
            fusion_result = fusion_service.fuse_scores(face_score, voice_score, text_score)
            results['fusion_analysis'] = fusion_result
            results['risk_score'] = fusion_result['risk_score']
            results['confidence_level'] = fusion_result['confidence']
            
            return results
        except Exception as e:
            logger.error(f"Error in criminal investigation analysis: {e}")
            raise
    
    def business_meeting_analysis(self, audio_path: Optional[str], video_path: Optional[str]) -> Dict[str, Any]:
        """
        Business Meeting Mode Analysis with multimodal fusion
        Analyzes for professionalism and engagement
        """
        try:
            results = {
                'mode': 'BUSINESS_MEETING',
                'audio_analysis': None,
                'video_analysis': None,
                'text_analysis': None,
                'professionalism_score': 0
            }
            
            # Run voice analysis
            if audio_path and os.path.exists(audio_path):
                logger.info("Running voice analysis for business meeting...")
                voice_result = self.analyze_audio_file(audio_path)
                results['audio_analysis'] = voice_result
                
                # Extract text from transcript
                if voice_result.get('transcript'):
                    text_result = self.text_service.analyze_text(voice_result['transcript'])
                    results['text_analysis'] = text_result
            
            # Run face analysis
            if video_path and os.path.exists(video_path):
                logger.info("Running face analysis for business meeting...")
                results['video_analysis'] = self.analyze_video_file(video_path)
            
            # Perform multimodal fusion
            fusion_service = FusionService('BUSINESS_MEETING')
            face_score = results['video_analysis'].get('face_score', 0) if results['video_analysis'] else 0
            voice_score = results['audio_analysis'].get('voice_score', 0) if results['audio_analysis'] else 0
            text_score = results['text_analysis'].get('text_score', 0) if results['text_analysis'] else 0
            
            fusion_result = fusion_service.fuse_scores(face_score, voice_score, text_score)
            
            # Calculate professionalism score
            results['professionalism_score'] = max(0, 100 - fusion_result['risk_score'])
            results['fusion_analysis'] = fusion_result
            results['risk_score'] = fusion_result['risk_score']
            results['confidence_level'] = fusion_result['confidence']
            
            return results
        except Exception as e:
            logger.error(f"Error in business meeting analysis: {e}")
            raise
    
    def _calculate_hr_assessment(self, results: Dict[str, Any]) -> Dict[str, Any]:
        """Calculate HR interview assessment"""
        assessment = {
            'confidence_level': 50,
            'communication_skills': 50,
            'stress_level': 'normal'
        }
        
        if results.get('audio_analysis'):
            audio = results['audio_analysis']
            assessment['stress_level'] = 'high' if audio.get('stress_level', 0) > 70 else 'normal'
        
        if results.get('video_analysis'):
            video = results['video_analysis']
            emotion = video.get('dominant_emotion', '')
            assessment['communication_skills'] = 70 if emotion in ['happy', 'calm'] else 50
        
        return assessment
