# State Reset Strategy: Preventing Stale UI Artifacts

## Problem

Without proper state reset, when users trigger a new analysis:
- Previous results remain displayed on screen
- Animated scores still show old values
- New data appears to "morph" from old results to new ones
- UX is confusing: unclear which analysis is being viewed
- If API call fails, user sees mix of old and new data

### Before (Problematic ❌)
```
1. User runs Analysis A → Results shown on screen
2. User clicks Analyze again (Analysis B)
3. Loading state shown, but old results from A still visible below
4. Analysis B completes
5. Results morph from A's numbers to B's numbers
   → User may not realize new analysis is different
```

### After (Clean ✅)
```
1. User runs Analysis A → Results shown on screen
2. User clicks Analyze again (Analysis B)
3. Old results immediately cleared
4. "Analyzing..." message shown
5. Analysis B completes
6. Fresh new results displayed
   → Clear visual transition, no confusion
```

## Solution: Three-Stage State Reset

### Stage 1: Clear Previous Results (BEFORE API Call)
```typescript
// CRITICAL: Do this FIRST, before any other state changes
analysis.setLiveResult(null);
```

**Effect**:
- LiveAnalysisDisplay component receives `result={null}`
- Shows "Analyzing..." message instead of old results
- Animated scores hidden during analysis
- Clean slate for new data

### Stage 2: Set Loading State (AFTER clearing results)
```typescript
analysis.setIsAnalyzing(true);
analysis.setProgress(0);
analysis.clearError();
```

**Effect**:
- Loading spinner shown
- Progress bar initialized to 0%
- Error messages cleared

### Stage 3: Populate on Valid Response (AFTER API returns)
```typescript
// Only update if this is the latest request (versioning check)
if (requestId !== latestRequestId.current) {
  console.warn(`Ignoring stale response`);
  return;
}

// Validate data exists
if (!analysisData) {
  throw new Error("Invalid response format");
}

// Update with new data
analysis.setAnalysisSuccess(analysisData);
```

**Effect**:
- LiveAnalysisDisplay receives new result
- Animated scores animate from 0 → final values
- "Analyzing..." replaced with actual results

## Implementation Pattern

```typescript
const handleFileAnalysis = async () => {
  if (!selectedFile) {
    analysis.setAnalysisError("Please select a file");
    return;
  }

  // Step 1: Generate request ID
  const requestId = Date.now();
  latestRequestId.current = requestId;

  // Step 2: Abort previous request
  if (currentController.current) {
    currentController.current.abort();
  }

  // Step 3: Create new controller
  const controller = new AbortController();
  currentController.current = controller;

  // ─────────────────────────────────────────────────
  // Stage 1: CLEAR PREVIOUS RESULTS (FIRST!)
  // ─────────────────────────────────────────────────
  analysis.setLiveResult(null);  // ← Clears old data, shows "Analyzing..."

  // ─────────────────────────────────────────────────
  // Stage 2: SET LOADING STATE
  // ─────────────────────────────────────────────────
  analysis.setIsAnalyzing(true);
  analysis.setProgress(0);
  analysis.clearError();

  let progressInterval: ReturnType<typeof setInterval> | null = null;

  try {
    progressInterval = analysis.startProgress();

    // Make API call
    const res = await fetch(endpoint, {
      method: 'POST',
      body: formData,
      signal: controller.signal,
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }

    const response = await res.json();

    // Check if still latest request
    if (requestId !== latestRequestId.current) {
      console.warn(`Ignoring stale response`);
      return;
    }

    const analysisData = response?.data;

    if (!analysisData) {
      throw new Error("Invalid response format");
    }

    // ─────────────────────────────────────────────────
    // Stage 3: POPULATE ON VALID RESPONSE (LAST!)
    // ─────────────────────────────────────────────────
    analysis.setAnalysisSuccess(analysisData);  // ← Updates with new data

  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      console.log(`Request was cancelled`);
      return;
    }

    if (requestId === latestRequestId.current) {
      analysis.setAnalysisError(err.message);
    }
  } finally {
    if (progressInterval) clearInterval(progressInterval);
    if (requestId === latestRequestId.current) {
      analysis.setIsAnalyzing(false);
    }
  }
};
```

## LiveAnalysisDisplay Component Behavior

The `LiveAnalysisDisplay` component receives the `result` prop and responds automatically:

### When result is null
```typescript
if (!result) {
  return (
    <div>
      <p>{isAnalyzing ? 'Analyzing...' : 'Start recording to see live analysis results...'}</p>
    </div>
  );
}
```

**Result**: Shows "Analyzing..." message, no old data visible

### When result has valid data (status: 'complete')
```typescript
useEffect(() => {
  if (!result?.data) return;

  // Animation from 0 → final values
  setAnimatedScores({
    deception: getSafeScore(result.data?.deceptionScore, 0) * progress,
    credibility: getSafeScore(result.data?.credibilityScore, 0) * progress,
    confidence: getSafeScore(result.data?.confidence, 0, 0, 1) * 100 * progress,
  });
}, [result]);
```

**Result**: Animated scores smoothly transition from 0 to final values

### When result is error
```typescript
if (result.status === 'error') {
  return (
    <div>
      <AlertCircle />
      <p>{result.error}</p>
    </div>
  );
}
```

**Result**: Error displayed to user

## State Flow Diagram

```
┌─────────────────────────────────────────────────┐
│ User Clicks "Analyze"                           │
└────────────────────┬────────────────────────────┘
                     │
                     ↓
        ┌────────────────────────┐
        │ Stage 1: CLEAR         │
        │ setLiveResult(null)    │
        │ ← Removes old results  │
        └────────────┬───────────┘
                     │
                     ↓
        ┌────────────────────────────────┐
        │ Stage 2: LOAD                  │
        │ setIsAnalyzing(true)           │
        │ setProgress(0)                 │
        │ clearError()                   │
        │ ← Shows "Analyzing..."         │
        └────────────┬───────────────────┘
                     │
                     ↓
        ┌────────────────────────────────┐
        │ Make API Call                  │
        │ (with AbortController signal)  │
        └────────────┬───────────────────┘
                     │
                     ↓
        ┌────────────────────────────────┐
        │ Response Received              │
        └────────────┬───────────────────┘
                     │
         ┌───────────┴───────────┐
         ↓                       ↓
    ✅ Valid               ❌ Invalid/Stale
    Response              Response
         │                       │
         ↓                       ↓
    ┌─────────────────┐  ┌──────────────────┐
    │ Stage 3:        │  │ Ignore response  │
    │ POPULATE        │  │ (already have    │
    │ setAnalysis     │  │  newer request)  │
    │ Success(data)   │  └──────────────────┘
    │                 │
    │ ← Animates      │
    │   scores to     │
    │   new values    │
    └─────────────────┘
```

## Components Updated

| Component | File | Changes |
|-----------|------|---------|
| Business Analysis | `BusinessAnalysis.tsx` | ✅ Added `setLiveResult(null)` before loading |
| Criminal Analysis | `CriminalAnalysis.tsx` | ✅ Added `setLiveResult(null)` before loading |
| Interview Analysis | `InterviewAnalysis.tsx` | ✅ Added `setLiveResult(null)` before loading |

## Testing Verification

### Test Case 1: Single Analysis
```
1. Click "Analyze"
2. Observe: "Analyzing..." message appears immediately
3. Old results are gone
4. New results appear with animated score transition
✅ PASS
```

### Test Case 2: Rapid Clicks (Race Condition Test)
```
1. Click "Analyze" → "Analyzing..." shown
2. Immediately click "Analyze" again
3. Observe: Results remain hidden with "Analyzing..."
4. Only latest analysis results appear when complete
✅ PASS - No mix of old and new data visible
```

### Test Case 3: Failed Analysis
```
1. Click "Analyze"
2. Observe: "Analyzing..." shown, old results cleared
3. Trigger API error
4. Observe: Error message shown instead of old results
✅ PASS - Clean error state, no stale data
```

## Benefits

| Benefit | Impact |
|---------|--------|
| **Clear UX** | Users instantly see "Analyzing..." when clicking |
| **No Confusion** | Old results never mixed with new ones |
| **Proper Transitions** | Score animations start from 0, not old values |
| **Error Clarity** | Errors shown on clean slate, not mixed state |
| **Mobile Friendly** | Clear loading state important on smaller screens |
| **Accessibility** | Screen readers: "Analyzing..." announces action |

## Key Takeaway

**Always reset results BEFORE starting new analysis**

```typescript
// ✅ CORRECT: Clear first
analysis.setLiveResult(null);      // Stage 1
analysis.setIsAnalyzing(true);     // Stage 2
// API call                         // Stage 3

// ❌ WRONG: Set loading without clearing
analysis.setIsAnalyzing(true);
// API call
// Old results still visible during loading!
```

## Implementation Checklist

- ✅ All three analysis components reset result state before API call
- ✅ LiveAnalysisDisplay shows "Analyzing..." when result is null
- ✅ Animated scores start from 0 on each new analysis
- ✅ Error states show on clean slate
- ✅ Request versioning prevents stale data updates
- ✅ AbortController cancels old requests immediately

---

**Status**: Production-ready | All components updated | Verified
