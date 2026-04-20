/**
 * Pipeline Consistency Validator - Integration Examples
 *
 * Shows how to use the validator in different scenarios
 */

import {
  pipelineValidator,
  logMismatch,
  quickValidate,
  PipelineConsistencyValidator,
} from './pipelineConsistencyValidator';

/**
 * EXAMPLE 1: Intercept and Validate API Response
 *
 * Capture Flask response as it comes from backend
 */
export function example1_APIResponseCapture() {
  return `
// In Express service (backend/src/services/business-analysis.service.ts)

async analyzeAudio(audioData) {
  try {
    const response = await fetch('http://localhost:8000/analyze/business', {
      method: 'POST',
      body: audioData
    });

    const flaskData = await response.json();

    // ✅ CAPTURE: Raw Flask response
    pipelineValidator.captureSnapshot('flask', flaskData);
    console.log('📸 Flask response captured');

    // Transform for Express
    const expressData = transformFlaskResponse(flaskData);

    // ✅ CAPTURE: Express-transformed data
    pipelineValidator.captureSnapshot('express', expressData);

    return expressData;
  } catch (error) {
    console.error('API error:', error);
    throw error;
  }
}
`;
}

/**
 * EXAMPLE 2: Track Frontend Transformation
 *
 * Validate data as it's transformed for UI
 */
export function example2_FrontendTransformation() {
  return `
// In React component / transformation layer

import { pipelineValidator } from '@/utils/pipelineConsistencyValidator';
import { transformAnalysisData } from '@/utils/transformAnalysisData';

function AnalysisComponent({ apiResponse }) {
  useEffect(() => {
    if (!apiResponse) return;

    // ✅ CAPTURE: Raw API response received
    pipelineValidator.captureSnapshot('flask', apiResponse);

    try {
      // Transform for display
      const transformedData = transformAnalysisData(apiResponse);

      // ✅ CAPTURE: Transformed data
      pipelineValidator.captureSnapshot('transform', transformedData);

      // ✅ CAPTURE: Final component-ready data
      pipelineValidator.captureSnapshot('component', {
        ...transformedData,
        // Any component-specific additions
      });

      // Compare stages
      const comparison = pipelineValidator.compareSnapshots(0, 1);

      if (comparison.summary.critical > 0) {
        console.error('❌ Critical issues in pipeline');
        console.table(comparison.differences);
      }

      setData(transformedData);
    } catch (error) {
      console.error('Transform error:', error);
    }
  }, [apiResponse]);
}
`;
}

/**
 * EXAMPLE 3: Full Pipeline Validation
 *
 * Compare all layers at once
 */
export async function example3_FullPipeline(flaskData: any, expressData: any, transformedData: any, componentData: any) {
  console.log('🔄 Running Full Pipeline Validation\n');

  const result = await pipelineValidator.validateFullPipeline(
    flaskData,
    expressData,
    transformedData,
    componentData
  );

  console.log('\n' + pipelineValidator.getReport());

  return result;
}

/**
 * EXAMPLE 4: Continuous Monitoring
 *
 * Validate during normal app usage
 */
export function example4_ContinuousMonitoring() {
  return `
// In app initialization or middleware

import { pipelineValidator, logMismatch } from '@/utils/pipelineConsistencyValidator';

// Hook into analysis result updates
window.__analysisHook = (rawData, transformedData) => {
  // Capture both states  pipelineValidator.captureSnapshot('flask', rawData);
  pipelineValidator.captureSnapshot('component', transformedData);

  // Compare
  const comparison = pipelineValidator.compareSnapshots(
    pipelineValidator.snapshots.length - 2,
    pipelineValidator.snapshots.length - 1
  );

  if (comparison.summary.critical > 0) {
    logMismatch(comparison);
    // Report issue
    reportToErrorTracking('Pipeline consistency failure', comparison);
  }
};
`;
}

/**
 * EXAMPLE 5: Quick Validation
 *
 * Fast consistency check
 */
export function example5_QuickValidation() {
  return `
// Simple before/after check

import { quickValidate } from '@/utils/pipelineConsistencyValidator';

function testAPIResponse() {
  const flaskResponse = { /* ... */ };
  const transformedData = transformAnalysisData(flaskResponse);

  // Single line check
  const isConsistent = quickValidate(
    'API Response Transformation',
    flaskResponse,
    transformedData
  );

  if (!isConsistent) {
    console.error('Transformation has issues');
  }
}
`;
}

/**
 * EXAMPLE 6: Detect Specific Field Loss
 *
 * Find what fields are being dropped
 */
export async function example6_FieldLossDetection(flaskData: any, finalData: any) {
  console.log('🔍 Detecting Field Loss\n');

  const validator = new PipelineConsistencyValidator();

  validator.captureSnapshot('flask', flaskData);
  validator.captureSnapshot('final', finalData);

  const comparison = validator.compareSnapshots(0, 1);

  console.group('📊 Field Loss Analysis');

  // Show removed fields
  const removed = comparison.differences.filter((d) => d.type === 'removed');
  if (removed.length > 0) {
    console.error(`❌ ${removed.length} fields lost:`);
    removed.forEach((d) => {
      console.error(`   - ${d.path}: was ${validator['formatValue'](d.from)}`);
    });
  } else {
    console.log('✅ No fields lost');
  }

  // Show added fields
  const added = comparison.differences.filter((d) => d.type === 'added');
  if (added.length > 0) {
    console.log(`\n✚ ${added.length} new fields added:`);
    added.forEach((d) => {
      console.log(`   + ${d.path}: ${validator['formatValue'](d.to)}`);
    });
  }

  // Show changed fields
  const changed = comparison.differences.filter((d) => d.type === 'changed');
  if (changed.length > 0) {
    console.warn(`\n⚠️ ${changed.length} fields changed value:`);
    changed.forEach((d) => {
      console.warn(`   ${d.path}: ${validator['formatValue'](d.from)} → ${validator['formatValue'](d.to)}`);
    });
  }

  console.groupEnd();

  return comparison;
}

/**
 * EXAMPLE 7: Type Mismatch Detection
 *
 * Find where types change (e.g., number → string)
 */
export function example7_TypeMismatchDetection() {
  return `
// Detect type conversions that shouldn't happen

import { pipelineValidator } from '@/utils/pipelineConsistencyValidator';

function validateTypes() {
  const before = {
    confidence: 0.92,           // number
    credibilityScore: 85,       // number
    deceptionScore: 15          // number
  };

  const after = {
    confidence: "0.92",         // ❌ String!
    credibilityScore: "85",     // ❌ String!
    deceptionScore: "15"        // ❌ String!
  };

  pipelineValidator.captureSnapshot('expected', before);
  pipelineValidator.captureSnapshot('actual', after);

  const comparison = pipelineValidator.compareSnapshots(0, 1);

  // Shows:
  // ⚠️ Type Mismatches (3)
  //   confidence: number → string
  //   credibilityScore: number → string
  //   deceptionScore: number → string
}
`;
}

/**
 * EXAMPLE 8: Integration Test
 *
 * Jest/test file validation
 */
export function example8_IntegrationTest() {
  return `
// __tests__/pipeline.test.ts

import { pipelineValidator } from '@/utils/pipelineConsistencyValidator';
import { transformAnalysisData } from '@/utils/transformAnalysisData';

describe('Pipeline Consistency', () => {
  beforeEach(() => {
    pipelineValidator.reset();
  });

  it('preserves all fields through transformation', async () => {
    const mockFlaskData = {
      data: {
        credibility: { confidence: 0.92, credibility_score: 85 },
        voice: { transcription: 'test', stress_level: 0.3 }
      }
    };

    // Simulate pipeline
    pipelineValidator.captureSnapshot('flask', mockFlaskData);
    const transformed = transformAnalysisData(mockFlaskData);
    pipelineValidator.captureSnapshot('component', transformed);

    const result = pipelineValidator.compareSnapshots(0, 1);

    // Assertions
    expect(result.summary.critical).toBe(0);
    expect(result.summary.fieldsMissing).toBe(0);
    expect(result.differences).toEqual([]);
  });

  it('detects removed fields', async () => {
    const before = { a: 1, b: 2, c: 3 };
    const after = { a: 1, c: 3 };  // ❌ b is missing

    pipelineValidator.captureSnapshot('before', before);
    pipelineValidator.captureSnapshot('after', after);

    const result = pipelineValidator.compareSnapshots(0, 1);

    expect(result.summary.fieldsMissing).toBe(1);
    expect(result.differences).toContainEqual(
      expect.objectContaining({
        path: 'b',
        type: 'removed'
      })
    );
  });

  it('detects type mismatches', async () => {
    const before = { score: 85 };      // number
    const after = { score: "85" };     // string

    pipelineValidator.captureSnapshot('before', before);
    pipelineValidator.captureSnapshot('after', after);

    const result = pipelineValidator.compareSnapshots(0, 1);

    expect(result.summary.warnings).toBeGreaterThan(0);
    expect(result.differences[0].type).toBe('type_changed');
  });
});
`;
}

/**
 * EXAMPLE 9: Error Tracking Integration
 *
 * Send inconsistencies to error tracking service
 */
export function example9_ErrorTrackingIntegration() {
  return `
// Send pipeline issues to Sentry/DataDog/etc

import { pipelineValidator, logMismatch } from '@/utils/pipelineConsistencyValidator';
import * as Sentry from "@sentry/react";

function validateAndReport() {
  const comparison = pipelineValidator.compareSnapshots(0, 1);

  if (comparison.summary.critical > 0) {
    // Log to console
    logMismatch(comparison);

    // Send to error tracking
    Sentry.captureException(new Error('Pipeline consistency failure'), {
      tags: {
        type: 'pipeline_error',
        layer: comparison.from.layer,
        target: comparison.to.layer
      },
      contexts: {
        pipeline: {
          differences: comparison.differences.map(d => ({
            path: d.path,
            type: d.type,
            description: d.description
          })),
          critical: comparison.summary.critical
        }
      }
    });
  }
}
`;
}

/**
 * EXAMPLE 10: Real-time Dashboard
 *
 * Display pipeline health in UI
 */
export function example10_HealthDashboard() {
  return `
import React from 'react';
import { pipelineValidator } from '@/utils/pipelineConsistencyValidator';

function PipelineHealthDashboard() {
  const [health, setHealth] = React.useState(null);

  React.useEffect(() => {
    const checkHealth = () => {
      if (pipelineValidator.comparisons.length === 0) return;

      const latestComparison = pipelineValidator.comparisons[
        pipelineValidator.comparisons.length - 1
      ];

      setHealth({
        critical: latestComparison.summary.critical,
        warnings: latestComparison.summary.warnings,
        fieldsMissing: latestComparison.summary.fieldsMissing,
        status: latestComparison.summary.critical === 0 ? 'healthy' : 'warning'
      });
    };

    const interval = setInterval(checkHealth, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!health) return null;

  return (
    <div className="pipeline-health">
      <div className={health.status}>
        <span>🔄 Pipeline Health</span>
        <span>{health.critical === 0 ? '✅' : '❌'}</span>
      </div>
      <div className="details">
        <p>Critical: {health.critical}</p>
        <p>Warnings: {health.warnings}</p>
        <p>Missing Fields: {health.fieldsMissing}</p>
      </div>
    </div>
  );
}
`;
}

export const PipelineExamples = {
  example1_APIResponseCapture,
  example2_FrontendTransformation,
  example3_FullPipeline,
  example4_ContinuousMonitoring,
  example5_QuickValidation,
  example6_FieldLossDetection,
  example7_TypeMismatchDetection,
  example8_IntegrationTest,
  example9_ErrorTrackingIntegration,
  example10_HealthDashboard,
};
