# 🚀 Business Analysis Flask Integration Guide

Complete implementation of Node.js Express + TypeScript integration with Flask AI service for business analysis.

## 📋 Overview

This integration creates a POST endpoint that:
- ✅ Accepts file uploads (audio required, image optional)
- ✅ Validates files before forwarding
- ✅ Forwards to Flask AI API at `http://localhost:8000/analyze/business`
- ✅ Returns AI analysis results with proper error handling
- ✅ Implements comprehensive logging and monitoring
- ✅ Handles timeouts and connection errors gracefully

## 📁 Files Created/Modified

### New Service Layer
- **`src/services/business-analysis.service.ts`** - Flask API integration service
  - Health check functionality
  - FormData construction and file handling
  - Error handling with specific error types
  - Axios configuration with interceptors
  - Logging for every step

### New Controller Layer
- **`src/controllers/business-analysis.controller.ts`** - Request handler
  - File validation
  - Service invocation
  - Response formatting
  - Error handling and logging

### New Middleware Layer
- **`src/middleware/business-analysis-upload.middleware.ts`** - File upload handling
  - Multer configuration with memory storage
  - MIME type validation per field
  - File size limits (100MB each)
  - Custom error handling

### New Routes Layer
- **`src/routes/business-analysis.routes.ts`** - API routing
  - POST `/api/analysis/business/` - Main analysis endpoint
  - GET `/api/analysis/business/health` - Health check

### Modified Files
- **`src/server.ts`** - Added business analysis routes registration

## 🔧 API Endpoint

### Analyze Business
**POST** `/api/analysis/business`

#### Request
- **Authentication:** Required (JWT token in Authorization header)
- **Content-Type:** `multipart/form-data`
- **Files:**
  - `audio` (required): Audio file (MP3, WAV, OGG, M4A, AAC, WebM, FLAC)
  - `image` (optional): Image file (JPEG, PNG, GIF, WebP, BMP)
- **Fields:**
  - `text` (optional): Text input (string)

#### Example Request (cURL)
```bash
curl -X POST http://localhost:9999/api/analysis/business \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -F "audio=@/path/to/audio.mp3" \
  -F "image=@/path/to/image.jpg" \
  -F "text=Additional context here"
```

#### Example Request (JavaScript)
```javascript
const formData = new FormData();
formData.append('audio', audioFile); // File from input
formData.append('image', imageFile); // Optional
formData.append('text', 'Optional text context');

const response = await fetch('/api/analysis/business', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

const result = await response.json();
console.log(result);
```

#### Response (Success)
```json
{
  "success": true,
  "message": "Analysis completed successfully",
  "data": {
    "prediction": "...",
    "confidence": 0.95,
    "trustScore": 0.87,
    "faceAnalysis": { ... },
    "voiceAnalysis": { ... },
    "credibilityAnalysis": { ... },
    ...
  },
  "processingTime": 12345
}
```

#### Response (Error)
```json
{
  "success": false,
  "error": "Analysis failed: Connection refused",
  "message": "Cannot connect to Flask API at http://localhost:8000"
}
```

## 📊 Architecture Flow

```
Frontend
   ↓
POST /api/analysis/business
   ↓
┌─────────────────────────────────────┐
│ businessAnalysisRoutes              │
│ - Requires authentication           │
│ - Rate limiting                     │
│ - File upload handling              │
└─────────────────────────────────────┘
   ↓
┌─────────────────────────────────────┐
│ businessAnalysisUpload middleware   │
│ - Multer file handling              │
│ - MIME validation                   │
│ - Error handling                    │
└─────────────────────────────────────┘
   ↓
┌─────────────────────────────────────┐
│ BusinessAnalysisController          │
│ - Request validation                │
│ - Call service                      │
│ - Response formatting               │
└─────────────────────────────────────┘
   ↓
┌─────────────────────────────────────┐
│ businessAnalysisService             │
│ - Flask API health check            │
│ - FormData construction             │
│ - Error handling & retries          │
│ - Logging                           │
└─────────────────────────────────────┘
   ↓
Flask AI API (http://localhost:8000)
   ↓
Response → Frontend
```

## 🛠️ Configuration

### Environment Variables (in `.env`)
```env
# Already configured in .env:
AI_SERVICE_URL=http://localhost:8000
```

### Rate Limiting
- Uses existing `uploadLimiter` middleware
- Configurable in `src/middleware/rateLimiter.middleware.ts`

### Timeouts
- Flask API timeout: 60 seconds
- File size limits: 100MB per file

## 🔍 Logging

All operations are logged with structured logging:

```
[Business Analysis] Request received
  - userId: xxx
  - hasAudio: true
  - hasImage: false
  - audioSize: 5242880

[Business Analysis] Sending to Flask AI service

[Flask Business Analysis] Request started
  - method: POST
  - url: /analyze/business
  - timeout: 60000

[Business Analysis] Analysis completed successfully
  - userId: xxx
  - processingTime: 12345ms
  - resultSize: 2048
```

## ⚠️ Error Handling

### Common Error Cases

| Error | Status | Cause | Solution |
|-------|--------|-------|----------|
| `MISSING_AUDIO_FILE` | 400 | Audio file not uploaded | Upload audio file with field name "audio" |
| `NO_FILES` | 400 | No files in request | Upload at least the audio file |
| `INVALID_MIME_TYPE` | 400 | Wrong file type | Use correct MIME types |
| `FILE_TOO_LARGE` | 413 | File exceeds 100MB | Reduce file size |
| `ECONNREFUSED` | 503 | Flask API not running | Start Flask service at localhost:8000 |
| `ECONNABORTED` | 503 | Request timeout | Flask taking too long (>60s) |
| `Unauthorized` | 401 | Missing/invalid JWT token | Include valid authorization header |

## 🚀 Testing

### 1. Health Check
```bash
curl http://localhost:9999/api/analysis/business/health
```

### 2. Full Analysis (with test files)
```bash
# Create test files
echo "test audio data" > test_audio.mp3
echo "test image data" > test_image.jpg

# Send request
curl -X POST http://localhost:9999/api/analysis/business \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "audio=@test_audio.mp3" \
  -F "image=@test_image.jpg" \
  -F "text=Test input"

# Cleanup
rm test_audio.mp3 test_image.jpg
```

### 3. Using Node.js/TypeScript
```typescript
import FormData from 'form-data';
import fs from 'fs';
import axios from 'axios';

async function testAnalysis() {
  const form = new FormData();
  form.append('audio', fs.createReadStream('audio.mp3'));
  form.append('text', 'Test analysis');

  try {
    const response = await axios.post(
      'http://localhost:9999/api/analysis/business',
      form,
      {
        headers: {
          ...form.getHeaders(),
          'Authorization': 'Bearer YOUR_TOKEN'
        }
      }
    );
    console.log('Analysis result:', response.data);
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}
```

## 📦 Dependencies

All required dependencies are already in `package.json`:
- ✅ `express` - Web framework
- ✅ `axios` - HTTP client
- ✅ `multer` - File upload handling
- ✅ `form-data` - FormData construction
- ✅ `typescript` - Type safety
- ✅ `pino` - Logging

No additional installations needed!

## 🔐 Security Features

1. **Authentication Required**
   - All endpoints require valid JWT token
   - Validated via `requireAuth` middleware

2. **File Validation**
   - MIME type checking per field
   - File size limits (100MB)
   - Extension validation

3. **Rate Limiting**
   - Upload rate limiting applied
   - Prevents abuse

4. **Error Handling**
   - No sensitive data in error messages
   - Proper HTTP status codes
   - Detailed logging for debugging

## 📝 Type Safety

All code is written in TypeScript with strict type checking:
- ✅ No `any` types
- ✅ Full interface definitions
- ✅ Proper error typing
- ✅ Request/response validation

## 🐛 Debugging

### Enable Debug Logging
```typescript
// The logger automatically logs all steps with proper context
// Check console output for detailed logs
```

### Check Flask API Connection
```bash
# Verify Flask is running
curl http://localhost:8000/health

# Check Flask endpoint
curl -X POST http://localhost:8000/analyze/business \
  -F "audio=@test.mp3" \
  -F "text=test"
```

### Inspect Request/Response
All requests are logged through Pino HTTP logger:
```
[timestamp] POST /api/analysis/business HTTP/1.1
  Authorization: Bearer ...
  Content-Type: multipart/form-data
```

## 🎯 Next Steps

1. **Frontend Integration**
   - Create FormData with files
   - Send to POST `/api/analysis/business`
   - Handle response data

2. **Database Storage** (Optional)
   - Store analysis results in database
   - Track processing history

3. **Webhooks** (Optional)
   - Send analysis results to external service
   - Trigger notifications

4. **Caching** (Optional)
   - Cache results for identical inputs
   - Reduce Flask API calls

## 📚 File Reference

| File | Purpose | Lines |
|------|---------|-------|
| `business-analysis.service.ts` | Flask integration | ~200 |
| `business-analysis.controller.ts` | Request handling | ~120 |
| `business-analysis-upload.middleware.ts` | File upload | ~150 |
| `business-analysis.routes.ts` | API routing | ~50 |
| `server.ts` | Route registration | 2 changes |

## ✅ Verification Checklist

- [x] Service layer created with Flask integration
- [x] Controller layer for request handling
- [x] Multer middleware for file uploads
- [x] Routes properly configured
- [x] Server registration updated
- [x] Error handling comprehensive
- [x] Logging throughout
- [x] TypeScript strict mode compliance
- [x] Authentication required
- [x] Documentation complete

## 🎓 Architecture Highlights

1. **Separation of Concerns**
   - Service layer handles Flask communication
   - Controller handles HTTP logic
   - Middleware handles file processing
   - Routes define endpoints

2. **Error Handling**
   - Specific error types identified
   - Appropriate HTTP status codes
   - User-friendly error messages
   - Detailed internal logging

3. **Code Quality**
   - Full TypeScript type safety
   - Comprehensive comments
   - Consistent structure
   - Following Express patterns

4. **Production Ready**
   - Timeout handling
   - Rate limiting
   - Authentication
   - Logging & monitoring
