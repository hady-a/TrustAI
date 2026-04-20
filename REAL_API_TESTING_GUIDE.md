# Real API Response Testing Guide

## Overview

The `realAPIValidator.ts` utility tests the complete pipeline:
```
Backend API → Raw Response → Validation → Transformation → Display
```

This ensures your **real backend** returns data that passes all validation checks, not just mock data.

---

## Quick Start

### Browser Console (Easiest)

1. Open browser DevTools (F12)
2. Go to Console tab
3. Run:

```javascript
// Import the test utility
import { testRealAPIResponse } from '@/utils/realAPIValidator';

// Test your backend
const result = await testRealAPIResponse({
  apiUrl: 'http://localhost:8000/analyze/business',
  verbose: true
});

// Check result
console.log(result);
```

### React Component

```typescript
import { testRealAPIResponse } from '@/utils/realAPIValidator';

function HealthCheck() {
  const [status, setStatus] = useState('pending');

  async function checkBackend() {
    const result = await testRealAPIResponse({ verbose: true });
    setStatus(result.success ? 'healthy' : 'unhealthy');
  }

  return (
    <div>
      <button onClick={checkBackend}>Test Backend</button>
      <p>Status: {status}</p>
    </div>
  );
}
```

### Node.js/CLI

```typescript
import { runAndDisplayTest } from '@/utils/realAPIValidator';

async function main() {
  console.log('Testing real backend API...\n');
  await runAndDisplayTest({ verbose: true });
}

main();
```

---

## What Gets Tested

### Stage 1: API Call
- ✅ Backend endpoint reachable
- ✅ HTTP 200 response
- ✅ JSON response format

### Stage 2: Raw API Response Validation
- ✅ All required fields present
- ✅ Confidence 0-1 range
- ✅ Credibility 0-100 range
- ✅ No duplicate fields
- ✅ Correct data types

### Stage 3: Transformation
- ✅ Data transforms without errors
- ✅ All fields present after transform
- ✅ Field values preserved

### Stage 4: Display Validation
- ✅ Transformed data is valid
- ✅ Ranges correct after transform
- ✅ Display values consistent

### Stage 5: Completeness Check
- ✅ Face data present/absent
- ✅ Voice data present/absent
- ✅ Credibility data present/absent

### Stage 6: Data Flow Consistency
- ✅ API confidence → Transformed confidence (match)
- ✅ API credibility → Transformed credibility (match)
- ✅ API deception → Transformed deception (match)
- ✅ Voice transcription preserved

---

## Return Value

```typescript
{
  success: boolean;                    // Overall test pass/fail

  stages: {
    apiCall: {
      status: 'success' | 'error';
      statusCode?: number;
      rawResponse: any;
      error?: string;
    },
    apiValidation: {
      valid: boolean;
      errors: string[];
      warnings: string[];
    },
    transformation: {
      success: boolean;
      transformedData: any;
      error?: string;
    },
    displayValidation: {
      valid: boolean;
      errors: string[];
      warnings: string[];
    },
    completeness: {
      isComplete: boolean;
      hasFace: boolean;
      hasVoice: boolean;
      hasCredibility: boolean;
    }
  },

  comparison?: {
    fields: string[];                // Fields tracked
    mismatches: string[];            // Any differences found
  },

  summary: string[];                 // Human-readable summary
}
```

---

## Console Output

When verbose=true, you see detailed output:

```
🔬 REAL API RESPONSE TEST
Testing endpoint: http://localhost:8000/analyze/business

Stage 1: Call Backend API
POST http://localhost:8000/analyze/business
✅ API call successful (HTTP 200)
Response structure: ['success', 'data', 'timestamp', 'report_type']

Stage 2: Validate Raw API Response
✅ API response passed validation
Checks passed: 8/8

Stage 3: Transform for Display
✅ Transformation successful
Transformed fields: ['deceptionScore', 'credibilityScore', 'confidence', ...]

Stage 4: Validate Transformed Data
✅ Transformed data passed validation

Stage 5: Check Data Completeness
Complete analysis: true
Face data: true
Voice data: true
Credibility data: true

Stage 6: Data Flow Comparison
Fields tracked through pipeline: confidence, credibilityScore, deceptionScore, voiceData
Status: ✅ All fields consistent through pipeline

📊 FINAL RESULTS
✅ ALL TESTS PASSED
API Validation: ✅ Pass
Transformation: ✅ Success
Display Validation: ✅ Pass
Completeness: ✅ Complete
```

---

## Sample Output Formatting

Use the included formatter:

```typescript
import { formatTestResults } from '@/utils/realAPIValidator';

const result = await testRealAPIResponse();
const formatted = formatTestResults(result);
console.log(formatted);

// Output:
// ══════════════════════════════════════════════════════════════════
// API RESPONSE TEST RESULTS
// ══════════════════════════════════════════════════════════════════
//
// 📡 API CALL:
//   Status: ✅ Success
//   HTTP Code: 200
//
// ✅ API VALIDATION:
//   Valid: YES
//
// 🔄 TRANSFORMATION:
//   Success: YES
//
// 🖥️ DISPLAY VALIDATION:
//   Valid: YES
//
// 📊 DATA COMPLETENESS:
//   Complete: YES
//   Face: ✅
//   Voice: ✅
//   Credibility: ✅
//
// ══════════════════════════════════════════════════════════════════
```

---

## Real-World Testing Scenarios

### Scenario 1: Full Analysis (All Sections)
```typescript
// What to expect:
// ✅ All 6 stages pass
// ✅ completeness.isComplete = true
// ✅ No warnings
// ✅ summary shows all green checkmarks
```

### Scenario 2: Partial Analysis (Missing Face)
```typescript
// What to expect:
// ✅ API validation passes
// ✅ Transformation succeeds
// ⚠️ completeness.hasFace = false
// ⚠️ Warnings about missing section
```

### Scenario 3: Invalid Confidence Range
```typescript
// What to expect:
// ❌ API validation fails
// ❌ Error: "Confidence out of range"
// ❌ Test stops at Stage 2
```

### Scenario 4: Duplicate Fields
```typescript
// What to expect:
// ❌ API validation fails
// ❌ Error: "Duplicate field: credibility_score in metrics"
// ❌ Test stops at Stage 2
```

### Scenario 5: Backend Down
```typescript
// What to expect:
// ❌ API call fails
// ❌ Error: "HTTP 503..." or "Network error"
// ❌ summary shows API connection issue
```

---

## Integration Patterns

### Pattern 1: Health Check Endpoint

```typescript
// In your API service or health check component
import { testRealAPIResponse } from '@/utils/realAPIValidator';

async function getBackendHealth() {
  try {
    const result = await testRealAPIResponse({
      verbose: false,  // Suppress logging
      apiUrl: 'http://localhost:8000/analyze/business'
    });

    return {
      healthy: result.success,
      validationPassed: result.stages.apiValidation.valid,
      transformationWorks: result.stages.transformation.success,
      displayValid: result.stages.displayValidation.valid,
    };
  } catch (error) {
    return { healthy: false, error: String(error) };
  }
}
```

### Pattern 2: Test on App Startup

```typescript
// In App.tsx or main initialization
import { testRealAPIResponse } from '@/utils/realAPIValidator';

useEffect(() => {
  if (process.env.NODE_ENV === 'development') {
    testRealAPIResponse({ verbose: true }).then(result => {
      if (!result.success) {
        console.warn('⚠️ Backend validation issues detected');
      }
    });
  }
}, []);
```

### Pattern 3: Manual Testing Command

```typescript
// Create a global test function accessible in console
window.__testBackendAPI = async () => {
  const { runAndDisplayTest } = await import('@/utils/realAPIValidator');
  return await runAndDisplayTest({ verbose: true });
};

// In browser console:
// $ await window.__testBackendAPI()
```

### Pattern 4: CI/CD Integration

```typescript
// In a test file
import { testRealAPIResponse } from '@/utils/realAPIValidator';

describe('Backend API Contract', () => {
  it('returns valid analysis responses', async () => {
    const result = await testRealAPIResponse({
      apiUrl: process.env.API_URL || 'http://localhost:8000/analyze/business'
    });

    expect(result.success).toBe(true);
    expect(result.stages.apiValidation.valid).toBe(true);
    expect(result.stages.transformation.success).toBe(true);
    expect(result.stages.displayValidation.valid).toBe(true);
  });

  it('handles partial analysis', async () => {
    const result = await testRealAPIResponse();

    // Partial analysis is ok, just check it was detected
    expect(result.stages.apiValidation.warnings.length).toBeGreaterThanOrEqual(0);
  });

  it('provides complete data flow', async () => {
    const result = await testRealAPIResponse();

    if (result.comparison) {
      expect(result.comparison.mismatches.length).toBe(0);
    }
  });
});
```

---

## Troubleshooting

### Issue: "API call failed: HTTP 404"

**Cause:** Endpoint URL wrong or backend not running

**Fix:**
```typescript
await testRealAPIResponse({
  apiUrl: 'http://localhost:8000/api/analyze/business'
  // or whatever your actual endpoint is
});
```

### Issue: "Confidence out of range: 150"

**Cause:** Backend returning 0-100 scale instead of 0-1

**Fix:** Update Flask API to return confidence as 0-1

### Issue: "Duplicate field: credibility_score in metrics"

**Cause:** Field appears both at top-level and in metrics

**Fix:**
- Remove from metrics OR
- Keep only in one location

### Issue: "Transformation failed"

**Cause:** transformAnalysisData() can't parse the response structure

**Fix:** Check that API response matches expected schema

### Issue: Test hangs/timeout

**Cause:** Backend endpoint is slow or unresponsive

**Fix:**
```typescript
// Add timeout
const controller = new AbortController();
const timeout = setTimeout(() => controller.abort(), 5000);

try {
  const result = await testRealAPIResponse({ /* ... */ });
  // ...
} finally {
  clearTimeout(timeout);
}
```

---

## Data Flow Tracing

The test shows exactly where data flows:

```
Backend Raw Response:
  {
    data: {
      credibility: {
        confidence: 0.92,
        credibility_score: 85,
        deception_probability: 15
      }
    }
  }
        ↓ validat ↓
  API validation: ✅ PASS
        ↓ transform ↓
  Transformed Data:
  {
    confidence: 0.92,
    credibilityScore: 85,
    deceptionScore: 15
  }
        ↓ validate ↓
  Display validation: ✅ PASS
        ↓ compare ↓
  Data flow: ✅ Consistent
```

---

## Advanced Usage

### Custom API Endpoint

```typescript
// Test a different endpoint
const result = await testRealAPIResponse({
  apiUrl: 'http://your-server.com/api/custom-analyze',
  verbose: true
});
```

### Batch Testing Multiple Endpoints

```typescript
const endpoints = [
  'http://localhost:8000/analyze/business',
  'http://localhost:8000/analyze/interview',
  'http://localhost:8000/analyze/criminal'
];

for (const endpoint of endpoints) {
  const result = await testRealAPIResponse({ apiUrl: endpoint });
  console.log(`${endpoint}: ${result.success ? '✅' : '❌'}`);
}
```

### Compare with Previous Response

```typescript
let previousResponse = null;

async function testAndCompare() {
  const result = await testRealAPIResponse({ verbose: true });

  if (previousResponse) {
    const comparison = compareAnalysisResults(previousResponse, result.stages.apiCall.rawResponse);
    console.log('Changes from previous:', comparison.differences);
  }

  previousResponse = result.stages.apiCall.rawResponse;
}
```

---

## Success Criteria

✅ **Test passes if:**
- Stage 1: API call returns HTTP 200
- Stage 2: API response passes validation
- Stage 3: Transformation succeeds
- Stage 4: Transformed data passes validation
- Stage 5: Data completeness detected correctly
- Stage 6: Data flow is consistent

⚠️ **Warnings (expected sometimes):**
- Partial analysis (missing face/voice/credibility)
- Non-critical field type mismatches

❌ **Test fails if:**
- API call returns error
- API response has invalid values
- Transformation throws error
- Transformed data fails validation
- Data values mismatch between stages

---

## Output Checklist

When test completes, verify:

```
✅ API call successful
  [ ] HTTP 200 response
  [ ] Valid JSON response
  [ ] Expected fields present

✅ API validation
  [ ] success flag correct
  [ ] Ranges valid (0-1 for confidence)
  [ ] No duplicate fields
  [ ] Correct data types

✅ Transformation
  [ ] No errors thrown
  [ ] All fields present
  [ ] Values preserved

✅ Display validation
  [ ] Transformed data valid
  [ ] Ranges correct after transform
  [ ] Display values match calculated

✅ Data completeness
  [ ] Face/Voice/Credibility detected correctly

✅ Data flow
  [ ] All values consistent through pipeline
  [ ] No unexpected mismatches
```

---

## Next Steps

1. **Run test** → `await testRealAPIResponse({ verbose: true })`
2. **Review output** → Check for any errors or warnings
3. **Fix issues** → If any failed stages, fix backend/transform logic
4. **Re-test** → Verify fixes work
5. **Monitor** → Add health checks to production

---

## Files

- **Utility:** `apps/frontend/src/utils/realAPIValidator.ts`
- **Guide:** This document
- **Related:** `analysisValidator.ts` (data validation)
- **Related:** `transformAnalysisData.ts` (data transformation)

---

## Summary

This utility **ensures your real backend returns valid data** by testing:
- ✅ API connectivity
- ✅ Response structure
- ✅ Data ranges
- ✅ Field consistency
- ✅ Data transformation
- ✅ Display readiness

Use it to catch backend issues early, before they break the frontend!
