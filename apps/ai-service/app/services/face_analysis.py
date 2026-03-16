"""
Face Analysis Service - Analyzes face/video for deception indicators
Returns: face_score (deception probability 0-100)
"""

import os
import logging
from typing import Dict, Any, Optional

try:
    import cv2
    CV2_AVAILABLE = True
except ImportError:
    print("Warning: opencv-python not installed")
    CV2_AVAILABLE = False

try:
    from deepface import DeepFace
except ImportError:
    print("Warning: DeepFace not installed")

logger = logging.getLogger(__name__)


class FaceAnalysisService:
    """Service for analyzing facial expressions and emotions"""
    
    def __init__(self):
        """Initialize face analysis service"""
        logger.info("FaceAnalysisService initialized")
    
    def analyze_video_file(self, file_path: Optional[str]) -> Dict[str, Any]:
        """
        Analyze video/image file for facial expressions
        
        Returns:
        {
            'face_score': float (0-100) - deception probability,
            'dominant_emotion': str,
            'emotion_scores': dict,
            'frame_count': int,
            'duration': float,
            'file_type': str,
            'emotions_detected': list
        }
        """
        if not file_path or not os.path.exists(file_path):
            logger.warning(f"Video file not found: {file_path}")
            return {
                'face_score': 0.0,
                'dominant_emotion': 'neutral',
                'emotion_scores': {},
                'frame_count': 0,
                'duration': 0,
                'file_type': 'unknown',
                'emotions_detected': []
            }
        
        try:
            logger.info(f"Analyzing face/video: {file_path}")
            
            # Check if file is an image or video
            is_image = file_path.lower().endswith(('.jpg', '.jpeg', '.png', '.bmp', '.gif'))
            
            if is_image:
                return self._analyze_image(file_path)
            else:
                return self._analyze_video(file_path)
        
        except Exception as e:
            logger.error(f"Error analyzing video/image: {e}")
            return {
                'face_score': 0.0,
                'dominant_emotion': 'neutral',
                'emotion_scores': {},
                'frame_count': 0,
                'duration': 0,
                'file_type': 'unknown',
                'emotions_detected': []
            }
    
    def _analyze_image(self, file_path: str) -> Dict[str, Any]:
        """Analyze a single image for face emotions"""
        try:
            logger.info(f"Processing as static image: {file_path}")
            frame = cv2.imread(file_path)
            
            if frame is None:
                raise ValueError(f"Could not read image file: {file_path}")
            
            emotions_detected = []
            emotion_scores = {}
            
            try:
                # Analyze emotions in image
                analysis = DeepFace.analyze(
                    frame,
                    actions=['emotion'],
                    enforce_detection=False
                )
                
                if analysis:
                    emotion = analysis[0].get('dominant_emotion', 'neutral')
                    emotions_detected.append(emotion)
                    emotion_scores = analysis[0].get('emotion', {})
            except Exception as e:
                logger.debug(f"Could not analyze image: {e}")
            
            dominant_emotion = max(emotion_scores, key=emotion_scores.get) if emotion_scores else 'neutral'
            
            # Calculate deception score based on emotion
            face_score = self._calculate_deception_score(dominant_emotion, emotion_scores)
            
            return {
                'face_score': face_score,
                'dominant_emotion': dominant_emotion,
                'emotion_scores': emotion_scores,
                'frame_count': 1,
                'duration': 0,
                'file_type': 'image',
                'emotions_detected': emotions_detected
            }
        except Exception as e:
            logger.error(f"Error analyzing image: {e}")
            return {
                'face_score': 0.0,
                'dominant_emotion': 'neutral',
                'emotion_scores': {},
                'frame_count': 1,
                'duration': 0,
                'file_type': 'image',
                'emotions_detected': []
            }
    
    def _analyze_video(self, file_path: str) -> Dict[str, Any]:
        """Analyze a video file for facial expressions across frames"""
        try:
            logger.info(f"Processing as video file: {file_path}")
            cap = cv2.VideoCapture(file_path)
            
            if not cap.isOpened():
                raise ValueError(f"Could not open video file: {file_path}")
            
            fps = cap.get(cv2.CAP_PROP_FPS)
            frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
            duration = frame_count / fps if fps > 0 else 0
            
            frame_processed = 0
            emotions_detected = []
            emotion_scores = {}
            
            # Sample frames to reduce processing time (~30 frames)
            sample_rate = max(1, frame_count // 30)
            
            while True:
                ret, frame = cap.read()
                if not ret:
                    break
                
                if frame_processed % sample_rate == 0:
                    try:
                        # Analyze emotions in frame
                        analysis = DeepFace.analyze(
                            frame,
                            actions=['emotion'],
                            enforce_detection=False
                        )
                        
                        if analysis:
                            emotion = analysis[0].get('dominant_emotion', 'neutral')
                            emotions_detected.append(emotion)
                            
                            # Accumulate emotion scores
                            for emotion_type, score in analysis[0].get('emotion', {}).items():
                                emotion_scores[emotion_type] = emotion_scores.get(emotion_type, 0) + score
                    except Exception as e:
                        logger.debug(f"Could not analyze frame {frame_processed}: {e}")
                
                frame_processed += 1
            
            cap.release()
            
            # Calculate averages
            if emotion_scores:
                total = sum(emotion_scores.values())
                emotion_scores = {k: v / total * 100 for k, v in emotion_scores.items()}
            
            dominant_emotion = max(emotion_scores, key=emotion_scores.get) if emotion_scores else 'neutral'
            
            # Calculate deception score from emotion patterns
            face_score = self._calculate_deception_score(dominant_emotion, emotion_scores)
            
            return {
                'face_score': face_score,
                'dominant_emotion': dominant_emotion,
                'emotion_scores': emotion_scores,
                'frame_count': frame_processed,
                'duration': duration,
                'file_type': 'video',
                'emotions_detected': emotions_detected
            }
        except Exception as e:
            logger.error(f"Error analyzing video: {e}")
            return {
                'face_score': 0.0,
                'dominant_emotion': 'neutral',
                'emotion_scores': {},
                'frame_count': 0,
                'duration': 0,
                'file_type': 'video',
                'emotions_detected': []
            }
    
    def _calculate_deception_score(self, dominant_emotion: str, emotion_scores: Dict[str, float]) -> float:
        """
        Calculate deception probability from emotions
        
        Deception indicators:
        - Fear, Anger, Disgust: high deception probability
        - Sadness, Surprise: medium deception probability
        - Happy, Calm, Neutral: low deception probability
        
        Args:
            dominant_emotion: Primary detected emotion
            emotion_scores: Dictionary of emotion scores
        
        Returns:
            Deception score (0-100)
        """
        base_scores = {
            'fear': 75.0,
            'angry': 70.0,
            'disgust': 65.0,
            'sad': 50.0,
            'surprise': 45.0,
            'happy': 20.0,
            'calm': 10.0,
            'neutral': 25.0
        }
        
        # Get base score for dominant emotion
        face_score = base_scores.get(dominant_emotion.lower(), 25.0)
        
        # Adjust based on emotion confidence
        if emotion_scores:
            dominant_score = emotion_scores.get(dominant_emotion.lower(), 0)
            if dominant_score > 0:
                # High confidence in deceptive emotion increases score
                confidence_factor = min(dominant_score / 100.0, 1.0)
                face_score = face_score * (0.5 + 0.5 * confidence_factor)
        
        return float(max(0.0, min(100.0, face_score)))
