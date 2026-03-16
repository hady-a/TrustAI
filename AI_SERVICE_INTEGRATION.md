# TrustAI AI Service Integration Complete

## Overview

The TrustAI system now has a complete AI microservice that integrates the multimodal analysis system with your backend.

### Architecture

```
┌─────────────────┐
│    Frontend     │
│   (React/Vite)  │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────────┐
│      Backend (Node.js/Express)      │
├─────────────────────────────────────┤
│  - Analysis Queue (Redis)           │
│  - File Storage Service             │
│  - Authentication & Authorization   │
│  - Database Management (Drizzle)    │
└────────┬────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────┐
│    AI Service (Python/FastAPI)       │
├──────────────────────────────────────┤
│  - TrustAI Integration               │
│  - Multimodal Analysis:              │
│    • Audio: Whisper, Wav2Vec2        │
│    • Video: DeepFace                 │
│  - Three Analysis Modes:             │
│    • HR Interview                    │
│    • Criminal Investigation          │
│    • Business Meeting                │
└──────────────────────────────────────┘
```

## Quick Start

### Using Docker (Recommended)

```bash
# Make setup script executable
chmod +x setup-all.sh

# Run setup and choose option 1
./setup-all.sh

# In the root directory
docker-compose up -d

# View logs
docker-compose logs -f
```

Access the system:
- Frontend: http://localhost:5173
- Backend API: http://localhost:5000
- AI Service: http://localhost:8000
- Backend Swagger Docs: http://localhost:5000/api/docs

### Running Locally

```bash
# Terminal 1: Backend
cd apps/backend
npm install
npm run dev

# Terminal 2: Frontend
cd apps/frontend
npm install
npm run dev

# Terminal 3: AI Service
cd apps/ai-service
chmod +x setup.sh
./setup.sh
source venv/bin/activate
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

## How It Works

### 1. User Submits Analysis
- Frontend sends audio/video files to backend
- Backend stores files and creates analysis record

### 2. Analysis Queued
- Job added to Redis queue with:
  - Analysis ID
  - User ID
  - Analysis modes (HR_INTERVIEW, CRIMINAL_INVESTIGATION, BUSINESS_MEETING)
  - File references

### 3. Worker Processes
- Analysis worker picks up job from queue
- Updates status to PROCESSING
- Calls AI service with file paths and modes

### 4. AI Analysis
- AI service loads specified files
- Runs multimodal analysis:
  - **Audio Processing**:
    - Speech-to-text using Whisper
    - Emotion detection using Wav2Vec2
    - Stress level calculation from audio features
  
  - **Video Processing**:
    - Frame-by-frame emotion analysis with DeepFace
    - Dominant emotion detection
    - Expression patterns over time

### 5. Results Returned
- AI service returns structured analysis:
  ```json
  {
    "overall_risk_score": 35.5,
    "confidence_level": 85.0,
    "modality_breakdown": {
      "audio": 40,
      "video": 30,
      "text": 0
    },
    "detected_indicators": [...],
    "explanation_summary": "...",
    "model_details": {...}
  }
  ```

### 6. Storage & Display
- Backend stores results in database
- Status updated to AI_ANALYZED then COMPLETED
- Frontend displays results with visualizations

## API Integration Points

### Backend → AI Service

**Endpoint:** `POST http://ai-service:8000/analyze`

```json
{
  "user_id": "user_123",
  "modes": ["HR_INTERVIEW"],
  "audio_file_path": "/path/to/audio.wav",
  "video_file_path": "/path/to/video.mp4"
}
```

**Response:** AIResponse with risk scores, indicators, and detailed analysis

### File Handling

1. **Files uploaded to backend** via `/api/analyses/upload`
2. **Stored in backend** at configured location (local or S3)
3. **Paths passed to AI service** for processing
4. **Results stored** in analysis record

## Configuration

### Environment Variables

**Backend** (.env):
```
AI_SERVICE_URL=http://ai-service:8000  # Docker
# or
AI_SERVICE_URL=http://localhost:8000    # Local
```

**Frontend** (.env):
```
VITE_API_URL=http://localhost:5000
VITE_AI_SERVICE_URL=http://localhost:8000
```

**AI Service** (in docker-compose.yml or as env vars):
```
PYTHONUNBUFFERED=1
LOG_LEVEL=info
```

## AI Service Details

### Supported Modes

1. **HR Interview Mode**
   - Evaluates candidate communication skills
   - Measures stress during interview
   - Assesses emotional stability
   - Generates professionalism score

2. **Criminal Investigation Mode**
   - Detects deception indicators
   - Analyzes stress patterns
   - Flags suspicious behaviors
   - Identifies emotion inconsistencies

3. **Business Meeting Mode**
   - Measures engagement levels
   - Assesses professionalism
   - Tracks emotional expressions
   - Generates collaboration metrics

### Models Used

- **Whisper** (OpenAI): Speech-to-text transcription
- **Wav2Vec2** (Meta): Speech emotion recognition and stress detection
- **DeepFace**: Facial emotion recognition and attribute analysis
- **Librosa**: Audio feature extraction

### Performance

- **Audio Processing**: ~5-30 seconds depending on duration
- **Video Processing**: Duration-dependent (optimized with frame sampling)
- **Combined Analysis**: 15-60 seconds for typical 1-5 minute media

## Troubleshooting

### AI Service Won't Start

```bash
# Check if port 8000 is in use
lsof -i :8000

# Check Python logs
cd apps/ai-service
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Models Taking Long to Download

First run downloads ~2-3GB of AI models (~5-10 minutes on good connection)

### Memory Issues

If system runs out of memory:
- Reduce batch sizes in `trustai_integration.py`
- Process smaller files first
- Use docker resource limits: `docker-compose up --compatibility`

### Backend Can't Connect to AI Service

```bash
# From backend container or local machine
curl http://localhost:8000/health

# If using Docker, check network
docker network ls
docker network inspect trustai-network
```

## Development

### Modifying Analysis Logic

Edit `apps/ai-service/app/trustai_integration.py`:

```python
def custom_analysis(self, audio_path, video_path):
    """Add your custom analysis here"""
    # Use existing methods
    audio_result = self.analyze_audio_file(audio_path)
    video_result = self.analyze_video_file(video_path)
    
    # Custom processing
    # ...
    
    return results
```

### Adding New Analysis Modes

1. Add mode to backend enum in `src/db/schema/enums.ts`
2. Implement analysis method in `trustai_integration.py`
3. Route in `app/main.py` analyze endpoint
4. Update frontend mode selector

## Testing

### Test Analysis Endpoint

```bash
curl -X POST http://localhost:8000/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "test_user",
    "modes": ["HR_INTERVIEW"],
    "audio_file_path": "/tmp/test.wav",
    "video_file_path": "/tmp/test.mp4"
  }'
```

### Test Health Check

```bash
curl http://localhost:8000/health
```

### Test with Files

```bash
curl -X POST http://localhost:8000/analyze-upload \
  -F "user_id=test_user" \
  -F "modes=HR_INTERVIEW" \
  -F "audio_file=@/path/to/audio.wav"
```

## Next Steps

1. **Configure storage**: Update file storage backend (local/S3)
2. **Add authentication**: Implement OAuth for analysis endpoints
3. **Custom models**: Train models on your domain-specific data
4. **Monitoring**: Add Prometheus metrics to AI service
5. **Optimization**: Use GPU acceleration for faster inference

## Support

For issues with:
- **Backend**: See `apps/backend/README.md`
- **Frontend**: See `apps/frontend/README.md`
- **AI Service**: See `apps/ai-service/README.md`
- **Docker**: See `DOCKER_SETUP_GUIDE.md`
