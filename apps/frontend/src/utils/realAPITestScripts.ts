/**
 * Practical Test Scripts for Real API Responses
 *
 * These scripts can be run in different environments:
 * 1. Browser console (copy into DevTools)
 * 2. React component (import and call)
 * 3. Node.js test file (Jest/Mocha)
 */

import { testRealAPIResponse, formatTestResults, runAndDisplayTest } from './realAPIValidator';
import { validateAnalysisResult } from './analysisValidator';

/**
 * SCRIPT 1: Quick Test in Browser Console
 *
 * Copy and paste this into browser DevTools Console:
 */
export const BROWSER_CONSOLE_TEST = `
// Step 1: Import the test utility
import { runAndDisplayTest } from '/src/utils/realAPIValidator.js';

// Step 2: Run the test (shows all details)
await runAndDisplayTest({ verbose: true });

// Step 3: See results in console
`;

/**
 * SCRIPT 2: Test All Endpoints
 */
export async function testAllBackendEndpoints() {
  console.log('🧪 Testing All Backend Endpoints\n');

  const endpoints = [
    {
      name: 'Business Analysis',
      url: 'http://localhost:8000/analyze/business',
    },
    {
      name: 'Interview Analysis',
      url: 'http://localhost:8000/analyze/interview',
    },
    {
      name: 'Audio Analysis',
      url: 'http://localhost:8000/analyze/audio',
    },
  ];

  const results: Record<string, any> = {};

  for (const endpoint of endpoints) {
    console.log(`\n📡 Testing: ${endpoint.name}`);
    console.log(`   URL: ${endpoint.url}`);
    console.log('   Status: Testing...');

    try {
      const result = await testRealAPIResponse({
        apiUrl: endpoint.url,
        verbose: false,
      });

      results[endpoint.name] = result;

      if (result.success) {
        console.log('   ✅ PASSED');
      } else {
        console.log('   ❌ FAILED');
        console.log('   Reason:', result.summary[0]);
      }
    } catch (error) {
      results[endpoint.name] = { success: false, error: String(error) };
      console.log('   ❌ ERROR:', error);
    }
  }

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('SUMMARY');
  console.log('='.repeat(70));

  const passed = Object.values(results).filter((r: any) => r.success).length;
  const total = Object.keys(results).length;

  console.log(`\nEndpoints: ${passed}/${total} passed`);

  Object.entries(results).forEach(([name, result]: [string, any]) => {
    const status = result.success ? '✅' : '❌';
    console.log(`  ${status} ${name}`);
  });

  return results;
}

/**
 * SCRIPT 3: Continuous Monitoring (Health Check Loop)
 */
export async function monitorBackendHealth(
  interval: number = 30000,
  maxDuration: number = 300000
) {
  console.log('🏥 Starting Backend Health Monitor');
  console.log(`   Interval: ${interval}ms`);
  console.log(`   Duration: ${maxDuration}ms (${(maxDuration / 1000 / 60).toFixed(1)} minutes)\n`);

  const startTime = Date.now();
  let checkCount = 0;
  const results: any[] = [];

  const monitor = setInterval(async () => {
    checkCount++;
    const timestamp = new Date().toLocaleTimeString();

    console.log(`\n[${timestamp}] Health Check #${checkCount}`);

    try {
      const result = await testRealAPIResponse({
        verbose: false,
        apiUrl: 'http://localhost:8000/analyze/business',
      });

      results.push({ timestamp, result });

      if (result.success) {
        console.log('✅ Backend healthy');
      } else {
        console.log('❌ Backend unhealthy:', result.summary[0]);
      }

      // Check if we should stop
      const elapsed = Date.now() - startTime;
      if (elapsed >= maxDuration) {
        clearInterval(monitor);

        // Print summary
        console.log('\n' + '='.repeat(70));
        console.log('MONITORING SUMMARY');
        console.log('='.repeat(70));

        const successCount = results.filter((r) => r.result.success).length;
        console.log(`Total checks: ${results.length}`);
        console.log(`Successful: ${successCount}/${results.length}`);
        console.log(`Success rate: ${((successCount / results.length) * 100).toFixed(1)}%`);

        if (successCount === results.length) {
          console.log('✅ Backend stable throughout monitoring period');
        } else {
          console.log('⚠️  Backend had issues during monitoring');
          const failedChecks = results.filter((r) => !r.result.success);
          console.log(`Failed: ${failedChecks.length} times`);
        }
      }
    } catch (error) {
      console.error('❌ Monitor error:', error);
    }
  }, interval);
}

/**
 * SCRIPT 4: Test with File Upload
 *
 * For testing endpoints that require file uploads
 */
export async function testWithFileUpload(filePath: string) {
  console.log('📤 Testing API with File Upload\n');

  try {
    // Read file (in Node.js)
    const fs = require('fs');
    const fileData = fs.readFileSync(filePath);

    console.log(`File: ${filePath}`);
    console.log(`Size: ${(fileData.length / 1024).toFixed(2)} KB`);

    // Create FormData
    const formData = new FormData();
    formData.append('file', new Blob([fileData]), filePath);

    // Call API
    console.log('\nCalling API with file...');
    const response = await fetch('http://localhost:8000/analyze/business', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      console.error(`❌ API returned ${response.status}`);
      return;
    }

    const data = await response.json();
    console.log('✅ API returned response');

    // Validate
    console.log('\nValidating response...');
    const validation = validateAnalysisResult(data);

    if (validation.valid) {
      console.log('✅ Response is valid');
    } else {
      console.log('❌ Response validation failed:');
      validation.errors.forEach((e) => console.error(`   - ${e}`));
    }

    return { data, validation };
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

/**
 * SCRIPT 5: Stress Test (Multiple Concurrent Requests)
 */
export async function stressTestBackend(
  concurrentRequests: number = 5,
  totalRequests: number = 20
) {
  console.log(`⚡ Stress Testing Backend`);
  console.log(`   Concurrent: ${concurrentRequests}`);
  console.log(`   Total: ${totalRequests}\n`);

  const results: any[] = [];
  let completed = 0;

  for (let batch = 0; batch < totalRequests / concurrentRequests; batch++) {
    console.log(`Batch ${batch + 1}: Sending ${concurrentRequests} concurrent requests...`);

    const promises: Promise<any>[] = [];

    for (let i = 0; i < concurrentRequests; i++) {
      const promise = testRealAPIResponse({
        verbose: false,
        apiUrl: 'http://localhost:8000/analyze/business',
      }).then((result) => {
        completed++;
        results.push(result);
        return result;
      });

      promises.push(promise);
    }

    await Promise.all(promises);
    console.log(`  ✅ Batch complete (${completed}/${totalRequests})`);
  }

  // Summary
  console.log('\n' + '='.repeat(70));
  console.log('STRESS TEST RESULTS');
  console.log('='.repeat(70));

  const successful = results.filter((r) => r.success).length;
  const failed = results.length - successful;

  console.log(`Total requests: ${results.length}`);
  console.log(`Successful: ${successful}`);
  console.log(`Failed: ${failed}`);
  console.log(`Success rate: ${((successful / results.length) * 100).toFixed(1)}%`);

  // Average times
  if (results.length > 0) {
    const avgValidation = results.reduce((sum, r) => sum + (r.stages.apiValidation.valid ? 1 : 0), 0) / results.length;
    console.log(`API validation pass rate: ${(avgValidation * 100).toFixed(1)}%`);
  }

  if (failed > 0) {
    const failureTypes = results
      .filter((r) => !r.success)
      .map((r) => r.summary[0])
      .reduce((acc: Record<string, number>, msg) => {
        acc[msg] = (acc[msg] || 0) + 1;
        return acc;
      }, {});

    console.log('\nFailure types:');
    Object.entries(failureTypes).forEach(([type, count]: [string, any]) => {
      console.log(`  - ${type}: ${count}x`);
    });
  }

  return results;
}

/**
 * SCRIPT 6: API Response Comparison
 *
 * Call API twice and compare responses for consistency
 */
export async function compareConsecutiveAPICalls() {
  console.log('🔄 Testing API Response Consistency\n');

  console.log('Call 1: Making first request...');
  const result1 = await testRealAPIResponse({
    verbose: false,
    apiUrl: 'http://localhost:8000/analyze/business',
  });

  if (!result1.success) {
    console.error('❌ First call failed');
    return;
  }

  console.log('✅ First call succeeded');

  // Wait a bit
  await new Promise((resolve) => setTimeout(resolve, 1000));

  console.log('Call 2: Making second request...');
  const result2 = await testRealAPIResponse({
    verbose: false,
    apiUrl: 'http://localhost:8000/analyze/business',
  });

  if (!result2.success) {
    console.error('❌ Second call failed');
    return;
  }

  console.log('✅ Second call succeeded');

  // Compare
  console.log('\n' + '='.repeat(70));
  console.log('COMPARISON');
  console.log('='.repeat(70));

  const r1 = result1.stages.apiCall.rawResponse;
  const r2 = result2.stages.apiCall.rawResponse;

  // Compare key fields
  const fields = ['data.confidence', 'data.credibility.credibility_score', 'data.credibility.deception_probability'];

  let differences = 0;

  fields.forEach((field) => {
    const parts = field.split('.');
    let v1 = r1;
    let v2 = r2;

    for (const part of parts) {
      v1 = v1?.[part];
      v2 = v2?.[part];
    }

    const match = v1 === v2;
    const icon = match ? '✅' : '❌';

    console.log(`${icon} ${field}: ${v1} ${!match ? '→ ' + v2 : ''}`);

    if (!match) differences++;
  });

  console.log(`\nTotal differences: ${differences}`);

  if (differences === 0) {
    console.log('✅ API responses are consistent');
  } else {
    console.log('⚠️  API returned different data on consecutive calls');
  }

  return { result1, result2, differences };
}

/**
 * SCRIPT 7: Interactive Test Menu
 *
 * For easier manual testing
 */
export async function interactiveTestMenu() {
  const inquire = require('inquire'); // Would need inquirer.js

  console.log('🧪 Backend API Test Menu\n');

  const choices = [
    { name: '1️⃣  Quick Test (Single Request)', value: 'quick' },
    { name: '2️⃣  Test All Endpoints', value: 'all' },
    { name: '3️⃣  Stress Test', value: 'stress' },
    { name: '4️⃣  Health Monitor', value: 'monitor' },
    { name: '5️⃣  Compare Consecutive Calls', value: 'compare' },
    { name: '❌ Exit', value: 'exit' },
  ];

  // For now, just show the menu structure
  console.log('Available tests:');
  choices.forEach((c) => console.log(`   ${c.name}`));

  // In real implementation, use inquirer to get user choice
}

/**
 * SCRIPT 8: Export Test Data for Analysis
 *
 * Collect and export test results for debugging
 */
export async function collectTestDataForDebugging() {
  console.log('💾 Collecting Test Data\n');

  const testData = {
    timestamp: new Date().toISOString(),
    tests: [] as any[],
  };

  // Run multiple tests
  for (let i = 0; i < 3; i++) {
    console.log(`Running test ${i + 1}/3...`);

    const result = await testRealAPIResponse({
      verbose: false,
      apiUrl: 'http://localhost:8000/analyze/business',
    });

    testData.tests.push({
      testNumber: i + 1,
      timestamp: new Date().toISOString(),
      success: result.success,
      stages: result.stages,
      summary: result.summary,
    });
  }

  // Export
  const json = JSON.stringify(testData, null, 2);

  console.log('\nTest data collected:');
  console.log(json);

  // In Node.js, could write to file:
  // const fs = require('fs');
  // fs.writeFileSync(`test-data-${Date.now()}.json`, json);

  return testData;
}

export const TestScripts = {
  testAllBackendEndpoints,
  monitorBackendHealth,
  testWithFileUpload,
  stressTestBackend,
  compareConsecutiveAPICalls,
  interactiveTestMenu,
  collectTestDataForDebugging,
};

// Example: How to run these scripts
export function exampleUsage() {
  return `
// Run in browser console:
import { TestScripts } from '@/utils/realAPITestScripts';

// Quick test
await TestScripts.testAllBackendEndpoints();

// Monitor health
await TestScripts.monitorBackendHealth(
  30000,  // Check every 30 seconds
  300000  // For 5 minutes
);

// Stress test
await TestScripts.stressTestBackend(
  5,   // 5 concurrent requests
  20   // 20 total requests
);

// Compare responses
await TestScripts.compareConsecutiveAPICalls();
`;
}
