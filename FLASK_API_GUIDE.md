# TrustAI Flask API Integration Guide

Complete guide for integrating Python AI models with your backend using Flask.

## Table of Contents
1. [Setup](#setup)
2. [Running the API](#running-the-api)
3. [API Endpoints](#api-endpoints)
4. [Frontend Integration](#frontend-integration)
5. [Error Handling](#error-handling)
6. [Troubleshooting](#troubleshooting)

---

## Setup

### Prerequisites
- Python 3.8+
- Node.js & npm (for frontend)
- All AI modules installed (see requirements.txt)

### Installation Steps

#### 1. Install Python Dependencies
```bash
cd "trust ai system"
pip install -r requirements.txt
```

#### 2. Verify All Modules Are Available
```bash
python -c "
from modules.face_module import FaceAnalyzer
from modules.voice_module import VoiceAnalyzer
from modules.lie_module import LieDetector
from modules.report_module import ReportGenerator
print('✓ All modules imported successfully')
"
```

#### 3. Create Uploads Directory
```bash
mkdir -p uploads
```

---

## Running the API

### Development Mode
```bash
cd "trust ai system"
python flask_api.py
```

The API will start on `http://localhost:5000`

### Production Mode (with Gunicorn)
```bash
cd "trust ai system"
gunicorn -w 4 -b 0.0.0.0:5000 flask_api:app
```

### Using the Provided Scripts
```bash
# Make scripts executable (macOS/Linux)
chmod +x run_flask.sh run_flask_prod.sh

# Run development server
./run_flask.sh

# Run production server
./run_flask_prod.sh
```

### Docker Deployment
```bash
# Build
docker build -t trustai-flask -f Dockerfile .

# Run
docker run -p 5000:5000 \
  -v $(pwd)/uploads:/app/uploads \
  trustai-flask
```

---

## API Endpoints

### 1. Health Check
**Endpoint:** `GET /api/health`

**Response:**
```json
{
  "success": true,
  "message": "...",
  "data": {
    "status": "healthy",
    "service": "TrustAI Flask API",
    "version": "1.0.0"
  },
  "timestamp": "2024-03-23T10:30:00.000000"
}
```

**cURL Example:**
```bash
curl http://localhost:5000/api/health
```

---

### 2. API Information
**Endpoint:** `GET /api/info`

**Response:** Lists all available endpoints and their requirements

**cURL Example:**
```bash
curl http://localhost:5000/api/info
```

---

### 3. Business Mode Analysis
**Endpoint:** `POST /api/analyze/business`

**Description:** Analyze facial expressions and voice during business interaction

**Required Files:**
- `audio`: Audio file (WAV, MP3, M4A, OGG, FLAC) - max 50MB
- `image`: Image file (JPG, PNG, BMP) - max 50MB

**Optional Fields:**
- `text`: Meeting transcript or text

**Response:**
```json
{
  "success": true,
  "message": "Business analysis completed successfully",
  "data": {
    "mode": "business",
    "analysis": {
      "face": { ... },
      "voice": { ... },
      "credibility": { ... }
    },
    "report": { ... },
    "errors": []
  },
  "timestamp": "2024-03-23T10:30:00.000000"
}
```

**cURL Example:**
```bash
curl -X POST http://localhost:5000/api/analyze/business \
  -F "audio=@meeting.wav" \
  -F "image=@person.jpg" \
  -F "text=Meeting transcript here"
```

**Python Example:**
```python
import requests

with open('meeting.wav', 'rb') as f_audio, \
     open('person.jpg', 'rb') as f_image:
    
    response = requests.post(
        'http://localhost:5000/api/analyze/business',
        files={
            'audio': f_audio,
            'image': f_image
        },
        data={
            'text': 'Meeting transcript'
        }
    )
    
    print(response.json())
```

---

### 4. HR Interview Mode Analysis
**Endpoint:** `POST /api/analyze/hr`

**Description:** Analyze candidate during HR interview - stress, deception, emotion

**Required Files:**
- `audio`: Audio file (WAV, MP3, M4A, OGG, FLAC)
- `image`: Image file (JPG, PNG, BMP)

**Optional Fields:**
- `text`: Interview transcript

**Response:** Similar structure to business mode with HR-specific metrics

**cURL Example:**
```bash
curl -X POST http://localhost:5000/api/analyze/hr \
  -F "audio=@interview.wav" \
  -F "image=@candidate.jpg" \
  -F "text=Interview transcript"
```

---

### 5. Investigation Mode Analysis
**Endpoint:** `POST /api/analyze/investigation`

**Description:** Deep analysis for criminal investigation - deception detection, credibility

**Required Files:**
- `audio`: Audio file (WAV, MP3, M4A, OGG, FLAC)
- `image`: Image file (JPG, PNG, BMP)

**Optional Fields:**
- `text`: Statement/transcript

**Response:** Includes deception probability and credibility scores

**cURL Example:**
```bash
curl -X POST http://localhost:5000/api/analyze/investigation \
  -F "audio=@statement.wav" \
  -F "image=@person.jpg" \
  -F "text=Full statement"
```

---

## Frontend Integration

### Using the JavaScript Client

#### 1. Import the Client
```html
<script src="trustai-client.js"></script>
```

#### 2. Initialize
```javascript
const client = new TrustAIClient('http://localhost:5000');
```

#### 3. Simple Analysis
```javascript
async function analyze() {
  try {
    const audioFile = document.getElementById('audioInput').files[0];
    const imageFile = document.getElementById('imageInput').files[0];
    const text = document.getElementById('textInput').value;
    
    const result = await client.analyzeBusinessMode(
      audioFile,
      imageFile,
      text
    );
    
    console.log('Analysis Result:', result);
  } catch (error) {
    console.error('Error:', error);
  }
}
```

### HTML Form Example
```html
<form id="analysisForm">
  <input type="file" id="audioInput" accept=".wav,.mp3" required>
  <input type="file" id="imageInput" accept=".jpg,.png" required>
  <textarea id="textInput" placeholder="Text (optional)"></textarea>
  
  <button type="button" onclick="analyzeBusinessMode()">
    Analyze
  </button>
</form>

<div id="results"></div>

<script src="trustai-client.js"></script>
<script>
  const client = new TrustAIClient('http://localhost:5000');
  
  async function analyzeBusinessMode() {
    const result = await client.analyzeBusinessMode(
      document.getElementById('audioInput').files[0],
      document.getElementById('imageInput').files[0],
      document.getElementById('textInput').value
    );
    
    document.getElementById('results').innerText = 
      JSON.stringify(result, null, 2);
  }
</script>
```

### React Example
```jsx
import { useState } from 'react';
import TrustAIClient from './trustai-client';

function AnalysisComponent() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const client = new TrustAIClient('http://localhost:5000');

  const handleAnalyze = async (e) => {
    const files = e.target.files;
    setLoading(true);
    
    try {
      const result = await client.analyzeBusinessMode(
        files[0],  // audio
        files[1],  // image
        ''         // text
      );
      setResult(result);
    } catch (error) {
      setResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input type="file" multiple onChange={handleAnalyze} />
      {loading && <p>Loading...</p>}
      {result && <pre>{JSON.stringify(result, null, 2)}</pre>}
    </div>
  );
}
```

### Vue Example
```vue
<template>
  <div>
    <input type="file" @change="handleFileSelect" multiple />
    <button @click="analyzeVideo">Analyze</button>
    
    <div v-if="loading">Analyzing...</div>
    <pre v-if="result">{{ JSON.stringify(result, null, 2) }}</pre>
  </div>
</template>

<script>
import TrustAIClient from './trustai-client';

export default {
  data() {
    return {
      files: [],
      loading: false,
      result: null,
      client: new TrustAIClient('http://localhost:5000')
    };
  },
  methods: {
    handleFileSelect(e) {
      this.files = e.target.files;
    },
    async analyzeVideo() {
      this.loading = true;
      try {
        this.result = await this.client.analyzeBusinessMode(
          this.files[0],
          this.files[1],
          ''
        );
      } catch (error) {
        this.result = { error: error.message };
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>
```

---

## Error Handling

### Common Error Responses

#### 1. Missing Files (400)
```json
{
  "success": false,
  "error": "Missing required file: audio",
  "timestamp": "2024-03-23T10:30:00.000000"
}
```

#### 2. Invalid File Format (400)
```json
{
  "success": false,
  "error": "Invalid audio format. Allowed: wav, mp3, m4a, ogg, flac",
  "timestamp": "2024-03-23T10:30:00.000000"
}
```

#### 3. File Too Large (413)
```json
{
  "success": false,
  "error": "File too large. Maximum size: 50MB",
  "timestamp": "2024-03-23T10:30:00.000000"
}
```

#### 4. Analysis Error (500)
```json
{
  "success": false,
  "error": "Unexpected error: [error details]",
  "timestamp": "2024-03-23T10:30:00.000000"
}
```

### JavaScript Error Handling
```javascript
try {
  const result = await client.analyzeBusinessMode(
    audioFile,
    imageFile,
    text
  );
  
  if (!result.success) {
    console.error('API Error:', result.error);
  } else {
    console.log('Analysis complete:', result.data);
  }
} catch (error) {
  console.error('Network Error:', error.message);
}
```

---

## Configuration

### Environment Variables
Create `.env` file in `trust ai system/` directory:

```env
# Flask Settings
FLASK_ENV=development
FLASK_DEBUG=true
SECRET_KEY=your-secret-key-here

# API Settings
API_HOST=0.0.0.0
API_PORT=5000
API_WORKERS=4

# File Upload
UPLOAD_FOLDER=uploads
MAX_FILE_SIZE=52428800  # 50MB

# AI Models
FACE_MODEL=Facenet512
EMOTION_MODEL=enet
USE_GPU=true

# Logging
LOG_LEVEL=INFO
LOG_FILE=logs/flask_api.log

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:5173
```

### Load Environment Variables
```python
from dotenv import load_dotenv
import os

load_dotenv()

API_PORT = int(os.getenv('API_PORT', 5000))
MAX_FILE_SIZE = int(os.getenv('MAX_FILE_SIZE', 50 * 1024 * 1024))
```

---

## Performance Tips

### 1. Increase Gunicorn Workers
```bash
gunicorn -w 8 -b 0.0.0.0:5000 flask_api:app
```

### 2. Use Async Processing for Long Tasks
```python
from threading import Thread

def analyze_async(audio_path, image_path):
    def task():
        # Run analysis in background
        pass
    
    thread = Thread(target=task)
    thread.start()
    return {'job_id': '...'}
```

### 3. Implement Caching
```python
from functools import lru_cache

@lru_cache(maxsize=100)
def analyze_image(image_hash):
    # Cached results
    pass
```

### 4. Optimize File Handling
- Save files to SSD if possible
- Use in-memory processing for small files
- Implement cleanup of old uploads

---

## Troubleshooting

### Issue: ModuleNotFoundError
**Solution:**
```bash
pip install -r requirements.txt
python -c "from modules.face_module import FaceAnalyzer"
```

### Issue: CORS Error
**Solution:** Update CORS_ORIGINS in config:
```python
CORS(app, resources={
    r"/api/*": {"origins": ["http://localhost:3000", "http://localhost:5173"]}
})
```

### Issue: Out of Memory
**Solution:**
- Reduce image/audio resolution
- Process files in batches
- Use GPU for tensor operations
- Increase swap space

### Issue: Slow Analysis
**Solution:**
- Use GPU acceleration: `USE_GPU=true`
- Pre-load models on startup
- Implement caching
- Use lighter models (Facenet vs Facenet512)

### Issue: Files Not Deleting
**Solution:**
```python
import os
import atexit

def cleanup():
    for f in os.listdir('uploads'):
        os.remove(f)

atexit.register(cleanup)
```

### Issue: API Not Accessible from Frontend
**Solution:**
```python
# In flask_api.py
CORS(app, resources={
    r"/api/*": {
        "origins": "*",
        "methods": ["GET", "POST"],
        "allow_headers": ["Content-Type"]
    }
})
```

---

## API Response Format

All responses follow this format:

```json
{
  "success": true/false,
  "message": "Human-readable message",
  "data": { ... },
  "timestamp": "ISO 8601 timestamp"
}
```

### Success Response Example
```json
{
  "success": true,
  "message": "Business analysis completed successfully",
  "data": {
    "mode": "business",
    "analysis": {
      "face": {
        "emotions": { ... },
        "landmarks": { ... },
        "confidence": 0.95
      },
      "voice": {
        "transcription": "...",
        "stress_level": 0.45,
        "emotion": "neutral"
      }
    },
    "report": { ... },
    "errors": []
  },
  "timestamp": "2024-03-23T10:30:00.000000"
}
```

---

## Testing

### Test with cURL
```bash
# Business analysis
curl -X POST http://localhost:5000/api/analyze/business \
  -F "audio=@test_audio.wav" \
  -F "image=@test_image.jpg"

# Health check
curl http://localhost:5000/api/health

# API info
curl http://localhost:5000/api/info
```

### Test with Python
```python
import requests

response = requests.post(
    'http://localhost:5000/api/analyze/business',
    files={
        'audio': open('test.wav', 'rb'),
        'image': open('test.jpg', 'rb')
    }
)

print(response.json())
```

### Test with JavaScript
```javascript
const client = new TrustAIClient('http://localhost:5000');

client.healthCheck()
  .then(result => console.log('API Status:', result))
  .catch(error => console.error('Error:', error));
```

---

## Next Steps

1. **Deploy to Production**
   - Use Gunicorn + Nginx
   - Set up SSL/TLS
   - Enable authentication

2. **Monitor Performance**
   - Add Prometheus metrics
   - Set up ELK logging
   - Monitor GPU usage

3. **Scale the API**
   - Use message queues (Celery)
   - Implement job scheduling
   - Load balance multiple workers

4. **Enhance Security**
   - Add API key authentication
   - Implement rate limiting
   - Add input validation

---

## Support

For issues or questions:
1. Check the troubleshooting section
2. Review Flask documentation: https://flask.palletsprojects.com/
3. Check AI modules documentation in respective folders
4. Enable DEBUG mode for detailed error logs

---

**Last Updated:** March 23, 2026
