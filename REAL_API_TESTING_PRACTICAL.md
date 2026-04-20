# How to Test Real API Responses - Practical Guide

## 🚀 Quick Start (Pick Your Environment)

### Option 1: Browser Console (Easiest, No Setup)

1. Open your app in browser
2. Press `F12` to open DevTools
3. Go to **Console** tab
4. Paste this code:

```javascript
// Import and run test
import { runAndDisplayTest } from '/src/utils/realAPIValidator.js';
await runAndDisplayTest({ verbose: true });
```

5. Press Enter and watch the results

---

### Option 2: React Component (Integrate into App)

Create a test button in your component:

```typescript
import { testRealAPIResponse, formatTestResults } from '@/utils/realAPIValidator';

function BackendHealthCheck() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  async function runTest() {
    setLoading(true);
    const testResult = await testRealAPIResponse({ verbose: true });
    setResult(testResult);
    setLoading(false);
  }

  return (
    <div>
      <button onClick={runTest} disabled={loading}>
        {loading ? 'Testing...' : 'Test Backend API'}
      </button>

      {result && (
        <pre style={{ whiteSpace: 'pre-wrap' }}>
          {formatTestResults(result)}
        </pre>
      )}
    </div>
  );
}
```

---

### Option 3: Node.js / Jest Test

Create a test file:

```typescript
// __tests__/api.test.ts
import { testRealAPIResponse } from '@/utils/realAPIValidator';

describe('Backend API Contract', () => {
  it('returns valid analysis responses', async () => {
    const result = await testRealAPIResponse({
      apiUrl: 'http://localhost:8000/analyze/business',
    });

    expect(result.success).toBe(true);
    expect(result.stages.apiValidation.valid).toBe(true);
    expect(result.stages.transformation.success).toBe(true);
    expect(result.stages.displayValidation.valid).toBe(true);
  });
});
```

Run with:
```bash
npm test -- api.test.ts
```

---

## 📋 Test Scenarios

### Test 1: Quick Sanity Check

**Time:** 5 seconds
**What it tests:** Is the backend up and returning valid data?

```bash
# Browser console:
await testRealAPIResponse({ verbose: true });
```

**Expected output:**
```
✅ ALL TESTS PASSED
API Validation: ✅ Pass
Transformation: ✅ Success
Display Validation: ✅ Pass
Completeness: ✅ Complete
```

---

### Test 2: Full Pipeline Test

**Time:** 10 seconds
**What it tests:** Complete data flow from backend to display

```bash
# Browser console:
import { runAndDisplayTest } from '@/utils/realAPIValidator';
await runAndDisplayTest({ verbose: true });
```

**What you see:**
1. Raw API response with all fields
2. Each validation stage result
3. Data transformation verification
4. Final display compatibility

---

### Test 3: All Endpoints

**Time:** 30 seconds
**What it tests:** All backend endpoints return valid data

```bash
# Browser console:
import { testAllBackendEndpoints } from '@/utils/realAPITestScripts';
await testAllBackendEndpoints();
```

**Output shows for each endpoint:**
- ✅ or ❌ status
- Which stage failed (if any)
- Summary of successes/failures

---

### Test 4: Health Monitoring

**Time:** Continuous (configurable)
**What it tests:** Backend stability over time

```bash
# Browser console:
import { monitorBackendHealth } from '@/utils/realAPITestScripts';

// Check every 30 seconds for 5 minutes
await monitorBackendHealth(30000, 300000);
```

**Shows:**
- Timestamp of each check
- ✅ or ❌ status
- Success rate at end
- If all checks passed

---

### Test 5: Stress Test

**Time:** 1-2 minutes
**What it tests:** Backend under load (concurrent requests)

```bash
# Browser console:
import { stressTestBackend } from '@/utils/realAPITestScripts';

// 5 concurrent requests, 20 total
await stressTestBackend(5, 20);
```

**Output:**
```
Batch 1: Sending 5 concurrent requests...
  ✅ Batch complete
Batch 2: Sending 5 concurrent requests...
  ✅ Batch complete
...

STRESS TEST RESULTS
Total requests: 20
Successful: 20
Failed: 0
Success rate: 100.0%
```

---

### Test 6: Compare Consecutive Calls

**Time:** 10 seconds
**What it tests:** API returns consistent data on repeated calls

```bash
# Browser console:
import { compareConsecutiveAPICalls } from '@/utils/realAPITestScripts';
await compareConsecutiveAPICalls();
```

**Output:**
```
✅ data.confidence: 0.92
✅ data.credibility.credibility_score: 85
✅ data.credibility.deception_probability: 15

Total differences: 0
✅ API responses are consistent
```

---

## 🔍 Reading the Results

### Success (✅ Green)

```
✅ ALL TESTS PASSED
✅ API call successful (HTTP 200)
✅ API response passed validation
✅ Transformation successful
✅ Transformed data passed validation
✅ Complete analysis
```

**What this means:**
- Backend is up and healthy
- Returns valid data structure
- Data transforms correctly
- Ready for display

---

### Partial Success (⚠️ Yellow)

```
⚠️ Partial Analysis
✅ API validation passed
✅ Transformation successful
⚠️ No face data detected
```

**What this means:**
- Backend works fine
- Some sections missing (e.g., no face detected)
- UI should show fallback for missing sections
- This is NORMAL

---

### Failure (❌ Red)

```
❌ API validation failed
❌ Confidence out of range: 1.5 (expected 0-1)
```

**What this means:**
- Backend returned invalid data
- Backend needs to be fixed
- See troubleshooting below

---

## 🐛 Troubleshooting

### Problem: "HTTP 404: Not Found"

```
❌ API call failed: HTTP 404
```

**Causes:**
1. Wrong endpoint URL
2. Backend not running
3. Wrong port

**Fix:**
```bash
# Check backend is running
ps aux | grep python  # On Linux/Mac
tasklist | findstr python  # On Windows

# Check it's listening on right port
curl http://localhost:8000/analyze/business

# If wrong port, update test:
await testRealAPIResponse({
  apiUrl: 'http://localhost:9000/analyze/business'  // Wrong port?
});
```

---

### Problem: "Confidence out of range: 150 (expected 0-1)"

```
❌ API validation failed
❌ Confidence out of range: 150 (expected 0-1)
```

**Cause:** Backend returning 0-100 scale instead of 0-1

**Fix:** Update Flask API to return confidence as 0.0-1.0

```python
# In flask_api.py, before returning:
confidence = confidence_value / 100.0  # Convert to 0-1 scale
```

---

### Problem: "Transformation failed"

```
❌ Transformation failed: Cannot read property 'confidence' of undefined
```

**Cause:** Response structure doesn't match expected format

**Fix:**
1. Check API response structure
2. Update `transformAnalysisData.ts` to match
3. Re-test

```bash
# Debug: See actual response structure
import { testRealAPIResponse } from '@/utils/realAPIValidator';
const result = await testRealAPIResponse();
console.log(result.stages.apiCall.rawResponse);
```

---

### Problem: "Test hangs / doesn't complete"

**Cause:** Backend is slow or unresponsive

**Fix:**
```bash
# Add timeout
const promise = testRealAPIResponse();
const timeout = new Promise((_, reject) =>
  setTimeout(() => reject(new Error('Timeout')), 5000)
);
await Promise.race([promise, timeout]);
```

---

## 📊 Interpreting Results

### Console Output Structure

```
🔬 REAL API RESPONSE TEST
Testing endpoint: http://localhost:8000/analyze/business

Stage 1: Call Backend API
  ✅ API call successful (HTTP 200)
  │
  ├─ Stage 2: Validate Raw API Response
  │   ✅ API response passed validation (8/8 checks)
  │
  ├─ Stage 3: Transform for Display
  │   ✅ Transformation successful
  │
  ├─ Stage 4: Validate Transformed Data
  │   ✅ Transformed data passed validation
  │
  └─ Stage 5: Check Data Completeness
      Complete: YES ✅
      Face: ✅    Voice: ✅    Credibility: ✅

📊 FINAL RESULTS
✅ ALL TESTS PASSED
```

Each stage must pass for the next to run.

---

## 📈 Performance Metrics

After test completes, you see:

```
Time to complete: ~1-2 seconds
- Network call: ~500ms
- Validation: ~10ms
- Transformation: ~20ms
- Display validation: ~10ms
```

**Good performance:**
- < 2 seconds total
- Network is bottleneck (fine)

**Bad performance:**
- > 5 seconds
- Transformation taking > 100ms
- Check code for issues

---

## 🎯 Testing Workflow

### Daily Development

```bash
# Morning: Quick health check
await testRealAPIResponse({ verbose: false });

# After changes: Full test
await runAndDisplayTest({ verbose: true });

# Before commit: All endpoints
await testAllBackendEndpoints();
```

### Before Deploy

```bash
# Stress test
await stressTestBackend(10, 50);

// Monitor for issues
await monitorBackendHealth(30000, 600000);  // 10 minutes
```

### Production Monitoring

Add periodic health checks:

```typescript
// In App.tsx or service worker
setInterval(async () => {
  const result = await testRealAPIResponse({ verbose: false });
  if (!result.success) {
    // Alert operations team
    reportissue('Backend validation failed', result.summary[0]);
  }
}, 60000);  // Every minute
```

---

## 🔄 Continuous Integration

### GitHub Actions Example

```yaml
name: Backend Contract Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Start Backend
        run: python trust\ ai\ system/flask_api.py &

      - name: Wait for Backend
        run: sleep 5

      - name: Run API Tests
        run: npm test -- api.test.ts
```

---

## 📋 Checklist: Should Pass Before Deploy

- [ ] Quick test passes (✅ all stages)
- [ ] All endpoints pass (✅ business, interview, audio)
- [ ] Stress test OK (✅ 100% success rate)
- [ ] Monitoring stable (✅ no failures in 10 min)
- [ ] Comparable calls consistent (✅ same values)
- [ ] Console shows no warnings
- [ ] Response times acceptable (< 2 sec)

If any ❌, investigate and fix before deploying.

---

## 🎓 Learning Path

1. **Beginner**: Run quick test in browser console
2. **Intermediate**: Integrate test button into component
3. **Advanced**: Add to Jest test suite
4. **Expert**: Set up continuous monitoring

---

## 📞 Support

**Test returning errors?**
→ See Troubleshooting section

**Not sure what a message means?**
→ See "Reading the Results" section

**Want to customize test?**
→ Review `realAPIValidator.ts` source code

**Need different endpoint?**
→ Change `apiUrl` parameter

---

## Summary

Use these tests to:

✅ Verify backend returns valid data
✅ Catch schema changes early
✅ Monitor production stability
✅ Debug data flow issues
✅ Ensure frontend can handle responses

Run them:
- **Daily** during development
- **Before** each deploy
- **Periodically** in production

All tests take < 2 seconds. No backend changes needed!
