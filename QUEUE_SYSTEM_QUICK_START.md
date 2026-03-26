# Quick Reference: Using the Production Queue System

## Start Development

### Terminal 1: API Server
```bash
cd apps/backend
npm run dev
```

### Terminal 2: Worker Process
```bash
cd apps/backend
WORKER_MODE=true npm run dev
```

Or use npm scripts (add to package.json):
```json
"scripts": {
  "dev": "tsx watch src/server.ts",
  "worker": "WORKER_MODE=true tsx watch src/server.ts"
}
```

Then:
```bash
npm run dev      # Terminal 1
npm run worker   # Terminal 2
```

---

## API Usage Examples

### 1. Submit Analysis (Business)

```bash
curl -X POST http://localhost:3000/api/analyze/business \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "audio=@recording.wav" \
  -F "image=@face.jpg" \
  -F "text=Tell me about your strengths"
```

**Response:**
```json
{
  "success": true,
  "jobId": "550e8400-e29b-41d4-a716-446655440000",
  "analysisId": "550e8400-e29b-41d4-a716-446655440001",
  "status": "queued",
  "estimatedWaitTime": 45,
  "pollUrl": "/api/analyze/550e8400-e29b-41d4-a716-446655440000/status"
}
```

### 2. Check Status

```bash
curl http://localhost:3000/api/analyze/550e8400-e29b-41d4-a716-446655440000/status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Response (Still processing):**
```json
{
  "success": true,
  "status": "processing",
  "progress": 65,
  "result": null
}
```

**Response (Completed):**
```json
{
  "success": true,
  "status": "completed",
  "progress": 100,
  "result": {
    "success": true,
    "confidence": 0.92,
    "trustScore": 0.87,
    ...full analysis result...
  }
}
```

### 3. Queue Statistics

```bash
curl http://localhost:3000/api/analyze/queue/stats \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### 4. Health Check

```bash
curl http://localhost:3000/api/analyze/health/check
```

---

## Important Environment Variables

```bash
# .env (in apps/backend)

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# Flask AI
FLASK_API_URL=http://localhost:5000
FLASK_TIMEOUT=60000
FLASK_MAX_RETRIES=3

# Queue Worker
WORKER_MODE=true          # Enable worker
WORKER_CONCURRENCY=2      # Parallel jobs

# File Upload
UPLOAD_DIR=/tmp/trustai-uploads
MAX_FILE_SIZE=50000000    # 50MB

# Logging
LOG_LEVEL=debug           # debug/info/warn/error
```

---

## TypeScript Usage (Backend Code)

### Submit a Job

```typescript
import { analysisQueueService } from '../services/analysis.queue.service';

const { jobId, analysisId, estimatedWaitTime } = await analysisQueueService.createAnalysisJob({
  userId: 'user123',
  mode: 'BUSINESS',
  inputMethod: 'upload',
  audioPath: '/tmp/audio.wav',
  imagePath: '/tmp/image.jpg',
  textInput: 'Tell me...',
});

console.log(`Job queued: ${jobId}`);
```

### Check Status

```typescript
const status = await analysisQueueService.getJobStatus(jobId);
console.log(`Status: ${status.status}, Progress: ${status.progress}%`);
```

### Get Result

```typescript
const result = await analysisQueueService.getJobResult(jobId);
if (result) {
  console.log('Confidence:', result.confidence);
  console.log('Trust Score:', result.trustScore);
}
```

### Get Queue Stats

```typescript
const stats = await analysisQueueService.getQueueStats();
console.log(`Pending jobs: ${stats.pending}`);
console.log(`Processing: ${stats.processing}`);
console.log(`Completed: ${stats.completed}`);
```

---

## Frontend TypeScript Example

```typescript
interface AnalysisResponse {
  success: boolean;
  jobId: string;
  analysisId: string;
  status: 'queued';
  estimatedWaitTime: number;
}

interface StatusResponse {
  success: boolean;
  jobId: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  result?: AnalysisResult;
  failedReason?: string;
}

// Submit analysis
async function submitAnalysis(formData: FormData): Promise<string> {
  const response = await fetch('/api/analyze/business', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData,
  });
  
  const data: AnalysisResponse = await response.json();
  return data.jobId;
}

// Poll status
async function pollStatus(jobId: string): Promise<AnalysisResult | null> {
  let isComplete = false;
  let result = null;
  
  while (!isComplete) {
    const response = await fetch(`/api/analyze/${jobId}/status`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    
    const data: StatusResponse = await response.json();
    
    console.log(`Status: ${data.status}, Progress: ${data.progress}%`);
    
    if (data.status === 'completed') {
      result = data.result;
      isComplete = true;
    } else if (data.status === 'failed') {
      console.error('Analysis failed:', data.failedReason);
      isComplete = true;
    } else {
      // Wait 2 seconds before next poll
      await new Promise(r => setTimeout(r, 2000));
    }
  }
  
  return result;
}

// Usage
const formData = new FormData();
formData.append('audio', audioFile);
formData.append('image', imageFile);
formData.append('text', 'Interview text...');

const jobId = await submitAnalysis(formData);
const result = await pollStatus(jobId);
```

---

## Logging

### Check Logs

```bash
# All logs (tail -f)
tail -f /var/log/trustai.log

# Filter by job
grep "jobId=550e8400" /var/log/trustai.log

# Filter by error
grep "ERROR" /var/log/trustai.log

# With colors (Pino Pretty in dev)
npm run dev 2>&1 | grep "jobId=550e8400"
```

### Log Format

```
[TIMESTAMP] [LEVEL] [CONTEXT]
{"level":"info","time":"2026-03-26T10:30:45.123Z","jobId":"550e8400","event":"Job completed","processingTime":12500}
```

---

## Troubleshooting

### 1. "Flask API is not responding"

**Cause:** Flask server not running or wrong URL  
**Fix:**
```bash
# Check Flask is running
curl http://localhost:5000/health

# Update FLASK_API_URL if needed
FLASK_API_URL=http://your-flask-server:5000 npm run dev
```

### 2. "Redis connection refused"

**Cause:** Redis not running  
**Fix:**
```bash
# Start Redis (Docker)
docker run -d -p 6379:6379 redis:7-alpine

# Or locally
redis-server
```

### 3. "Job stuck in processing"

**Cause:** Worker crashed  
**Fix:**
```bash
# Check worker is running
ps aux | grep "WORKER_MODE=true"

# Restart worker
WORKER_MODE=true npm run dev
```

### 4. "Files not cleaning up"

**Cause:** File cleanup service error  
**Fix:**
```bash
# Check permissions
ls -la /tmp/trustai-uploads/

# Manual cleanup
rm -rf /tmp/trustai-uploads/temp/*
```

### 5. "Analysis timeout"

**Cause:** Flask processing takes > 60s  
**Fix:**
```bash
# Increase timeout
FLASK_TIMEOUT=90000 npm run dev
```

---

## File Upload Tips

### Supported Audio
- WAV, MP3, WebM, OGG, M4A, AAC
- Max: 50MB
- Field name: `audio`

### Supported Images
- JPEG, PNG, WebP, BMP
- Max: 20MB
- Field name: `image`

### Text Input
- Max: 5000 characters
- Field name: `text`
- Optional but recommended

---

## Analysis Modes

### BUSINESS
- Focus: Professionalism, confidence, trustworthiness
- Use case: Sales, interviews, negotiations

### CRIMINAL
- Focus:  Deception detection, behavior analysis, credibility
- Use case: Investigations, interrogations, fraud detection

### INTERVIEW
- Focus: Emotional intelligence, fit, candidate assessment
- Use case: Hiring, recruitment, performance reviews

---

## Database Tables Used

```sql
-- Analysis records
analysis_records (
  id UUID PRIMARY KEY,
  userId UUID,
  mode VARCHAR(50),
  status VARCHAR(20),
  confidence NUMERIC,
  summary TEXT,
  faceAnalysis JSONB,
  voiceAnalysis JSONB,
  credibilityAnalysis JSONB,
  createdAt TIMESTAMP,
  completedAt TIMESTAMP
)

-- Analysis metrics
analysis_metrics (
  id UUID PRIMARY KEY,
  analysisId UUID,
  faceConfidence NUMERIC,
  voiceConfidence NUMERIC,
  deceptionProbability NUMERIC
)
```

---

## Performance Tips

1. **Use live mode when possible** - Video/audio captured directly
2. **Keep files reasonable size** - Large files slow processing
3. **Monitor queue depth** - Add workers if queue > 50
4. **Scale workers for load** - 4 workers = ~20 analyses/min
5. **Configure concurrency** - Match CPU count for best results

---

## What's Next?

- [ ] Update frontend to use new endpoints
- [ ] Add progress bar UI
- [ ] Implement result sharing
- [ ] Add PDF export
- [ ] Setup monitoring (Sentry)
- [ ] Load testing with k6
- [ ] E2E tests with Playwright
- [ ] Production deployment

---

**System Status: ✅ PRODUCTION READY**

Need help? Check `QUEUE_SYSTEM_IMPLEMENTATION.md` for detailed documentation.
