# Strict Evaluation Rules - Real API Stress Test

## Overview

The enhanced `runRealAPIStressTest` now includes **strict pass/fail evaluation** with 6 specific rules. Each rule is evaluated independently and must pass for the overall test to pass.

## The 6 Strict Evaluation Rules

### 1. **Timing Consistency** ⏱️

**Rule:** Average response time must be < 2000ms AND standard deviation < 500ms

**Implementation:**
```typescript
evaluateTiming({
  avgDuration: number;    // Must be < 2000ms
  stdDev: number;         // Must be < 500ms
}): { pass: boolean; status: 'PASS' | 'WARN' | 'FAIL' }
```

**Examples:**
- ✅ PASS: avg=218ms, stdDev=45ms
- ❌ FAIL: avg=2500ms (exceeds limit)
- ❌ FAIL: avg=1500ms, stdDev=800ms (variance too high)

**Why:** Detects backend performance issues and instability

---

### 2. **Ordering** 🔄

**Rule:** Responses must match request order. Responses arriving out of order → FAIL

**Implementation:**
```typescript
evaluateOrdering({
  allResponsesInOrder: boolean;
  outOfOrderInstances: Array<{ before, after }>;
}): { pass: boolean; status: 'PASS' | 'FAIL' }
```

**Detection Method:**
- Compares `responseTimestamp` from API metadata
- If response N has earlier timestamp than response N-1 → out of order
- Catches backend reordering or async processing bugs

**Examples:**
- ✅ PASS: All responseTimestamps 1-10 in ascending order
- ❌ FAIL: Response 5 timestamp earlier than response 4

**Why:** Ensures latest result is actually displayed

---

### 3. **Data Consistency** 📊

**Rule:** Identical inputs must produce same outputs. Differences allowed only for floats ±0.05

**Implementation:**
```typescript
evaluateConsistency({
  allResponsesIdentical: boolean;
  differences: Array<{ field: string; variations: any[] }>;
}): { pass: boolean; status: 'PASS' | 'FAIL' }
```

**Tolerance Logic:**
```typescript
// For numeric fields
const absDiff = Math.abs(value1 - value2);
if (absDiff > 0.05) {
  // FAIL - difference too large
}

// For non-numeric fields
// Any difference → FAIL
```

**Examples:**
- ✅ PASS: All responses identical OR confidence diffs ≤ ±0.05
- ❌ FAIL: credibility_score 75 vs 82 (difference > 0.05)
- ❌ FAIL: String fields differ: "success" vs "pending"

**Why:** Detects non-deterministic backend or inconsistent data sources

---

### 4. **Response Integrity** 📋

**Rule:** All responses must include required fields: `success`, `data`, `timestamp`

**Implementation:**
```typescript
evaluateIntegrity(requests: RealAPIRequest[]): {
  pass: boolean;
  missingFields: string[];
  status: 'PASS' | 'FAIL'
}
```

**Check:**
```typescript
const requiredFields = ['success', 'data', 'timestamp'];
// All requests must have all fields
```

**Examples:**
- ✅ PASS: All responses have {success, data, timestamp, ...}
- ❌ FAIL: Request 3 missing 'data' field
- ❌ FAIL: Request 7 missing 'timestamp'

**Why:** Ensures API contract is respected

---

### 5. **Stale Data** ⚠️

**Rule:** Latest request must match latest displayed result. Mismatch → FAIL

**Implementation:**
```typescript
evaluateStaleData(requests: RealAPIRequest[]): {
  pass: boolean;
  latestMismatch: boolean;
  status: 'PASS' | 'FAIL'
}
```

**Detection:**
- Compares latest request response with previous response
- If latest is different from previous = good (current data)
- If latest matches previous for multiple requests = stale data

**Examples:**
- ✅ PASS: Latest response different from previous (current)
- ✅ PASS: Latest response matches previous (expected consistency)
- ❌ FAIL: Latest response same as 5 requests ago (stale)

**Why:** Prevents displaying old/cached analysis results

---

### 6. **Confidence Consistency** 📈

**Rule:** `confidence * 100 === displayed_percentage` (with ±0.5% tolerance)

**Implementation:**
```typescript
evaluateConfidenceConsistency(requests): {
  pass: boolean;
  mismatches: Array<{
    requestId: number;
    confidence: number;              // Raw 0-1 value
    displayedPercentage: number;     // Displayed 0-100 value
    mismatch: number;
  }>;
  status: 'PASS' | 'FAIL'
}
```

**Calculation:**
```typescript
const expectedPercentage = confidence * 100;
const displayedPercentage = response.data.face.confidence_percentage;
const mismatch = expectedPercentage - displayedPercentage;

if (Math.abs(mismatch) > 0.5) {
  // FAIL - conversion error
}
```

**Examples:**
- ✅ PASS: confidence=0.85 → 85%, displayed=85% (exact match)
- ✅ PASS: confidence=0.851 → 85.1%, displayed=85.0% (within ±0.5%)
- ❌ FAIL: confidence=0.85 → 85%, displayed=50% (mismatch detected)

**Why:** Catches frontend percentage conversion bugs

---

## Return Structure

```typescript
{
  evaluation: {
    passed: boolean;  // Overall pass/fail based on all 6 rules
    summary: {
      timing: 'PASS' | 'WARN' | 'FAIL';
      ordering: 'PASS' | 'WARN' | 'FAIL';
      consistency: 'PASS' | 'WARN' | 'FAIL';
      integrity: 'PASS' | 'WARN' | 'FAIL';
      staleData: 'PASS' | 'WARN' | 'FAIL';
      confidenceConsistency: 'PASS' | 'WARN' | 'FAIL';
    };
    details: {
      timing: {
        avgResponseTime: number;  // milliseconds
        limit: number;            // 2000ms
        pass: boolean;
        reason: string;
      };
      timingVariance: {
        stdDev: number;          // std deviation
        limit: number;           // 500ms
        pass: boolean;
        reason: string;
      };
      ordering: {
        outOfOrderCount: number;
        pass: boolean;
        reason: string;
      };
      consistency: {
        differences: number;     // field count
        pass: boolean;
        reason: string;
      };
      integrity: {
        missingFields: string[]; // List of missing fields
        pass: boolean;
        reason: string;
      };
      staleData: {
        latestMismatch: boolean;
        pass: boolean;
        reason: string;
      };
      confidenceConsistency: {
        mismatches: Array<{
          requestId: number;
          confidence: number;
          displayedPercentage: number;
          mismatch: number;
        }>;
        pass: boolean;
        reason: string;
      };
    };
    issues: string[];  // Human-readable issues
  };
}
```

## Usage

### Browser Console

```javascript
// Run test
const result = await quickStressTest();

// Check strict evaluation
console.log(result.evaluation.passed);           // true/false
console.log(result.evaluation.summary);          // All 6 rule results
console.log(result.evaluation.details);          // Detailed breakdown
console.log(result.evaluation.issues);           // List of failures
```

### Programmatic

```typescript
import { runRealAPIStressTest } from '@/utils/stressTestAnalysisSystem';

const result = await runRealAPIStressTest(
  'http://localhost:3000/api/analyze/business',
  10,
  true
);

// Check each rule
if (result.evaluation.summary.timing === 'FAIL') {
  console.log('⏱️ Backend too slow:', result.evaluation.details.timing.reason);
}

if (result.evaluation.summary.consistency === 'FAIL') {
  console.log('📊 Non-deterministic:', result.evaluation.details.consistency.reason);
}

if (result.evaluation.summary.ordering === 'FAIL') {
  console.log('🔄 Out of order:', result.evaluation.details.ordering.outOfOrderCount);
}

// Strict pass/fail
if (!result.evaluation.passed) {
  console.error('❌ FAILED STRICT EVALUATION');
  result.evaluation.issues.forEach(issue => console.error(issue));
}
```

## Console Output Example

```
================================================================================
REAL API STRESS TEST REPORT - STRICT EVALUATION
================================================================================

Endpoint: http://localhost:3000/api/analyze/business
Duration: 2156ms
Requests: 10/10 successful

✅ STRICT EVALUATION PASSED

────────────────────────────────────────────────────────────────────────────────
STRICT EVALUATION SUMMARY
────────────────────────────────────────────────────────────────────────────────
Timing:                   ✅ PASS
  → avg: 218ms (limit: 2000ms)
  → variance: 45ms (limit: 500ms)

Ordering:                 ✅ PASS
  → out of order: 0

Consistency:              ✅ PASS
  → field differences: 0 (tolerance: ±0.05)

Integrity:                ✅ PASS
  → required fields: success, data, timestamp

Stale Data:               ✅ PASS
  → latest response is current: ✅

Confidence Consistency:   ✅ PASS
  → confidence * 100 == displayed %

────────────────────────────────────────────────────────────────────────────────
```

## Integration with Tests

### Jest Test Example

```typescript
import { runRealAPIStressTest } from '@/utils/stressTestAnalysisSystem';

describe('Real API Stress Test', () => {
  it('should pass strict evaluation', async () => {
    const result = await runRealAPIStressTest(
      'http://localhost:3000/api/analyze/business',
      10,
      false
    );

    // All 6 rules must pass
    expect(result.evaluation.passed).toBe(true);
    expect(result.evaluation.summary.timing).toBe('PASS');
    expect(result.evaluation.summary.ordering).toBe('PASS');
    expect(result.evaluation.summary.consistency).toBe('PASS');
    expect(result.evaluation.summary.integrity).toBe('PASS');
    expect(result.evaluation.summary.staleData).toBe('PASS');
    expect(result.evaluation.summary.confidenceConsistency).toBe('PASS');
  });

  it('should detect timing issues', async () => {
    // Mock slow backend
    const result = await runRealAPIStressTest(...);

    if (result.evaluation.summary.timing !== 'PASS') {
      console.log('Backend performance issue:',
        result.evaluation.details.timing.reason);
    }
  });
});
```

### CI/CD Pipeline

```typescript
// In your CI test runner
const result = await runRealAPIStressTest(
  process.env.API_ENDPOINT,
  process.env.STRESS_TEST_COUNT || 10,
  false
);

if (!result.evaluation.passed) {
  console.error('❌ Strict evaluation failed');
  process.exit(1);
}
```

## Debugging Failed Rules

### If Timing Fails
```javascript
const result = await quickStressTest();
console.log(result.evaluation.details.timing);
console.log(result.timing);  // minDuration, maxDuration, avgDuration, stdDev

// Backend optimization needed
// - Profile database queries
// - Check API latency
// - Monitor backend server load
```

### If Ordering Fails
```javascript
console.log(result.evaluation.details.ordering.reason);
console.log(result.ordering.outOfOrderInstances);

// Check response timestamps in API
// Verify requestId/timestamp in response metadata
```

### If Consistency Fails
```javascript
console.log(result.evaluation.details.consistency.reason);
console.log(result.responseVariation.differences);

// Check for non-deterministic AI results
// Verify same input files are used
```

### If Integrity Fails
```javascript
console.log(result.evaluation.details.integrity.missingFields);

// Update API response to include:
// - success field
// - data field
// - timestamp field
```

### If Stale Data Fails
```javascript
console.log(result.evaluation.details.staleData.reason);

// Check:
// - Request ID tracking in UI
// - State update timing
// - Race condition detection
```

### If Confidence Consistency Fails
```javascript
console.log(result.evaluation.details.confidenceConsistency.mismatches);

// Fix conversion: confidence * 100 === displayedPercentage
// Check for rounding errors in frontend
```

## What Passes vs Fails

### ✅ PASS Examples
```
Timing:           avg=150ms, stdDev=30ms
Ordering:         All responses chronological
Consistency:      All responses identical
Integrity:        All fields present
Stale Data:       Latest response is current
Confidence:       0.85 * 100 = 85% (exact)
```

### ❌ FAIL Examples
```
Timing:           avg=2500ms OR stdDev=600ms
Ordering:         Response 5 before response 4
Consistency:      credibility differs by 10 pts
Integrity:        Request 3 missing 'data'
Stale Data:       5 requests returned same old data
Confidence:       0.85 displayed as 50%
```

## Production Monitoring

```javascript
// Run every hour
setInterval(async () => {
  const result = await quickStressTest();

  if (!result.evaluation.passed) {
    // Send alert
    alertService.send({
      level: 'critical',
      title: 'API Stress Test Failed',
      details: result.evaluation.summary,
      failedRules: result.evaluation.issues
    });
  }
}, 3600000);
```
