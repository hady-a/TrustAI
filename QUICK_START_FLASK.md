# Flask AI Integration - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Prerequisites
- Python 3.8+ installed
- Node.js 18+ installed
- PostgreSQL running (for backend)

### Step 1: Run Setup Script (One-time)

```bash
cd /Users/hadyakram/Desktop/trustai
bash setup_flask_integration.sh
```

This will:
- Create Python virtual environment
- Install Flask dependencies
- Configure Flask server
- Configure backend with Flask API URL
- Verify all files are in place

### Step 2: Start Services

**Terminal 1 - Flask API:**
```bash
cd /Users/hadyakram/Desktop/trustai
bash run_flask.sh
```

You should see:
```
✅ Flask API starting on http://0.0.0.0:5000
```

**Terminal 2 - Backend Server:**
```bash
cd /Users/hadyakram/Desktop/trustai/apps/backend
npm run dev
```

You should see:
```
🤖 Initializing Flask AI API connection...
✅ Flask AI API is connected and healthy
✅ Server running on http://localhost:9999
```

**Terminal 3 - Frontend (Optional):**
```bash
cd /Users/hadyakram/Desktop/trustai/apps/frontend
npm run dev
```

### Step 3: Verify Everything Works

```bash
# Test Flask API
curl http://localhost:5000/health

# Test Backend
curl http://localhost:9999/api/health
```

## 🧪 Test the Integration

### Simple Face Analysis Test

```bash
# Upload an image for face analysis
curl -X POST http://localhost:5000/api/analyze/face \
  -F "image=@/path/to/your/image.jpg"
```

### Test via Backend

```bash
# Backend calls Flask API
curl -X POST http://localhost:9999/api/analysis/full \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "image=@/path/to/image.jpg" \
  -F "audio=@/path/to/audio.mp3" \
  -F "report_type=general"
```

## 📁 Key Files

| File | Purpose |
|------|---------|
| `flask_api.py` | Main Flask API application |
| `.env.flask` | Flask configuration |
| `apps/backend/src/services/ai.service.ts` | Backend service for Flask API |
| `apps/backend/src/middleware/flaskAPIHealth.middleware.ts` | Flask health check |
| `FLASK_INTEGRATION_GUIDE.md` | Detailed documentation |

## 🛠️ Troubleshooting

### Flask API won't start
```bash
# Check Python version
python3 --version  # Should be 3.8+

# Check virtual environment
source "/Users/hadyakram/Desktop/trustai/trust ai system/venv/bin/activate"
which python

# Test Flask directly
cd "/Users/hadyakram/Desktop/trustai/trust ai system"
python flask_api.py
```

### Connection refused errors
```bash
# Check if Flask is running
curl http://localhost:5000/health

# Check port is not in use
lsof -i :5000

# Check firewall/network
ping 127.0.0.1
```

### Backend can't find Flask
```bash
# Update .env with correct Flask URL
echo "FLASK_API_URL=http://localhost:5000" >> apps/backend/.env

# Restart backend
npm run dev
```

## 📚 More Information

See [FLASK_INTEGRATION_GUIDE.md](FLASK_INTEGRATION_GUIDE.md) for:
- Detailed API endpoints documentation
- How to use AI Service in controllers
- Production deployment guide
- Performance optimization tips
- Advanced configuration options

## 🎯 Common Tasks

### Add Analysis to a Controller
```typescript
import { aiAnalysisService } from '../services/ai.service';

// Analyze image
const results = await aiAnalysisService.analyzeFace('/path/to/image.jpg');
```

### Check Flask API Status
```typescript
const isHealthy = await aiAnalysisService.healthCheck();
```

### Generate Report
```typescript
const report = await aiAnalysisService.generateReport(
  faceData,
  voiceData,
  credibilityData,
  'hr'
);
```

### Require Flask in Routes
```typescript
import { requireFlaskAPI } from '../middleware/flaskAPIHealth.middleware';

router.post('/api/analysis/full', requireFlaskAPI, controller.analyze);
```

## 🆘 Need Help?

1. Check logs:
   - Flask: Terminal running `run_flask.sh`
   - Backend: Terminal running `npm run dev`

2. Verify connections:
   ```bash
   curl http://localhost:5000/health
   curl http://localhost:9999/api/health
   ```

3. Check configuration:
   - Flask: `trust ai system/.env.flask`
   - Backend: `apps/backend/.env`

4. Read full documentation:
   - See `FLASK_INTEGRATION_GUIDE.md`
