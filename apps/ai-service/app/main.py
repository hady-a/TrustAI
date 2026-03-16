"""
FastAPI microservice integrating TrustAI multimodal analysis
Endpoints serve analysis results to TrustAI backend
Lazy-loaded models for faster startup
"""

import os
import logging
from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import tempfile
from typing import Optional, List

from app.models import AnalysisRequest, AIResponse, ModalityBreakdown

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global analyzer instance - lazy loaded
analyzer: Optional[object] = None
analyzer_initialized = False


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Initialize on first use (lazy loading)"""
    logger.info("Starting AI Service (models load on first analysis)...")
    yield
    logger.info("Shutting down AI Service...")


app = FastAPI(
    title="TrustAI Analysis Service",
    description="Multimodal evidence analysis using TrustAI system",
    version="1.0.0",
    lifespan=lifespan
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    """Root endpoint - redirect to docs"""
    return {
        "message": "TrustAI Analysis Service is running",
        "service": "TrustAI Analyzer",
        "version": "1.0.0",
        "docs": "http://localhost:8000/docs",
        "health": "http://localhost:8000/health",
        "endpoints": {
            "POST /analyze": "Main analysis endpoint",
            "GET /health": "Health check status",
            "GET /docs": "API documentation (Swagger UI)",
            "GET /redoc": "Alternative API documentation (ReDoc)"
        }
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "TrustAI Analyzer",
        "version": "1.0.0",
        "models_initialized": analyzer_initialized
    }


async def initialize_analyzer():
    """Lazy initialize the analyzer on first use"""
    global analyzer, analyzer_initialized
    if analyzer is None and not analyzer_initialized:
        try:
            logger.info("Loading AI models (this may take 1-2 minutes on first run)...")
            from app.trustai_integration import TrustAIAnalyzer
            analyzer = TrustAIAnalyzer()
            analyzer_initialized = True
            logger.info("✅ AI models loaded successfully")
        except Exception as e:
            logger.error(f"❌ Failed to load AI models: {e}")
            analyzer_initialized = True  # Mark as attempted
            raise


@app.post("/analyze", response_model=AIResponse)
async def analyze(request: AnalysisRequest):
    """
    Main analysis endpoint
    Accepts modes list and file paths
    Returns risk assessment and analysis results
    """
    try:
        logger.info(f"Analysis request - User: {request.user_id}, Modes: {request.modes}")
        
        # Validate that we have at least one file
        if not request.audio_file_path and not request.video_file_path and not request.file_url:
            raise HTTPException(status_code=400, detail="No file provided for analysis")
        
        # Initialize analyzer on first use
        await initialize_analyzer()
        
        if analyzer is None:
            raise HTTPException(status_code=503, detail="AI models not available yet - still loading. Check back in a moment.")
        
        # Route to appropriate analysis mode
        mode = request.modes[0].upper() if request.modes else "HR_INTERVIEW"
        
        # Run the actual AI analysis with multimodal fusion
        if mode == "HR_INTERVIEW":
            analysis_result = analyzer.hr_interview_analysis(
                request.audio_file_path,
                request.video_file_path
            )
            formatted_result = _format_hr_interview_results(analysis_result)
        elif mode == "CRIMINAL_INVESTIGATION":
            analysis_result = analyzer.criminal_investigation_analysis(
                request.audio_file_path,
                request.video_file_path
            )
            formatted_result = _format_criminal_investigation_results(analysis_result)
        elif mode == "BUSINESS_MEETING":
            analysis_result = analyzer.business_meeting_analysis(
                request.audio_file_path,
                request.video_file_path
            )
            formatted_result = _format_business_meeting_results(analysis_result)
        else:
            raise HTTPException(status_code=400, detail=f"Unknown mode: {mode}")
        
        # Extract fusion results from analysis
        fusion_data = analysis_result.get('fusion_analysis', {})
        risk_score = fusion_data.get('risk_score', 0)
        confidence_level = fusion_data.get('confidence', 85)
        modality_scores = fusion_data.get('modality_scores', {
            'face_score': 0,
            'voice_score': 0,
            'text_score': 0
        })
        
        # Get indicators from analysis
        indicators = _extract_detected_indicators(analysis_result, mode)
        
        return AIResponse(
            overall_risk_score=risk_score,
            confidence_level=confidence_level,
            modality_breakdown=ModalityBreakdown(
                video=modality_scores.get('face_score', 0),
                audio=modality_scores.get('voice_score', 0),
                text=modality_scores.get('text_score', 0)
            ),
            detected_indicators=indicators,
            explanation_summary=fusion_data.get('explanation', _generate_summary(analysis_result, mode)),
            model_details={
                "mode": mode,
                "models_used": ["whisper", "wav2vec2", "deepface"],
                "raw_analysis": analysis_result,
                "formatted_results": formatted_result,
                "analysis_data": analysis_result,
                "fusion_analysis": fusion_data,
                "risk_level": fusion_data.get('risk_level', 'Unknown')
            }
        )
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Analysis error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@app.post("/analyze-upload", response_model=AIResponse)
async def analyze_upload(
    user_id: str = Form(...),
    modes: List[str] = Form(...),
    audio_file: Optional[UploadFile] = File(None),
    video_file: Optional[UploadFile] = File(None)
):
    """
    Analysis endpoint with file uploads
    Accepts multipart form data with audio and/or video files
    """
    audio_path = None
    video_path = None
    
    try:
        # Initialize analyzer on first use
        await initialize_analyzer()
        
        if analyzer is None:
            raise HTTPException(status_code=503, detail="AI models not available yet - still loading. Check back in a moment.")
        
        # Save uploaded files to temporary directory
        temp_dir = tempfile.mkdtemp()
        
        if audio_file:
            audio_path = os.path.join(temp_dir, audio_file.filename or "audio.wav")
            content = await audio_file.read()
            with open(audio_path, "wb") as f:
                f.write(content)
            logger.info(f"Saved audio file: {audio_path}")
        
        if video_file:
            video_path = os.path.join(temp_dir, video_file.filename or "video.mp4")
            content = await video_file.read()
            with open(video_path, "wb") as f:
                f.write(content)
            logger.info(f"Saved video file: {video_path}")
        
        # Create request and analyze
        request = AnalysisRequest(
            user_id=user_id,
            modes=modes,
            audio_file_path=audio_path,
            video_file_path=video_path
        )
        
        # Reuse main analysis endpoint logic
        return await analyze(request)
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Upload analysis error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Upload analysis failed: {str(e)}")


def _calculate_risk_score(analysis_result: dict, mode: str) -> float:
    """Calculate overall risk score based on analysis"""
    score = 0.0
    
    if mode == "CRIMINAL_INVESTIGATION":
        # More sensitive to deception indicators
        indicators = analysis_result.get('deception_indicators', [])
        score = min(100.0, float(len(indicators)) * 25)
        
        if analysis_result.get('audio_analysis'):
            stress = analysis_result['audio_analysis'].get('stress_level', 0)
            score += stress * 0.3
    
    elif mode == "HR_INTERVIEW":
        # Focus on stress and communication
        if analysis_result.get('audio_analysis'):
            stress = analysis_result['audio_analysis'].get('stress_level', 0)
            score += stress * 0.4
    
    elif mode == "BUSINESS_MEETING":
        # Lower risk tolerance - inverted for business (high prof = low risk)
        prof_score = analysis_result.get('professionalism_score', 75)
        score = max(0.0, 100.0 - prof_score)
    
    return float(min(100.0, max(0.0, score)))


def _calculate_modality_scores(analysis_result: dict) -> dict:
    """Calculate risk scores for each modality"""
    scores = {'video': 0, 'audio': 0, 'text': 0}
    
    if analysis_result.get('audio_analysis'):
        audio = analysis_result['audio_analysis']
        stress = audio.get('stress_level', 0)
        scores['audio'] = stress * 0.5  # Stress contributes to audio score
    
    if analysis_result.get('video_analysis'):
        video = analysis_result['video_analysis']
        emotion_map = {
            'fear': 80, 'angry': 70, 'sad': 60,
            'happy': 20, 'calm': 10, 'neutral': 30
        }
        dominant = video.get('dominant_emotion', 'neutral')
        scores['video'] = emotion_map.get(dominant, 40)
    
    return scores


def _extract_detected_indicators(analysis_result: dict, mode: str) -> List[str]:
    """Extract detected indicators from analysis"""
    indicators = []
    
    if mode == "CRIMINAL_INVESTIGATION":
        indicators.extend(analysis_result.get('deception_indicators', []))
    
    if analysis_result.get('audio_analysis'):
        audio = analysis_result['audio_analysis']
        if audio.get('stress_level', 0) > 70:
            indicators.append('high_stress_detected')
        if audio.get('emotion') not in ['calm', 'neutral']:
            indicators.append(f'voice_emotion_{audio.get("emotion")}')
    
    if analysis_result.get('video_analysis'):
        video = analysis_result['video_analysis']
        emotion = video.get('dominant_emotion')
        if emotion:
            indicators.append(f'facial_emotion_{emotion}')
    
    return indicators if indicators else ['analysis_completed']


def _format_hr_interview_results(analysis_result: dict) -> dict:
    """Format HR interview results for frontend"""
    audio = analysis_result.get('audio_analysis', {})
    video = analysis_result.get('video_analysis', {})
    assessment = analysis_result.get('overall_assessment', {})
    
    return {
        "mode": "HR_INTERVIEW",
        "insights": [
            {
                "category": "Communication Style",
                "confidence": min(100, audio.get('confidence', 50) + 10),
                "insights": [
                    f"Detected {audio.get('emotion', 'neutral')} emotional state",
                    f"Speech duration: {audio.get('duration', 0):.1f} seconds",
                    "Clear audio transcription available"
                ],
                "tone": assessment.get('stress_level', 'normal').capitalize(),
                "keyPhrases": audio.get('transcript', '')[:100].split()[:5]
            },
            {
                "category": "Credibility Assessment",
                "confidence": assessment.get('confidence_level', 50),
                "insights": [
                    f"Stress level: {audio.get('stress_level', 0)}%",
                    f"Speech emotion: {audio.get('emotion', 'neutral')}",
                    f"Facial dominant emotion: {video.get('dominant_emotion', 'neutral')}"
                ],
                "tone": "Professional" if audio.get('stress_level', 0) < 50 else "Uncertain",
                "keyPhrases": [audio.get('emotion', 'neutral'), assessment.get('stress_level', 'normal')]
            },
            {
                "category": "Stress Indicators",
                "confidence": max(50, 100 - audio.get('stress_level', 0)),
                "insights": [
                    f"Voice stress level: {audio.get('stress_level', 0)}%",
                    f"Communication skills: {assessment.get('communication_skills', 50)}/100",
                    f"Detected emotions: {', '.join([audio.get('emotion', 'neutral'), video.get('dominant_emotion', 'neutral')])}"
                ],
                "tone": "Confident" if audio.get('stress_level', 0) < 40 else ("Uncertain" if audio.get('stress_level', 0) < 70 else "Defensive"),
                "keyPhrases": [f"{audio.get('stress_level', 0)}% stress", assessment.get('stress_level', 'normal')]
            }
        ],
        "transcript": audio.get('transcript', ''),
        "audioAnalysis": audio,
        "videoAnalysis": video,
        "assessment": assessment
    }


def _format_criminal_investigation_results(analysis_result: dict) -> dict:
    """Format criminal investigation results for frontend"""
    audio = analysis_result.get('audio_analysis', {})
    video = analysis_result.get('video_analysis', {})
    deception = analysis_result.get('deception_indicators', [])
    
    def map_severity(stress_level):
        if stress_level > 80:
            return "Critical"
        elif stress_level > 60:
            return "High"
        elif stress_level > 40:
            return "Medium"
        return "Low"
    
    findings = []
    
    # Audio analysis findings
    if audio.get('stress_level', 0) > 40:
        findings.append({
            "category": "Voice & Stress Analysis",
            "severity": map_severity(audio.get('stress_level', 0)),
            "description": f"Audio stress level: {audio.get('stress_level', 0)}% | Detected emotion: {audio.get('emotion', 'neutral')}",
            "evidence": [
                f"Stress indicator: {audio.get('stress_level', 0)}%",
                f"Emotional tone: {audio.get('emotion', 'unknown')}",
                f"Confidence: {audio.get('confidence', 0)}%"
            ]
        })
    
    # Video/Face analysis findings
    if video and video.get('dominant_emotion'):
        emotion_name = video.get('dominant_emotion', 'neutral')
        emotion_scores = video.get('emotion_scores', {})
        
        # Create evidence list from emotion scores
        evidence = []
        for emotion_type, score in list(emotion_scores.items())[:3]:
            evidence.append(f"{emotion_type.capitalize()}: {score:.1f}%")
        
        # Determine severity based on emotion type
        if emotion_name in ['fear', 'anger', 'disgust']:
            severity = "High"
        elif emotion_name in ['sad', 'surprise']:
            severity = "Medium"
        else:
            severity = "Low"
        
        findings.append({
            "category": "Facial Expression Analysis",
            "severity": severity,
            "description": f"Dominant facial emotion detected: {emotion_name} (File type: {video.get('file_type', 'unknown')})",
            "evidence": evidence if evidence else [f"Primary emotion: {emotion_name}"]
        })
    
    # Deception indicators
    if deception:
        findings.append({
            "category": "Behavioral Deception Markers",
            "severity": "High",
            "description": "Multiple indicators suggest potential deception or dishonesty",
            "evidence": deception
        })
    
    # If no strong findings, still provide some analysis
    if not findings:
        findings.append({
            "category": "Baseline Assessment",
            "severity": "Low",
            "description": "Subject presents with controlled demeanor and consistent patterns",
            "evidence": [
                "No acute stress indicators",
                "Neutral to positive emotional baseline",
                "Consistent vocal patterns"
            ]
        })
    
    # Generate recommendations based on findings
    recommendations = []
    if any(f['severity'] in ['Critical', 'High'] for f in findings):
        recommendations = [
            "Conduct detailed transcript analysis of key statements",
            "Cross-reference timeline with corroborating evidence",
            "Perform comprehensive follow-up interview",
            "Request additional documentation for verification",
            "Flag for advanced investigation protocol"
        ]
    else:
        recommendations = [
            "Continue standard investigation protocol",
            "Monitor for behavioral changes in follow-up",
            "Maintain documentation of interactions",
            "Schedule periodic reassessment"
        ]
    
    return {
        "mode": "CRIMINAL_INVESTIGATION",
        "riskLevel": max([f['severity'] for f in findings] or ['Low']),
        "confidence": max(60, 100 - abs(audio.get('stress_level', 50) - 50)),
        "findings": findings,
        "recommendations": recommendations,
        "timeline": "",
        "suspectProfile": f"Emotional profile: {video.get('dominant_emotion', 'neutral')} | Stress indicators: {audio.get('stress_level', 0)}% | Audio emotion: {audio.get('emotion', 'neutral')}",
        "audioAnalysis": audio,
        "videoAnalysis": video,
        "deceptionIndicators": deception
    }


def _format_business_meeting_results(analysis_result: dict) -> dict:
    """Format business meeting results for frontend"""
    audio = analysis_result.get('audio_analysis', {})
    video = analysis_result.get('video_analysis', {})
    prof_score = analysis_result.get('professionalism_score', 75)
    
    def get_trend(value, benchmark):
        if value > benchmark:
            return "up"
        elif value < benchmark:
            return "down"
        return "stable"
    
    metrics = [
        {
            "name": "Communication Clarity",
            "current": min(100, audio.get('confidence', 50) + 20),
            "benchmark": 80,
            "trend": get_trend(audio.get('confidence', 50) + 20, 80),
            "category": "Communication"
        },
        {
            "name": "Professionalism Score",
            "current": prof_score,
            "benchmark": 75,
            "trend": get_trend(prof_score, 75),
            "category": "Behavior"
        },
        {
            "name": "Emotional Stability",
            "current": max(0, 100 - audio.get('stress_level', 0)),
            "benchmark": 80,
            "trend": get_trend(100 - audio.get('stress_level', 0), 80),
            "category": "Emotional"
        },
        {
            "name": "Engagement Level",
            "current": min(100, len(video.get('emotions_detected', [])) * 3 + 50),
            "benchmark": 75,
            "trend": "up",
            "category": "Behavior"
        }
    ]
    
    recommendations = []
    if prof_score < 60:
        recommendations.append({
            "priority": "Critical",
            "title": "Professionalism Development",
            "description": "Focus on communication and professional demeanor",
            "impact": "Improved meeting effectiveness",
            "timeline": "Immediate"
        })
    if audio.get('stress_level', 0) > 60:
        recommendations.append({
            "priority": "High",
            "title": "Stress Management Training",
            "description": "Implement stress management techniques",
            "impact": "Better performance under pressure",
            "timeline": "Within 2 weeks"
        })
    if not recommendations:
        recommendations.append({
            "priority": "Low",
            "title": "Continue Current Practice",
            "description": "Maintain current professional standards",
            "impact": "Sustained performance",
            "timeline": "Ongoing"
        })
    
    return {
        "mode": "BUSINESS_MEETING",
        "metrics": metrics,
        "recommendations": recommendations,
        "professionalismScore": prof_score,
        "audioAnalysis": audio,
        "videoAnalysis": video
    }


def _generate_summary(analysis_result: dict, mode: str) -> str:
    """Generate human-readable summary"""
    summary_parts = []
    
    if analysis_result.get('audio_analysis'):
        audio = analysis_result['audio_analysis']
        summary_parts.append(f"Audio Analysis: Detected {audio.get('emotion', 'neutral')} emotional state with {audio.get('stress_level', 0)}% stress level. Confidence: {audio.get('confidence', 50)}%.")
    
    if analysis_result.get('video_analysis'):
        video = analysis_result['video_analysis']
        emotion_summary = ', '.join([f"{k}: {v:.0f}%" for k, v in list(video.get('emotion_scores', {}).items())[:3]])
        summary_parts.append(f"Video Analysis: Dominant emotion detected as {video.get('dominant_emotion', 'neutral')} across {video.get('frame_count', 0)} frames. Emotion breakdown: {emotion_summary if emotion_summary else 'not available'}.")
    
    if mode == "CRIMINAL_INVESTIGATION":
        indicators = analysis_result.get('deception_indicators', [])
        if indicators:
            summary_parts.append(f"Deception Analysis: {len(indicators)} indicator(s) flagged - {', '.join(indicators)}.")
        else:
            summary_parts.append("Deception Analysis: No significant deception indicators detected.")
    
    elif mode == "HR_INTERVIEW":
        assessment = analysis_result.get('overall_assessment', {})
        summary_parts.append(f"Assessment: Communication skills {assessment.get('communication_skills', 50)}/100, Stress level {assessment.get('stress_level', 'normal')}.")
    
    elif mode == "BUSINESS_MEETING":
        prof = analysis_result.get('professionalism_score', 75)
        summary_parts.append(f"Professionalism Score: {prof}/100. {'Strong professional presentation.' if prof >= 75 else ('Good professional standards.' if prof >= 60 else 'Needs professional development.')}")
    
    return " ".join(summary_parts) if summary_parts else "Analysis completed successfully."


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
