# TrustAI Quick Start Guide

Your TrustAI system is **fully integrated and ready to use**!

## ✅ What's Running

- **AI Service (Python/FastAPI)**: ✅ Running on `http://localhost:8000`
  - Health: `curl http://localhost:8000/health`
  - API Docs: http://localhost:8000/docs

## 🚀 Start All Services

Choose one of these options:

### Option 1: Docker (Recommended - One Command)

```bash
cd /Users/hadyakram/Desktop/trustai
docker-compose up -d
```

All services start automatically:
- Frontend: http://localhost:5173
- Backend: http://localhost:9999
- AI Service: http://localhost:8000

### Option 2: Local Development (3 Terminals)

**Terminal 1 - Backend:**
```bash
cd /Users/hadyakram/Desktop/trustai/apps/backend
npm install     # (if not done yet)
npm run dev     # Runs on http://localhost:9999
```

**Terminal 2 - Frontend:**
```bash
cd /Users/hadyakram/Desktop/trustai/apps/frontend
npm install     # (if not done yet)
npm run dev     # Runs on http://localhost:5173
```

**Terminal 3 - AI Service:**
```bash
cd /Users/hadyakram/Desktop/trustai/apps/ai-service
source venv/bin/activate
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
# Runs on http://localhost:8000
```

### Option 3: Install AI Service Dependencies (Full Setup)

To enable full AI analysis with all models (Whisper, DeepFace, Wav2Vec2):

```bash
cd /Users/hadyakram/Desktop/trustai/apps/ai-service
chmod +x setup.sh
./setup.sh
```

**Note:** First-time model download is ~2-3GB and takes 5-10 minutes. After that, it's fast.

## 📊 API Endpoints

Once services are running:

### AI Service Health
```bash
curl http://localhost:8000/health
# Returns:
# {
#   "status": "healthy",
#   "service": "TrustAI Analyzer",
#   "version": "1.0.0",
#   "models_initialized": false
# }
```

### Run Analysis
```bash
curl -X POST http://localhost:8000/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "user_123",
    "modes": ["HR_INTERVIEW"],
    "audio_file_path": "/path/to/audio.wav",
    "video_file_path": "/path/to/video.mp4"
  }'
```

### Upload & Analyze
```bash
curl -X POST http://localhost:8000/analyze-upload \
  -F "user_id=user_123" \
  -F "modes=HR_INTERVIEW" \
  -F "audio_file=@/path/to/audio.wav" \
  -F "video_file=@/path/to/video.mp4"
```

## 🔍 Access UIs

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | http://localhost:5173 | User interface |
| Backend API Docs | http://localhost:9999/api/docs | API documentation |
| AI Service Docs | http://localhost:8000/docs | AI analysis API |
| Database Admin | http://localhost:5432 | PostgreSQL (if needed) |

## 📂 Project Structure

```
trustai/
├── apps/
│   ├── backend/          # Node.js/Express API
│   ├── frontend/         # React/Vite UI
│   └── ai-service/       # Python/FastAPI AI
├── docker-compose.yml    # All services
├── AI_SERVICE_INTEGRATION.md  # Full docs
└── setup-all.sh         # Interactive setup
```

## 🔄 Data Flow

1. **User uploads media** via Frontend
2. **Backend stores files** and creates analysis job
3. **Redis queue** distributes work
4. **Worker calls AI Service** with file paths
5. **AI Service analyzes** using TrustAI models
6. **Results stored** in database
7. **Frontend displays** analysis results

## 📋 Analysis Modes

The AI Service supports 3 professional analysis modes:

### 1. HR Interview Mode
- Evaluates candidate communication
- Measures stress and emotion
- Generates confidence scores

### 2. Criminal Investigation Mode
- Detects deception indicators
- Analyzes suspicious behavior
- Flags emotional inconsistencies

### 3. Business Meeting Mode  
- Assesses professionalism
- Measures engagement
- Tracks emotional expressions

## 🛠 Troubleshooting

### AI Service won't start
```bash
# Check if port 8000 is in use
lsof -i :8000

# Kill the process if needed
kill -9 <PID>

# Restart it
cd /Users/hadyakram/Desktop/trustai/apps/ai-service
/Users/hadyakram/Desktop/trustai/apps/ai-service/venv/bin/python \
  -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

### Backend can't connect to AI Service
```bash
# Verify AI Service is running
curl http://localhost:8000/health

# Check backend logs
tail -f apps/backend/logs/*.log
```

### Models loading slowly
First time loading takes 5-10 minutes (one-time only). After that it's instant.

Check status:
```bash
tail -f /tmp/ai-service.log
```

## 📚 Documentation

- **[AI_SERVICE_INTEGRATION.md](AI_SERVICE_INTEGRATION.md)** - Complete integration details
- **[apps/ai-service/README.md](apps/ai-service/README.md)** - AI Service API reference
- **[DOCKER_SETUP_GUIDE.md](DOCKER_SETUP_GUIDE.md)** - Docker deployment guide

## ✨ Next Steps

1. **Start services** (choose Docker or Local option above)
2. **Upload media** through the frontend
3. **Select analysis mode** (HR/Criminal/Business)
4. **View results** with risk scores and indicators
5. **Explore API** at http://localhost:9999/api/docs

## Support

Questions? Check the documentation or review the log files:
- Backend logs: `apps/backend/package.json` shows dev scripts
- Frontend logs: Check browser console (F12)
- AI Service logs: `/tmp/ai-service.log`

---

**Your TrustAI system is ready to analyze multimodal evidence!** 🚀
