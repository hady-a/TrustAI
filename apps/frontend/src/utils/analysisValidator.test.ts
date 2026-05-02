/**
 * Analysis Validator Test Suite
 *
 * Tests for validateAnalysisResult utility
 * Includes examples of valid, invalid, and edge-case data
 */

import {
  validateAnalysisResult,
  isValidAnalysis,
  isCompleteAnalysis,
  hasPartialAnalysis,
  getValidationErrors,
  compareAnalysisResults,
  ValidationResult,
} from './analysisValidator';

/**
 * Test Case 1: Complete, Valid Analysis Result
 */
export const VALID_COMPLETE_ANALYSIS = {
  success: true,
  data: {
    face: {
      emotion: 'confident',
      microExpressions: ['surprise', 'fear'],
      symmetry: 0.87,
    },
    voice: {
      transcription: 'I am telling the truth',
      stress_level: 0.25,
      emotion: 'calm',
      pace: 'normal',
    },
    credibility: {
      credibility_score: 85,
      deception_probability: 15,
      confidence: 0.92,
    },
    confidence: 0.92,
    metrics: {
      voice_stress: 0.25,
      voice_emotion: 'calm',
      transcription: 'I am telling the truth',
      risk_level: 'low',
    },
  },
};

/**
 * Test Case 2: Partial Analysis (missing face)
 */
export const PARTIAL_ANALYSIS_NO_FACE = {
  success: true,
  data: {
    face: null,
    voice: {
      transcription: 'test audio',
      stress_level: 0.3,
      emotion: 'neutral',
    },
    credibility: {
      credibility_score: 72,
      deception_probability: 28,
      confidence: 0.88,
    },
    confidence: 0.88,
    metrics: {
      voice_stress: 0.3,
      voice_emotion: 'neutral',
      transcription: 'test audio',
      risk_level: 'medium',
    },
  },
};

/**
 * Test Case 3: Invalid Confidence (out of range)
 */
export const INVALID_CONFIDENCE = {
  success: true,
  data: {
    face: { emotion: 'neutral' },
    voice: { transcription: 'test' },
    credibility: {
      credibility_score: 75,
      deception_probability: 25,
      confidence: 1.5, // ❌ INVALID: > 1
    },
    confidence: 1.5,
  },
};

/**
 * Test Case 4: Invalid Credibility Score (out of range)
 */
export const INVALID_CREDIBILITY = {
  success: true,
  data: {
    face: { emotion: 'neutral' },
    voice: { transcription: 'test' },
    credibility: {
      credibility_score: 150, // ❌ INVALID: > 100
      deception_probability: -50, // ❌ INVALID: < 0
      confidence: 0.85,
    },
    confidence: 0.85,
  },
};

/**
 * Test Case 5: Duplicate Fields (silent inconsistency)
 */
export const DUPLICATE_METRICS = {
  success: true,
  data: {
    face: { emotion: 'neutral' },
    voice: { transcription: 'test', stress_level: 0.4 },
    credibility: {
      credibility_score: 80,
      deception_probability: 20,
      confidence: 0.90,
    },
    credibilityScore: 80, // Duplicate!
    confidence: 0.90,
    metrics: {
      credibility_score: 80, // ❌ DUPLICATE (should only be at top level)
      confidence_level: 90, // ❌ DUPLICATE (should only be at top level)
      voice_stress: 0.4,
      voice_emotion: 'neutral',
      transcription: 'test',
      risk_level: 'low',
    },
  },
};

/**
 * Test Case 6: No data object
 */
export const INVALID_NO_DATA = {
  success: true,
  // Missing data field
};

/**
 * Test Case 7: Confidence Inconsistency
 */
export const CONFIDENCE_MISMATCH = {
  success: true,
  data: {
    face: { emotion: 'neutral' },
    voice: { transcription: 'test' },
    credibility: {
      credibility_score: 82,
      deception_probability: 18,
      confidence: 0.92,
    },
    confidence: 0.92,
    displayedConfidence: 85, // ❌ Should be 92 (0.92 * 100)
  },
};

/**
 * Test Case 8: Missing success flag
 */
export const MISSING_SUCCESS_FLAG = {
  // No success field
  data: {
    face: { emotion: 'confident' },
    voice: { transcription: 'test', stress_level: 0.2 },
    credibility: {
      credibility_score: 88,
      deception_probability: 12,
      confidence: 0.94,
    },
    confidence: 0.94,
  },
};

/**
 * Test Case 9: API Error Response
 */
export const API_ERROR = {
  success: false,
  data: null,
  error: 'Analysis failed: No audio detected',
};

/**
 * Test Case 10: Empty analysis
 */
export const EMPTY_ANALYSIS = {
  success: true,
  data: {
    face: null,
    voice: null,
    credibility: null,
    confidence: null,
  },
};

/**
 * Run all test cases and display results
 */
export function runAllValidationTests() {
  console.log('🧪 Running Analysis Validator Test Suite\n');

  const testCases = [
    {
      name: 'Valid Complete Analysis',
      data: VALID_COMPLETE_ANALYSIS,
      expectValid: true,
      expectComplete: true,
    },
    {
      name: 'Partial Analysis (no face)',
      data: PARTIAL_ANALYSIS_NO_FACE,
      expectValid: true,
      expectComplete: false,
    },
    {
      name: 'Invalid Confidence (>1)',
      data: INVALID_CONFIDENCE,
      expectValid: false,
      expectComplete: false,
    },
    {
      name: 'Invalid Credibility Score (>100)',
      data: INVALID_CREDIBILITY,
      expectValid: false,
      expectComplete: false,
    },
    {
      name: 'Duplicate Metrics Fields',
      data: DUPLICATE_METRICS,
      expectValid: false,
      expectComplete: true,
    },
    {
      name: 'Invalid: No data object',
      data: INVALID_NO_DATA,
      expectValid: false,
      expectComplete: false,
    },
    {
      name: 'Confidence Mismatch',
      data: CONFIDENCE_MISMATCH,
      expectValid: false,
      expectComplete: true,
    },
    {
      name: 'Missing success flag',
      data: MISSING_SUCCESS_FLAG,
      expectValid: false,
      expectComplete: true,
    },
    {
      name: 'API Error',
      data: API_ERROR,
      expectValid: false,
      expectComplete: false,
    },
    {
      name: 'Empty Analysis',
      data: EMPTY_ANALYSIS,
      expectValid: false,
      expectComplete: false,
    },
  ];

  let passed = 0;
  let failed = 0;

  testCases.forEach((testCase, idx) => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Test ${idx + 1}: ${testCase.name}`);
    console.log('='.repeat(60));

    const result = validateAnalysisResult(testCase.data);
    const isComplete = isCompleteAnalysis(testCase.data);

    // Check if result matches expectations
    const validityMatch = result.valid === testCase.expectValid;
    const completenessMatch = isComplete === testCase.expectComplete;

    if (validityMatch && completenessMatch) {
      console.log('✅ PASSED');
      passed++;
    } else {
      console.log('❌ FAILED');
      failed++;
      if (!validityMatch) {
        console.log(
          `   Expected valid=${testCase.expectValid}, got=${result.valid}`
        );
      }
      if (!completenessMatch) {
        console.log(
          `   Expected complete=${testCase.expectComplete}, got=${isComplete}`
        );
      }
    }
  });

  console.log(`\n${'='.repeat(60)}`);
  console.log(`📊 Test Results: ${passed} passed, ${failed} failed`);
  console.log('='.repeat(60));

  return { passed, failed, total: testCases.length };
}

/**
 * Demonstrate helper functions
 */
export function demonstrateHelperFunctions() {
  console.log('\n🔧 Demonstrating Helper Functions\n');

  const validData = VALID_COMPLETE_ANALYSIS;
  const invalidData = INVALID_CONFIDENCE;

  console.log('isValidAnalysis(validData):', isValidAnalysis(validData));
  console.log('isValidAnalysis(invalidData):', isValidAnalysis(invalidData));

  console.log('\nisCompleteAnalysis(validData):', isCompleteAnalysis(validData));
  console.log('isCompleteAnalysis(PARTIAL):', isCompleteAnalysis(PARTIAL_ANALYSIS_NO_FACE));

  console.log('\nhasPartialAnalysis(PARTIAL):', hasPartialAnalysis(PARTIAL_ANALYSIS_NO_FACE));
  console.log('hasPartialAnalysis(EMPTY):', hasPartialAnalysis(EMPTY_ANALYSIS));

  console.log('\ngetValidationErrors(invalidData):', getValidationErrors(invalidData));

  // Compare results
  console.log('\n📊 Comparing two analysis results:');
  const before = VALID_COMPLETE_ANALYSIS;
  const after = JSON.parse(JSON.stringify(VALID_COMPLETE_ANALYSIS));
  after.data.confidence = 0.85; // Simulate change

  const comparison = compareAnalysisResults(before, after);
  console.log('Same:', comparison.same);
  console.log('Differences:', comparison.differences);
}

/**
 * Integration test: Simulate API response pipeline
 */
export function testAPIResponsePipeline() {
  console.log('\n🔄 Testing API Response Pipeline\n');

  // Stage 1: Raw API response
  const rawResponse = VALID_COMPLETE_ANALYSIS;
  console.log('Stage 1 - Raw API Response:');
  let result = validateAnalysisResult(rawResponse);
  console.log('Valid:', result.valid);

  // Stage 2: After frontend transformation
  const transformed = {
    ...rawResponse,
    deceptionScore: rawResponse.data.credibility.deception_probability,
    credibilityScore: rawResponse.data.credibility.credibility_score,
  };
  console.log('\nStage 2 - After Transformation:');
  result = validateAnalysisResult(transformed);
  console.log('Valid:', result.valid);

  // Stage 3: Component receives it
  console.log('\nStage 3 - Component Display:');
  console.log('Display confidence %:', Math.round(transformed.data.confidence * 100));
  console.log('Animated confidence %:', Math.round(transformed.data.confidence * 100));
  console.log('Match:', true);
}

/**
 * Example: How to use in a React component
 */
export function exampleComponentUsage() {
  return `
// In a React component:
import { validateAnalysisResult, isCompleteAnalysis } from './utils/analysisValidator';

function AnalysisResultsComponent({ apiResponse }) {
  const validation = validateAnalysisResult(apiResponse);

  if (!validation.valid) {
    return (
      <div className="error">
        <p>Analysis validation failed:</p>
        <ul>
          {validation.errors.map((err, i) => <li key={i}>{err}</li>)}
        </ul>
      </div>
    );
  }

  if (!isCompleteAnalysis(apiResponse)) {
    return <div className="warning">Partial analysis available</div>;
  }

  return <div className="success">Full analysis complete</div>;
}
`;
}

// Export test functions for external use
export const ValidationTests = {
  runAllValidationTests,
  demonstrateHelperFunctions,
  testAPIResponsePipeline,
  exampleComponentUsage,
};
