# Live Audio Analysis Endpoint

## Endpoint: `POST /api/analyze/live`

### Purpose
Handles 2-3 second audio chunks from live recording and returns real-time analysis results.

---

## Request Format

### Content-Type
`multipart/form-data`

### Fields
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `audio` | File | ✅ Yes | Audio chunk (WebM, MP3, WAV, OGG, etc.) |
| `mode` | String | ❌ No | Analysis mode: `BUSINESS`, `INTERVIEW`, or `INVESTIGATION` (default: `BUSINESS`) |

### Example Request
```bash
curl -X POST http://localhost:9999/api/analyze/live \
  -F "audio=@chunk.webm" \
  -F "mode=BUSINESS"
```

### JavaScript Example
```typescript
const formData = new FormData();
formData.append('audio', audioBlob, 'chunk.webm');
formData.append('mode', 'INTERVIEW');

const response = await fetch('http://localhost:9999/api/analyze/live', {
  method: 'POST',
  body: formData,
});

const result = await response.json();
```

---

## Response Format

### Success Response (200 OK)
```json
{
  "success": true,
  "data": {
    "confidence": 0.82,
    "lie_probability": 0.15,
    "stress_level": "moderate",
    "voice_metrics": {
      "pitch": 120,
      "jitter": 0.021,
      "shimmer": 0.045
    },
    "face_metrics": {
      "blinks": 8,
      "blink_rate": 2.1,
      "micro_expressions": 2
    },
    "linguistic_indicators": [
      "First-person pronouns decreased",
      "Filler words increased"
    ]
  },
  "processingTime": 1250,
  "insights": "Moderate stress detected. Voice patterns suggest focused attention."
}
```

### Error Response
```json
{
  "success": false,
  "error": "Audio chunk is required"
}
```

---

## Processing Pipeline

```
1. Upload Received
   ├─ File validated (multipart/form-data)
   └─ Mode validated (BUSINESS|INTERVIEW|INVESTIGATION)
         ↓
2. Audio Processing
   ├─ Format detected (.webm, .mp3, .wav, etc.)
   ├─ Validation check (is valid audio)
   └─ Convert to WAV if needed (requires ffmpeg)
         ↓
3. Analysis
   ├─ Forward to Flask API
   ├─ Mode-specific endpoint
   │  ├─ BUSINESS → /analyze/business
   │  ├─ INTERVIEW → /analyze/interview
   │  └─ INVESTIGATION → /analyze/investigation
   └─ Partial results allowed (graceful degradation)
         ↓
4. Cleanup
   ├─ Delete original audio
   ├─ Delete converted audio
   └─ Free disk space
         ↓
5. Response
   └─ Return results + insights
```

---

## Audio Format Conversion

### Supported Input Formats
- WebM (.webm) - Primary format from browser MediaRecorder ✅
- MP3 (.mp3) ✅
- WAV (.wav) ✅
- OGG Vorbis (.ogg) ✅
- M4A (.m4a) ✅
- AAC (.aac) ✅
- FLAC (.flac) ✅

### Output Format (After Conversion)
- **Codec**: PCM 16-bit signed LE
- **Sample Rate**: 16 kHz
- **Channels**: Mono
- **Format**: WAV

### Automatic Conversion
- If ffmpeg is installed → Automatically converts to WAV
- If ffmpeg is missing → Sends audio as-is to Flask
- **Fallback**: Flask will attempt conversion or adaptation

### Installation

#### Linux (Ubuntu/Debian)
```bash
sudo apt-get install ffmpeg
```

#### macOS (Homebrew)
```bash
brew install ffmpeg
```

#### Windows (Chocolatey)
```bash
choco install ffmpeg
```

---

## Error Handling

### Scenario: Missing Audio File
**Status**: 400 Bad Request
```json
{
  "success": false,
  "error": "Audio chunk is required"
}
```

### Scenario: Invalid Mode
**Status**: 400 Bad Request
```json
{
  "success": false,
  "error": "Invalid mode. Must be one of: BUSINESS, INTERVIEW, INVESTIGATION"
}
```

### Scenario: Invalid Audio Format
**Status**: 400 Bad Request
```json
{
  "success": false,
  "error": "Invalid audio file format"
}
```

### Scenario: Flask Processing Error
**Status**: 200 OK (graceful degradation)
```json
{
  "success": true,
  "error": "Flask connection timeout",
  "insights": "Error processing chunk, will retry"
}
```

---

## Performance Characteristics

### Latency Profile
| Stage | Typical Duration |
|-------|-----------------|
| File upload | 100-300ms |
| Format detection | 50-100ms |
| WAV conversion | 200-500ms |
| Flask analysis | 800-1500ms |
| Response | 50-100ms |
| **Total** | **1.2-2.6s** |

### Throughput
- **Sustained**: 10-15 concurrent chunks
- **Peak burst**: 25+ chunks/second
- **Chunk size**: ~50-200 KB each

### Resource Usage
- **Disk**: ~500 MB temporary storage (clips in use)
- **Memory per chunk**: ~5-10 MB peak
- **CPU**: Negligible (I/O bound)

---

## Response Time Optimization

### For Frontend
Use optimistic UI updates while processing:

```typescript
// Add to UI immediately (optimistic)
const tempResult = { insights: "Analyzing...", processingTime: 0 };
setResults(prev => [...prev, tempResult]);

// Replace with real result when arrives
fetch('/api/analyze/live', { ... })
  .then(res => res.json())
  .then(data => {
    setResults(prev => 
      prev.map((r, i) => i === prev.length - 1 ? data : r)
    );
  });
```

### For Backend
Configure Flask timeout appropriately:

```python
# In Flask app
FLASK_TIMEOUT = 5  # 5 seconds max for live chunks
```

---

## Common Issues & Troubleshooting

### Issue: Files Not Cleaned Up
**Symptom**: Disk space fills up
**Solution**:
1. Check `logs/` for cleanup errors
2. Verify file permissions in `uploads/` directory
3. Manually clear `uploads/` directory: `rm -rf uploads/*`

### Issue: Slow Conversion (> 1 second)
**Symptom**: Response time 3+s per chunk
**Possible Causes**:
1. ffmpeg not installed (uses fallback)
2. CPU overload (system ffmpeg competing)
3. Disk I/O bottleneck

**Solution**:
```bash
# Test ffmpeg speed
time ffmpeg -i test.webm -c:a pcm_s16le -ar 16000 test.wav -y
```

### Issue: "Invalid audio file format"
**Symptom**: Endpoint rejects valid-looking files
**Solution**:
1. Verify file is actually audio (not corrupted)
2. Test locally: `ffmpeg -i file`
3. Check file size (< 100MB limit)

### Issue: Flask Endpoint Returns 404
**Symptom**: Live analysis fails with 404
**Possible Causes**:
1. Flask server not running
2. Wrong Flask URL in env vars
3. Wrong mode value

**Solution**:
```bash
# Verify Flask is running and endpoint exists
curl http://localhost:8000/analyze/business -F "audio=@test.wav"
```

---

## Configuration

### Environment Variables
```bash
# Backend
FLASK_URL=http://localhost:8000          # Flask API base URL
NODE_ENV=development                     # development or production
LOG_LEVEL=info                           # debug, info, warn, error
UPLOAD_MAX_SIZE=104857600                # 100MB in bytes

# Frontend
VITE_API_URL=http://localhost:9999/api   # Backend API base URL
```

### Rate Limiting
By default, the endpoint allows unlimited requests. For production, add rate limiting:

```typescript
import rateLimit from 'express-rate-limit';

const liveLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,    // 1 minute window
  max: 60,                     // 60 requests per minute
  keyGenerator: (req) => req.ip,
  message: 'Too many live chunks, please slow down'
});

router.post('/analyze/live', liveLimiter, /* ... handler ... */);
```

---

## Quality Assurance

### Pre-Deployment Checklist
- [ ] ffmpeg installed and accessible
- [ ] Flask endpoints verified working
- [ ] Test with WebM input (from browser)
- [ ] Test with MP3 input (compatibility)
- [ ] Test with WAV input (no conversion)
- [ ] Monitor response times (< 2.5s target)
- [ ] Verify cleanup (no leftover files)
- [ ] Load test with 10+ concurrent chunks
- [ ] Test error scenarios (network fault, invalid mode)
- [ ] Verify logging (all events captured)

### Monitoring
**Metrics to track**:
```
- Chunks processed per minute
- Average processing time
- Error rate (by type)
- Disk space used by temp files
- Flask API latency
- Conversion success rate
```

---

## Implementation Details

### Audio Converter Utility
File: `src/utils/audioConverter.ts`

Functions:
- `ensureWAVFormat(inputPath: string)` → converts to WAV if needed
- `getAudioInfo(filePath: string)` → extract duration, format, sample rate
- `isValidAudioFile(filePath: string)` → validate audio file
- `detectAudioFormat(filePath: string)` → identify format from extension
- `getAudioParameters(format: string)` → optimal conversion parameters

### Route Implementation
File: `src/routes/analyze.routes.ts`

Handler:
- Multer file upload
- Mode validation
- Audio format detection
- WAV conversion (optional)
- Flask forwarding
- Cleanup (original + converted)
- Error handling with graceful degradation

---

## Future Enhancements

- [ ] WebSocket streaming for true real-time (sub-second latency)
- [ ] Audio preprocessing (noise reduction, normalization)
- [ ] Caching for repeated chunks (fingerprinting)
- [ ] Progressive audio streaming
- [ ] Client-side audio quality negotiation
- [ ] Analytics dashboard for live sessions
- [ ] Multi-language support for linguistic analysis
