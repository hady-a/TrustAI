from pydantic import BaseModel
from typing import List, Dict, Any, Optional

class AnalysisRequest(BaseModel):
    """Request model for analysis"""
    user_id: str
    modes: List[str]
    file_url: Optional[str] = None
    audio_file_path: Optional[str] = None
    video_file_path: Optional[str] = None

class ModalityBreakdown(BaseModel):
    """Risk scores for each modality"""
    video: float
    audio: float
    text: float

class AIResponse(BaseModel):
    """Response model matching backend expectations"""
    overall_risk_score: float
    confidence_level: float
    modality_breakdown: ModalityBreakdown
    detected_indicators: List[str]
    explanation_summary: str
    model_details: Dict[str, Any]
