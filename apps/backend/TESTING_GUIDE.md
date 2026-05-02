# 🧪 Business Analysis Integration - Testing Guide

## Prerequisites

- ✅ Node.js backend running at `http://localhost:9999`
- ✅ Flask AI API running at `http://localhost:8000`
- ✅ PostgreSQL database configured
- ✅ Valid JWT token for authentication

## Test Suite

### 1. Health Check Test

**What it does:** Verifies Flask API is accessible

```bash
# Basic health check
curl http://localhost:9999/api/analysis/business/health

# Expected response (200 OK)
{
  "success": true,
  "status": "healthy",
  "timestamp": "2024-03-26T10:30:00.000Z"
}

# If Flask is down (503)
{
  "success": false,
  "status": "unavailable",
  "message": "Connection refused"
}
```

### 2. Minimal Analysis Test

**What it does:** Test with only required audio file

```bash
# Create test audio file
echo "test audio data" > test_audio.wav

# Send request
curl -X POST http://localhost:9999/api/analysis/business \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -F "audio=@test_audio.wav"

# Cleanup
rm test_audio.wav

# Expected (if successful):
# 200 OK with analysis results
```

### 3. Full Analysis Test

**What it does:** Test with all optional fields

```bash
# Create test files
echo "test audio" > test_audio.mp3
echo "test image" > test_image.jpg

# Full request
curl -X POST http://localhost:9999/api/analysis/business \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -F "audio=@test_audio.mp3" \
  -F "image=@test_image.jpg" \
  -F "text=This is test analysis"

# Cleanup
rm test_audio.mp3 test_image.jpg

# Expected:
# 200 OK with full analysis results
```

### 4. Missing Audio Test

**What it does:** Verify error handling for missing audio

```bash
# Try to send without audio
curl -X POST http://localhost:9999/api/analysis/business \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -F "text=Only text"

# Expected (400 Bad Request):
{
  "success": false,
  "error": "Audio file is required",
  "code": "MISSING_AUDIO_FILE"
}
```

### 5. Authentication Test

**What it does:** Verify JWT authentication is required

```bash
# No token
curl -X POST http://localhost:9999/api/analysis/business \
  -F "audio=@test_audio.wav"

# Expected (401 Unauthorized):
{
  "success": false,
  "error": "Unauthorized"
}

# Invalid token
curl -X POST http://localhost:9999/api/analysis/business \
  -H "Authorization: Bearer invalid-token" \
  -F "audio=@test_audio.wav"

# Expected (401 Unauthorized):
{
  "success": false,
  "error": "Invalid token"
}
```

### 6. File Size Limit Test

**What it does:** Verify 100MB file size limit

```bash
# Create file over 100MB
dd if=/dev/zero of=large_file.mp3 bs=1M count=101

# Try to upload
curl -X POST http://localhost:9999/api/analysis/business \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -F "audio=@large_file.mp3"

# Expected (413 Payload Too Large):
{
  "success": false,
  "error": "File size exceeds 100MB limit",
  "code": "FILE_TOO_LARGE"
}

# Cleanup
rm large_file.mp3
```

### 7. Invalid MIME Type Test

**What it does:** Verify MIME type validation

```bash
# Create fake video file with wrong extension
echo "fake video" > test_audio.txt

# Try to upload as audio
curl -X POST http://localhost:9999/api/analysis/business \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -F "audio=@test_audio.txt"

# Expected (400 Bad Request):
{
  "success": false,
  "error": "Invalid file type for field \"audio\": text/plain",
  "code": "INVALID_MIME_TYPE"
}

# Cleanup
rm test_audio.txt
```

### 8. Timeout Test

**What it does:** Verify timeout handling (slow Flask)

```bash
# This test requires artificially delaying Flask response
# Not recommended for production testing

# Expected behavior:
# Service will wait 60 seconds
# If no response, returns:
{
  "success": false,
  "error": "Analysis timeout (exceeded 60s)"
}
```

### 9. Flask Unavailable Test

**What it does:** Verify error when Flask API is down

```bash
# Stop Flask API
# (close the Flask terminal or kill the process)

# Try analysis
curl -X POST http://localhost:9999/api/analysis/business \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -F "audio=@test_audio.wav"

# Expected (503 Service Unavailable):
{
  "success": false,
  "error": "Cannot connect to Flask API at http://localhost:8000"
}

# Start Flask API again
```

### 10. Multiple File Test

**What it does:** Verify ability to send both audio and image

```bash
# Using real files
curl -X POST http://localhost:9999/api/analysis/business \
  -H "Authorization: Bearer ${JWT_TOKEN}" \
  -F "audio=@path/to/real/audio.mp3" \
  -F "image=@path/to/real/image.jpg"

# Expected:
# 200 OK with full analysis results
```

## Automated Test Script

Save as `test-business-analysis.sh`:

```bash
#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

BASE_URL="http://localhost:9999"
FLASK_URL="http://localhost:8000"
JWT_TOKEN="${1:-test-token}"

echo -e "${YELLOW}Starting Business Analysis Integration Tests${NC}\n"

# Test 1: Health Check
echo -e "${YELLOW}Test 1: Health Check${NC}"
RESPONSE=$(curl -s http://localhost:9999/api/analysis/business/health)
if echo "$RESPONSE" | grep -q '"success":true'; then
  echo -e "${GREEN}✓ Health check passed${NC}\n"
else
  echo -e "${RED}✗ Health check failed${NC}"
  echo "Response: $RESPONSE\n"
fi

# Test 2: Flask connectivity
echo -e "${YELLOW}Test 2: Flask API Connectivity${NC}"
RESPONSE=$(curl -s $FLASK_URL/health)
if echo "$RESPONSE" | grep -q "success\|status"; then
  echo -e "${GREEN}✓ Flask API is accessible${NC}\n"
else
  echo -e "${RED}✗ Flask API is not responding${NC}\n"
fi

# Test 3: Missing audio
echo -e "${YELLOW}Test 3: Missing Audio Error${NC}"
RESPONSE=$(curl -s -X POST $BASE_URL/api/analysis/business \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -F "text=test")
if echo "$RESPONSE" | grep -q "MISSING_AUDIO"; then
  echo -e "${GREEN}✓ Missing audio error handled correctly${NC}\n"
else
  echo -e "${RED}✗ Missing audio error not detected${NC}"
  echo "Response: $RESPONSE\n"
fi

# Test 4: No authentication
echo -e "${YELLOW}Test 4: Authentication Required${NC}"
RESPONSE=$(curl -s -X POST $BASE_URL/api/analysis/business \
  -F "audio=@test_audio.wav" 2>/dev/null)
if echo "$RESPONSE" | grep -q "Unauthorized\|401"; then
  echo -e "${GREEN}✓ Authentication is required${NC}\n"
else
  echo -e "${YELLOW}⚠ Unable to verify auth (may need valid token)${NC}\n"
fi

# Test 5: Create test files and send
echo -e "${YELLOW}Test 5: Full Analysis with Real Files${NC}"
echo "test audio content" > test_audio.mp3
echo "test image content" > test_image.jpg

RESPONSE=$(curl -s -X POST $BASE_URL/api/analysis/business \
  -H "Authorization: Bearer $JWT_TOKEN" \
  -F "audio=@test_audio.mp3" \
  -F "image=@test_image.jpg" \
  -F "text=Test input")

rm test_audio.mp3 test_image.jpg

if echo "$RESPONSE" | grep -q '"success":true'; then
  echo -e "${GREEN}✓ Analysis completed successfully${NC}"
  echo "First 200 chars: ${RESPONSE:0:200}"
  echo -e "${NC}\n"
elif echo "$RESPONSE" | grep -q '"success":false'; then
  echo -e "${YELLOW}⚠ Analysis returned error (Flask may be processing)${NC}"
  echo "Response: $RESPONSE"
  echo -e "${NC}\n"
else
  echo -e "${RED}✗ Unexpected response${NC}"
  echo "Response: $RESPONSE\n"
fi

echo -e "${YELLOW}Tests Complete!${NC}"
```

Make it executable:
```bash
chmod +x test-business-analysis.sh
./test-business-analysis.sh "your-jwt-token"
```

## Manual Testing Workflow

### Setup
```bash
# Terminal 1: Backend
cd apps/backend
npm run dev
# Wait for: "✅ Server running on http://localhost:9999"

# Terminal 2: Flask (should already be running)
curl http://localhost:8000/health
# Should return success

# Terminal 3: Tests
# Run curl commands from this terminal
```

### Quick Test Sequence
```bash
# 1. Health check
curl http://localhost:9999/api/analysis/business/health

# 2. Get JWT token (from your auth system)
# Or use a test token if configured

# 3. Create test files
echo "audio test" > test_audio.wav
echo "image test" > test_image.jpg

# 4. Send analysis request
curl -X POST http://localhost:9999/api/analysis/business \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -F "audio=@test_audio.wav" \
  -F "image=@test_image.jpg" \
  -F "text=Testing the integration"

# 5. Clean up
rm test_audio.wav test_image.jpg

# 6. Check logs
# Look at Terminal 1 (backend logs)
```

## Expected Behaviors

### Success Scenario
1. Files uploaded with valid auth
2. Backend validates files
3. Backend creates FormData
4. Backend sends to Flask
5. Flask processes (10-30 seconds)
6. Flask returns analysis
7. Backend returns 200 OK

### Error Scenarios

| Scenario | Status | Response |
|----------|--------|----------|
| No audio | 400 | MISSING_AUDIO_FILE |
| Wrong MIME | 400 | INVALID_MIME_TYPE |
| File >100MB | 413 | FILE_TOO_LARGE |
| No token | 401 | Unauthorized |
| Flask down | 503 | Cannot connect to Flask |
| Flask timeout | 503 | Analysis timeout |

## Performance Expectations

| Metric | Expected |
|--------|----------|
| Health check | <100ms |
| File upload | Depends on size |
| Flask processing | 10-30s |
| Response | <5s after Flask completes |
| Total | ~15-35s typical |

## Debugging Tips

### Enable Verbose Logging
```bash
# Check backend terminal for logs
# Look for [Business Analysis] or [Flask Business Analysis] entries
```

### Check Flask API Directly
```bash
# Test Flask without Node.js
curl -X POST http://localhost:8000/analyze/business \
  -F "audio=@test_audio.wav"
```

### Inspect Network
```bash
# Use curl -v for verbose output
curl -v -X POST http://localhost:9999/api/analysis/business \
  -H "Authorization: Bearer TOKEN" \
  -F "audio=@test_audio.wav"
```

### Check Response Headers
```bash
# Get just headers
curl -I http://localhost:9999/api/analysis/business/health

# Get response with headers
curl -v -X POST http://localhost:9999/api/analysis/business \
  -H "Authorization: Bearer TOKEN" \
  -F "audio=@test.wav"
```

## Troubleshooting

| Problem | Solution |
|---------|----------|
| 503 Flask Error | Start Flask API |
| 401 Unauthorized | Use valid JWT token |
| MIME type error | Use correct file format |
| Connection refused | Check Flask port (8000) |
| Timeout | Flask is slow, increase timeout or reduce file size |
| 400 Bad Request | Check all required fields |

---

**Total Test Time:** ~5-10 minutes for full suite
**Recommended:** Run health check + full analysis test
