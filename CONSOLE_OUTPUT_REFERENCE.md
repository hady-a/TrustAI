# Console Output Reference: What You Should See

## Console Logs Across the System

### 1. Flask API Console (Python)

When you call `/api/analyze` or `/analyze/business`:

```
================================================================================
🔍 FINAL API RESPONSE [/analyze/business]
================================================================================
Status: 200
Response Keys: ['success', 'data', 'timestamp', 'report_type']
Full Response:
{
  "success": true,
  "data": {
    "face": {
      "age": 28,
      "gender": "Male",
      "emotion": "neutral",
      "confidence": 0.95
    },
    "voice": {
      "transcription": {
        "transcript": "Hello, this is a test",
        "confidence": 0.92
      },
      "stress": {
        "stress_level": 0.35,
        "stress_indicators": [0.2, 0.4, 0.3]
      },
      "emotion": {
        "emotion": "calm",
        "joy": 0.2,
        "anger": 0.1
      }
    },
    "credibility": {
      "is_credible": true,
      "credibility_score": 0.87,
      "deception_probability": 0.13,
      "confidence": 0.91
    },
    "errors": []
  },
  "timestamp": "2026-04-20T12:34:56.789012",
  "report_type": "business"
}
================================================================================
```

**What this shows:**
- ✅ Final response before Flask returns it
- ✅ All fields intact (success, data, timestamp, report_type)
- ✅ Voice sub-components separated (transcription, stress, emotion)
- ✅ Full credibility results
- ✅ Error tracking array

---

### 2. Express Backend Console (TypeScript)

When Flask response arrives:

```
🔍 RAW FLASK RESPONSE: {
  success: true,
  data: {
    face: {
      age: 28,
      gender: 'Male',
      emotion: 'neutral',
      confidence: 0.95
    },
    voice: {
      transcription: {
        transcript: 'Hello, this is a test',
        confidence: 0.92
      },
      stress: {
        stress_level: 0.35,
        stress_indicators: [Array]
      },
      emotion: {
        emotion: 'calm',
        joy: 0.2,
        anger: 0.1
      }
    },
    credibility: {
      is_credible: true,
      credibility_score: 0.87,
      deception_probability: 0.13,
      confidence: 0.91
    },
    errors: []
  },
  timestamp: '2026-04-20T12:34:56.789012',
  report_type: 'business'
}
```

**What this shows:**
- ✅ Raw Flask response received by service
- ✅ Same structure as Flask sent it
- ✅ No transformation by service
- ✅ All fields intact
- ✅ Voice components properly separated

---

### 3. Frontend Receives (React/Browser)

After Express returns response:

```javascript
{
  "success": true,
  "data": {
    "face": {
      "age": 28,
      "gender": "Male",
      "emotion": "neutral",
      "confidence": 0.95
    },
    "voice": {
      "transcription": {
        "transcript": "Hello, this is a test",
        "confidence": 0.92
      },
      "stress": {
        "stress_level": 0.35,
        "stress_indicators": [0.2, 0.4, 0.3]
      },
      "emotion": {
        "emotion": "calm",
        "joy": 0.2,
        "anger": 0.1
      }
    },
    "credibility": {
      "is_credible": true,
      "credibility_score": 0.87,
      "deception_probability": 0.13,
      "confidence": 0.91
    },
    "errors": []
  },
  "timestamp": "2026-04-20T12:34:56.789012",
  "report_type": "business"
}
```

**What this shows:**
- ✅ Exact same as Flask returned it
- ✅ Exact same as Express received it
- ✅ 1:1 pass-through maintained
- ✅ All fields at correct levels

---

## Complete Data Flow: Side-by-Side

```
┌──────────────────┐
│   Flask API      │
│   Console        │
├──────────────────┤
│ FINAL API        │
│ RESPONSE:        │
│ {success, data,  │
│  timestamp,      │
│  report_type}    │
└────────┬─────────┘
         │
         ▼ (HTTP 200)
┌──────────────────────────┐
│  Express Service         │
│  Console                 │
├──────────────────────────┤
│ RAW FLASK RESPONSE:      │
│ {success, data,          │
│  timestamp,              │
│  report_type}            │
│                          │
│ (log appears             │
│  before return)          │
└────────┬─────────────────┘
         │
         ▼ return response.data
┌──────────────────────────┐
│  Frontend Browser        │
│  API Response            │
├──────────────────────────┤
│ {success, data,          │
│  timestamp,              │
│  report_type}            │
│                          │
│ ✓ Same as Flask          │
│ ✓ No changes             │
│ ✓ All fields present     │
└──────────────────────────┘
```

---

## Error Scenarios

### Flask Error (e.g., missing audio file)

Flask Console:
```
================================================================================
🔍 FINAL API RESPONSE [/analyze/business]
================================================================================
Status: 400
Response Keys: ['success', 'error', 'timestamp']
Full Response:
{
  "success": false,
  "error": "At least one of image or audio file is required",
  "timestamp": "2026-04-20T12:34:56.789012"
}
================================================================================
```

Express Console:
```
🔍 RAW FLASK RESPONSE: {
  success: false,
  error: 'At least one of image or audio file is required',
  timestamp: '2026-04-20T12:34:56.789012'
}
```

Frontend Receives:
```json
{
  "success": false,
  "error": "At least one of image or audio file is required",
  "timestamp": "2026-04-20T12:34:56.789012"
}
```

---

## Logger Outputs (Structured Logging)

### Flask Service Logger
```
{
  "level": "info",
  "message": "AI analysis completed",
  "mode": "business",
  "processingTime": 1234,
  "success": true,
  "dataKeys": ["face", "voice", "credibility", "report", "errors"]
}
```

### Express Service Logger
```
[Flask Business Analysis] Analysis completed successfully
{
  "processingTime": 1234,
  "statusCode": 200,
  "success": true,
  "dataKeys": ["face", "voice", "credibility", "errors"]
}
```

---

## How to Verify Everything Works

### Checklist for Validation

#### 1. Flask API Logs
- [ ] See `FINAL API RESPONSE` in Flask console
- [ ] Response has all expected keys: success, data, timestamp, report_type
- [ ] Data contains: face, voice, credibility, report, errors
- [ ] No extra fields added

#### 2. Express Backend Logs
- [ ] See `RAW FLASK RESPONSE` in Express console
- [ ] Response matches Flask's response exactly
- [ ] dataKeys array shows: success, data, timestamp, report_type
- [ ] Voice contains sub-components: transcription, stress, emotion

#### 3. Frontend Response
- [ ] Receive same structure as Flask sent
- [ ] Can access response.data.face
- [ ] Can access response.data.voice.transcription
- [ ] Can access response.data.voice.stress
- [ ] Can access response.data.voice.emotion
- [ ] Can access response.data.credibility
- [ ] All error handling works

#### 4. No Transformations
- [ ] No `processingTime` field in response
- [ ] No nested `data.data` structure
- [ ] No wrapped `{success, data: {...}}` layer
- [ ] Fields at correct nesting levels

---

## Example Test Request

### Make Request
```bash
curl -X POST http://localhost:3000/api/analyze \
  -F "audio=@audio.wav" \
  -F "image=@image.jpg" \
  -F "report_type=business"
```

### Watch Flask Console
```
🔍 RAW FLASK RESPONSE: {...}
✓ See full response before returning
```

### Watch Express Console
```
🔍 RAW FLASK RESPONSE: {...}
✓ See response as received by service
```

### Check Frontend
```javascript
// In DevTools Console:
await fetch('/api/analyze', {...})
  .then(r => r.json())
  .then(data => console.log(JSON.stringify(data, null, 2)))

// Should match Flask output exactly
```

---

## Summary

**Correct Output Pattern:**
```
Flask logs: FINAL API RESPONSE: {...}
    ↓
Express logs: RAW FLASK RESPONSE: {...}
    ↓
Frontend receives: {...}

All three should be IDENTICAL ✓
```

**Wrong Output Pattern:**
```
Flask logs: FINAL API RESPONSE: {...}
    ↓
Express logs: nothing (no RAW FLASK RESPONSE)  ❌
    ↓
Frontend receives: {success, data: {success, data: {...}}}  ❌ (double wrapped)
```

