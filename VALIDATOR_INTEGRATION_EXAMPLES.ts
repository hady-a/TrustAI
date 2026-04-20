/**
 * Integration Example: Using Validator in LiveAnalysisDisplay
 *
 * This file shows how to add validation to detect issues early
 */

import { validateAnalysisResult, isCompleteAnalysis } from '../utils/analysisValidator';

/**
 * EXAMPLE 1: Add validation to existing component
 *
 * Before: Component assumes data is always valid
 * After: Component validates and handles both valid and invalid cases
 */

// ============ BEFORE ============
// async function onAnalysisComplete(response) {
//   setResult(response);  // ❌ No validation
//   // Might render invalid data without knowing
// }

// ============ AFTER ============
async function onAnalysisCompleteWithValidation(response: any) {
  // Validate immediately
  const validation = validateAnalysisResult(response);

  // Log validation for debugging
  console.log('📋 Analysis Validation:', validation);

  // Handle invalid cases
  if (!validation.valid) {
    console.error('❌ Analysis validation failed:', validation.errors);

    // Show error to user
    setResult({
      status: 'error',
      error: validation.errors[0],
      data: null,
    });

    // Optional: Send to error tracking service
    // trackError('analysis_validation_failed', validation.errors);

    return;
  }

  // Handle partial data
  if (!isCompleteAnalysis(response)) {
    console.warn('⚠️ Partial analysis:', validation.warnings);

    // Can still show results, but flag as partial
    setResult({
      status: 'complete',
      data: response.data,
      partial: true,
      missingAnalysis: validation.warnings,
    });

    return;
  }

  // Fully valid and complete
  setResult({
    status: 'complete',
    data: response.data,
    partial: false,
  });
}

/**
 * EXAMPLE 2: Add validation hook
 */
function useAnalysisValidation() {
  const [validation, setValidation] = React.useState<any>(null);
  const [isValid, setIsValid] = React.useState(false);
  const [isComplete, setIsComplete] = React.useState(false);

  const validate = React.useCallback((data: any) => {
    const result = validateAnalysisResult(data);
    setValidation(result);
    setIsValid(result.valid);
    setIsComplete(isCompleteAnalysis(data));
    return result;
  }, []);

  return { validate, validation, isValid, isComplete };
}

/**
 * EXAMPLE 3: Enhanced LiveAnalysisDisplay component
 *
 * Simplified version showing validation integration
 */
interface EnhancedLiveAnalysisDisplayProps {
  result: any;
  isAnalyzing: boolean;
}

function EnhancedLiveAnalysisDisplay({
  result,
  isAnalyzing,
}: EnhancedLiveAnalysisDisplayProps) {
  const [validation, setValidation] = React.useState<any>(null);

  // Validate result on change
  React.useEffect(() => {
    if (result?.data) {
      const validationResult = validateAnalysisResult(result);
      setValidation(validationResult);
    }
  }, [result]);

  // No result
  if (!result) {
    return <div>Start analysis to see results...</div>;
  }

  // Validation failed
  if (validation && !validation.valid) {
    return (
      <div className="validation-error">
        <h3>❌ Data Validation Failed</h3>
        <ul>
          {validation.errors.map((error: string, i: number) => (
            <li key={i}>{error}</li>
          ))}
        </ul>
        <details>
          <summary>Debug Info</summary>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </details>
      </div>
    );
  }

  // Processing
  if (result.status === 'processing' || isAnalyzing) {
    return <div>Processing...</div>;
  }

  // Error
  if (result.status === 'error') {
    return <div className="error">Error: {result.error}</div>;
  }

  // Valid but partial
  if (validation && !isCompleteAnalysis(result)) {
    return (
      <div className="partial-results">
        <p className="warning">⚠️ Partial Analysis</p>
        {validation.warnings.map((w: string, i: number) => (
          <p key={i} className="text-sm text-gray-600">
            {w}
          </p>
        ))}

        {/* Show available sections */}
        {validation.checks.hasFace && <FaceAnalysisSection data={result.data} />}
        {validation.checks.hasVoice && <VoiceAnalysisSection data={result.data} />}
        {validation.checks.hasCredibility && (
          <CredibilityAnalysisSection data={result.data} />
        )}
      </div>
    );
  }

  // Valid and complete
  return (
    <div className="complete-results">
      {/* Validation badge (optional) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="validation-badge">
          ✅ Validation passed ({Object.values(validation?.checks || {}).filter(Boolean).length}/
          {Object.keys(validation?.checks || {}).length} checks)
        </div>
      )}

      {/* Display all sections */}
      <FaceAnalysisSection data={result.data} />
      <VoiceAnalysisSection data={result.data} />
      <CredibilityAnalysisSection data={result.data} />
    </div>
  );
}

/**
 * EXAMPLE 4: Error boundary with validation
 */
class AnalysisErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: any; validation: any }
> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null, validation: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Analysis render error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h3>Analysis Display Error</h3>
          <p>{this.state.error?.message}</p>
          <button onClick={() => this.setState({ hasError: false, error: null })}>
            Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * EXAMPLE 5: Data comparison for drift detection
 */
function detectAnalysisDataDrift(
  previousAnalysis: any,
  currentAnalysis: any
): {
  hasChanges: boolean;
  details: string[];
} {
  const { compareAnalysisResults } = require('../utils/analysisValidator');

  const comparison = compareAnalysisResults(previousAnalysis, currentAnalysis);

  if (!comparison.same) {
    console.warn('⚠️ Analysis data changed:', comparison.differences);
  }

  return {
    hasChanges: !comparison.same,
    details: comparison.differences,
  };
}

/**
 * EXAMPLE 6: Validation in service layer
 */
class AnalysisService {
  async analyzeAudio(audioBlob: Blob) {
    try {
      // Call API
      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: audioBlob,
      });

      const data = await response.json();

      // Validate response before returning to components
      const validation = validateAnalysisResult(data);

      if (!validation.valid) {
        console.error('API returned invalid data:', validation);
        throw new Error(`API validation failed: ${validation.errors[0]}`);
      }

      // Return with validation metadata
      return {
        ...data,
        _validation: validation,
        _isComplete: isCompleteAnalysis(data),
      };
    } catch (error) {
      console.error('Analysis service error:', error);
      throw error;
    }
  }
}

/**
 * EXAMPLE 7: Testing component behavior with validator
 */
function testComponentWithValidator() {
  // Test Case 1: Valid data
  const validData = {
    success: true,
    data: {
      face: { emotion: 'neutral' },
      voice: { transcription: 'test' },
      credibility: { credibility_score: 85, confidence: 0.92 },
      confidence: 0.92,
    },
  };

  let validation = validateAnalysisResult(validData);
  console.assert(
    validation.valid === true,
    'Valid data should pass validation'
  );
  console.assert(
    isCompleteAnalysis(validData) === true,
    'Complete data should be detected'
  );

  // Test Case 2: Invalid confidence
  const invalidData = {
    ...validData,
    data: { ...validData.data, confidence: 1.5 }, // Out of range
  };

  validation = validateAnalysisResult(invalidData);
  console.assert(
    validation.valid === false,
    'Invalid confidence should fail validation'
  );
  console.assert(
    validation.errors.some((e) => e.includes('Confidence')),
    'Should report confidence error'
  );

  // Test Case 3: Partial data
  const partialData = {
    ...validData,
    data: { ...validData.data, face: null }, // Missing face
  };

  validation = validateAnalysisResult(partialData);
  console.assert(
    isCompleteAnalysis(partialData) === false,
    'Partial data should not be complete'
  );
  console.assert(
    validation.checks.hasVoice === true,
    'Should still detect voice data'
  );

  console.log('✅ All tests passed');
}

/**
 * EXAMPLE 8: Custom validation for specific needs
 */
function validateForUI(data: any): {
  canDisplay: boolean;
  displayMessage: string;
  sections: {
    face: boolean;
    voice: boolean;
    credibility: boolean;
  };
} {
  const validation = validateAnalysisResult(data);

  return {
    canDisplay: validation.valid && validation.warnings.length === 0,
    displayMessage: validation.valid
      ? isCompleteAnalysis(data)
        ? '✅ Complete analysis'
        : '⚠️ Partial analysis'
      : `❌ ${validation.errors[0]}`,
    sections: {
      face: validation.checks.hasFace,
      voice: validation.checks.hasVoice,
      credibility: validation.checks.hasCredibility,
    },
  };
}

export {
  onAnalysisCompleteWithValidation,
  useAnalysisValidation,
  EnhancedLiveAnalysisDisplay,
  AnalysisErrorBoundary,
  detectAnalysisDataDrift,
  AnalysisService,
  testComponentWithValidator,
  validateForUI,
};
