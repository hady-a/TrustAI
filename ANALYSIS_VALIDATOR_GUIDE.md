# Analysis Result Validator - Usage Guide

## Overview

The `analysisValidator.ts` utility automatically validates AI analysis results to catch data mismatches, inconsistencies, and out-of-range values. This prevents silent bugs where the UI displays incorrect data.

## Quick Start

### Import the Validator

```typescript
import { validateAnalysisResult, isCompleteAnalysis } from '@/utils/analysisValidator';
```

### Basic Usage

```typescript
// Validate API response
const apiResponse = await analyzeAudio(audioData);
const validation = validateAnalysisResult(apiResponse);

if (!validation.valid) {
  console.error('Analysis failed validation:', validation.errors);
  // Show error to user
} else if (!validation.checks.hasAllData) {
  console.warn('Partial analysis:', validation.warnings);
  // Show partial results
} else {
  console.log('✅ Analysis valid, display results');
  // Display full results
}
```

---

## API Reference

### `validateAnalysisResult(data: any): ValidationResult`

**Performs comprehensive validation of analysis data**

Returns:
```typescript
{
  valid: boolean;                    // Overall pass/fail
  errors: string[];                  // Critical issues
  warnings: string[];                // Non-critical issues
  checks: {
    hasSuccess: boolean;             // success flag exists
    hasFace: boolean;                // face analysis present
    hasVoice: boolean;               // voice analysis present
    hasCredibility: boolean;         // credibility analysis present
    confidenceInRange: boolean;      // confidence 0-1
    credibilityInRange: boolean;     // credibility 0-100
    stressInRange: boolean;          // stress 0-1 or 0-100
    confidenceConsistent: boolean;   // display matches calculated
  }
}
```

### Helper Functions

#### `isValidAnalysis(data: any): boolean`
Quick check if data passes validation.

```typescript
if (isValidAnalysis(response)) {
  displayResults(response);
}
```

#### `isCompleteAnalysis(data: any): boolean`
Check if all analysis sections (face, voice, credibility) are present.

```typescript
if (isCompleteAnalysis(response)) {
  showComprehensiveResults();
} else {
  showPartialResults();
}
```

#### `hasPartialAnalysis(data: any): boolean`
Check if at least one analysis section exists.

```typescript
if (!hasPartialAnalysis(response)) {
  showEmptyStateUI();
}
```

#### `getValidationErrors(data: any): string[]`
Get just the error messages for reporting.

```typescript
const errors = getValidationErrors(response);
log.error('Validation failed:', errors);
```

#### `compareAnalysisResults(before: any, after: any): { same: boolean, differences: string[] }`
Compare two analysis results to detect changes.

```typescript
const comparison = compareAnalysisResults(previousAnalysis, newAnalysis);
if (!comparison.same) {
  console.log('Changes detected:', comparison.differences);
}
```

---

## What Gets Validated

### 1. Structural Checks
- ✅ `data` object exists and is not null
- ✅ `data.success` flag exists (non-critical)
- ✅ `data.data` object exists
- ✅ `data.data.face` is an object (optional)
- ✅ `data.data.voice` is an object (optional)
- ✅ `data.data.credibility` is an object (optional)

### 2. Range Validation
- ✅ Confidence between 0–1 (0.0 to 1.0)
- ✅ Credibility score between 0–100
- ✅ Stress level between 0–1 or 0–100 (auto-detects scale)
- ✅ Deception probability between 0–100

### 3. Consistency Checks
- ✅ Displayed confidence (%) equals confidence × 100
- ✅ No duplicate fields in metrics
- ✅ No conflicting field names
- ✅ Voice data structure consistent

### 4. Data Quality
- ✅ All required fields have appropriate types
- ✅ No silent data type mismatches
- ✅ Missing optional fields tracked as warnings

---

## Real-World Examples

### Example 1: Component with Error Handling

```typescript
import { validateAnalysisResult, isCompleteAnalysis } from '@/utils/analysisValidator';

function AnalysisResults({ response }: { response: any }) {
  const validation = validateAnalysisResult(response);

  // Failed validation
  if (!validation.valid) {
    return (
      <div className="error-box">
        <h3>Analysis Failed</h3>
        <ul>
          {validation.errors.map((err, i) => (
            <li key={i}>{err}</li>
          ))}
        </ul>
      </div>
    );
  }

  // Check completeness
  if (!isCompleteAnalysis(response)) {
    return (
      <div className="warning-box">
        <p>⚠️ Partial analysis available</p>
        {validation.warnings.map((warn, i) => (
          <p key={i}>{warn}</p>
        ))}
        <PartialResultsDisplay data={response.data} />
      </div>
    );
  }

  // Fully valid and complete
  return <CompleteResultsDisplay data={response.data} />;
}
```

### Example 2: During API Call

```typescript
async function handleAudioAnalysis(audioBlob) {
  try {
    const response = await api.analyzeAudio(audioBlob);

    // Validate immediately after receiving
    const validation = validateAnalysisResult(response);

    if (!validation.valid) {
      showError('Server returned invalid data');
      log.error('API validation failed:', validation);
      return;
    }

    // Safe to use response now
    setAnalysisResult(response);
    setValidation(validation);
  } catch (error) {
    handleError(error);
  }
}
```

### Example 3: Testing

```typescript
import { ValidationTests } from '@/utils/analysisValidator.test';

// In a test file or browser console:
ValidationTests.runAllValidationTests();
// Output: ✅ Test 1: Valid Complete Analysis - PASSED
//         ❌ Test 2: Invalid Confidence - FAILED
//         etc.
```

### Example 4: Progressive Enhancement

```typescript
function SmartAnalysisDisplay({ response }) {
  const validation = validateAnalysisResult(response);

  // Adapt UI based on validation results
  return (
    <div>
      {/* Show validation issues as banner */}
      {validation.errors.length > 0 && (
        <ValidationErrorBanner errors={validation.errors} />
      )}

      {/* Show warnings */}
      {validation.warnings.length > 0 && (
        <ValidationWarningBanner warnings={validation.warnings} />
      )}

      {/* Show results based on completeness */}
      {validation.checks.hasFace && <FaceAnalysisCard data={response.data.face} />}
      {validation.checks.hasVoice && <VoiceAnalysisCard data={response.data.voice} />}
      {validation.checks.hasCredibility && (
        <CredibilityCard data={response.data.credibility} />
      )}

      {/* Validation report (debug) */}
      {process.env.NODE_ENV === 'development' && (
        <ValidationDebugPanel validation={validation} />
      )}
    </div>
  );
}
```

---

## Detecting the 6 Silent Inconsistencies

The validator catches all 6 issues we just fixed:

### Issue 1: Confidence Scale Mismatch
```typescript
// BEFORE: confidence = 0.92 but displayed as 92% without explicit conversion
// VALIDATOR: ✅ Checks confidenceInRange (0-1) and confidenceConsistent (matches * 100)
const validation = validateAnalysisResult({
  data: { confidence: 0.92 }
});
console.log(validation.checks.confidenceInRange);    // ✅ true
console.log(validation.checks.confidenceConsistent); // ✅ true
```

### Issue 2: Duplicate Credibility/Confidence Fields
```typescript
// BEFORE: credibility_score in both data AND metrics with different scales
// VALIDATOR: ✅ Detects duplicate fields
const validation = validateAnalysisResult({
  data: {
    credibilityScore: 85,
    confidence: 0.92,
    metrics: {
      credibility_score: 85,        // ❌ Duplicate detected
      confidence_level: 92           // ❌ Duplicate detected
    }
  }
});
console.log(validation.errors);
// [
//   "❌ Duplicate field: credibility_score in metrics",
//   "❌ Duplicate field: confidence_level in metrics"
// ]
```

### Issue 3: Animation Race Condition
```typescript
// BEFORE: Multiple rapid analyses could show stale data
// VALIDATOR: ✅ Checks field consistency across comparisons
const before = { data: { confidence: 0.92 } };
const after = { data: { confidence: 0.85 } };
const comparison = compareAnalysisResults(before, after);
console.log(comparison.differences);
// ["Confidence changed: 0.92 → 0.85"]
```

### Issue 4: Out-of-Range Values
```typescript
// BEFORE: No validation of numeric ranges
// VALIDATOR: ✅ Validates all numeric fields
const validation = validateAnalysisResult({
  data: {
    confidence: 1.5,              // ❌ Out of range (should be 0-1)
    credibility: { credibility_score: 150 }  // ❌ Out of range (should be 0-100)
  }
});
console.log(validation.errors);
// [
//   "❌ Confidence out of range: 1.5 (expected 0-1)",
//   "❌ Credibility score out of range: 150 (expected 0-100)"
// ]
```

### Issue 5: Missing Data Sections
```typescript
// BEFORE: Component crash if face/voice/credibility missing
// VALIDATOR: ✅ Tracks presence of each section
const validation = validateAnalysisResult({
  data: {
    face: null,
    voice: { /* ... */ },
    credibility: { /* ... */ }
  }
});
console.log(validation.checks);
// {
//   hasFace: false,              // ❌ Missing
//   hasVoice: true,              // ✅ Present
//   hasCredibility: true         // ✅ Present
// }
```

### Issue 6: Type Mismatches
```typescript
// BEFORE: Silently wrong types (string instead of number)
// VALIDATOR: ✅ Validates and reports type issues
const validation = validateAnalysisResult({
  data: {
    confidence: "0.92"      // ❌ String instead of number
  }
});
console.log(validation.warnings);
// ["⚠️  Confidence not a number"]
```

---

## Console Output Format

The validator provides structured console output:

```
🔍 AI VALIDATION REPORT
  📊 Raw Data
    Complete structure: {...}
    Has face: true
    Has voice: true
    Has credibility: true
    Confidence: 0.92
  ✅ Validation Results
    Overall valid: true
    Checks passed: 8/8
  📋 Detailed Checks
    ✅ hasSuccess: true
    ✅ hasFace: true
    ✅ hasVoice: true
    ✅ hasCredibility: true
    ✅ confidenceInRange: true
    ✅ credibilityInRange: true
    ✅ stressInRange: true
    ✅ confidenceConsistent: true
```

---

## Integration with React Component

### Step 1: Import Hook/Utility

```typescript
import { validateAnalysisResult, isCompleteAnalysis } from '@/utils/analysisValidator';
```

### Step 2: Validate on Receive

```typescript
function AnalysisComponent({ apiResponse }) {
  const [validation, setValidation] = useState(null);

  useEffect(() => {
    if (apiResponse) {
      const result = validateAnalysisResult(apiResponse);
      setValidation(result);
    }
  }, [apiResponse]);

  if (!validation) return <Loading />;
  if (!validation.valid) return <ErrorState errors={validation.errors} />;

  return <DisplayResults data={apiResponse} />;
}
```

### Step 3: Conditional Rendering

```typescript
return (
  <div>
    {/* Only show sections that have valid data */}
    {validation?.checks.hasFace && <FaceResults />}
    {validation?.checks.hasVoice && <VoiceResults />}
    {validation?.checks.hasCredibility && <CredibilityResults />}

    {/* Show warnings for missing sections */}
    {validation?.warnings.length > 0 && (
      <WarningBanner warnings={validation.warnings} />
    )}
  </div>
);
```

---

## Best Practices

### ✅ DO

- Validate immediately after receiving API response
- Use `isCompleteAnalysis()` before showing comprehensive UI
- Log validation results in development mode
- Compare results before and after transformations
- Show validation errors to users

### ❌ DON'T

- Assume API response structure is correct
- Skip validation on transformed data
- Display unvalidated values in critical sections
- Ignore warnings about missing sections
- Silently handle validation failures

---

## Troubleshooting

### Validation Fails But Data Looks Correct

**Check:**
1. Is the confidence in 0-1 range or 0-100 range?
2. Are numeric fields actually numbers or strings?
3. Are optional sections explicitly checked?

**Debug:**
```typescript
const validation = validateAnalysisResult(data);
console.log('Errors:', validation.errors);
console.log('Checks:', validation.checks);
```

### Partial Analysis Warnings

**This is expected** when analysis doesn't have all sections (e.g., no face detected).

**Handle:**
```typescript
if (!isCompleteAnalysis(response)) {
  // Show "Partial results" message
  // Only display sections that have data
}
```

### Duplicate Field Errors

**Indicates:** Both top-level and metrics have same field.

**Fix:** Remove from metrics, keep only at top-level.

```typescript
// WRONG
data: {
  credibilityScore: 85,
  metrics: { credibility_score: 85 }  // ❌ Remove this
}

// RIGHT
data: {
  credibilityScore: 85,
  metrics: { voice_stress: 35 }       // ✅ Only unique fields
}
```

---

## Related Files

- **Validator:** `/apps/frontend/src/utils/analysisValidator.ts`
- **Tests:** `/apps/frontend/src/utils/analysisValidator.test.ts`
- **Data Transform:** `/apps/frontend/src/utils/transformAnalysisData.ts`
- **Component:** `/apps/frontend/src/components/LiveAnalysisDisplay.tsx`

---

## Summary

The validator **automatically detects:**
- ❌ Missing critical fields
- ❌ Out-of-range values
- ❌ Type mismatches
- ❌ Duplicate fields
- ❌ Inconsistent scales
- ❌ Data corruption

**Use it to:** Catch bugs, improve reliability, and ensure UI reflects backend accurately.
