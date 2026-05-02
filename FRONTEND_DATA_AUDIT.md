# React Frontend Data Access Audit

## Problem Statement

Backend now returns:
```json
{
  "success": true,
  "data": {
    "face": {...},
    "voice": {...},
    "credibility": {...},
    "errors": []
  },
  "timestamp": "...",
  "report_type": "..."
}
```

Frontend components are accessing this incorrectly or not extracting the nested structure properly.

---

## Files Affected

### 1. BusinessAnalysis.tsx (CRITICAL)

**Location:** Line 63

**CURRENT CODE:**
```typescript
const analysisData = response?.data || response;
```

**ISSUE:**
- Frontend receives: `{success, data: {...}, timestamp, report_type}`
- Extracts: `response.data` which is the FULL nested object
- Then passes to `transformAnalysisData()` which expects different structure
- `transformAnalysisData()` looks for `apiResponse?.data?.data?.analysis` — doesn't exist!

**PROBLEM PATH:**
```
Backend response: {success, data: {face, voice, credibility, errors}, timestamp, report_type}
              ↓
Frontend extracts: response.data = {face, voice, credibility, errors}
              ↓
Passes to transformAnalysisData(): Looks for data?.data?.analysis (WRONG!)
```

### 2. transformAnalysisData.ts (INCORRECT STRUCTURE EXTRACTION)

**Location:** Lines 44-48

**CURRENT CODE:**
```typescript
const analysis =
  apiResponse?.data?.data?.analysis ||
  apiResponse?.data?.analysis ||
  apiResponse?.analysis ||
  {};
```

**ISSUE:**
- Expects `analysis.credibility`, `analysis.voice`, `analysis.face`
- Backend actually returns top-level: `credibility`, `voice`, `face`
- Should extract directly from root level

**SHOULD BE:**
```typescript
// When API response is: {face, voice, credibility, errors}
const credibilityData = apiResponse?.credibility || {};
const voiceData = apiResponse?.voice || {};
const faceData = apiResponse?.face || {};
```

### 3. BusinessAnalysis.tsx - Missing Raw Logging

**ISSUE:**
- No console logging of received data structure
- Cannot verify what data was extracted
- Makes debugging impossible

---

## Console Logs Missing

These components need `console.log` added to see data flow:

1. **BusinessAnalysis.tsx** (Line 61):
   ```typescript
   console.log('✅ [BusinessAnalysis] Response received:', response);
   ```
   Should be followed immediately by:
   ```typescript
   console.log("FRONTEND DATA:", analysisData);
   ```

2. **useAnalysisState.ts** (Line 36-37):
   Should log before and after transformation:
   ```typescript
   console.log('[useAnalysisState] Raw analysis data:', analysisData);
   const transformedData = transformAnalysisData(analysisData);
   console.log('[useAnalysisState] Transformed data:', transformedData);
   ```

3. **transformAnalysisData.ts** (Line 42):
   Should log input structure:
   ```typescript
   console.log('[transformAnalysisData] Input structure:', {
     keys: Object.keys(apiResponse || {}),
     hasData: !!apiResponse?.data,
     hasFaceVoice: !!(apiResponse?.face || apiResponse?.voice),
     fullInput: apiResponse
   });
   ```

---

## Field Mapping Issues

### Old Fields (Deprecated)

These fields NO LONGER EXIST in backend response:
- ❌ `lie_probability` - Backend now uses `deception_probability`
- ❌ `trust_score` - Backend uses `credibility_score`

### Current Structure

Backend `response.data` contains:

```json
{
  "face": {
    "age": number,
    "gender": string,
    "emotion": string,
    "confidence": number
  },
  "voice": {
    "transcription": {
      "transcript": string,
      "confidence": number
    },
    "stress": {
      "stress_level": number,
      "stress_indicators": array
    },
    "emotion": {
      "emotion": string,
      "anger": number,
      "joy": number,
      ...
    }
  },
  "credibility": {
    "is_credible": boolean,
    "credibility_score": number,
    "deception_probability": number,
    "confidence": number
  },
  "errors": []
}
```

### Safe Access with Optional Chaining

```typescript
// OLD (WRONG):
data.face.emotion
data.voice.stress_level
data.credibility.lie_probability

// NEW (CORRECT):
data?.face?.emotion
data?.voice?.stress?.stress_level
data?.credibility?.deception_probability
```

---

## Files to Fix

### Priority 1: CRITICAL

1. **apps/frontend/src/pages/BusinessAnalysis.tsx** - Lines 60-72
   - Add console logging
   - Add safe data extraction

2. **apps/frontend/src/utils/transformAnalysisData.ts** - Lines 42-56
   - Fix structure extraction to match new backend response
   - Add console logging

3. **apps/frontend/src/hooks/useAnalysisState.ts** - Lines 35-46
   - Add console logging before/after transformation

### Priority 2: SAFETY

1. **apps/frontend/src/components/LiveAnalysisDisplay.tsx** - Multiple locations
   - Already uses safe access with `result?.data?.`
   - Add console logging for debugging

2. **apps/frontend/src/components/AnalysisResults.tsx** - Line 16
   - Add console logging

---

## Testing Checklist

After fixes, verify:

- [ ] Console shows "FRONTEND DATA:" with complete backend response
- [ ] Console shows transformed data without errors
- [ ] LiveAnalysisDisplay receives properly structured data
- [ ] No console errors about undefined nested properties
- [ ] All analysis metrics display correctly in UI
- [ ] Optional chaining prevents crashes on partial data

