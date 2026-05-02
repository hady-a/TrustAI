# Flask API Response Structure Audit

## Summary
The API currently has **INCONSISTENT response structures** and **MISSING debug logging**. The `/api/analyze/credibility` endpoint uses a different nesting structure than other endpoints.

---

## 1. EXACT JSON RESPONSES BY ENDPOINT

### ✅ POST `/api/analyze` (GENERAL COMPLETE ANALYSIS)
**Status Code:** 200 (Success) or 500 (Error)

**CURRENT RESPONSE STRUCTURE:**
```json
{
  "success": true,
  "data": {
    "face": {},
    "voice": {},
    "credibility": {},
    "report": {},
    "errors": []
  },
  "timestamp": "2026-04-20T12:34:56.789012",
  "report_type": "general"
}
```

**Fields in `data`:**
- `face`: Direct output from `FaceAnalyzer.analyze_image()`
- `voice`: Combined output from transcribe + stress + emotion (spread operator)
- `credibility`: Direct output from `CredibilityAnalyzer.analyze()`
- `report`: Direct output from `ReportGenerator.generate()`
- `errors`: Array of error messages from each stage

**Source Code:** Lines 151-156 (run_complete_analysis)

---

### ✅ POST `/analyze/business` | `/analyze/interview` | `/analyze/investigation`
**Status Code:** 200 (Success) or 500 (Error)

**RESPONSE STRUCTURE:** Same as `/api/analyze`
```json
{
  "success": true,
  "data": {
    "face": {},
    "voice": {},
    "credibility": {},
    "report": {},
    "errors": []
  },
  "timestamp": "2026-04-20T12:34:56.789012",
  "report_type": "business" | "hr" | "criminal"
}
```

**Source Code:** Lines 166-181 (route handlers call `run_complete_analysis()`)

---

### ✅ POST `/api/analyze/face`
**Status Code:** 200 (Success) or 500 (Error)

**RESPONSE STRUCTURE:**
```json
{
  "success": true,
  "data": {
    // Raw output from face_analyzer.analyze_image()
    // Contains: age, gender, emotion, race, confidence, etc.
  },
  "timestamp": "2026-04-20T12:34:56.789012"
}
```

**Key Issues:**
- ❌ **NO report_type field** (inconsistent with other endpoints)
- Returns direct `FaceAnalyzer` output with no transformation

**Source Code:** Lines 233-237

---

### ✅ POST `/api/analyze/voice`
**Status Code:** 200 (Success) or 500 (Error)

**RESPONSE STRUCTURE:**
```json
{
  "success": true,
  "data": {
    // COMBINED result from 3 separate calls:
    // 1. transcribe_audio() results (spread)
    // 2. analyze_audio_file() results (spread)
    // 3. detect_emotion() results (spread)
  },
  "timestamp": "2026-04-20T12:34:56.789012"
}
```

**Key Issues:**
- ❌ **NO report_type field** (inconsistent)
- Results are **merged with spread operator** (lines 295-299)
  ```python
  results = {
      **transcription,
      **stress_analysis,
      **emotion_analysis
  }
  ```
- This LOSES the source attribution (which result came from which analyzer?)

**Source Code:** Lines 301-305

---

### ❌ POST `/api/analyze/credibility` [MAJOR ISSUE]
**Status Code:** 200 (Success) or 500 (Error)

**RESPONSE STRUCTURE:**
```json
{
  "success": true,
  "data": {
    "face": {},
    "voice": {},
    "credibility": {}
  },
  "timestamp": "2026-04-20T12:34:56.789012",
  "report_type": "general"
}
```

**KEY PROBLEMS:**
- ❌ **DIFFERENT nesting structure** than other endpoints!
- Other endpoints return flat `data` object with `face`, `voice`, `credibility`, `report`, `errors`
- This endpoint returns nested object with only `face`, `voice`, `credibility`
- ❌ **MISSING error tracking** - no `errors` array
- ❌ **MISSING report** field
- ❌ **MISSING credibility analysis** (despite being the credibility endpoint!)
  - Calls `ai_system.lie_detector.detect_credibility()` but it's not exposed - should be `credibility_analyzer`

**Source Code:** Lines 377-386 (Lines 372-375 call wrong method)

---

### ✅ POST `/api/analyze/report`
**Status Code:** 200 (Success) or 500 (Error)

**RESPONSE STRUCTURE:**
```json
{
  "success": true,
  "data": {
    // Raw report from ReportGenerator.generate_report()
  },
  "timestamp": "2026-04-20T12:34:56.789012",
  "report_type": "general"
}
```

**Key Issues:**
- Requires JSON body (not form data)
- Takes pre-computed `face_data`, `voice_data`, `credibility_data`
- Returns only the report, no metadata about component analyses

**Source Code:** Lines 445-450

---

### ✅ GET `/health`
```json
{
  "status": "healthy",
  "service": "TrustAI Flask API",
  "version": "1.0.0",
  "timestamp": "2026-04-20T12:34:56.789012"
}
```

---

### ✅ GET `/api/status`
```json
{
  "status": "active",
  "service": "TrustAI Flask API",
  "version": "1.0.0",
  "endpoints": {
    "health": "GET /health",
    "analyze_complete": "POST /api/analyze",
    // ... list of all endpoints
  },
  "timestamp": "2026-04-20T12:34:56.789012"
}
```

---

## 2. INCONSISTENCIES DETECTED

| Endpoint | success | timestamp | report_type | data structure | errors array |
|----------|---------|-----------|-------------|-----------------|--------------|
| `/api/analyze` | ✅ | ✅ | ✅ | Flat | ✅ |
| `/analyze/business` | ✅ | ✅ | ✅ | Flat | ✅ |
| `/api/analyze/face` | ✅ | ✅ | ❌ | Direct output | ❌ |
| `/api/analyze/voice` | ✅ | ✅ | ❌ | Merged/flat | ❌ |
| `/api/analyze/credibility` | ✅ | ✅ | ✅ | **NESTED** | ❌ |
| `/api/analyze/report` | ✅ | ✅ | ✅ | Direct output | ❌ |

---

## 3. FIELD TRANSFORMATION ISSUES

### Issue 1: Voice Results Merged with Spread Operator
**Location:** `analyze_voice()` lines 295-299

```python
results = {
    **transcription,        # From transcribe_audio()
    **stress_analysis,      # From analyze_audio_file()
    **emotion_analysis      # From detect_emotion()
}
```

**Problem:** If these dicts have overlapping keys, later ones overwrite earlier ones. No way to know which analyzer provided which field.

**What gets lost:**
- Source attribution (which field came from which analyzer)
- Duplicate key detection
- Structure clarity for backend parsing

---

### Issue 2: Missing `lie_detector` vs `credibility_analyzer`
**Location:** `analyze_credibility()` line 372

```python
lie_results = ai_system.lie_detector.detect_credibility(...)
```

**Problem:**
- `main.py` initializes `credibility_analyzer` (line 73)
- Flask API tries to access `lie_detector` (doesn't exist!)
- This causes AttributeError at runtime

---

### Issue 3: Inconsistent Error Handling
**Location:** All endpoints

- `/api/analyze` includes `errors: []` array in response
- `/api/analyze/voice` does NOT include errors array
- `/api/analyze/credibility` does NOT include errors array
- Frontend can't distinguish between partial success and total failure

---

## 4. DEBUGGING GAPS

**Current State:** No debug logging before returning responses

**Impact:**
- Cannot see what the AI system actually returned
- Cannot detect field mutations
- Difficult to debug data loss

---

## 5. RECOMMENDED FIXES

### FIX #1: Add Debug Logging to All Endpoints
Add before EVERY return statement:
```python
print("FINAL API RESPONSE:", {
    'endpoint': request.path,
    'status': status_code,
    'data_keys': list(result.keys()),
    'result': result
})
```

### FIX #2: Standardize Response Structure
Make ALL endpoints follow this pattern:
```json
{
  "success": boolean,
  "data": {
    "face": {} | null,
    "voice": {} | null,
    "credibility": {} | null,
    "report": {} | null
  },
  "errors": [],
  "timestamp": "ISO-8601",
  "report_type": "general|hr|criminal|business"
}
```

### FIX #3: Preserve Voice Analysis Structure
Instead of:
```python
results = {
    **transcription,
    **stress_analysis,
    **emotion_analysis
}
```

Use:
```python
results = {
    "transcription": transcription,
    "stress": stress_analysis,
    "emotion": emotion_analysis
}
```

### FIX #4: Fix Credibility Endpoint
Change line 372:
```python
# WRONG:
lie_results = ai_system.lie_detector.detect_credibility(...)

# CORRECT:
lie_results = ai_system.credibility_analyzer.analyze(...)
```

### FIX #5: Ensure Full Output Transparency
Verify that:
- No fields are removed
- No fields are renamed
- No fields are nested when they shouldn't be
- All analyzer outputs are included

---

## 6. VALIDATION CHECKLIST

Before returning any response, verify:
- [ ] All fields from AI system are present
- [ ] No field names are changed
- [ ] No nested fields are lost
- [ ] Error tracking is complete
- [ ] Response structure matches documentation
- [ ] Debug log shows raw output

