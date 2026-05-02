# Real API Stress Test - Usage Guide

## Overview

The stress test system has been updated to use **real API calls** instead of mock data. This simulates actual production behavior and detects real-world async/race condition bugs.

## Quick Start

### Browser Console (Simplest)

```javascript
// Run 10 rapid API calls to /api/analyze/business
await quickStressTest();

// Or use custom endpoint
await quickStressTest('http://localhost:3000/api/analyze/audio');
```

### Programmatic Usage

```typescript
import { runRealAPIStressTest } from '@/utils/stressTestAnalysisSystem';

// Run stress test
const result = await runRealAPIStressTest(
  'http://localhost:3000/api/analyze/business',  // endpoint
  10,                                              // request count
  true                                             // verbose logging
);

// Check results
if (result.summary.passed) {
  console.log('✅ All tests passed');
} else {
  console.log('❌ Issues detected:', result.summary.issues);
  console.log('💡 Fixes:', result.summary.recommendations);
}
```

## What It Tests

### 1. **Timing Consistency**
- Captures actual request/response times from real backend
- Calculates: min, max, average, standard deviation
- Detects performance anomalies and bottlenecks

```
📊 TIMING STATISTICS
  Min:     145ms
  Max:     312ms
  Average: 218ms
  StdDev:  45ms
```

### 2. **Response Consistency**
- Compares all 10 responses field-by-field
- Detects if backend returns different data for same input
- Tracks what fields vary across requests

```
📋 RESPONSE CONSISTENCY
  Identical: ✅
  Variations: 0 differences
```

### 3. **Response Ordering**
- Verifies responses arrive in correct order
- Tracks response IDs/timestamps from API
- Detects out-of-order processing

```
🔄 RESPONSE ORDERING
  In Order: ✅
  Out of Order: 0 instances
```

### 4. **Response Validation**
- Validates each response against analysis schema
- Checks required fields (face, voice, credibility)
- Verifies range constraints (confidence 0-1, etc.)

### 5. **API Reliability**
- Tracks HTTP status codes
- Captures and logs errors
- Counts successful vs failed requests

## Result Structure

```typescript
interface RealAPIStressTestResult {
  // Identification
  testId: string;              // e.g., "real-api-stress-1718884521234"
  endpoint: string;            // API endpoint tested

  // Timing
  startTime: number;           // Unix timestamp when test started
  endTime: number;             // Unix timestamp when test ended
  duration: number;            // Total duration in ms

  // Counts
  totalRequests: number;       // 10
  successfulRequests: number;  // How many got 200 OK
  failedRequests: number;      // How many failed

  // Individual requests
  requests: RealAPIRequest[]; // Array of request details

  // Analysis results
  timing: {
    minDuration: number;      // Fastest response
    maxDuration: number;      // Slowest response
    avgDuration: number;      // Average response time
    stdDev: number;           // Variance in response times
  };

  responseVariation: {
    allResponsesIdentical: boolean;  // Do all responses match?
    differences: Array<{
      field: string;                 // Field name that differs
      variations: any[];             // Different values observed
    }>;
  };

  ordering: {
    allResponsesInOrder: boolean;    // Did responses arrive in order?
    outOfOrderInstances: Array<{
      before: number;               // Request sequence number
      after: number;                // Request sequence number
      beforeId?: string;            // API response ID
      afterId?: string;             // API response ID
    }>;
  };

  // Validation
  validation: {
    allValid: boolean;       // All responses valid?
    invalidCount: number;    // How many failed validation
    errors: string[];        // Error details
  };

  // Summary
  summary: {
    passed: boolean;         // Overall pass/fail
    issues: string[];        // List of detected issues
    recommendations: string[];  // Suggested fixes
  };
}
```

## Individual Request Details

```typescript
interface RealAPIRequest {
  requestId: number;           // 0-9 (request sequence)
  endpoint: string;            // API endpoint called
  startTime: number;           // When request was sent
  endTime?: number;            // When response received
  duration?: number;           // endTime - startTime
  httpStatus?: number;         // 200, 500, etc.
  response: Record<string, any> | null;  // Full JSON response
  responseId?: string;         // ID from response metadata
  responseTimestamp?: number;  // Timestamp from response
  error?: string;              // Error message if failed
  validation?: ValidationResult;  // Validation results
}
```

## Common Scenarios

### Scenario 1: Basic Stress Test
```javascript
// Simple one-liner for quick testing
await quickStressTest();
```

**Expected Output:**
```
🔥 REAL API STRESS TEST
   Test ID: real-api-stress-1718884521234
   Endpoint: http://localhost:3000/api/analyze/business
   Requests: 10

Request 0: ✅ 218ms
Request 1: ✅ 205ms
...
Request 9: ✅ 231ms

✅ PASSED - No issues detected
```

### Scenario 2: Custom Endpoint
```javascript
// Test audio analysis endpoint
await quickStressTest('http://localhost:3000/api/analyze/audio');

// Test interview analysis
await quickStressTest('http://localhost:3000/api/analyze/interview');
```

### Scenario 3: Detailed Analysis with Custom Count
```typescript
const result = await runRealAPIStressTest(
  'http://localhost:3000/api/analyze/business',
  20,  // More requests = better detection
  true // Verbose logging
);

console.log('Timing stats:', result.timing);
console.log('Response variations:', result.responseVariation.differences);
console.log('Out of order:', result.ordering.outOfOrderInstances);
```

### Scenario 4: Export Results for Analysis
```typescript
const result = await runRealAPIStressTest(
  'http://localhost:3000/api/analyze/business',
  10,
  false
);

// Save to file or send to monitoring
const json = JSON.stringify(result, null, 2);
console.log(json);

// Or export specific data
result.requests.forEach((req, i) => {
  console.log(`Request ${i}: ${req.duration}ms`);
});
```

## Interpreting Results

### ✅ PASSED - What This Means
- All 10 requests completed successfully
- All responses passed validation
- Responses were identical
- No out-of-order issues
- Timing was consistent (low variance)

### ❌ FAILED - What Can Go Wrong

**Timing Issues:**
- `High response time variance detected`
- → Backend might be unstable or overloaded
- → Fix: Scale backend, optimize database queries

**Response Variation:**
- `Response variation detected: 3 field(s) differ`
- → Backend returns different data for same input
- → Fix: Check for non-deterministic AI results, verify input consistency

**Out of Order:**
- `2 out-of-order response(s) detected`
- → Requests arriving/processing in wrong order
- → Fix: Use request IDs to track latest response, ignore stale data

**Validation Errors:**
- `3 response(s) failed validation`
- → API response doesn't match expected schema
- → Fix: Update validation rules or fix API response format

**Failed Requests:**
- `2 request(s) failed`
- → Backend is down or unreachable
- → Fix: Check backend status, verify endpoint URL, check network

## Integration with UI Component

The `StressTestUI` React component can be updated to use real API:

```tsx
import StressTestUI from '@/components/StressTestUI';

export default function App() {
  return (
    <>
      {/* ... your app ... */}
      <StressTestUI isOpen={false} apiEndpoint="http://localhost:3000/api/analyze/business" />
    </>
  );
}
```

## Troubleshooting

### "Could not connect to backend"
- Ensure backend is running: `npm run dev` (backend)
- Check endpoint URL is correct
- Verify no firewall blocking localhost:3000

### "All requests failed with timeout"
- Backend might be slow
- Increase timeout in fetch call (currently 30s default)
- Check backend logs for errors

### "Responses are inconsistent"
- This might be expected if AI results vary
- Check if input files are identical
- Review AI system for non-determinism

### "Out of order responses detected"
- This can happen with concurrent requests
- Expected behavior if requests complete at different times
- Only concerning if **processing** is out of order (checked via responseTimestamp)

## Production Deployment

For production monitoring, run periodically:

```javascript
// Run every 5 minutes
setInterval(async () => {
  const result = await quickStressTest();

  // Send to monitoring service (Datadog, New Relic, etc.)
  if (!result.summary.passed) {
    sendAlert(result.summary.issues);
  }
}, 300000);
```

## Performance Benchmarks

Typical results on healthy system:

```
Duration: ~2000ms (for 10 requests with 50ms delays)
Average Response Time: 150-300ms
Success Rate: 100%
Timing StdDev: <50ms
```

Red flags:
- Duration > 5000ms
- Average > 500ms
- Success < 90%
- Timing StdDev > avg × 0.5
