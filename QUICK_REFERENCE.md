# TrustAI Flask Integration - Quick Reference Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Start Flask API
```bash
cd /Users/hadyakram/Desktop/trustai
./run_flask.sh
```

### Step 2: Verify It's Running
```bash
curl http://localhost:5000/api/health
```

Expected Response:
```json
{
  "success": true,
  "data": {
    "status": "healthy",
    "service": "TrustAI Flask API",
    "version": "1.0.0"
  }
}
```

### Step 3: Try the Demo
Open in browser:
```
file:///Users/hadyakram/Desktop/trustai/apps/frontend/public/trustai-demo.html
```

---

## 📝 API Endpoints at a Glance

| Endpoint | Method | Purpose | Required Files |
|----------|--------|---------|-----------------|
| `/api/health` | GET | Check API status | None |
| `/api/info` | GET | List endpoints | None |
| `/api/analyze/business` | POST | Business analysis | audio, image |
| `/api/analyze/hr` | POST | HR interview analysis | audio, image |
| `/api/analyze/investigation` | POST | Investigation analysis | audio, image |

---

## 💻 Code Examples

### JavaScript/React
```javascript
import TrustAIClient from './trustai-client.js';

const client = new TrustAIClient('http://localhost:5000');
const result = await client.analyzeBusinessMode(audioFile, imageFile, transcript);
console.log(result);
```

### TypeScript/Node.js Backend
```typescript
import { FlaskAIService } from './services/FlaskAIService';

const service = new FlaskAIService('http://localhost:5000');
const result = await service.analyzeBusinessMode({
  audioPath: './audio.wav',
  imagePath: './image.jpg',
  text: 'Optional transcript'
});
```

### cURL
```bash
curl -X POST http://localhost:5000/api/analyze/business \
  -F "audio=@meeting.wav" \
  -F "image=@person.jpg" \
  -F "text=Meeting transcript"
```

### Python
```python
import requests

response = requests.post(
    'http://localhost:5000/api/analyze/business',
    files={
        'audio': open('meeting.wav', 'rb'),
        'image': open('person.jpg', 'rb')
    },
    data={'text': 'Meeting transcript'}
)
print(response.json())
```

---

## 🔧 Configuration

### Environment Variables
Create `.env` in `trust ai system/` directory:

```env
FLASK_ENV=development
FLASK_DEBUG=true
API_PORT=5000
MAX_FILE_SIZE=52428800
USE_GPU=true
CORS_ORIGINS=*
```

### Load from Python
```python
from config import API_PORT, MAX_FILE_SIZE, USE_GPU
```

---

## 📊 API Response Format

### Success Response
```json
{
  "success": true,
  "message": "Analysis completed successfully",
  "data": {
    "mode": "business",
    "analysis": {
      "face": {...},
      "voice": {...},
      "credibility": {...}
    },
    "report": {...},
    "errors": []
  },
  "timestamp": "2024-03-23T10:30:00.000000"
}
```

### Error Response
```json
{
  "success": false,
  "error": "Missing required file: audio",
  "timestamp": "2024-03-23T10:30:00.000000"
}
```

---

## ⚡ Common Tasks

### Check API Status
```bash
curl http://localhost:5000/api/health
```

### Get API Info
```bash
curl http://localhost:5000/api/info
```

### Analyze Business Meeting
```bash
curl -X POST http://localhost:5000/api/analyze/business \
  -F "audio=@recorded.wav" \
  -F "image=@speaker.jpg"
```

### Analyze HR Interview
```bash
curl -X POST http://localhost:5000/api/analyze/hr \
  -F "audio=@interview.wav" \
  -F "image=@candidate.jpg" \
  -F "text=Interview transcript"
```

### Analyze for Investigation
```bash
curl -X POST http://localhost:5000/api/analyze/investigation \
  -F "audio=@statement.wav" \
  -F "image=@person.jpg" \
  -F "text=Full statement"
```

---

## 🐛 Troubleshooting

### Flask API Won't Start
```bash
# Check Python
python3 --version

# Check modules
python3 -c "from modules.face_module import FaceAnalyzer"

# Check port
lsof -i :5000
```

### CORS Error in Browser
Update `CORS_ORIGINS` in `.env`:
```env
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

### File Upload Creates ConnectionError
- Ensure Flask API is running
- Check `curl http://localhost:5000/api/health`
- Verify file size < 50MB
- Check file format

### Analysis Takes Too Long
- Enable GPU: `USE_GPU=true`
- Reduce image size
- Reduce audio duration
- Increase timeout in client

---

## 📁 File Locations

```
Flask API:
trust ai system/flask_api.py

Frontend Client:
apps/frontend/src/services/trustai-client.js
apps/frontend/public/trustai-demo.html

Backend Service:
apps/backend/src/services/FlaskAIService.ts

Backend Controller:
apps/backend/src/controllers/analysisController.ts

Documentation:
FLASK_API_GUIDE.md
IMPLEMENTATION_SUMMARY.md
```

---

## 🚀 Deployment

### Development
```bash
./run_flask.sh          # Auto-reload enabled
```

### Production
```bash
./run_flask_prod.sh     # Gunicorn with 4 workers
```

### Docker
```bash
docker build -t trustai-flask .
docker run -p 5000:5000 trustai-flask
```

---

## 📈 Performance Tips

1. **Enable GPU**
   ```env
   USE_GPU=true
   ```

2. **Increase Workers**
   ```bash
   gunicorn -w 8 flask_api:app
   ```

3. **Enable Caching**
   ```javascript
   const result = client.getCachedResult(request);
   ```

4. **Reduce File Size**
   ```javascript
   // Compress before upload
   ```

---

## 🔐 Security Checklist

- [ ] Change SECRET_KEY in production
- [ ] Restrict CORS_ORIGINS
- [ ] Validate file uploads
- [ ] Use HTTPS in production
- [ ] Set strong upload limits
- [ ] Monitor suspicious activity
- [ ] Use environment variables for secrets
- [ ] Keep dependencies updated

---

## 📞 Support Resources

| Topic | Resource |
|-------|----------|
| Flask | https://flask.palletsprojects.com/ |
| DeepFace | https://github.com/serengil/deepface |
| Librosa | https://librosa.org/ |
| Whisper | https://github.com/openai/whisper |
| Express | https://expressjs.com/ |

---

## ✅ Verification Checklist

- [ ] `pip install -r requirements.txt` completed
- [ ] Flask API starts: `./run_flask.sh`
- [ ] Health check passes: `curl http://localhost:5000/api/health`
- [ ] Demo page loads: `trustai-demo.html`
- [ ] Can upload files and analyze
- [ ] Results display correctly
- [ ] No CORS errors in browser console
- [ ] Backend can import FlaskAIService
- [ ] All file paths are correct

---

## 💡 Pro Tips

1. **Use the demo page first** to test endpoints
2. **Check API info** to see all available endpoints: `curl http://localhost:5000/api/info`
3. **Monitor logs** while testing: `tail -f logs/flask_api.log`
4. **Use caching** for repeated analyses
5. **Pre-load models** at startup for faster analysis
6. **Profile performance** with GPU monitoring: `nvidia-smi`

---

## 🎯 What's Next?

1. Integrate into your React app
2. Add authentication layer
3. Set up monitoring/logging
4. Deploy to production server
5. Optimize for your specific use cases

---

**Last Updated:** March 23, 2026
**Status:** Production Ready ✅
