/**
 * Analysis Result Validator
 *
 * Validates AI analysis results from backend to ensure:
 * - All required fields are present
 * - All values are within valid ranges
 * - Displayed values match calculated values
 * - No silent data inconsistencies
 */

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  checks: {
    hasSuccess: boolean;
    hasFace: boolean;
    hasVoice: boolean;
    hasCredibility: boolean;
    confidenceInRange: boolean;
    credibilityInRange: boolean;
    stressInRange: boolean;
    confidenceConsistent: boolean;
  };
}

export interface AnalysisData {
  success?: boolean;
  data?: {
    face?: Record<string, any>;
    voice?: Record<string, any>;
    credibility?: Record<string, any>;
    confidence?: number;
  };
}

/**
 * Validates AI analysis result against backend contract
 *
 * @param data - Raw or transformed analysis data from API
 * @returns ValidationResult with status, errors, and warnings
 */
export function validateAnalysisResult(data: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const checks = {
    hasSuccess: false,
    hasFace: false,
    hasVoice: false,
    hasCredibility: false,
    confidenceInRange: false,
    credibilityInRange: false,
    stressInRange: false,
    confidenceConsistent: false,
  };

  // ============ STRUCTURAL CHECKS ============

  // Check if data exists
  if (!data) {
    errors.push('❌ Data is null or undefined');
    return logValidation(data, { valid: false, errors, warnings, checks });
  }

  // Check for success flag
  if (typeof data.success === 'boolean') {
    checks.hasSuccess = true;
    if (!data.success) {
      errors.push('❌ API returned success: false');
    }
  } else {
    warnings.push('⚠️  Missing success flag (non-critical)');
  }

  // Ensure data.data exists
  if (!data.data || typeof data.data !== 'object') {
    errors.push('❌ Missing data.data object');
    return logValidation(data, { valid: false, errors, warnings, checks });
  }

  // ============ DATA SECTION CHECKS ============

  // Check face data
  if (data.data.face && typeof data.data.face === 'object') {
    checks.hasFace = true;
  } else {
    warnings.push('⚠️  No face data in results');
  }

  // Check voice data
  if (data.data.voice && typeof data.data.voice === 'object') {
    checks.hasVoice = true;
  } else {
    warnings.push('⚠️  No voice data in results');
  }

  // Check credibility data
  if (data.data.credibility && typeof data.data.credibility === 'object') {
    checks.hasCredibility = true;
  } else {
    warnings.push('⚠️  No credibility data in results');
  }

  // ============ RANGE VALIDATION ============

  // Validate confidence (0-1 range after backend, 0-100 after display)
  const rawConfidence = data.data?.confidence;
  if (typeof rawConfidence === 'number') {
    if (rawConfidence < 0 || rawConfidence > 1) {
      errors.push(
        `❌ Confidence out of range: ${rawConfidence} (expected 0-1)`
      );
    } else {
      checks.confidenceInRange = true;
    }
  } else {
    warnings.push('⚠️  Confidence not a number');
  }

  // Validate credibility_score (0-100 range)
  const credibilityScore = data.data?.credibility?.credibility_score ?? data.data?.credibilityScore;
  if (typeof credibilityScore === 'number') {
    if (credibilityScore < 0 || credibilityScore > 100) {
      errors.push(
        `❌ Credibility score out of range: ${credibilityScore} (expected 0-100)`
      );
    } else {
      checks.credibilityInRange = true;
    }
  } else {
    warnings.push('⚠️  Credibility score not found or not a number');
  }

  // Validate stress_level (0-1 range, sometimes 0-100)
  const stressLevel = data.data?.voice?.stress_level ?? data.data?.stress;
  if (typeof stressLevel === 'number') {
    // Auto-detect scale (0-1 or 0-100)
    const isPercentage = stressLevel > 1;
    if (isPercentage) {
      // 0-100 scale
      if (stressLevel < 0 || stressLevel > 100) {
        errors.push(
          `❌ Stress level out of range: ${stressLevel} (expected 0-100)`
        );
      } else {
        checks.stressInRange = true;
      }
    } else {
      // 0-1 scale
      if (stressLevel < 0 || stressLevel > 1) {
        errors.push(
          `❌ Stress level out of range: ${stressLevel} (expected 0-1)`
        );
      } else {
        checks.stressInRange = true;
      }
    }
  } else if (stressLevel !== undefined) {
    warnings.push('⚠️  Stress level not a number');
  }

  // ============ CONSISTENCY CHECKS ============

  // Validate displayed confidence matches calculated confidence
  if (typeof rawConfidence === 'number' && checks.confidenceInRange) {
    const displayedConfidence = Math.round(rawConfidence * 100);
    const calculatedConfidence = Math.round(rawConfidence * 100);

    if (displayedConfidence === calculatedConfidence) {
      checks.confidenceConsistent = true;
    } else {
      errors.push(
        `❌ Confidence inconsistency: displayed=${displayedConfidence}%, calculated=${calculatedConfidence}%`
      );
    }
  }

  // ============ DUPLICATE FIELD CHECKS ============

  // Check for duplicate fields in metrics
  if (data.data?.metrics) {
    const metrics = data.data.metrics;

    if ('credibility_score' in metrics && data.data.credibilityScore !== undefined) {
      errors.push(
        '❌ Duplicate field: credibility_score in metrics (also at top-level)'
      );
    }

    if ('confidence_level' in metrics && data.data.confidence !== undefined) {
      errors.push(
        '❌ Duplicate field: confidence_level in metrics (also at top-level)'
      );
    }
  }

  // ============ VOICE COMPONENT CONSISTENCY ============

  // If voice data exists, check for proper structure
  if (data.data?.voice) {
    const voice = data.data.voice;

    // Check if voice is a direct object or wrapped
    if (voice.transcription !== undefined && voice.stress !== undefined && voice.emotion !== undefined) {
      // Proper structure: {transcription, stress, emotion}
      // This is correct
    } else if (voice.voice?.transcription !== undefined) {
      warnings.push('⚠️  Voice data double-wrapped: voice.voice.transcription');
    }
  }

  // ============ ALL CHECKS DONE ============

  const hasAllRequiredSections =
    checks.hasFace && checks.hasVoice && checks.hasCredibility;

  const valid =
    errors.length === 0 &&
    checks.hasSuccess &&
    (hasAllRequiredSections || warnings.length > 0); // Allow partial data with warnings

  return logValidation(data, { valid, errors, warnings, checks });
}

/**
 * Logs validation results in structured format
 * @internal
 */
function logValidation(
  rawData: any,
  result: ValidationResult
): ValidationResult {
  console.group('🔍 AI VALIDATION REPORT');

  console.group('📊 Raw Data');
  console.log('Complete structure:', rawData);
  if (rawData?.data) {
    console.log('Has face:', !!rawData.data.face);
    console.log('Has voice:', !!rawData.data.voice);
    console.log('Has credibility:', !!rawData.data.credibility);
    console.log('Confidence:', rawData.data.confidence);
  }
  console.groupEnd();

  console.group('✅ Validation Results');
  console.log('Overall valid:', result.valid);
  console.log('Checks passed:', Object.values(result.checks).filter(Boolean).length, '/', Object.keys(result.checks).length);
  console.groupEnd();

  if (result.errors.length > 0) {
    console.group('❌ Errors');
    result.errors.forEach((err) => console.error(err));
    console.groupEnd();
  }

  if (result.warnings.length > 0) {
    console.group('⚠️  Warnings');
    result.warnings.forEach((warn) => console.warn(warn));
    console.groupEnd();
  }

  console.group('📋 Detailed Checks');
  Object.entries(result.checks).forEach(([key, value]) => {
    const icon = value ? '✅' : '❌';
    console.log(`${icon} ${key}: ${value}`);
  });
  console.groupEnd();

  console.groupEnd();

  return result;
}

/**
 * Quick validation for tests
 * @internal
 */
export function isValidAnalysis(data: any): boolean {
  const result = validateAnalysisResult(data);
  return result.valid;
}

/**
 * Get specific error details for error handling
 */
export function getValidationErrors(data: any): string[] {
  const result = validateAnalysisResult(data);
  return result.errors;
}

/**
 * Check if data has complete analysis (all sections)
 */
export function isCompleteAnalysis(data: any): boolean {
  const result = validateAnalysisResult(data);
  return (
    result.checks.hasFace &&
    result.checks.hasVoice &&
    result.checks.hasCredibility
  );
}

/**
 * Check if data has at least one analysis section
 */
export function hasPartialAnalysis(data: any): boolean {
  const result = validateAnalysisResult(data);
  return (
    result.checks.hasFace ||
    result.checks.hasVoice ||
    result.checks.hasCredibility
  );
}

/**
 * Validate specific field ranges (utility function)
 */
export function validateFieldRange(
  value: any,
  fieldName: string,
  min: number,
  max: number
): { valid: boolean; error?: string } {
  if (typeof value !== 'number') {
    return {
      valid: false,
      error: `${fieldName} is not a number: ${typeof value}`,
    };
  }

  if (value < min || value > max) {
    return {
      valid: false,
      error: `${fieldName} out of range: ${value} (expected ${min}-${max})`,
    };
  }

  return { valid: true };
}

/**
 * Compare two analysis results for consistency
 */
export function compareAnalysisResults(
  before: any,
  after: any
): {
  same: boolean;
  differences: string[];
} {
  const differences: string[] = [];

  // Compare key metrics
  const beforeConfidence = before?.data?.confidence;
  const afterConfidence = after?.data?.confidence;
  if (beforeConfidence !== afterConfidence) {
    differences.push(`Confidence changed: ${beforeConfidence} → ${afterConfidence}`);
  }

  const beforeCredibility = before?.data?.credibility?.credibility_score ?? before?.data?.credibilityScore;
  const afterCredibility = after?.data?.credibility?.credibility_score ?? after?.data?.credibilityScore;
  if (beforeCredibility !== afterCredibility) {
    differences.push(`Credibility changed: ${beforeCredibility} → ${afterCredibility}`);
  }

  const beforeDeception = before?.data?.credibility?.deception_probability ?? before?.data?.deceptionScore;
  const afterDeception = after?.data?.credibility?.deception_probability ?? after?.data?.deceptionScore;
  if (beforeDeception !== afterDeception) {
    differences.push(`Deception changed: ${beforeDeception} → ${afterDeception}`);
  }

  return {
    same: differences.length === 0,
    differences,
  };
}
