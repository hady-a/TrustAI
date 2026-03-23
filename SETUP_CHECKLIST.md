# Flask AI Integration - Setup Checklist

Use this checklist to verify that everything is installed and configured correctly.

## Prerequisites

- [ ] Python 3.8+ installed: `python3 --version`
- [ ] Node.js 18+ installed: `node --version`
- [ ] npm installed: `npm --version`
- [ ] PostgreSQL running (for backend)
- [ ] Git installed (optional): `git --version`

## Flask AI System Setup

- [ ] `/Users/hadyakram/Desktop/trustai/trust ai system/` directory exists
- [ ] `flask_api.py` file exists
- [ ] `main.py` file exists
- [ ] `modules/` directory with:
  - [ ] `face_module.py`
  - [ ] `voice_module.py`
  - [ ] `lie_module.py`
  - [ ] `report_module.py`
- [ ] `requirements.txt` file exists with dependencies
- [ ] Python virtual environment created:
  - [ ] `.venv/` or `venv/` directory exists
- [ ] `.env.flask` configuration file exists with:
  - [ ] `FLASK_PORT=5000`
  - [ ] `FLASK_DEBUG=True` (development only)
  - [ ] Other configuration values

## Backend Setup

- [ ] `/Users/hadyakram/Desktop/trustai/apps/backend/` directory exists
- [ ] `package.json` exists
- [ ] `node_modules/` directory exists (run `npm install` if missing)
- [ ] `.env` file exists with:
  - [ ] `DATABASE_URL` set
  - [ ] `JWT_SECRET` set
  - [ ] `FLASK_API_URL=http://localhost:5000`
  - [ ] `FLASK_API_TIMEOUT=120000`
  - [ ] `PORT=9999`
- [ ] TypeScript files compiled: `npm run build` (optional, dev mode auto-compiles)
- [ ] `src/services/ai.service.ts` exists
- [ ] `src/middleware/flaskAPIHealth.middleware.ts` exists
- [ ] `src/types/express.d.ts` updated with Flask API types
- [ ] `src/server.ts` updated with Flask initialization

## Documentation Files

- [ ] `/Users/hadyakram/Desktop/trustai/FLASK_INTEGRATION_GUIDE.md` exists
- [ ] `/Users/hadyakram/Desktop/trustai/QUICK_START_FLASK.md` exists
- [ ] `/Users/hadyakram/Desktop/trustai/IMPLEMENTATION_SUMMARY.md` exists
- [ ] `/Users/hadyakram/Desktop/trustai/trust ai system/README_FLASK_API.md` exists

## Startup Scripts

- [ ] `/Users/hadyakram/Desktop/trustai/run_flask.sh` exists and is executable
  - Test: `ls -l run_flask.sh | grep rwx`
- [ ] `/Users/hadyakram/Desktop/trustai/run_flask_prod.sh` exists and is executable
- [ ] `/Users/hadyakram/Desktop/trustai/setup_flask_integration.sh` exists and is executable

## Docker Setup (Optional)

- [ ] `/Users/hadyakram/Desktop/trustai/trust ai system/Dockerfile` exists
- [ ] `/Users/hadyakram/Desktop/trustai/trust ai system/docker-compose.yml` exists
- [ ] Docker installed (optional): `docker --version`

## Initial Setup Test

Run setup script:
```bash
cd /Users/hadyakram/Desktop/trustai
bash setup_flask_integration.sh
```

Expected output:
- [ ] Virtual environment creation/activation messages
- [ ] Python dependencies installation messages
- [ ] Configuration files created
- [ ] All files verified

## Flask API Startup Test

```bash
cd /Users/hadyakram/Desktop/trustai
bash run_flask.sh
```

Expected output:
- [ ] Virtual environment activated
- [ ] Dependencies loaded
- [ ] Flask starting message
- [ ] Server running on `http://0.0.0.0:5000`

**Keep terminal open!**

## Flask API Health Check

In another terminal:
```bash
curl http://localhost:5000/health
```

Expected response:
```json
{
  "status": "healthy",
  "service": "TrustAI Flask API",
  "version": "1.0.0",
  "timestamp": "..."
}
```

- [ ] Status is `healthy`
- [ ] Service is recognized
- [ ] Response time is reasonable (<1s)

## Backend Startup Test

In a new terminal:
```bash
cd /Users/hadyakram/Desktop/trustai/apps/backend
npm run dev
```

Expected output:
- [ ] TypeScript compilation messages
- [ ] Database connection successful message
- [ ] `🤖 Initializing Flask AI API connection...` message
- [ ] `✅ Flask AI API is connected and healthy` message
- [ ] `✅ Server running on http://localhost:9999` message

**Keep terminal open!**

## Backend Health Check

In another terminal:
```bash
curl http://localhost:9999/api/health
```

Expected response:
- [ ] Response is JSON with status
- [ ] Environment information included
- [ ] Database configured indicator
- [ ] Response time is reasonable (<1s)

## Integration Test

```bash
# Check Flask status endpoint
curl http://localhost:5000/api/status
```

Expected response:
- [ ] All endpoints listed
- [ ] Status is `active`
- [ ] Version number shown

## Frontend Startup Test (Optional)

In a new terminal:
```bash
cd /Users/hadyakram/Desktop/trustai/apps/frontend
npm run dev
```

Expected output:
- [ ] Vite dev server starting
- [ ] Server running on `http://localhost:5173` (or similar)
- [ ] Ready to accept connections

## Configuration Verification

### Flask Configuration
```bash
cat "/Users/hadyakram/Desktop/trustai/trust ai system/.env.flask"
```

Should contain:
- [ ] `FLASK_PORT=5000`
- [ ] `FLASK_ENV=development` (or production)
- [ ] `FLASK_DEBUG=True/False` (appropriate for environment)

### Backend Configuration
```bash
cat /Users/hadyakram/Desktop/trustai/apps/backend/.env
```

Should contain:
- [ ] `FLASK_API_URL=http://localhost:5000`
- [ ] `FLASK_API_TIMEOUT=120000`
- [ ] `DATABASE_URL` (valid connection string)
- [ ] `JWT_SECRET` (secure value)

### Environment Variables Loaded
In backend terminal (during dev mode), check logs for:
- [ ] `✅ Server running on http://localhost:9999`
- [ ] `🤖 Initializing Flask AI API connection...`
- [ ] `✅ Flask AI API is connected and healthy`

## API Endpoint Verification

### Test Flask Face Analysis
```bash
# Create a test image or use an existing one
curl -X POST http://localhost:5000/api/analyze/face \
  -F "image=@/path/to/test/image.jpg"
```

Expected:
- [ ] Returns JSON response
- [ ] `success: true` field present
- [ ] Takes 5-15 seconds
- [ ] No errors in Flask console

### Test Flask Status
```bash
curl http://localhost:5000/api/status
```

Expected:
- [ ] Lists all available endpoints
- [ ] Status is `active`
- [ ] Response includes version

## Performance Check

### Flask API Response Time
```bash
time curl http://localhost:5000/health
```

Expected:
- [ ] Response time < 100ms
- [ ] Real time < 50ms
- [ ] Consistent timing

### Backend API Response Time
```bash
time curl http://localhost:9999/api/health
```

Expected:
- [ ] Response time < 200ms
- [ ] Real time < 100ms
- [ ] Consistent timing

## Error Scenario Testing

### Test Flask Unavailable
1. Stop Flask server (Ctrl+C in Flask terminal)
2. Try backend request:
   ```bash
   curl http://localhost:9999/api/health
   ```
3. Expected: Backend still responds but shows Flask unavailable
4. Restart Flask server

- [ ] Graceful degradation works
- [ ] Backend doesn't crash
- [ ] Can restart Flask

### Test Invalid File Upload
```bash
# Try uploading a non-image file as image
curl -X POST http://localhost:5000/api/analyze/face \
  -F "image=@/path/to/file.txt"
```

Expected:
- [ ] Returns error response
- [ ] Error message is clear
- [ ] HTTP status is 400 or 415

### Test Large File Upload
```bash
# Create a large test file (>50MB)
dd if=/dev/zero of=largefile.bin bs=1M count=60

# Try uploading
curl -X POST http://localhost:5000/api/analyze/face \
  -F "image=@largefile.bin"
```

Expected:
- [ ] Returns 413 Payload Too Large error
- [ ] Gracefully handles overflow
- [ ] Backend not affected

## Database Verification (Backend)

```bash
# Test database connection
curl http://localhost:9999/api/health/ready
```

Expected:
- [ ] Returns status: ready (if healthy)
- [ ] Returns status: not_ready if database issues

## Production Readiness Checklist

If planning to deploy to production:

- [ ] All development debug logs have been reviewed
- [ ] `.env` files use production values
- [ ] `FLASK_DEBUG=False` set
- [ ] Database backups configured
- [ ] Logging configured for production
- [ ] Error monitoring set up
- [ ] Performance testing completed
- [ ] Security review completed
- [ ] Firewall rules configured
- [ ] SSL/TLS certificates obtained
- [ ] Reverse proxy (Nginx) configured
- [ ] Process manager (PM2/Supervisor) configured
- [ ] Database migrated to production
- [ ] Backup/recovery procedures documented

## Support Resources

If something doesn't work:

1. **Check these documentation files:**
   - [ ] Have read `QUICK_START_FLASK.md`
   - [ ] Have read `FLASK_INTEGRATION_GUIDE.md`
   - [ ] Have read `IMPLEMENTATION_SUMMARY.md`

2. **Common Issues:**
   - [ ] Flask not starting: Check Python and virtual environment
   - [ ] Port 5000 in use: `lsof -i :5000`
   - [ ] Backend can't connect: Check `FLASK_API_URL` in `.env`
   - [ ] File upload fails: Check file format and size

3. **Verify Basics:**
   - [ ] Both Flask and backend are running
   - [ ] .env files are correctly configured
   - [ ] Ports are not already in use
   - [ ] Network connectivity is working

## Completion Status

Use this section to track your progress:

- [ ] Prerequisites installed
- [ ] Flask API set up
- [ ] Backend integration configured
- [ ] Documentation reviewed
- [ ] All services starting successfully
- [ ] Health checks passing
- [ ] Integration tests passing
- [ ] Ready for development

---

## Date Completed: _______________

## Notes:
```
_________________________________________________________

_________________________________________________________

_________________________________________________________
```

## Next Steps:
1. [ ] Read QUICK_START_FLASK.md for development workflow
2. [ ] Review FLASK_INTEGRATION_GUIDE.md for API details
3. [ ] Check ai.controller.example.ts for code patterns
4. [ ] Implement AI analysis in your controllers
5. [ ] Test with real images and audio files
6. [ ] Deploy to production (see deployment guide)
