# TrustAI Flask API

REST API wrapper for Python AI models (face analysis, voice analysis, lie detection)

## Quick Start

### Development Mode
```bash
bash ../../run_flask.sh
```

Server runs on `http://localhost:5000`

### Production Mode (with Gunicorn)
```bash
bash ../../run_flask_prod.sh
```

### Using Docker
```bash
docker-compose up
```

## Files

- **`flask_api.py`** - Main Flask application with all endpoints
- **`.env.flask`** - Configuration file
- **`Dockerfile`** - Docker image definition
- **`docker-compose.yml`** - Docker Compose configuration
- **`requirements.txt`** - Python dependencies
- **`main.py`** - Main AI system orchestrator
- **`modules/`** - AI model modules (face, voice, lie detection, report)

## API Endpoints

### Health Check
```
GET /health
GET /api/status
```

### Analysis
```
POST /api/analyze                    - Complete analysis (face + voice + credibility)
POST /api/analyze/face               - Face analysis only
POST /api/analyze/voice              - Voice analysis only
POST /api/analyze/credibility        - Credibility/lie detection
POST /api/analyze/report             - Generate report from analysis data
```

## Configuration

Edit `.env.flask` to change:
- Port (default: 5000)
- Debug mode
- Upload file size limit
- Report types
- Video duration

## Dependencies

See `requirements.txt` for all Python packages.

Key libraries:
- Flask (REST API framework)
- DeepFace (face analysis)
- Librosa (voice analysis)
- Whisper (speech transcription)
- Torch (deep learning)

## Environment Variables

```env
FLASK_PORT=5000                    # Port to run on
FLASK_DEBUG=True                   # Debug mode (dev only)
FLASK_ENV=development              # development or production
MAX_FILE_SIZE_MB=50                # Max upload size
DEFAULT_REPORT_TYPE=general        # Default report type
VIDEO_DURATION_SECONDS=5           # Video capture duration
```

## Docker Deployment

Build image:
```bash
docker build -t trustai-flask .
```

Run container:
```bash
docker run -p 5000:5000 \
  -e FLASK_ENV=production \
  trustai-flask
```

Or use docker-compose:
```bash
docker-compose up
```

## Performance

- Gunicorn workers: 4 (configurable via `GUNICORN_WORKERS`)
- Request timeout: 120 seconds
- Max file size: 50MB (configurable)

For production:
- Run with `gunicorn` (not Flask dev server)
- Use multiple workers (default: 4)
- Set `FLASK_DEBUG=False`
- Use reverse proxy (Nginx) for SSL/TLS

## Scaling

Multiple instances behind load balancer:

```bash
# Terminal 1
FLASK_PORT=5000 python flask_api.py

# Terminal 2
FLASK_PORT=5001 python flask_api.py

# Terminal 3
FLASK_PORT=5002 python flask_api.py
```

Then proxy through Nginx/HAProxy.

## Monitoring

Check health:
```bash
curl http://localhost:5000/health
```

Get status:
```bash
curl http://localhost:5000/api/status
```

## Logs

Development mode shows logs in terminal.

For production, capture logs:
```bash
docker logs trustai-flask-api
```

## Support

See:
- [Integration Guide](../../FLASK_INTEGRATION_GUIDE.md)
- [Quick Start](../../QUICK_START_FLASK.md)
- [Implementation Summary](../../IMPLEMENTATION_SUMMARY.md)
