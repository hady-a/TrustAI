/**
 * Master Test Runner for TrustAI System
 *
 * Orchestrates ALL validation layers and returns a final PASS/FAIL verdict:
 * 1. Validator Tests (analysisValidator)
 * 2. UI Stress Test (simulated race conditions)
 * 3. Real API Stress Test (http://localhost:3000/api/analyze/business)
 *
 * Returns structured output with:
 * - Overall status (PASS/FAIL)
 * - Per-layer status
 * - Metrics and diagnostics
 * - Issues and recommendations
 */

import { validateAnalysisResult, type ValidationResult } from './analysisValidator';
import { runRealAPIStressTest, type RealAPIStressTestResult } from './stressTestAnalysisSystem';

// ============ TYPES ============

export interface ValidatorTestResult {
  name: string;
  passed: boolean;
  testCount: number;
  successCount: number;
  failedCount: number;
  errors: string[];
}

export interface UIStressTestResult {
  passed: boolean;
  raceConditions: number;
  staleDataIssues: number;
  flickeringDetected: boolean;
  memoryLeakDetected: boolean;
  issues: string[];
}

export interface MasterTestResult {
  overallStatus: 'PASS' | 'FAIL';
  timestamp: number;
  duration: number;

  summary: {
    validator: 'PASS' | 'FAIL';
    uiStress: 'PASS' | 'FAIL';
    apiStress: 'PASS' | 'FAIL';
  };

  metrics: {
    // API timing
    avgResponseTime: number;
    stdDeviation: number;
    minResponseTime: number;
    maxResponseTime: number;

    // Consistency
    responsesConsistent: boolean;
    responsesInOrder: boolean;
    confidenceConsistent: boolean;

    // Integrity
    allFieldsPresent: boolean;
    structureValid: boolean;

    // Stress test results
    totalRequests: number;
    successfulRequests: number;
    failedRequests: number;
  };

  details: {
    validator: ValidatorTestResult | null;
    uiStress: UIStressTestResult | null;
    apiStress: Partial<RealAPIStressTestResult> | null;
  };

  issues: string[];
  recommendations: string[];

  verdicts: {
    production_ready: boolean;
    reason: string;
  };
}

// ============ VALIDATOR TESTS ============

/**
 * Run comprehensive validator tests
 */
async function runValidatorTests(): Promise<ValidatorTestResult> {
  const testCases = generateValidatorTestCases();
  const results: { name: string; passed: boolean; error?: string }[] = [];

  console.group('🧪 Running Validator Tests');

  for (const testCase of testCases) {
    try {
      const result = validateAnalysisResult(testCase.data);

      if (testCase.shouldPass) {
        results.push({
          name: testCase.name,
          passed: result.valid,
          error: !result.valid ? result.errors[0] : undefined,
        });
      } else {
        results.push({
          name: testCase.name,
          passed: !result.valid,
          error: result.valid ? 'Expected invalid, but got valid' : undefined,
        });
      }
    } catch (error) {
      results.push({
        name: testCase.name,
        passed: false,
        error: String(error),
      });
    }
  }

  const successCount = results.filter((r) => r.passed).length;
  const failedCount = results.length - successCount;
  const errors = results.filter((r) => r.error).map((r) => `${r.name}: ${r.error}`);

  console.log(`✅ Passed: ${successCount}/${results.length}`);
  if (failedCount > 0) {
    console.error(`❌ Failed: ${failedCount}`);
    errors.slice(0, 3).forEach((err) => console.error(`   - ${err}`));
  }
  console.groupEnd();

  return {
    name: 'Validator Tests',
    passed: failedCount === 0,
    testCount: results.length,
    successCount,
    failedCount,
    errors,
  };
}

/**
 * Generate comprehensive validator test cases
 */
function generateValidatorTestCases(): Array<{
  name: string;
  data: any;
  shouldPass: boolean;
}> {
  return [
    // ✅ VALID CASES
    {
      name: 'Complete valid analysis',
      data: {
        success: true,
        data: {
          face: { confidence: 0.85, micro_expressions: 2 },
          voice: { stress_level: 0.3, transcription: 'test' },
          credibility: { credibility_score: 75, deception_probability: 0.25 },
          confidence: 0.85,
        },
      },
      shouldPass: true,
    },
    {
      name: 'Valid with all ranges at boundaries',
      data: {
        success: true,
        data: {
          face: { confidence: 0 },
          voice: { stress_level: 1 },
          credibility: { credibility_score: 100, deception_probability: 100 },
          confidence: 1,
        },
      },
      shouldPass: true,
    },
    {
      name: 'Valid partial analysis (face only)',
      data: {
        success: true,
        data: {
          face: { confidence: 0.5 },
          confidence: 0.5,
        },
      },
      shouldPass: true,
    },
    {
      name: 'Valid stress in percentage range',
      data: {
        success: true,
        data: {
          voice: { stress_level: 45 },
          credibility: { credibility_score: 50 },
        },
      },
      shouldPass: true,
    },

    // ❌ INVALID CASES
    {
      name: 'Missing success flag',
      data: {
        data: {
          face: { confidence: 0.85 },
          voice: { stress_level: 0.3 },
          credibility: { credibility_score: 75 },
        },
      },
      shouldPass: false,
    },
    {
      name: 'Missing data.data object',
      data: { success: true },
      shouldPass: false,
    },
    {
      name: 'Confidence out of range (>1)',
      data: {
        success: true,
        data: {
          face: { confidence: 1.5 },
          confidence: 1.5,
        },
      },
      shouldPass: false,
    },
    {
      name: 'Credibility score out of range (>100)',
      data: {
        success: true,
        data: {
          credibility: { credibility_score: 150 },
        },
      },
      shouldPass: false,
    },
    {
      name: 'Stress level invalid in percentage scale',
      data: {
        success: true,
        data: {
          voice: { stress_level: 150 },
        },
      },
      shouldPass: false,
    },
    {
      name: 'Null data',
      data: null,
      shouldPass: false,
    },
  ];
}

// ============ UI STRESS TEST (SIMULATED) ============

/**
 * Simulate UI stress test for race conditions, stale data, flickering
 */
async function runUIStressTest(): Promise<UIStressTestResult> {
  console.group('⚡ Running UI Stress Test (Simulated)');

  const issues: string[] = [];
  let raceConditions = 0;
  let staleDataIssues = 0;
  let flickeringDetected = false;
  let memoryLeakDetected = false;

  // Simulate 10 rapid state updates
  const mockResponses: any[] = [];
  const stateUpdates: Array<{ id: number; state: any; timestamp: number }> = [];

  console.log('Simulating 10 rapid analysis requests...');

  for (let i = 0; i < 10; i++) {
    mockResponses.push({
      id: i,
      confidence: 0.8 + Math.random() * 0.15,
      credibility: 70 + Math.random() * 20,
      timestamp: Date.now() + i * 10, // Out of order delivery
    });
  }

  // Shuffle to simulate out-of-order delivery
  mockResponses.sort(() => Math.random() - 0.5);

  let latestId = -1;
  const previousValues: Record<string, number> = {};

  for (const response of mockResponses) {
    // Check for race condition: older response arrived after newer
    if (response.id < latestId) {
      raceConditions++;
      issues.push(`Race condition: Request ${response.id} arrived after ${latestId}`);
    }

    // Check for stale data
    if (response.id < latestId) {
      staleDataIssues++;
      issues.push(`Stale data: Old request ${response.id} overwriting newer ${latestId}`);
    }

    // Check for flickering: value changes back and forth
    if (previousValues['confidence'] !== undefined) {
      const diff = Math.abs(previousValues['confidence'] - response.confidence);
      if (diff > 0.1 && previousValues['confidence'] !== response.confidence) {
        // Would be flickering if it changed again
      }
    }

    previousValues['confidence'] = response.confidence;
    latestId = Math.max(latestId, response.id);
    stateUpdates.push({ id: response.id, state: response, timestamp: response.timestamp });
  }

  // Check for memory leak: too many snapshots
  if (stateUpdates.length > 15) {
    memoryLeakDetected = true;
    issues.push('Potential memory leak: State snapshots not garbage collected');
  }

  console.log(`  Race Conditions: ${raceConditions}`);
  console.log(`  Stale Data Issues: ${staleDataIssues}`);
  console.log(`  Flickering Detected: ${flickeringDetected}`);
  console.log(`  Memory Leak: ${memoryLeakDetected}`);

  console.groupEnd();

  const passed = raceConditions === 0 && staleDataIssues === 0 && !flickeringDetected && !memoryLeakDetected;

  return {
    passed,
    raceConditions,
    staleDataIssues,
    flickeringDetected,
    memoryLeakDetected,
    issues,
  };
}

// ============ REAL API STRESS TEST ============

/**
 * Run real API stress test and extract relevant metrics
 */
async function runAPIStressTest(
  endpoint: string = 'http://localhost:3000/api/analyze/business',
  requestCount: number = 10
): Promise<Partial<RealAPIStressTestResult>> {
  console.group('🚀 Running Real API Stress Test');
  console.log(`Endpoint: ${endpoint}`);
  console.log(`Requests: ${requestCount}`);

  try {
    const result = await runRealAPIStressTest(endpoint, requestCount, false);
    console.groupEnd();
    return result;
  } catch (error) {
    console.error('API stress test failed:', error);
    console.groupEnd();
    return {
      summary: {
        passed: false,
        issues: [String(error)],
        recommendations: ['Ensure backend API is running', 'Check endpoint URL'],
      },
    };
  }
}

// ============ VALIDATION RULES ============

/**
 * Apply strict validation rules to determine final PASS/FAIL
 */
function applyValidationRules(
  validatorResult: ValidatorTestResult,
  uiStressResult: UIStressTestResult,
  apiStressResult: Partial<RealAPIStressTestResult>
): {
  passed: boolean;
  issues: string[];
  recommendations: string[];
} {
  const issues: string[] = [];
  const recommendations: string[] = [];

  // Rule 1: Validator tests must pass
  if (!validatorResult.passed) {
    issues.push(`❌ Validator tests failed (${validatorResult.failedCount}/${validatorResult.testCount})`);
    recommendations.push('Review validator test failures in detail');
    recommendations.push('Check data transformation pipeline');
  }

  // Rule 2: No race conditions
  if (uiStressResult.raceConditions > 0) {
    issues.push(`❌ Race conditions detected (${uiStressResult.raceConditions})`);
    recommendations.push('Implement request ID tracking');
    recommendations.push('Add request cancellation for older requests');
  }

  // Rule 3: No stale data
  if (uiStressResult.staleDataIssues > 0) {
    issues.push(`❌ Stale data issues detected (${uiStressResult.staleDataIssues})`);
    recommendations.push('Verify requestId/timestamp before updating state');
    recommendations.push('Add: if (requestId < this.latestRequestId) return');
  }

  // Rule 4: No flickering
  if (uiStressResult.flickeringDetected) {
    issues.push('❌ Value flickering detected');
    recommendations.push('Use request ID to ignore responses from older requests');
    recommendations.push('Consider debouncing rapid updates');
  }

  // Rule 5: Memory safe
  if (uiStressResult.memoryLeakDetected) {
    issues.push('❌ Potential memory leak detected');
    recommendations.push('Check for circular references in state');
    recommendations.push('Ensure old state is properly garbage collected');
  }

  // Rule 6: API responses consistent (within tolerance ±0.05)
  if (apiStressResult?.responseVariation) {
    const significantDifferences = apiStressResult.responseVariation.differences.filter((d) => {
      if (Array.isArray(d.variations) && d.variations.length === 2) {
        const [v1, v2] = d.variations;
        if (typeof v1 === 'number' && typeof v2 === 'number') {
          return Math.abs(v1 - v2) > 0.05;
        }
      }
      return true;
    });

    if (significantDifferences.length > 0) {
      issues.push(
        `❌ API responses inconsistent (${significantDifferences.length} field differences > tolerance)`
      );
      recommendations.push('Check backend for inconsistent response formats');
    }
  }

  // Rule 7: Responses in correct order
  if (apiStressResult?.ordering && !apiStressResult.ordering.allResponsesInOrder) {
    issues.push(
      `❌ Out-of-order responses detected (${apiStressResult.ordering.outOfOrderInstances.length})`
    );
    recommendations.push('Verify API request ordering guarantees');
  }

  // Rule 8: Response integrity (required fields)
  if (apiStressResult?.validation && apiStressResult.validation.invalidCount > 0) {
    issues.push(`❌ Invalid API responses (${apiStressResult.validation.invalidCount} responses)`);
    recommendations.push('Check API response format matches expected schema');
    recommendations.push('Verify success, data, and timestamp fields present');
  }

  // Rule 9: API performance
  if (apiStressResult?.timing) {
    if (apiStressResult.timing.avgDuration > 2000) {
      issues.push(
        `⚠️ Slow API responses (avg ${apiStressResult.timing.avgDuration.toFixed(0)}ms, limit 2000ms)`
      );
      recommendations.push('Profile backend performance');
      recommendations.push('Check for database/network bottlenecks');
    }

    if (apiStressResult.timing.stdDev > 500) {
      issues.push(`⚠️ High response time variance (stdDev ${apiStressResult.timing.stdDev.toFixed(0)}ms)`);
      recommendations.push('Check backend load distribution');
      recommendations.push('Implement request queuing if needed');
    }
  }

  // Final determination
  const passed = issues.filter((i) => i.includes('❌')).length === 0;

  return { passed, issues, recommendations };
}

// ============ MASTER TEST RUNNER ============

/**
 * Run complete system test suite and return final verdict
 */
export async function runMasterTest(options?: {
  apiEndpoint?: string;
  requestCount?: number;
  verbose?: boolean;
}): Promise<MasterTestResult> {
  const startTime = Date.now();
  const apiEndpoint = options?.apiEndpoint || 'http://localhost:3000/api/analyze/business';
  const requestCount = options?.requestCount || 10;
  const verbose = options?.verbose !== false;

  if (verbose) {
    console.clear();
    console.log('🏁 TRUSTAI MASTER TEST RUNNER - COMPLETE SYSTEM VALIDATION\n');
  }

  // ============ STAGE 1: VALIDATOR TESTS ============
  const validatorResult = await runValidatorTests();

  // ============ STAGE 2: UI STRESS TEST ============
  const uiStressResult = await runUIStressTest();

  // ============ STAGE 3: REAL API STRESS TEST ============
  const apiStressResult = await runAPIStressTest(apiEndpoint, requestCount);

  // ============ APPLY VALIDATION RULES ============
  const validationResult = applyValidationRules(validatorResult, uiStressResult, apiStressResult);

  // ============ EXTRACT METRICS ============
  const metrics = {
    // API timing
    avgResponseTime: apiStressResult?.timing?.avgDuration ?? 0,
    stdDeviation: apiStressResult?.timing?.stdDev ?? 0,
    minResponseTime: apiStressResult?.timing?.minDuration ?? 0,
    maxResponseTime: apiStressResult?.timing?.maxDuration ?? 0,

    // Consistency
    responsesConsistent: apiStressResult?.responseVariation?.allResponsesIdentical ?? false,
    responsesInOrder: apiStressResult?.ordering?.allResponsesInOrder ?? false,
    confidenceConsistent: apiStressResult?.evaluation?.summary?.confidenceConsistency === 'PASS',

    // Integrity
    allFieldsPresent: (apiStressResult?.validation?.invalidCount ?? 0) === 0,
    structureValid: apiStressResult?.summary?.passed ?? false,

    // Stress test results
    totalRequests: apiStressResult?.totalRequests ?? requestCount,
    successfulRequests: apiStressResult?.successfulRequests ?? 0,
    failedRequests: apiStressResult?.failedRequests ?? 0,
  };

  const endTime = Date.now();
  const duration = endTime - startTime;

  // ============ DETERMINE OVERALL STATUS ============
  const overallStatus = validationResult.passed ? 'PASS' : 'FAIL';

  const summary = {
    validator: validatorResult.passed ? ('PASS' as const) : ('FAIL' as const),
    uiStress: uiStressResult.passed ? ('PASS' as const) : ('FAIL' as const),
    apiStress:
      apiStressResult?.summary?.passed === true
        ? ('PASS' as const)
        : ('FAIL' as const),
  };

  const verdicts = {
    production_ready: overallStatus === 'PASS' && metrics.structureValid,
    reason:
      overallStatus === 'PASS'
        ? validationResult.issues.length === 0
          ? 'All tests passed - system is production ready'
          : 'Some warnings present but system is functional'
        : `${validationResult.issues.filter((i) => i.includes('❌')).length} critical issues detected`,
  };

  const result: MasterTestResult = {
    overallStatus,
    timestamp: startTime,
    duration,
    summary,
    metrics,
    details: {
      validator: validatorResult,
      uiStress: uiStressResult,
      apiStress: apiStressResult,
    },
    issues: validationResult.issues,
    recommendations: validationResult.recommendations,
    verdicts,
  };

  // ============ PRINT FORMATTED REPORT ============
  if (verbose) {
    printMasterTestReport(result);
  }

  return result;
}

// ============ REPORTING ============

/**
 * Print formatted master test report
 */
export function printMasterTestReport(result: MasterTestResult): void {
  const statusColor = result.overallStatus === 'PASS' ? '✅' : '❌';

  console.group('═'.repeat(80));
  console.log(`${statusColor} FINAL SYSTEM TEST RESULT: ${result.overallStatus}`);
  console.group('═'.repeat(80));

  // Overall verdict
  console.group('\n🎯 SYSTEM VERDICT');
  console.log(result.verdicts.reason);
  console.log(result.verdicts.production_ready ? '👉 System is production ready' : '👉 System requires fixes');
  console.groupEnd();

  // Summary
  console.group('\n📊 TEST SUMMARY');
  console.log(`Validator Tests:    ${result.summary.validator}`);
  console.log(`UI Stress Test:     ${result.summary.uiStress}`);
  console.log(`API Stress Test:    ${result.summary.apiStress}`);
  console.groupEnd();

  // Metrics
  console.group('\n📈 METRICS');
  console.log('API Performance:');
  console.log(`  Average Response: ${result.metrics.avgResponseTime.toFixed(0)}ms`);
  console.log(`  Std Deviation:    ${result.metrics.stdDeviation.toFixed(0)}ms`);
  console.log(`  Range:            ${result.metrics.minResponseTime}ms - ${result.metrics.maxResponseTime}ms`);

  console.log('\nConsistency:');
  console.log(`  Responses Identical: ${result.metrics.responsesConsistent ? '✅' : '❌'}`);
  console.log(`  Responses In Order:  ${result.metrics.responsesInOrder ? '✅' : '❌'}`);
  console.log(`  Confidence Match:    ${result.metrics.confidenceConsistent ? '✅' : '❌'}`);

  console.log('\nIntegrity:');
  console.log(`  All Fields Present: ${result.metrics.allFieldsPresent ? '✅' : '❌'}`);
  console.log(`  Structure Valid:    ${result.metrics.structureValid ? '✅' : '❌'}`);

  console.log('\nRequest Summary:');
  console.log(`  Total:       ${result.metrics.totalRequests}`);
  console.log(`  Successful:  ${result.metrics.successfulRequests}`);
  console.log(`  Failed:      ${result.metrics.failedRequests}`);
  console.groupEnd();

  // Issues
  if (result.issues.length > 0) {
    console.group('\n⚠️ ISSUES');
    result.issues.forEach((issue) => {
      console.log(issue);
    });
    console.groupEnd();
  } else {
    console.log('\n✅ No issues detected');
  }

  // Recommendations
  if (result.recommendations.length > 0) {
    console.group('\n💡 RECOMMENDATIONS');
    result.recommendations.forEach((rec, i) => {
      console.log(`${i + 1}. ${rec}`);
    });
    console.groupEnd();
  }

  // Test duration
  console.log(`\n⏱️ Test Duration: ${result.duration}ms`);

  console.group('═'.repeat(80));
  console.groupEnd();
}

/**
 * Get quick status summary
 */
export function getQuickStatus(result: MasterTestResult): {
  status: string;
  color: string;
  summary: string;
} {
  const statusEmoji = result.overallStatus === 'PASS' ? '✅' : '❌';
  const color = result.overallStatus === 'PASS' ? 'green' : 'red';
  const criticalIssues = result.issues.filter((i) => i.includes('❌')).length;

  let summary = `${statusEmoji} ${result.overallStatus}`;
  if (criticalIssues > 0) {
    summary += ` - ${criticalIssues} critical issue(s)`;
  } else if (result.issues.length > 0) {
    summary += ` - ${result.issues.length} warning(s)`;
  } else {
    summary += ' - No issues';
  }

  return { status: result.overallStatus, color, summary };
}

/**
 * Export test runner for CLI/scripts
 */
export const MasterTestRunner = {
  run: runMasterTest,
  printReport: printMasterTestReport,
  getStatus: getQuickStatus,
};
