# TrustAI AI Service Setup

This is the AI microservice for TrustAI that integrates the multimodal analysis system with the backend.

## Features

- **HR Interview Mode**: Analyzes candidates for HR interviews with audio/video
- **Criminal Investigation Mode**: Detects deception indicators and suspicious behavior  
- **Business Meeting Mode**: Assesses professionalism and engagement

### Multimodal Analysis

- **Audio Analysis**: Speech-to-text (Whisper), emotion detection (Wav2Vec2), stress detection
- **Video Analysis**: Facial emotion recognition (DeepFace), expression analysis
- **Combined Assessment**: Risk scoring and indicator detection

## Installation

### Option 1: Local Setup

```bash
# Make setup script executable
chmod +x setup.sh

# Run setup
./setup.sh

# Activate virtual environment
source venv/bin/activate

# Start the service
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

### Option 2: Docker

```bash
# Build image
docker build -t trustai-ai-service .

# Run container
docker run -p 8000:8000 \
  -v $(pwd)/temp:/app/temp \
  trustai-ai-service
```

## API Endpoints

### Health Check
```bash
GET /health
```

### Analysis (with file paths)
```bash
POST /analyze
Content-Type: application/json

{
  "user_id": "user_123",
  "modes": ["HR_INTERVIEW"],
  "audio_file_path": "/path/to/audio.wav",
  "video_file_path": "/path/to/video.mp4"
}
```

### Analysis (with file uploads)
```bash
POST /analyze-upload
Content-Type: multipart/form-data

- user_id: user_123
- modes: HR_INTERVIEW
- audio_file: (binary)
- video_file: (binary)
```

## Response Format

```json
{
  "overall_risk_score": 35.5,
  "confidence_level": 85,
  "modality_breakdown": {
    "video": 30,
    "audio": 40,
    "text": 0
  },
  "detected_indicators": [
    "high_stress_detected",
    "dominant_emotion_calm"
  ],
  "explanation_summary": "Audio: calm mood detected with 45% stress level. Video: Dominant emotion detected as happy across 120 frames. Professionalism score: 80/100",
  "model_details": {
    "mode": "HR_INTERVIEW",
    "models_used": ["whisper", "wav2vec2", "deepface"],
    "analysis_data": {...}
  }
}
```

## Integration with Backend

The backend calls this service at `http://localhost:8000/analyze` when processing analysis jobs:

1. Backend receives analysis request with audio/video files
2. Files are uploaded to the backend's file storage
3. Analysis job is added to Redis queue
4. Worker processes the job and calls this AI service
5. AI service returns analysis results
6. Results are stored in database and returned to frontend

## Configuration

The service reads configuration from environment variables:

- `AISERVICE_HOST`: Host to bind to (default: 0.0.0.0)
- `AISERVICE_PORT`: Port to bind to (default: 8000)

## Troubleshooting

### GPU Support
For GPU acceleration, install PyTorch CUDA-enabled version:
```bash
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu118
```

### Memory Issues
If experiencing memory issues with large files:
- Reduce model batch sizes in `trustai_integration.py`
- Use CPU-only mode (slower but less memory)
- Process one file at a time

### Missing Whisper Models
First run will download ~1.4GB of models. This can be slow but happens only once.

## Development

To modify the analysis logic, edit:
- `app/trustai_integration.py` - Core analysis engines
- `app/main.py` - API endpoints
- `app/models.py` - Request/response schemas

## See Also

- [Backend Documentation](../backend/README.md)
- [Frontend Documentation](../frontend/README.md)
- [Docker Setup Guide](../../DOCKER_SETUP_GUIDE.md)
