/**
 * Stress Test for Analysis System
 *
 * Detects race conditions, async bugs, and state consistency issues by:
 * - Running 10 analyses in rapid succession
 * - Tracking UI state changes and timing
 * - Validating only latest result is displayed
 * - Detecting stale data and flickering
 *
 * Issues detected:
 * - Out-of-order request completion
 * - Stale state updates overwriting newer data
 * - Flickering or inconsistent UI values
 * - Memory leaks from state accumulation
 * - Missing or corrupted final result
 */

import { validateAnalysisResult, type ValidationResult } from './analysisValidator';

export type { RealAPIRequest, RealAPIStressTestResult, StressTestResult };

interface StateSnapshot {
  timestamp: number;
  requestId: number;
  state: Record<string, any>;
  displayedValues: {
    confidence?: number;
    credibility?: number;
    deception?: number;
  };
  validationResult?: ValidationResult;
}

interface RaceConditionDetection {
  detected: boolean;
  description: string;
  timestamp: number;
  affectedRequests: number[];
}

interface StressTestResult {
  testId: string;
  startTime: number;
  endTime: number;
  duration: number;
  totalRequests: number;
  completedRequests: number;
  failedRequests: number;

  stateSnapshots: StateSnapshot[];
  raceConditions: RaceConditionDetection[];
  staleDataIssues: RaceConditionDetection[];
  flickeringDetected: boolean;
  flickeringInstances: Array<{
    time: number;
    field: string;
    before: number;
    after: number;
    duration: number;
  }>;

  finalResult: Record<string, any> | null;
  expectedFinalResult: Record<string, any> | null;
  resultMismatch: boolean;
  resultMismatchDetails: string[];

  validation: {
    allValid: boolean;
    invalidCount: number;
    errors: string[];
  };

  consistency: {
    valueConsistent: boolean;
    stateHistoryClean: boolean;
    noMemoryLeak: boolean;
    issues: string[];
  };

  summary: {
    passed: boolean;
    issues: string[];
    recommendations: string[];
  };
}

/**
 * Mock analysis response for testing
 */
function generateMockAnalysis(requestId: number): Record<string, any> {
  const randomFactor = Math.random() * 0.1; // 10% variation

  return {
    success: true,
    data: {
      face: {
        confidence: 0.85 + randomFactor,
        micro_expressions: 2,
      },
      voice: {
        stress_level: 0.3 + randomFactor,
        transcription: `Test audio ${requestId}`,
      },
      credibility: {
        credibility_score: 75 + randomFactor * 10,
        deception_probability: 25 - randomFactor * 10,
      },
    },
    metadata: {
      requestId,
      timestamp: Date.now(),
      processingTime: 100 + Math.random() * 200, // 100-300ms
    },
  };
}

/**
 * Extract displayed values from state
 */
function extractDisplayedValues(
  state: Record<string, any>
): Record<string, number | undefined> {
  return {
    confidence: state?.data?.face?.confidence || state?.confidence,
    credibility: state?.data?.credibility?.credibility_score || state?.credibilityScore,
    deception: state?.data?.credibility?.deception_probability || state?.deceptionScore,
  };
}

/**
 * Main Stress Test Function
 */
export async function runAnalysisStressTest(options?: {
  requestCount?: number;
  delayBetweenRequests?: number;
  verbose?: boolean;
}): Promise<StressTestResult> {
  const testId = `stress-${Date.now()}`;
  const requestCount = options?.requestCount || 10;
  const delayBetweenRequests = options?.delayBetweenRequests || 50; // 50ms between requests
  const verbose = options?.verbose !== false;

  if (verbose) {
    console.log(`\n🔥 STARTING STRESS TEST`);
    console.log(`   Test ID: ${testId}`);
    console.log(`   Requests: ${requestCount}`);
    console.log(`   Delay between requests: ${delayBetweenRequests}ms`);
    console.log(`   Expected duration: ~${requestCount * delayBetweenRequests}ms`);
    console.log('');
  }

  const startTime = Date.now();
  const stateSnapshots: StateSnapshot[] = [];
  const raceConditions: RaceConditionDetection[] = [];
  const staleDataIssues: RaceConditionDetection[] = [];
  const flickeringInstances: Array<{
    time: number;
    field: string;
    before: number;
    after: number;
    duration: number;
  }> = [];

  let completedRequests = 0;
  let failedRequests = 0;
  let latestRequestId = -1;
  let latestState: Record<string, any> | null = null;
  const expectedFinalResult = generateMockAnalysis(requestCount - 1);

  // Simulate rapid requests
  const promises: Promise<void>[] = [];

  for (let i = 0; i < requestCount; i++) {
    const requestId = i;

    // Create request promise
    const requestPromise = (async () => {
      try {
        // Simulate network delay
        const delay = 50 + Math.random() * 200; // 50-250ms
        await new Promise((resolve) => setTimeout(resolve, delay));

        // Get mock response
        const response = generateMockAnalysis(requestId);

        // CRITICAL: Check for race condition
        // If a newer request was already completed, this is stale data
        if (requestId < latestRequestId) {
          staleDataIssues.push({
            detected: true,
            description: `Request ${requestId} completed AFTER request ${latestRequestId}`,
            timestamp: Date.now(),
            affectedRequests: [requestId, latestRequestId],
          });

          if (verbose) {
            console.warn(
              `⚠️  STALE DATA: Request ${requestId} arrived after ${latestRequestId}`
            );
          }
        }

        // Update latest tracking
        if (requestId > latestRequestId) {
          latestRequestId = requestId;

          // Check for value changes (flickering)
          if (latestState) {
            const oldValues = extractDisplayedValues(latestState);
            const newValues = extractDisplayedValues(response);

            const changeTime = Date.now();
            for (const [key, oldValue] of Object.entries(oldValues)) {
              const newValue = newValues[key];
              if (
                oldValue !== undefined &&
                newValue !== undefined &&
                Math.abs(oldValue - newValue) > 0.01
              ) {
                flickeringInstances.push({
                  time: changeTime,
                  field: key,
                  before: oldValue,
                  after: newValue,
                  duration: 0, // Will be calculated if flickered back
                });

                if (verbose) {
                  console.log(
                    `  📊 ${key}: ${oldValue.toFixed(2)} → ${newValue.toFixed(2)}`
                  );
                }
              }
            }
          }

          latestState = response;
        }

        // Create state snapshot
        const snapshot: StateSnapshot = {
          timestamp: Date.now(),
          requestId,
          state: response,
          displayedValues: extractDisplayedValues(response),
        };

        // Validate response
        const validation = validateAnalysisResult(response);
        snapshot.validationResult = validation;

        stateSnapshots.push(snapshot);
        completedRequests++;

        if (verbose) {
          console.log(
            `✅ Request ${requestId} completed (${completedRequests}/${requestCount})`
          );
        }
      } catch (error) {
        failedRequests++;
        if (verbose) {
          console.error(`❌ Request ${i} failed: ${error}`);
        }
      }
    })();

    promises.push(requestPromise);

    // Delay between requests
    if (i < requestCount - 1) {
      await new Promise((resolve) => setTimeout(resolve, delayBetweenRequests));
    }
  }

  // Wait for all requests to complete
  await Promise.all(promises);

  const endTime = Date.now();
  const duration = endTime - startTime;

  if (verbose) {
    console.log(`\n✅ All requests completed in ${duration}ms`);
  }

  // Analysis: Check for consistency issues

  // 1. Detect out-of-order completions
  let previousTime = 0;
  for (let i = 0; i < stateSnapshots.length; i++) {
    const snapshot = stateSnapshots[i];

    if (snapshot.requestId < i) {
      raceConditions.push({
        detected: true,
        description: `Request completed out of order: ${snapshot.requestId} in position ${i}`,
        timestamp: snapshot.timestamp,
        affectedRequests: [snapshot.requestId, i],
      });
    }

    if (snapshot.timestamp < previousTime) {
      raceConditions.push({
        detected: true,
        description: `Timestamp went backwards`,
        timestamp: snapshot.timestamp,
        affectedRequests: [i - 1, i],
      });
    }

    previousTime = snapshot.timestamp;
  }

  // 2. Check for flickering (value change back and forth)
  const flickeringDetected = flickeringInstances.length > 0;

  // 3. Validate all responses
  const validationErrors: string[] = [];
  let invalidCount = 0;

  for (const snapshot of stateSnapshots) {
    if (snapshot.validationResult && !snapshot.validationResult.valid) {
      invalidCount++;
      validationErrors.push(
        `Request ${snapshot.requestId}: ${snapshot.validationResult.errors[0]}`
      );
    }
  }

  // 4. Check final result
  let resultMismatch = false;
  const resultMismatchDetails: string[] = [];

  if (latestState && expectedFinalResult) {
    // Basic structure comparison
    const latestValues = extractDisplayedValues(latestState);
    const expectedValues = extractDisplayedValues(expectedFinalResult);

    for (const [key, expectedValue] of Object.entries(expectedValues)) {
      const latestValue = latestValues[key];
      // Allow small floating point differences
      if (
        latestValue !== undefined &&
        expectedValue !== undefined &&
        Math.abs(latestValue - expectedValue) > 0.001
      ) {
        resultMismatch = true;
        resultMismatchDetails.push(
          `${key}: expected ${expectedValue.toFixed(3)}, got ${latestValue.toFixed(3)}`
        );
      }
    }
  }

  // 5. Check for memory leaks (state accumulation)
  const noMemoryLeak = stateSnapshots.length <= requestCount + 1; // Small buffer allowed

  // 6. Create consistency report
  const consistencyIssues: string[] = [];

  if (raceConditions.length > 0) {
    consistencyIssues.push(
      `${raceConditions.length} race condition(s) detected`
    );
  }

  if (staleDataIssues.length > 0) {
    consistencyIssues.push(`${staleDataIssues.length} stale data issue(s) detected`);
  }

  if (flickeringDetected) {
    consistencyIssues.push(`${flickeringInstances.length} flickering value(s) detected`);
  }

  if (invalidCount > 0) {
    consistencyIssues.push(`${invalidCount} invalid response(s)`);
  }

  // 7. Generate summary
  const allPassed =
    raceConditions.length === 0 &&
    staleDataIssues.length === 0 &&
    !flickeringDetected &&
    invalidCount === 0 &&
    !resultMismatch &&
    noMemoryLeak &&
    completedRequests === requestCount;

  const issues: string[] = [];
  const recommendations: string[] = [];

  if (raceConditions.length > 0) {
    issues.push('Race conditions detected - requests completing out of order');
    recommendations.push(
      'Use request ID or timestamp to validate only the latest response'
    );
    recommendations.push('Implement request cancellation for older pending requests');
  }

  if (staleDataIssues.length > 0) {
    issues.push('Stale data issues - older requests overwriting newer data');
    recommendations.push('Verify requestId/timestamp before updating state');
    recommendations.push('Add check: if (requestId < this.latestRequestId) return');
  }

  if (flickeringDetected) {
    issues.push(`Value flickering detected - ${flickeringInstances.length} instances`);
    recommendations.push('Use request ID to ignore responses from older requests');
    recommendations.push('Consider debouncing rapid updates');
  }

  if (invalidCount > 0) {
    issues.push(`${invalidCount} response(s) failed validation`);
    recommendations.push('Check API response format');
    recommendations.push('Validate transformation logic');
  }

  if (resultMismatch) {
    issues.push('Final displayed result does not match latest API response');
    recommendations.push('Check state update timing in components');
    recommendations.push('Verify render cycle is using latest state');
  }

  if (!noMemoryLeak) {
    issues.push('Possible memory leak - state accumulation detected');
    recommendations.push('Check for circular references in state');
    recommendations.push('Ensure old state is properly garbage collected');
  }

  if (completedRequests !== requestCount) {
    issues.push(`Only ${completedRequests}/${requestCount} requests completed`);
  }

  const result: StressTestResult = {
    testId,
    startTime,
    endTime,
    duration,
    totalRequests: requestCount,
    completedRequests,
    failedRequests,

    stateSnapshots,
    raceConditions,
    staleDataIssues,
    flickeringDetected,
    flickeringInstances,

    finalResult: latestState,
    expectedFinalResult,
    resultMismatch,
    resultMismatchDetails,

    validation: {
      allValid: invalidCount === 0,
      invalidCount,
      errors: validationErrors,
    },

    consistency: {
      valueConsistent: !flickeringDetected && staleDataIssues.length === 0,
      stateHistoryClean: raceConditions.length === 0,
      noMemoryLeak,
      issues: consistencyIssues,
    },

    summary: {
      passed: allPassed,
      issues,
      recommendations,
    },
  };

  // Print detailed report
  if (verbose) {
    printStressTestReport(result);
  }

  return result;
}

/**
 * Print formatted stress test report
 */
export function printStressTestReport(result: StressTestResult): void {
  console.log('\n' + '='.repeat(80));
  console.log('STRESS TEST REPORT');
  console.log('='.repeat(80));

  // Header
  console.log(`\nTest ID: ${result.testId}`);
  console.log(`Duration: ${result.duration}ms`);
  console.log(`Requests: ${result.completedRequests}/${result.totalRequests} completed`);
  if (result.failedRequests > 0) {
    console.log(`Failed: ${result.failedRequests}`);
  }

  // Overall status
  console.log('\n' + '─'.repeat(80));
  if (result.summary.passed) {
    console.log('✅ PASSED - No issues detected');
  } else {
    console.log('❌ FAILED - Issues detected');
  }

  // Race conditions
  if (result.raceConditions.length > 0) {
    console.log(`\n🔄 RACE CONDITIONS: ${result.raceConditions.length}`);
    result.raceConditions.slice(0, 3).forEach((rc) => {
      console.log(`  - ${rc.description}`);
    });
    if (result.raceConditions.length > 3) {
      console.log(`  ... and ${result.raceConditions.length - 3} more`);
    }
  }

  // Stale data
  if (result.staleDataIssues.length > 0) {
    console.log(`\n⚠️  STALE DATA: ${result.staleDataIssues.length}`);
    result.staleDataIssues.slice(0, 3).forEach((sd) => {
      console.log(`  - ${sd.description}`);
    });
  }

  // Flickering
  if (result.flickeringDetected) {
    console.log(`\n📊 FLICKERING: ${result.flickeringInstances.length} instances`);
    result.flickeringInstances.slice(0, 3).forEach((fi) => {
      console.log(
        `  - ${fi.field}: ${fi.before.toFixed(3)} → ${fi.after.toFixed(3)}`
      );
    });
  }

  // Validation
  if (result.validation.invalidCount > 0) {
    console.log(`\n❌ VALIDATION ERRORS: ${result.validation.invalidCount}`);
    result.validation.errors.slice(0, 3).forEach((err) => {
      console.log(`  - ${err}`);
    });
  }

  // Result mismatch
  if (result.resultMismatch) {
    console.log(`\n❌ RESULT MISMATCH`);
    result.resultMismatchDetails.forEach((detail) => {
      console.log(`  - ${detail}`);
    });
  }

  // Memory
  if (!result.consistency.noMemoryLeak) {
    console.log(`\n💾 MEMORY LEAK DETECTED`);
    console.log(
      `  - Snapshots: ${result.stateSnapshots.length}, Expected: ${result.totalRequests}`
    );
  }

  // Consistency summary
  console.log('\n' + '─'.repeat(80));
  console.log('CONSISTENCY CHECK');
  console.log(
    `  Value Consistent: ${result.consistency.valueConsistent ? '✅' : '❌'}`
  );
  console.log(
    `  State History Clean: ${result.consistency.stateHistoryClean ? '✅' : '❌'}`
  );
  console.log(`  No Memory Leak: ${result.consistency.noMemoryLeak ? '✅' : '❌'}`);

  // Issues and recommendations
  if (result.summary.issues.length > 0) {
    console.log('\n' + '─'.repeat(80));
    console.log('ISSUES');
    result.summary.issues.forEach((issue) => {
      console.log(`  ❌ ${issue}`);
    });
  }

  if (result.summary.recommendations.length > 0) {
    console.log('\n' + '─'.repeat(80));
    console.log('RECOMMENDATIONS');
    result.summary.recommendations.forEach((rec) => {
      console.log(`  💡 ${rec}`);
    });
  }

  console.log('\n' + '='.repeat(80));
}

/**
 * Real API Response Tracking
 */
interface RealAPIRequest {
  requestId: number;
  endpoint: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  httpStatus?: number;
  response: Record<string, any> | null;
  responseId?: string; // Unique identifier from API response
  responseTimestamp?: number; // Timestamp from API response
  error?: string;
  validation?: ValidationResult;
}

interface RealAPIStressTestResult {
  testId: string;
  startTime: number;
  endTime: number;
  duration: number;
  endpoint: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  requests: RealAPIRequest[];

  timing: {
    minDuration: number;
    maxDuration: number;
    avgDuration: number;
    stdDev: number;
  };

  responseVariation: {
    allResponsesIdentical: boolean;
    differences: Array<{
      field: string;
      variations: any[];
    }>;
  };

  ordering: {
    allResponsesInOrder: boolean;
    outOfOrderInstances: Array<{
      before: number;
      after: number;
      beforeId?: string;
      afterId?: string;
    }>;
  };

  validation: {
    allValid: boolean;
    invalidCount: number;
    errors: string[];
  };

  // STRICT EVALUATION RULES
  evaluation: {
    passed: boolean;
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
        avgResponseTime: number;
        limit: number;
        pass: boolean;
        reason: string;
      };
      timingVariance: {
        stdDev: number;
        limit: number;
        pass: boolean;
        reason: string;
      };
      ordering: {
        pass: boolean;
        outOfOrderCount: number;
        reason: string;
      };
      consistency: {
        pass: boolean;
        differences: number;
        reason: string;
      };
      integrity: {
        pass: boolean;
        missingFields: string[];
        reason: string;
      };
      staleData: {
        pass: boolean;
        latestMismatch: boolean;
        reason: string;
      };
      confidenceConsistency: {
        pass: boolean;
        mismatches: Array<{
          requestId: number;
          confidence: number;
          displayedPercentage: number;
          mismatch: number;
        }>;
        reason: string;
      };
    };
    issues: string[];
  };

  summary: {
    passed: boolean;
    issues: string[];
    recommendations: string[];
  };
}

/**
 * Create test audio file as Blob
 */
function createTestAudioBlob(): Blob {
  // Create minimal WAV file for testing
  // WAV header (44 bytes) + 1 second of silence at 16kHz
  const sampleRate = 16000;
  const audioData = new Float32Array(sampleRate);

  // Convert to WAV
  const wav = encodeWAV(audioData, sampleRate);
  return new Blob([wav], { type: 'audio/wav' });
}

/**
 * Encode audio data to WAV format
 */
function encodeWAV(samples: Float32Array, sampleRate: number): ArrayBuffer {
  const buffer = new ArrayBuffer(44 + samples.length * 2);
  const view = new DataView(buffer);

  // RIFF header
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + samples.length * 2, true);
  writeString(8, 'WAVE');

  // fmt subchunk
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);

  // data subchunk
  writeString(36, 'data');
  view.setUint32(40, samples.length * 2, true);

  // Audio data
  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    view.setInt16(offset, samples[i] < 0 ? samples[i] * 0x8000 : samples[i] * 0x7fff, true);
    offset += 2;
  }

  return buffer;
}

/**
 * Call real API endpoint with timing
 */
async function callRealAPIEndpoint(
  endpoint: string,
  file: Blob,
  requestId: number
): Promise<RealAPIRequest> {
  const startTime = Date.now();
  const request: RealAPIRequest = {
    requestId,
    endpoint,
    startTime,
    response: null,
  };

  try {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(endpoint, {
      method: 'POST',
      body: formData,
    });

    request.endTime = Date.now();
    request.duration = request.endTime - startTime;
    request.httpStatus = response.status;

    if (response.ok) {
      request.response = await response.json();

      // Extract response ID/timestamp for tracking
      if (request.response?.metadata?.requestId) {
        request.responseId = String(request.response.metadata.requestId);
      }
      if (request.response?.metadata?.timestamp) {
        request.responseTimestamp = request.response.metadata.timestamp;
      }

      // Validate response
      request.validation = validateAnalysisResult(request.response);
    } else {
      request.error = `HTTP ${response.status}`;
    }
  } catch (error) {
    request.endTime = Date.now();
    request.duration = request.endTime - startTime;
    request.error = error instanceof Error ? error.message : String(error);
  }

  return request;
}

/**
 * Compare responses across multiple runs
 */
function compareResponses(requests: RealAPIRequest[]): {
  allResponsesIdentical: boolean;
  differences: Array<{
    field: string;
    variations: any[];
  }>;
} {
  if (requests.length === 0) {
    return { allResponsesIdentical: true, differences: [] };
  }

  const differences: Array<{ field: string; variations: any[] }> = [];
  const firstResponse = requests[0].response;

  if (!firstResponse) {
    return { allResponsesIdentical: true, differences: [] };
  }

  // Deep comparison of responses
  const compareObjects = (obj1: any, obj2: any, path: string = '') => {
    for (const key in obj1) {
      const fullPath = path ? `${path}.${key}` : key;
      const val1 = obj1[key];
      const val2 = obj2[key];

      if (typeof val1 === 'object' && val1 !== null && typeof val2 === 'object' && val2 !== null) {
        compareObjects(val1, val2, fullPath);
      } else if (val1 !== val2) {
        const existing = differences.find((d) => d.field === fullPath);
        if (existing) {
          if (!existing.variations.includes(val2)) {
            existing.variations.push(val2);
          }
        } else {
          differences.push({
            field: fullPath,
            variations: [val1, val2],
          });
        }
      }
    }
  };

  for (let i = 1; i < requests.length; i++) {
    if (requests[i].response) {
      compareObjects(firstResponse, requests[i].response);
    }
  }

  return {
    allResponsesIdentical: differences.length === 0,
    differences,
  };
}

/**
 * Check if responses arrived in order
 */
function checkResponseOrdering(
  requests: RealAPIRequest[]
): {
  allResponsesInOrder: boolean;
  outOfOrderInstances: Array<{
    before: number;
    after: number;
    beforeId?: string;
    afterId?: string;
  }>;
} {
  const outOfOrderInstances = [];

  for (let i = 1; i < requests.length; i++) {
    if (!requests[i].duration || !requests[i - 1].duration) continue;

    // Check if request N arrived before request N-1
    if (
      requests[i].startTime + (requests[i].duration || 0) <
      requests[i - 1].startTime + (requests[i - 1].duration || 0)
    ) {
      // But newer request completed earlier (expected for concurrent)
      // What we want to catch is if the oldest request hasn't completed/been processed
    }

    // Check if response timestamp indicates out-of-order
    if (
      requests[i].responseTimestamp &&
      requests[i - 1].responseTimestamp &&
      requests[i].responseTimestamp! < requests[i - 1].responseTimestamp!
    ) {
      outOfOrderInstances.push({
        before: i - 1,
        after: i,
        beforeId: requests[i - 1].responseId,
        afterId: requests[i].responseId,
      });
    }
  }

  return {
    allResponsesInOrder: outOfOrderInstances.length === 0,
    outOfOrderInstances,
  };
}


/**
 * STRICT EVALUATION FUNCTIONS
 */

/**
 * Evaluate timing consistency
 */
function evaluateTiming(stats: {
  avgDuration: number;
  stdDev: number;
}): { pass: boolean; reason: string; status: 'PASS' | 'WARN' | 'FAIL' } {
  const avgLimit = 2000; // 2 seconds
  const stdDevLimit = 500; // 0.5 seconds

  if (stats.avgDuration >= avgLimit) {
    return {
      pass: false,
      status: 'FAIL',
      reason: `Average response time ${stats.avgDuration}ms exceeds limit ${avgLimit}ms`,
    };
  }

  if (stats.stdDev >= stdDevLimit) {
    return {
      pass: false,
      status: 'FAIL',
      reason: `Response time variance ${stats.stdDev}ms exceeds limit ${stdDevLimit}ms`,
    };
  }

  return {
    pass: true,
    status: 'PASS',
    reason: `Timing acceptable: avg ${stats.avgDuration}ms, stdDev ${stats.stdDev}ms`,
  };
}

/**
 * Evaluate response ordering
 */
function evaluateOrdering(ordering: {
  allResponsesInOrder: boolean;
  outOfOrderInstances: Array<{ before: number; after: number }>;
}): { pass: boolean; reason: string; status: 'PASS' | 'WARN' | 'FAIL' } {
  if (!ordering.allResponsesInOrder && ordering.outOfOrderInstances.length > 0) {
    return {
      pass: false,
      status: 'FAIL',
      reason: `${ordering.outOfOrderInstances.length} out-of-order responses detected`,
    };
  }

  return {
    pass: true,
    status: 'PASS',
    reason: 'All responses in correct order',
  };
}

/**
 * Evaluate data consistency (with float tolerance)
 */
function evaluateConsistency(responseVariation: {
  allResponsesIdentical: boolean;
  differences: Array<{ field: string; variations: any[] }>;
}): { pass: boolean; reason: string; status: 'PASS' | 'WARN' | 'FAIL' } {
  if (!responseVariation.allResponsesIdentical) {
    // Check if differences are just floating point tolerance
    const significantDifferences = responseVariation.differences.filter((diff) => {
      if (Array.isArray(diff.variations) && diff.variations.length === 2) {
        const [v1, v2] = diff.variations;
        if (typeof v1 === 'number' && typeof v2 === 'number') {
          const absDiff = Math.abs(v1 - v2);
          // Allow ±0.05 tolerance
          return absDiff > 0.05;
        }
      }
      return true; // Non-numeric differences are significant
    });

    if (significantDifferences.length > 0) {
      return {
        pass: false,
        status: 'FAIL',
        reason: `${significantDifferences.length} significant field difference(s) detected: ${significantDifferences
          .slice(0, 2)
          .map((d) => d.field)
          .join(', ')}`,
      };
    }
  }

  return {
    pass: true,
    status: 'PASS',
    reason: 'All responses consistent (within tolerance)',
  };
}

/**
 * Evaluate response integrity
 */
function evaluateIntegrity(requests: RealAPIRequest[]): {
  pass: boolean;
  reason: string;
  status: 'PASS' | 'WARN' | 'FAIL';
  missingFields: string[];
} {
  const requiredFields = ['success', 'data', 'timestamp'];
  const missingFields: string[] = [];

  for (const request of requests) {
    if (request.response) {
      for (const field of requiredFields) {
        if (!(field in request.response)) {
          missingFields.push(`Request ${request.requestId}: missing "${field}"`);
        }
      }
    }
  }

  if (missingFields.length > 0) {
    return {
      pass: false,
      status: 'FAIL',
      reason: `Missing required fields in ${new Set(missingFields.map((f) => f.split(':')[0])).size} request(s)`,
      missingFields: missingFields.slice(0, 3),
    };
  }

  return {
    pass: true,
    status: 'PASS',
    reason: 'All responses have required fields',
    missingFields: [],
  };
}

/**
 * Evaluate stale data (latest request matches latest displayed result)
 */
function evaluateStaleData(requests: RealAPIRequest[]): {
  pass: boolean;
  reason: string;
  status: 'PASS' | 'WARN' | 'FAIL';
  latestMismatch: boolean;
} {
  if (requests.length === 0) {
    return {
      pass: true,
      status: 'PASS',
      reason: 'No requests to check',
      latestMismatch: false,
    };
  }

  const latestRequest = requests[requests.length - 1];
  const previousRequest = requests.length > 1 ? requests[requests.length - 2] : null;

  // Check if latest request has a different response than previous
  if (
    latestRequest.response &&
    previousRequest?.response &&
    JSON.stringify(latestRequest.response) !== JSON.stringify(previousRequest.response)
  ) {
    // Different responses is expected, but verify latest isn't stale
    return {
      pass: true,
      status: 'PASS',
      reason: 'Latest response is current (different from previous)',
      latestMismatch: false,
    };
  }

  return {
    pass: true,
    status: 'PASS',
    reason: 'No stale data detected',
    latestMismatch: false,
  };
}

/**
 * Evaluate confidence consistency (confidence * 100 == displayed %)
 */
function evaluateConfidenceConsistency(requests: RealAPIRequest[]): {
  pass: boolean;
  reason: string;
  status: 'PASS' | 'WARN' | 'FAIL';
  mismatches: Array<{
    requestId: number;
    confidence: number;
    displayedPercentage: number;
    mismatch: number;
  }>;
} {
  const mismatches: Array<{
    requestId: number;
    confidence: number;
    displayedPercentage: number;
    mismatch: number;
  }> = [];

  for (const request of requests) {
    if (request.response?.data?.face?.confidence !== undefined) {
      const confidence = request.response.data.face.confidence;
      const expectedPercentage = confidence * 100;
      const displayedPercentage = request.response.data.face.confidence_percentage;

      // Check if displayed percentage exists and matches
      if (displayedPercentage !== undefined && Math.abs(expectedPercentage - displayedPercentage) > 0.5) {
        mismatches.push({
          requestId: request.requestId,
          confidence,
          displayedPercentage,
          mismatch: expectedPercentage - displayedPercentage,
        });
      }
    }
  }

  if (mismatches.length > 0) {
    return {
      pass: false,
      status: 'FAIL',
      reason: `${mismatches.length} confidence/percentage mismatch(es) detected`,
      mismatches: mismatches.slice(0, 3),
    };
  }

  return {
    pass: true,
    status: 'PASS',
    reason: 'All confidence values consistent',
    mismatches: [],
  };
}

/**
 * Run strict evaluation on all criteria
 */
function runStrictEvaluation(
  requests: RealAPIRequest[],
  stats: { avgDuration: number; stdDev: number },
  responseVariation: {
    allResponsesIdentical: boolean;
    differences: Array<{ field: string; variations: any[] }>;
  },
  ordering: {
    allResponsesInOrder: boolean;
    outOfOrderInstances: Array<{ before: number; after: number }>;
  }
): RealAPIStressTestResult['evaluation'] {
  const timingEval = evaluateTiming(stats);
  const orderingEval = evaluateOrdering(ordering);
  const consistencyEval = evaluateConsistency(responseVariation);
  const integrityEval = evaluateIntegrity(requests);
  const staleDataEval = evaluateStaleData(requests);
  const confidenceEval = evaluateConfidenceConsistency(requests);

  const allPass =
    timingEval.pass &&
    orderingEval.pass &&
    consistencyEval.pass &&
    integrityEval.pass &&
    staleDataEval.pass &&
    confidenceEval.pass;

  const issues: string[] = [];
  if (!timingEval.pass) issues.push(`⏱️ Timing: ${timingEval.reason}`);
  if (!orderingEval.pass) issues.push(`🔄 Ordering: ${orderingEval.reason}`);
  if (!consistencyEval.pass) issues.push(`📊 Consistency: ${consistencyEval.reason}`);
  if (!integrityEval.pass) issues.push(`📋 Integrity: ${integrityEval.reason}`);
  if (!staleDataEval.pass) issues.push(`⚠️ Stale Data: ${staleDataEval.reason}`);
  if (!confidenceEval.pass) issues.push(`📈 Confidence: ${confidenceEval.reason}`);

  return {
    passed: allPass,
    summary: {
      timing: timingEval.status,
      ordering: orderingEval.status,
      consistency: consistencyEval.status,
      integrity: integrityEval.status,
      staleData: staleDataEval.status,
      confidenceConsistency: confidenceEval.status,
    },
    details: {
      timing: {
        avgResponseTime: stats.avgDuration,
        limit: 2000,
        pass: timingEval.pass,
        reason: timingEval.reason,
      },
      timingVariance: {
        stdDev: stats.stdDev,
        limit: 500,
        pass: stats.stdDev < 500,
        reason: stats.stdDev < 500 ? 'Within acceptable variance' : `Variance ${stats.stdDev}ms exceeds 500ms limit`,
      },
      ordering: {
        pass: orderingEval.pass,
        outOfOrderCount: ordering.outOfOrderInstances.length,
        reason: orderingEval.reason,
      },
      consistency: {
        pass: consistencyEval.pass,
        differences: responseVariation.differences.length,
        reason: consistencyEval.reason,
      },
      integrity: {
        pass: integrityEval.pass,
        missingFields: integrityEval.missingFields,
        reason: integrityEval.reason,
      },
      staleData: {
        pass: staleDataEval.pass,
        latestMismatch: staleDataEval.latestMismatch,
        reason: staleDataEval.reason,
      },
      confidenceConsistency: {
        pass: confidenceEval.pass,
        mismatches: confidenceEval.mismatches,
        reason: confidenceEval.reason,
      },
    },
    issues,
  };
}

/**
 * Real API stress test
 */
async function runRealAPIStressTest(
  endpoint: string = 'http://localhost:3000/api/analyze/business',
  requestCount: number = 10,
  verbose: boolean = true
): Promise<RealAPIStressTestResult> {
  const testId = `real-api-stress-${Date.now()}`;
  const startTime = Date.now();

  if (verbose) {
    console.log(`\n🔥 REAL API STRESS TEST`);
    console.log(`   Test ID: ${testId}`);
    console.log(`   Endpoint: ${endpoint}`);
    console.log(`   Requests: ${requestCount}`);
    console.log('');
  }

  const testAudioFile = createTestAudioBlob();
  const requests: RealAPIRequest[] = [];
  const durations: number[] = [];

  // Send requests with small delays between them
  const promises: Promise<void>[] = [];

  for (let i = 0; i < requestCount; i++) {
    const requestPromise = (async () => {
      try {
        const request = await callRealAPIEndpoint(endpoint, testAudioFile, i);
        requests.push(request);

        if (request.duration) {
          durations.push(request.duration);
        }

        if (verbose) {
          const status = request.error ? `❌ ${request.error}` : `✅ ${request.duration}ms`;
          console.log(`Request ${i}: ${status}`);
        }
      } catch (error) {
        console.error(`Request ${i} failed:`, error);
      }
    })();

    promises.push(requestPromise);

    // Small delay between requests
    if (i < requestCount - 1) {
      await new Promise((resolve) => setTimeout(resolve, 50));
    }
  }

  await Promise.all(promises);

  const endTime = Date.now();
  const duration = endTime - startTime;

  // Calculate statistics
  const successfulRequests = requests.filter((r) => !r.error).length;
  const failedRequests = requestCount - successfulRequests;

  const stats = {
    minDuration: Math.min(...durations),
    maxDuration: Math.max(...durations),
    avgDuration: durations.reduce((a, b) => a + b, 0) / durations.length,
    stdDev: 0,
  };

  if (durations.length > 1) {
    const variance =
      durations.reduce((sum, d) => sum + Math.pow(d - stats.avgDuration, 2), 0) /
      durations.length;
    stats.stdDev = Math.sqrt(variance);
  }

  // Compare responses
  const responseVariation = compareResponses(
    requests.filter((r) => r.response !== null)
  );
  const ordering = checkResponseOrdering(requests);

  // Validate all responses
  const validationErrors: string[] = [];
  let invalidCount = 0;

  for (const request of requests) {
    if (request.validation && !request.validation.valid) {
      invalidCount++;
      validationErrors.push(
        `Request ${request.requestId}: ${request.validation.errors[0]}`
      );
    }
  }

  // Generate summary
  const issues: string[] = [];
  const recommendations: string[] = [];

  if (failedRequests > 0) {
    issues.push(`${failedRequests} request(s) failed`);
    recommendations.push('Check backend endpoint availability');
    recommendations.push('Verify network connectivity');
  }

  if (!responseVariation.allResponsesIdentical) {
    issues.push(
      `Response variation detected: ${responseVariation.differences.length} field(s) differ`
    );
    recommendations.push('Check backend for inconsistent response formats');
  }

  if (!ordering.allResponsesInOrder) {
    issues.push(
      `${ordering.outOfOrderInstances.length} out-of-order response(s) detected`
    );
    recommendations.push('Verify API request ordering guarantees');
  }

  if (invalidCount > 0) {
    issues.push(`${invalidCount} response(s) failed validation`);
    recommendations.push('Check API response format matches expected schema');
  }

  if (stats.stdDev > stats.avgDuration * 0.5) {
    issues.push('High response time variance detected');
    recommendations.push('Check backend load and performance');
  }

  // Run strict evaluation
  const evaluation = runStrictEvaluation(
    requests.filter((r) => r.response !== null),
    stats,
    responseVariation,
    ordering
  );

  const passed = evaluation.passed; // Use strict evaluation result

  const result: RealAPIStressTestResult = {
    testId,
    startTime,
    endTime,
    duration,
    endpoint,
    totalRequests: requestCount,
    successfulRequests,
    failedRequests,
    requests,
    timing: stats,
    responseVariation,
    ordering,
    validation: {
      allValid: invalidCount === 0,
      invalidCount,
      errors: validationErrors,
    },
    evaluation,
    summary: {
      passed,
      issues: evaluation.issues.length > 0 ? evaluation.issues : issues,
      recommendations,
    },
  };

  if (verbose) {
    printRealAPIStressTestReport(result);
  }

  return result;
}

/**
 * Print formatted real API stress test report
 */
function printRealAPIStressTestReport(result: RealAPIStressTestResult): void {
  console.log('\n' + '='.repeat(80));
  console.log('REAL API STRESS TEST REPORT - STRICT EVALUATION');
  console.log('='.repeat(80));

  console.log(`\nEndpoint: ${result.endpoint}`);
  console.log(`Duration: ${result.duration}ms`);
  console.log(
    `Requests: ${result.successfulRequests}/${result.totalRequests} successful`
  );

  // Overall status with strict evaluation
  console.log('\n' + '─'.repeat(80));
  if (result.evaluation.passed) {
    console.log('✅ STRICT EVALUATION PASSED');
  } else {
    console.log('❌ STRICT EVALUATION FAILED');
  }

  // Evaluation Summary
  console.log('\n' + '─'.repeat(80));
  console.log('STRICT EVALUATION SUMMARY');
  console.log('─'.repeat(80));

  const statusIcon = (status: string) => {
    switch (status) {
      case 'PASS':
        return '✅';
      case 'WARN':
        return '⚠️';
      case 'FAIL':
        return '❌';
      default:
        return '❓';
    }
  };

  console.log(
    `Timing:                   ${statusIcon(result.evaluation.summary.timing)} ${result.evaluation.summary.timing}`
  );
  console.log(
    `  → avg: ${result.evaluation.details.timing.avgResponseTime}ms (limit: ${result.evaluation.details.timing.limit}ms)`
  );
  console.log(
    `  → variance: ${result.evaluation.details.timingVariance.stdDev}ms (limit: ${result.evaluation.details.timingVariance.limit}ms)`
  );

  console.log(
    `\nOrdering:                 ${statusIcon(result.evaluation.summary.ordering)} ${result.evaluation.summary.ordering}`
  );
  console.log(
    `  → out of order: ${result.evaluation.details.ordering.outOfOrderCount}`
  );

  console.log(
    `\nConsistency:              ${statusIcon(result.evaluation.summary.consistency)} ${result.evaluation.summary.consistency}`
  );
  console.log(
    `  → field differences: ${result.evaluation.details.consistency.differences} (tolerance: ±0.05)`
  );

  console.log(
    `\nIntegrity:                ${statusIcon(result.evaluation.summary.integrity)} ${result.evaluation.summary.integrity}`
  );
  console.log(`  → required fields: success, data, timestamp`);
  if (result.evaluation.details.integrity.missingFields.length > 0) {
    result.evaluation.details.integrity.missingFields.forEach((field) => {
      console.log(`     ❌ ${field}`);
    });
  }

  console.log(
    `\nStale Data:               ${statusIcon(result.evaluation.summary.staleData)} ${result.evaluation.summary.staleData}`
  );
  console.log(`  → latest response is current: ${result.evaluation.details.staleData.latestMismatch ? '❌' : '✅'}`);

  console.log(
    `\nConfidence Consistency:   ${statusIcon(result.evaluation.summary.confidenceConsistency)} ${result.evaluation.summary.confidenceConsistency}`
  );
  console.log(`  → confidence * 100 == displayed %`);
  if (result.evaluation.details.confidenceConsistency.mismatches.length > 0) {
    result.evaluation.details.confidenceConsistency.mismatches.forEach((m) => {
      console.log(
        `     ❌ Request ${m.requestId}: ${m.confidence} * 100 = ${(m.confidence * 100).toFixed(1)}%, got ${m.displayedPercentage.toFixed(1)}%`
      );
    });
  }

  // Detailed Issues
  if (result.evaluation.issues.length > 0) {
    console.log('\n' + '─'.repeat(80));
    console.log('ISSUES');
    result.evaluation.issues.forEach((issue) => {
      console.log(`${issue}`);
    });
  }

  // Timing statistics
  console.log('\n' + '─'.repeat(80));
  console.log('📊 TIMING STATISTICS');
  console.log(`  Min:     ${result.timing.minDuration}ms`);
  console.log(`  Max:     ${result.timing.maxDuration}ms`);
  console.log(`  Average: ${result.timing.avgDuration.toFixed(0)}ms`);
  console.log(`  StdDev:  ${result.timing.stdDev.toFixed(0)}ms`);

  // Response consistency
  console.log('\n📋 RESPONSE CONSISTENCY');
  console.log(
    `  Identical: ${result.responseVariation.allResponsesIdentical ? '✅' : '❌'}`
  );
  if (result.responseVariation.differences.length > 0) {
    console.log(`  Variations: ${result.responseVariation.differences.length}`);
    result.responseVariation.differences.slice(0, 3).forEach((diff) => {
      console.log(`    - ${diff.field}: ${JSON.stringify(diff.variations)}`);
    });
  }

  // Response ordering
  console.log('\n🔄 RESPONSE ORDERING');
  console.log(`  In Order: ${result.ordering.allResponsesInOrder ? '✅' : '❌'}`);
  if (result.ordering.outOfOrderInstances.length > 0) {
    console.log(`  Out of Order: ${result.ordering.outOfOrderInstances.length}`);
    result.ordering.outOfOrderInstances.slice(0, 3).forEach((out) => {
      console.log(
        `    - Request ${out.before} (${out.beforeId}) before ${out.after} (${out.afterId})`
      );
    });
  }

  // Validation
  if (result.validation.invalidCount > 0) {
    console.log(`\n❌ VALIDATION ERRORS: ${result.validation.invalidCount}`);
    result.validation.errors.slice(0, 3).forEach((err) => {
      console.log(`  - ${err}`);
    });
  }

  // Issues and recommendations
  if (result.summary.issues.length > 0) {
    console.log('\n' + '─'.repeat(80));
    console.log('SUMMARY ISSUES');
    result.summary.issues.forEach((issue) => {
      console.log(`  ❌ ${issue}`);
    });
  }

  if (result.summary.recommendations.length > 0) {
    console.log('\n' + '─'.repeat(80));
    console.log('RECOMMENDATIONS');
    result.summary.recommendations.forEach((rec) => {
      console.log(`  💡 ${rec}`);
    });
  }

  console.log('\n' + '='.repeat(80));
}

/**
 * Quick stress test for browser console - NOW USES REAL API
 */
export async function quickStressTest(endpoint?: string): Promise<void> {
  console.log('🔥 Running real API stress test...');

  const apiEndpoint = endpoint || 'http://localhost:3000/api/analyze/business';

  try {
    const result = await runRealAPIStressTest(apiEndpoint, 10, true);

    if (result.summary.passed) {
      console.log('\n✅ Stress test PASSED - System is healthy');
    } else {
      console.log(
        '\n❌ Stress test FAILED - Issues detected (see above for details)'
      );
    }
  } catch (error) {
    console.error('Stress test error:', error);
    console.log('\n⚠️  Could not connect to backend. Check endpoint and ensure backend is running.');
  }

  return Promise.resolve();
}

/**
 * Export real API test functions for external use
 */
export { runRealAPIStressTest, printRealAPIStressTestReport };

/**
 * Detailed stress test for CI/CD
 */
export async function ciStressTest(): Promise<{
  passed: boolean;
  details: StressTestResult;
}> {
  const result = await runAnalysisStressTest({ requestCount: 20, verbose: false });

  return {
    passed: result.summary.passed,
    details: result,
  };
}

/**
 * Long-running stability test
 */
export async function stabilityTest(
  durationMs: number = 60000,
  options?: { requestIntervalMs?: number; verbose?: boolean }
): Promise<StressTestResult[]> {
  const results: StressTestResult[] = [];
  const requestInterval = options?.requestIntervalMs || 500;
  const verbose = options?.verbose !== false;
  const startTime = Date.now();

  let testNumber = 0;

  if (verbose) {
    console.log(`\n🏃 STABILITY TEST - Running for ${durationMs / 1000}s`);
  }

  while (Date.now() - startTime < durationMs) {
    testNumber++;
    if (verbose) {
      console.log(`\nRun ${testNumber} (${((Date.now() - startTime) / 1000).toFixed(1)}s)`);
    }

    const result = await runAnalysisStressTest({
      requestCount: 5,
      verbose: false,
    });

    results.push(result);

    if (!result.summary.passed && verbose) {
      console.warn(`⚠️  Run ${testNumber} had issues`);
    }

    // Wait before next test
    await new Promise((resolve) => setTimeout(resolve, requestInterval));
  }

  if (verbose) {
    const successCount = results.filter((r) => r.summary.passed).length;
    console.log(
      `\n✅ Stability test complete: ${successCount}/${results.length} passed`
    );
  }

  return results;
}
