# Analysis Validator - Quick Reference Card

## 📋 One-Pager Cheat Sheet

### Import
```typescript
import {
  validateAnalysisResult,
  isValidAnalysis,
  isCompleteAnalysis,
  hasPartialAnalysis,
  getValidationErrors,
  compareAnalysisResults,
} from '@/utils/analysisValidator';
```

### Basic Usage
```typescript
// Validate API response
const validation = validateAnalysisResult(apiResponse);

// Check result
if (!validation.valid) {
  showError(validation.errors[0]); // "❌ Confidence out of range..."
} else if (!isCompleteAnalysis(apiResponse)) {
  showWarning(validation.warnings); // "⚠️ No face data..."
} else {
  displayResults(apiResponse);
}
```

### Return Value
```typescript
{
  valid: boolean;           // ✅ or ❌
  errors: string[];         // Critical issues
  warnings: string[];       // Non-critical
  checks: {
    hasSuccess: boolean;
    hasFace: boolean;
    hasVoice: boolean;
    hasCredibility: boolean;
    confidenceInRange: boolean;      // 0-1
    credibilityInRange: boolean;     // 0-100
    stressInRange: boolean;           // 0-1 or 0-100
    confidenceConsistent: boolean;    // display == calc
  }
}
```

### 6 Helper Functions

| Function | Use Case | Returns |
|----------|----------|---------|
| `validateAnalysisResult(data)` | Full validation | ValidationResult |
| `isValidAnalysis(data)` | Quick check | boolean |
| `isCompleteAnalysis(data)` | All sections present | boolean |
| `hasPartialAnalysis(data)` | Any section present | boolean |
| `getValidationErrors(data)` | Extract errors | string[] |
| `compareAnalysisResults(before, after)` | Detect changes | {same, differences} |

### What Gets Validated

**Structure:**
- ✅ data object exists
- ✅ data.data object exists
- ✅ face/voice/credibility sections (optional)

**Ranges:**
- ✅ confidence: 0-1
- ✅ credibility_score: 0-100
- ✅ deception_probability: 0-100
- ✅ stress_level: 0-1 or 0-100

**Consistency:**
- ✅ displayed confidence = confidence × 100
- ✅ no duplicate fields
- ✅ correct data types

### Component Example

```typescript
function Results({ data }) {
  const v = validateAnalysisResult(data);

  if (!v.valid) return <ErrorUI errors={v.errors} />;
  if (!isCompleteAnalysis(data)) return <PartialUI />;

  return (
    <div>
      {v.checks.hasFace && <FaceResults data={data} />}
      {v.checks.hasVoice && <VoiceResults data={data} />}
      {v.checks.hasCredibility && <CredibilityResults data={data} />}
    </div>
  );
}
```

### Testing

```typescript
import { ValidationTests } from '@/utils/analysisValidator.test';

// Run all tests
ValidationTests.runAllValidationTests();
// Output: ✅/❌ for 10 test scenarios

// Demonstrate helpers
ValidationTests.demonstrateHelperFunctions();

// Pipeline simulation
ValidationTests.testAPIResponsePipeline();
```

### Console Output
```
🔍 AI VALIDATION REPORT
  📊 Raw Data
    [inputs shown]
  ✅ Validation Results
    Overall: valid=true
    Checks: 8/8 passed
  📋 Detailed Checks
    ✅ hasSuccess
    ✅ hasFace
    ✅ hasVoice
    ✅ hasCredibility
    ✅ confidenceInRange
    ✅ credibilityInRange
    ✅ stressInRange
    ✅ confidenceConsistent
```

### 6 Issues Detected

| Issue | Detection | Example |
|-------|-----------|---------|
| 1. Scale Mismatch | `confidenceInRange` | confidence=1.5 |
| 2. Duplicate Fields | Errors array | credibility_score in metrics |
| 3. Race Condition | `compareAnalysisResults()` | Detect changes |
| 4. Out-of-Range | `credibilityInRange` | credibility=150 |
| 5. Missing Sections | `hasFace/Voice/Credibility` | face=null |
| 6. Type Mismatch | Warnings array | confidence="0.92" |

### Error Messages

```typescript
// Invalid confidence (out of range)
"❌ Confidence out of range: 1.5 (expected 0-1)"

// Invalid credibility (out of range)
"❌ Credibility score out of range: 150 (expected 0-100)"

// Duplicate field
"❌ Duplicate field: credibility_score in metrics"

// Type mismatch
"⚠️  Confidence not a number"

// Missing data
"⚠️  No face data in results"
```

### Integration Patterns

**API Service:**
```typescript
const response = await api.analyze(audio);
const validation = validateAnalysisResult(response);
if (!validation.valid) throw new Error(validation.errors[0]);
return response;
```

**React Hook:**
```typescript
function useAnalysisValidation() {
  const validate = (data) => validateAnalysisResult(data);
  return { validate };
}
```

**Error Boundary:**
```typescript
componentDidCatch(error) {
  const v = validateAnalysisResult(this.state.data);
  log.error('Render error:', v.errors);
}
```

**Data Comparison:**
```typescript
const comparison = compareAnalysisResults(before, after);
if (!comparison.same) {
  console.log('Changes:', comparison.differences);
}
```

### Files

| File | Size | Purpose |
|------|------|---------|
| `analysisValidator.ts` | 10KB | Core utility (production) |
| `analysisValidator.test.ts` | 10KB | Test suite (10 scenarios) |
| `ANALYSIS_VALIDATOR_GUIDE.md` | 13KB | Full documentation |
| `ANALYSIS_VALIDATOR_SUMMARY.md` | 12KB | Reference guide |
| `VALIDATOR_INTEGRATION_EXAMPLES.ts` | 9.5KB | 8 code examples |

### Installation

1. Copy `analysisValidator.ts` to `apps/frontend/src/utils/`
2. Copy `analysisValidator.test.ts` to `apps/frontend/src/utils/`
3. Import: `import { validateAnalysisResult } from '@/utils/analysisValidator'`
4. Use in components/services immediately

### Best Practices

✅ **DO:**
- Validate immediately after API call
- Check `isCompleteAnalysis()` before rendering full UI
- Log validation errors to console (debug mode)
- Compare results before/after transformations
- Show validation errors to users

❌ **DON'T:**
- Assume API response is valid
- Skip validation on transformed data
- Silently handle validation failures
- Render without checking completeness
- Ignore duplicate field errors

### Troubleshooting

**Q: Validation fails but data looks correct?**
A: Check console output, review specific errors, use debugger.

**Q: Partial analysis warnings?**
A: Normal - at least one section missing. Show partial results UI.

**Q: Duplicate field errors?**
A: Remove from metrics, keep at top-level only.

**Q: Which errors are critical?**
A: All in `errors` array. Warnings in `warnings` array.

### Performance

- Validation: O(n) where n = fields (~20)
- Memory: Negligible, returns object
- Time: <1ms for typical data
- Overhead: None when not called

### Next Steps

1. Read `ANALYSIS_VALIDATOR_GUIDE.md`
2. Review `VALIDATOR_INTEGRATION_EXAMPLES.ts`
3. Import and use in components
4. Run `ValidationTests.runAllValidationTests()`
5. Monitor console for validation reports

---

**Status:** ✅ Production Ready
**TypeScript:** ✅ Fully Typed
**Tests:** ✅ 10 Scenarios
**Docs:** ✅ Complete

Ready to integrate!
