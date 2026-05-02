/**
 * Real API Response Validator
 *
 * Tests the complete pipeline:
 * Backend API → Express Service → Frontend Transformation → Component Display
 *
 * Run this to verify real backend responses pass validation
 */

import { validateAnalysisResult, isCompleteAnalysis, compareAnalysisResults } from './analysisValidator';
import { transformAnalysisData } from './transformAnalysisData';

interface APITestConfig {
  apiUrl?: string;
  filePath?: string;
  verbose?: boolean;
  compareWithPrevious?: boolean;
}

interface APITestResult {
  success: boolean;
  stages: {
    apiCall: {
      status: 'success' | 'error';
      statusCode?: number;
      rawResponse: any;
      error?: string;
    };
    apiValidation: {
      valid: boolean;
      errors: string[];
      warnings: string[];
    };
    transformation: {
      success: boolean;
      transformedData: any;
      error?: string;
    };
    displayValidation: {
      valid: boolean;
      errors: string[];
      warnings: string[];
    };
    completeness: {
      isComplete: boolean;
      hasFace: boolean;
      hasVoice: boolean;
      hasCredibility: boolean;
    };
  };
  comparison?: {
    fields: string[];
    mismatches: string[];
  };
  summary: string[];
}

/**
 * Call real backend API and validate response
 */
export async function testRealAPIResponse(config: APITestConfig = {}): Promise<APITestResult> {
  const {
    apiUrl = 'http://localhost:8000/analyze/business',
    verbose = true,
    compareWithPrevious = false,
  } = config;

  const result: APITestResult = {
    success: false,
    stages: {
      apiCall: { status: 'error', rawResponse: null },
      apiValidation: { valid: false, errors: [], warnings: [] },
      transformation: { success: false, transformedData: null },
      displayValidation: { valid: false, errors: [], warnings: [] },
      completeness: { isComplete: false, hasFace: false, hasVoice: false, hasCredibility: false },
    },
    summary: [],
  };

  if (verbose) {
    console.group('🔬 REAL API RESPONSE TEST');
    console.log('Testing endpoint:', apiUrl);
  }

  try {
    // ============ STAGE 1: CALL BACKEND API ============
    if (verbose) {
      console.group('Stage 1: Call Backend API');
      console.log('POST', apiUrl);
    }

    // For browser: use Fetch API
    // For Node: would need node-fetch or similar
    let apiResponse: any;

    try {
      // Try Fetch API (browser/Node 18+)
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          test: true,
          audio: 'sample_audio_data',
        }),
      });

      result.stages.apiCall.statusCode = response.status;

      if (!response.ok) {
        result.stages.apiCall.status = 'error';
        result.stages.apiCall.error = `HTTP ${response.status}: ${response.statusText}`;
        console.error('❌ API call failed:', result.stages.apiCall.error);
        console.groupEnd();
        throw new Error(result.stages.apiCall.error);
      }

      apiResponse = await response.json();
      result.stages.apiCall.status = 'success';
      result.stages.apiCall.rawResponse = apiResponse;

      if (verbose) {
        console.log('✅ API call successful (HTTP 200)');
        console.log('Response structure:', Object.keys(apiResponse));
      }
    } catch (error) {
      if (verbose) {
        console.error('❌ API call failed:', error);
      }
      result.stages.apiCall.error = String(error);
      if (verbose) {
        console.groupEnd();
      }
    }

    if (verbose) {
      console.groupEnd();
    }

    if (result.stages.apiCall.status === 'error') {
      result.summary.push('❌ API call failed - cannot proceed with validation');
      if (verbose) {
        console.log('Summary:', result.summary);
        console.groupEnd();
      }
      return result;
    }

    // ============ STAGE 2: VALIDATE RAW API RESPONSE ============
    if (verbose) {
      console.group('Stage 2: Validate Raw API Response');
    }

    const apiValidation = validateAnalysisResult(apiResponse);
    result.stages.apiValidation = {
      valid: apiValidation.valid,
      errors: apiValidation.errors,
      warnings: apiValidation.warnings,
    };

    if (verbose) {
      if (apiValidation.valid) {
        console.log('✅ API response passed validation');
        console.log('Checks passed:', Object.values(apiValidation.checks).filter(Boolean).length, '/', Object.keys(apiValidation.checks).length);
      } else {
        console.error('❌ API response failed validation');
        console.error('Errors:', apiValidation.errors);
      }
      if (apiValidation.warnings.length > 0) {
        console.warn('Warnings:', apiValidation.warnings);
      }
    }

    if (verbose) {
      console.groupEnd();
    }

    if (!apiValidation.valid) {
      result.summary.push(`❌ API validation failed: ${apiValidation.errors[0]}`);
      if (verbose) {
        console.log('Summary:', result.summary);
        console.groupEnd();
      }
      return result;
    }

    // ============ STAGE 3: TRANSFORM FOR DISPLAY ============
    if (verbose) {
      console.group('Stage 3: Transform for Display');
    }

    let transformedData: any;

    try {
      transformedData = transformAnalysisData(apiResponse);
      result.stages.transformation.success = true;
      result.stages.transformation.transformedData = transformedData;

      if (verbose) {
        console.log('✅ Transformation successful');
        console.log('Transformed fields:', Object.keys(transformedData));
      }
    } catch (error) {
      result.stages.transformation.success = false;
      result.stages.transformation.error = String(error);

      if (verbose) {
        console.error('❌ Transformation failed:', error);
      }
    }

    if (verbose) {
      console.groupEnd();
    }

    if (!result.stages.transformation.success) {
      result.summary.push(`❌ Transformation failed: ${result.stages.transformation.error}`);
      if (verbose) {
        console.log('Summary:', result.summary);
        console.groupEnd();
      }
      return result;
    }

    // ============ STAGE 4: VALIDATE TRANSFORMED DATA ============
    if (verbose) {
      console.group('Stage 4: Validate Transformed Data');
    }

    const displayValidation = validateAnalysisResult({
      success: true,
      data: transformedData,
    });

    result.stages.displayValidation = {
      valid: displayValidation.valid,
      errors: displayValidation.errors,
      warnings: displayValidation.warnings,
    };

    if (verbose) {
      if (displayValidation.valid) {
        console.log('✅ Transformed data passed validation');
      } else {
        console.error('❌ Transformed data failed validation');
        console.error('Errors:', displayValidation.errors);
      }
    }

    if (verbose) {
      console.groupEnd();
    }

    // ============ STAGE 5: CHECK COMPLETENESS ============
    if (verbose) {
      console.group('Stage 5: Check Data Completeness');
    }

    const isComplete = isCompleteAnalysis({ success: true, data: transformedData });
    result.stages.completeness = {
      isComplete,
      hasFace: displayValidation.checks.hasFace,
      hasVoice: displayValidation.checks.hasVoice,
      hasCredibility: displayValidation.checks.hasCredibility,
    };

    if (verbose) {
      console.log('Complete analysis:', isComplete);
      console.log('Face data:', result.stages.completeness.hasFace);
      console.log('Voice data:', result.stages.completeness.hasVoice);
      console.log('Credibility data:', result.stages.completeness.hasCredibility);
      console.groupEnd();
    }

    // ============ STAGE 6: DATA FLOW COMPARISON ============
    if (verbose) {
      console.group('Stage 6: Data Flow Comparison');
    }

    const comparison = compareDataFlow(apiResponse, transformedData);
    if (comparison) {
      result.comparison = comparison;

      if (verbose) {
        console.log('Fields tracked through pipeline:', comparison.fields);
        if (comparison.mismatches.length > 0) {
          console.warn('Potential mismatches:', comparison.mismatches);
        } else {
          console.log('✅ All fields consistent through pipeline');
        }
      }
    }

    if (verbose) {
      console.groupEnd();
    }

    // ============ FINAL RESULT ============
    result.success =
      result.stages.apiCall.status === 'success' &&
      result.stages.apiValidation.valid &&
      result.stages.transformation.success &&
      result.stages.displayValidation.valid;

    result.summary = [
      result.success ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED',
      `API Validation: ${result.stages.apiValidation.valid ? '✅ Pass' : '❌ Fail'}`,
      `Transformation: ${result.stages.transformation.success ? '✅ Success' : '❌ Failed'}`,
      `Display Validation: ${result.stages.displayValidation.valid ? '✅ Pass' : '❌ Fail'}`,
      `Completeness: ${result.stages.completeness.isComplete ? '✅ Complete' : '⚠️ Partial'}`,
    ];

    if (verbose) {
      console.group('📊 FINAL RESULTS');
      result.summary.forEach((line) => console.log(line));
      console.groupEnd();

      console.groupEnd(); // End main group
    }

    return result;
  } catch (error) {
    if (verbose) {
      console.error('❌ Test failed with exception:', error);
      console.groupEnd();
    }
    return result;
  }
}

/**
 * Compare data flow from API → Transform → Display
 */
function compareDataFlow(apiResponse: any, transformedData: any): { fields: string[]; mismatches: string[] } | null {
  const fields: string[] = [];
  const mismatches: string[] = [];

  // Track confidence through pipeline
  const apiConfidence = apiResponse?.data?.credibility?.confidence;
  const transformedConfidence = transformedData?.confidence;

  if (typeof apiConfidence === 'number' && typeof transformedConfidence === 'number') {
    fields.push('confidence');
    if (Math.abs(apiConfidence - transformedConfidence) > 0.01) {
      mismatches.push(`confidence: API=${apiConfidence}, Transformed=${transformedConfidence}`);
    }
  }

  // Track credibility score
  const apiCredibility = apiResponse?.data?.credibility?.credibility_score;
  const transformedCredibility = transformedData?.credibilityScore;

  if (typeof apiCredibility === 'number' && typeof transformedCredibility === 'number') {
    fields.push('credibilityScore');
    if (Math.abs(apiCredibility - transformedCredibility) > 0.1) {
      mismatches.push(`credibilityScore: API=${apiCredibility}, Transformed=${transformedCredibility}`);
    }
  }

  // Track deception
  const apiDeception = apiResponse?.data?.credibility?.deception_probability;
  const transformedDeception = transformedData?.deceptionScore;

  if (typeof apiDeception === 'number' && typeof transformedDeception === 'number') {
    fields.push('deceptionScore');
    if (Math.abs(apiDeception - transformedDeception) > 0.1) {
      mismatches.push(`deceptionScore: API=${apiDeception}, Transformed=${transformedDeception}`);
    }
  }

  // Track voice data
  if (apiResponse?.data?.voice && transformedData) {
    fields.push('voiceData');
    if (!transformedData.transcript && apiResponse.data.voice.transcription) {
      mismatches.push('transcript: Present in API but missing in transformed');
    }
  }

  return { fields, mismatches };
}

/**
 * Utility: Format test results for display
 */
export function formatTestResults(result: APITestResult): string {
  const lines: string[] = [];

  lines.push('═'.repeat(70));
  lines.push('API RESPONSE TEST RESULTS');
  lines.push('═'.repeat(70));

  // API Call
  lines.push('\n📡 API CALL:');
  lines.push(`  Status: ${result.stages.apiCall.status === 'success' ? '✅ Success' : '❌ Failed'}`);
  if (result.stages.apiCall.statusCode) {
    lines.push(`  HTTP Code: ${result.stages.apiCall.statusCode}`);
  }

  // API Validation
  lines.push('\n✅ API VALIDATION:');
  lines.push(`  Valid: ${result.stages.apiValidation.valid ? 'YES' : 'NO'}`);
  if (result.stages.apiValidation.errors.length > 0) {
    lines.push('  Errors:');
    result.stages.apiValidation.errors.forEach((e) => lines.push(`    - ${e}`));
  }
  if (result.stages.apiValidation.warnings.length > 0) {
    lines.push('  Warnings:');
    result.stages.apiValidation.warnings.forEach((w) => lines.push(`    - ${w}`));
  }

  // Transformation
  lines.push('\n🔄 TRANSFORMATION:');
  lines.push(`  Success: ${result.stages.transformation.success ? 'YES' : 'NO'}`);
  if (result.stages.transformation.error) {
    lines.push(`  Error: ${result.stages.transformation.error}`);
  }

  // Display Validation
  lines.push('\n🖥️ DISPLAY VALIDATION:');
  lines.push(`  Valid: ${result.stages.displayValidation.valid ? 'YES' : 'NO'}`);
  if (result.stages.displayValidation.errors.length > 0) {
    lines.push('  Errors:');
    result.stages.displayValidation.errors.forEach((e) => lines.push(`    - ${e}`));
  }

  // Completeness
  lines.push('\n📊 DATA COMPLETENESS:');
  lines.push(`  Complete: ${result.stages.completeness.isComplete ? 'YES' : 'NO'}`);
  lines.push(`  Face: ${result.stages.completeness.hasFace ? '✅' : '❌'}`);
  lines.push(`  Voice: ${result.stages.completeness.hasVoice ? '✅' : '❌'}`);
  lines.push(`  Credibility: ${result.stages.completeness.hasCredibility ? '✅' : '❌'}`);

  // Comparison
  if (result.comparison) {
    lines.push('\n🔀 DATA FLOW CONSISTENCY:');
    lines.push(`  Fields tracked: ${result.comparison.fields.join(', ')}`);
    if (result.comparison.mismatches.length === 0) {
      lines.push('  Status: ✅ All consistent');
    } else {
      lines.push('  Mismatches:');
      result.comparison.mismatches.forEach((m) => lines.push(`    - ${m}`));
    }
  }

  // Summary
  lines.push('\n' + '═'.repeat(70));
  lines.push('SUMMARY:');
  result.summary.forEach((s) => lines.push(`  ${s}`));
  lines.push('═'.repeat(70));

  return lines.join('\n');
}

/**
 * Run test and display formatted results
 */
export async function runAndDisplayTest(config?: APITestConfig) {
  const result = await testRealAPIResponse(config);
  console.log(formatTestResults(result));
  return result;
}

/**
 * Example: How to use in a React component
 */
export function exampleUsageInComponent() {
  return `
// In useEffect or onClick handler:
import { testRealAPIResponse } from '@/utils/realAPIValidator';

async function testBackend() {
  console.log('Testing backend API responses...');
  const result = await testRealAPIResponse({ verbose: true });

  if (result.success) {
    console.log('✅ Backend returns valid data');
    setBackendStatus('healthy');
  } else {
    console.error('❌ Backend data validation failed');
    setBackendStatus('unhealthy');
  }
}
`;
}

export const RealAPITests = {
  testRealAPIResponse,
  formatTestResults,
  runAndDisplayTest,
  exampleUsageInComponent,
};
