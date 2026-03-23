# Flask AI API Integration Guide

This guide explains how to integrate the Python AI models with the Express backend using Flask.

## Overview

The TrustAI system uses a Flask API server to expose Python AI models (face analysis, voice analysis, lie detection) as REST endpoints. The Express backend communicates with this Flask API to perform AI analysis operations.

### Architecture

```
Frontend (React)
    ↓
Express Backend (Node.js/TypeScript)
    ↓
Flask API (Python)
    ↓
AI Models (Face, Voice, Lie Detection)
```

## Quick Start

### 1. Start the Flask API Server

#### Option A: Development Mode (with auto-reload)

```bash
cd "/Users/hadyakram/Desktop/trustai"
bash run_flask.sh
```

This script will:
- Activate the Python virtual environment
- Install dependencies if needed
- Start the Flask development server on `http://localhost:5000`

#### Option B: Production Mode (with Gunicorn)

```bash
bash run_flask_prod.sh
```

This uses Gunicorn with multiple workers for better performance.

### 2. Verify Flask API Connection

Check if the Flask API is running:

```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "TrustAI Flask API",
  "version": "1.0.0",
  "timestamp": "2026-03-23T10:00:00.000000"
}
```

### 3. Start the Express Backend

In a separate terminal:

```bash
cd "/Users/hadyakram/Desktop/trustai/apps/backend"
npm run dev
```

The backend will automatically check the Flask API connection on startup and log the status.

### 4. Start the Frontend

In another terminal:

```bash
cd "/Users/hadyakram/Desktop/trustai/apps/frontend"
npm run dev
```

## Configuration

### Flask API Configuration

Edit `/Users/hadyakram/Desktop/trustai/trust\ ai\ system/.env.flask`:

```env
# Flask API Configuration
FLASK_PORT=5000
FLASK_DEBUG=True
FLASK_ENV=development

# Upload settings
MAX_FILE_SIZE_MB=50

# AI Model Configuration
DEFAULT_REPORT_TYPE=general
VIDEO_DURATION_SECONDS=5
```

### Backend Configuration

Add to `/Users/hadyakram/Desktop/trustai/apps/backend/.env`:

```env
# Flask AI API Configuration
FLASK_API_URL=http://localhost:5000
FLASK_API_TIMEOUT=120000
```

**Note:** If `FLASK_API_URL` is not set, it defaults to `http://localhost:5000`.

## API Endpoints

### Health & Status

#### Check API Health
```
GET /health
```

Response:
```json
{
  "status": "healthy",
  "service": "TrustAI Flask API",
  "version": "1.0.0",
  "timestamp": "2026-03-23T10:00:00.000000"
}
```

#### Get API Status
```
GET /api/status
```

Response:
```json
{
  "status": "active",
  "service": "TrustAI Flask API",
  "version": "1.0.0",
  "endpoints": {
    "health": "GET /health",
    "analyze_complete": "POST /api/analyze",
    "analyze_face": "POST /api/analyze/face",
    "analyze_voice": "POST /api/analyze/voice",
    "analyze_credibility": "POST /api/analyze/credibility",
    "generate_report": "POST /api/analyze/report",
    "status": "GET /api/status"
  },
  "timestamp": "2026-03-23T10:00:00.000000"
}
```

### Analysis Endpoints

#### Complete Analysis
```
POST /api/analyze
```

**Form Data:**
- `image` (file, optional): Facial image file
- `audio` (file, optional): Audio file
- `report_type` (string, optional): Type of report - `general`, `hr`, `criminal`, `business` (default: general)
- `video_duration` (integer, optional): Video duration in seconds (default: 5)

**Note:** At least one of `image` or `audio` is required.

**Example using cURL:**
```bash
curl -X POST http://localhost:5000/api/analyze \
  -F "image=@/path/to/image.jpg" \
  -F "audio=@/path/to/audio.mp3" \
  -F "report_type=hr"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "face": { ... },
    "voice": { ... },
    "credibility": { ... },
    "report": { ... },
    "errors": []
  },
  "timestamp": "2026-03-23T10:00:00.000000",
  "report_type": "hr"
}
```

#### Face Analysis
```
POST /api/analyze/face
```

**Form Data:**
- `image` (file, required): Facial image file

**Example:**
```bash
curl -X POST http://localhost:5000/api/analyze/face \
  -F "image=@/path/to/image.jpg"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "age": 28,
    "gender": "male",
    "emotion": "neutral",
    "race": "asian",
    ...
  },
  "timestamp": "2026-03-23T10:00:00.000000"
}
```

#### Voice Analysis
```
POST /api/analyze/voice
```

**Form Data:**
- `audio` (file, required): Audio file

**Example:**
```bash
curl -X POST http://localhost:5000/api/analyze/voice \
  -F "audio=@/path/to/audio.mp3"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "transcription": "...",
    "stress_level": 0.45,
    "emotion": "calm",
    ...
  },
  "timestamp": "2026-03-23T10:00:00.000000"
}
```

#### Credibility Analysis
```
POST /api/analyze/credibility
```

**Form Data:**
- `image` (file, optional): Facial image file
- `audio` (file, optional): Audio file
- `report_type` (string, optional): `general`, `hr`, `criminal`, `business` (default: general)

**Response:**
```json
{
  "success": true,
  "data": {
    "face": { ... },
    "voice": { ... },
    "credibility": {
      "credibility_score": 0.85,
      "lie_probability": 0.15,
      ...
    }
  },
  "timestamp": "2026-03-23T10:00:00.000000",
  "report_type": "hr"
}
```

#### Generate Report
```
POST /api/analyze/report
```

**JSON Body:**
```json
{
  "face_data": { ... },
  "voice_data": { ... },
  "credibility_data": { ... },
  "report_type": "hr"
}
```

**Example:**
```bash
curl -X POST http://localhost:5000/api/analyze/report \
  -H "Content-Type: application/json" \
  -d '{
    "face_data": { ... },
    "voice_data": { ... },
    "credibility_data": { ... },
    "report_type": "hr"
  }'
```

**Response:**
```json
{
  "success": true,
  "data": {
    "report": "...",
    ...
  },
  "timestamp": "2026-03-23T10:00:00.000000",
  "report_type": "hr"
}
```

## Using AI Service in the Backend

### Import the AI Service

```typescript
import { aiAnalysisService } from '../services/ai.service';
```

### Check Flask API Health

```typescript
const isHealthy = await aiAnalysisService.healthCheck();
if (isHealthy) {
  console.log('Flask API is available');
}
```

### Run Complete Analysis

```typescript
try {
  const results = await aiAnalysisService.analyzeComplete(
    imagePath,      // optional
    audioPath,      // optional
    'hr',           // report type
    5               // video duration
  );
  
  console.log('Analysis results:', results);
} catch (error) {
  console.error('Analysis failed:', error.message);
}
```

### Analyze Face Only

```typescript
try {
  const results = await aiAnalysisService.analyzeFace(imagePath);
  console.log('Face analysis:', results);
} catch (error) {
  console.error('Face analysis failed:', error.message);
}
```

### Analyze Voice Only

```typescript
try {
  const results = await aiAnalysisService.analyzeVoice(audioPath);
  console.log('Voice analysis:', results);
} catch (error) {
  console.error('Voice analysis failed:', error.message);
}
```

### Analyze Credibility

```typescript
try {
  const results = await aiAnalysisService.analyzeCredibility(
    imagePath,      // optional
    audioPath,      // optional
    'hr'            // report type
  );
  console.log('Credibility results:', results);
} catch (error) {
  console.error('Credibility analysis failed:', error.message);
}
```

### Generate Report

```typescript
try {
  const report = await aiAnalysisService.generateReport(
    faceData,
    voiceData,
    credibilityData,
    'hr'
  );
  console.log('Generated report:', report);
} catch (error) {
  console.error('Report generation failed:', error.message);
}
```

## Middleware

### requireFlaskAPI Middleware

Requires the Flask API to be available. Returns 503 if unavailable.

```typescript
import { requireFlaskAPI } from '../middleware/flaskAPIHealth.middleware';

router.post('/api/analysis', requireFlaskAPI, analysisController.analyze);
```

### checkFlaskAPI Middleware

Check Flask API availability without blocking. Adds `req.flaskAPIAvailable` boolean.

```typescript
import { checkFlaskAPI } from '../middleware/flaskAPIHealth.middleware';

router.get('/api/status', checkFlaskAPI, (req, res) => {
  res.json({
    flaskAvailable: req.flaskAPIAvailable
  });
});
```

## Error Handling

The AI Service provides comprehensive error handling:

```typescript
export interface AIAnalysisResponse {
  success: boolean;
  data?: any;
  error?: string;
  timestamp?: string;
}
```

Common error scenarios:

| Status | Scenario | Action |
|--------|----------|--------|
| 400 | Invalid file format | Validate file type and size |
| 413 | File too large | Check MAX_FILE_SIZE config |
| 500 | Flask API error | Check Flask logs |
| 503 | Flask API unavailable | Start Flask API server |

## Troubleshooting

### Flask API not starting

1. Check Python is installed: `python3 --version`
2. Check virtual environment: `ls "trust ai system/venv"`
3. Check dependencies: `pip list | grep flask`
4. Check Flask logs for errors

### Connection refused errors

1. Verify Flask is running: `curl http://localhost:5000/health`
2. Check FLASK_API_URL in backend .env
3. Check firewalls/proxies aren't blocking port 5000

### File upload failures

1. Check file size (max 50MB)
2. Check file format is supported (jpg, png, wav, mp3, etc.)
3. Check disk space for temporary uploads

### Analysis timeouts

1. Increase timeout in backend .env: `FLASK_API_TIMEOUT=180000` (3 minutes)
2. Check system resources (CPU, RAM)
3. Check Flask server is not overloaded

## Production Deployment

### Using Docker

The Flask API can be containerized for production:

```dockerfile
FROM python:3.11-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .
EXPOSE 5000

CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "flask_api:app"]
```

Build and run:
```bash
docker build -t trustai-flask .
docker run -p 5000:5000 trustai-flask
```

### Using a Process Manager

For production, use a process manager like PM2:

```bash
npm install -g pm2

pm2 start "bash run_flask_prod.sh" --name "trustai-flask" --watch
pm2 logs trustai-flask
```

### Load Balancing

For high traffic, run multiple Flask instances behind a load balancer:

```bash
# Terminal 1
FLASK_PORT=5000 python flask_api.py

# Terminal 2
FLASK_PORT=5001 python flask_api.py

# Terminal 3
FLASK_PORT=5002 python flask_api.py
```

Then configure Nginx to load balance across these instances.

## Performance Tips

1. **Caching:** Cache analysis results when possible
2. **Async Processing:** Use job queues for long-running analyses
3. **Resource Limits:** Set appropriate timeouts for different analysis types
4. **Monitoring:** Monitor Flask logs for performance issues
5. **Scaling:** Deploy multiple Flask instances for high traffic

## Support

For issues or questions:
1. Check Flask API logs: `tail -f "trust ai system/flask.log"`
2. Check backend logs: `npm run dev` (check console output)
3. Test API endpoints manually with cURL
4. Check system resources: `top`, `free -h`
