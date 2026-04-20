/**
 * Data Validation Debugger Component
 *
 * Demonstrates the complete validation pipeline for analysis results:
 * 1. Analysis Validator - comprehensive field and range checks
 * 2. Real API Validator - full 6-stage pipeline validation
 * 3. Pipeline Consistency Validator - deep layer comparison
 *
 * This component can be added to dev/debug views for visibility into data flow.
 */

import { useState } from 'react';
import { ChevronDown, CheckCircle, XCircle } from 'lucide-react';
import {
  validateAnalysisResult,
  isCompleteAnalysis,
  hasPartialAnalysis,
  type ValidationResult,
} from '../utils/analysisValidator';
import { quickValidate } from '../utils/pipelineConsistencyValidator';

interface DataValidationDebuggerProps {
  analysisData?: Record<string, any> | null;
  apiResponse?: Record<string, any> | null;
  transformedData?: Record<string, any> | null;
  isOpen?: boolean;
}

/**
 * Status indicator component
 */
function StatusIndicator({
  valid,
  label,
  count,
}: {
  valid: boolean;
  label: string;
  count?: number;
}) {
  return (
    <div className="flex items-center gap-2 py-1">
      {valid ? (
        <CheckCircle className="w-4 h-4 text-emerald-600" />
      ) : (
        <XCircle className="w-4 h-4 text-red-600" />
      )}
      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
        {label}
        {count !== undefined && <span className="ml-2 text-xs text-gray-500">({count})</span>}
      </span>
    </div>
  );
}

/**
 * Validation results panel
 */
function ValidationPanel({
  title,
  result,
  icon,
}: {
  title: string;
  result: ValidationResult;
  icon: string;
}) {
  return (
    <div className="space-y-2 p-3 bg-gray-50 dark:bg-gray-800/50 rounded border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2">
        <span className="text-lg">{icon}</span>
        <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100">{title}</h4>
      </div>

      <StatusIndicator
        valid={result.valid}
        label={`Overall: ${result.valid ? 'Valid' : 'Invalid'}`}
      />

      <div className="space-y-1 text-xs">
        <StatusIndicator valid={result.checks.hasSuccess} label="Has success flag" />
        <StatusIndicator valid={result.checks.hasFace} label="Has face data" />
        <StatusIndicator valid={result.checks.hasVoice} label="Has voice data" />
        <StatusIndicator valid={result.checks.hasCredibility} label="Has credibility data" />
        <StatusIndicator valid={result.checks.confidenceInRange} label="Confidence in range" />
        <StatusIndicator valid={result.checks.credibilityInRange} label="Credibility in range" />
        <StatusIndicator valid={result.checks.stressInRange} label="Stress in range" />
        <StatusIndicator valid={result.checks.confidenceConsistent} label="Confidence consistent" />
      </div>

      {result.errors.length > 0 && (
        <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
          <p className="text-xs font-semibold text-red-700 dark:text-red-400 mb-1">Errors:</p>
          {result.errors.map((err, i) => (
            <p key={i} className="text-xs text-red-600 dark:text-red-400">
              • {err}
            </p>
          ))}
        </div>
      )}

      {result.warnings.length > 0 && (
        <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-900/20 rounded border border-amber-200 dark:border-amber-800">
          <p className="text-xs font-semibold text-amber-700 dark:text-amber-400 mb-1">Warnings:</p>
          {result.warnings.map((warn, i) => (
            <p key={i} className="text-xs text-amber-600 dark:text-amber-300">
              • {warn}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Main Debugger Component
 */
export default function DataValidationDebugger({
  analysisData,
  apiResponse,
  transformedData,
  isOpen: initialOpen = false,
}: DataValidationDebuggerProps) {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [consistency, setConsistency] = useState<{
    consistent: boolean;
    differences?: number;
  } | null>(null);

  // Run validation when data changes
  const handleValidate = () => {
    if (!analysisData) return;

    // 1. Run analysis validator
    const result = validateAnalysisResult(analysisData);
    setValidation(result);

    // 2. Run pipeline consistency check if we have multiple data points
    if (apiResponse && transformedData) {
      const result = quickValidate('Pipeline Consistency', apiResponse, transformedData);
      setConsistency({ consistent: result });
    }

    console.group('📊 Data Validation Report');
    console.log('Analysis Validation:', result);
    console.log('Data Completeness:', {
      isComplete: isCompleteAnalysis(analysisData),
      isPartial: hasPartialAnalysis(analysisData),
    });
    if (consistency) {
      console.log('Pipeline Consistency:', consistency);
    }
    console.groupEnd();
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 px-3 py-2 bg-blue-600 text-white text-xs font-semibold rounded-lg shadow-lg hover:bg-blue-700 transition-colors"
      >
        🔍 Debug
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 max-h-96 bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
          🔍 Data Validation Debugger
        </h3>
        <button
          onClick={() => setIsOpen(false)}
          title="Close debugger"
          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="overflow-y-auto flex-1 p-3 space-y-3">
        {!analysisData ? (
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded border border-amber-200 dark:border-amber-800">
            <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
              ⚠️ No analysis data provided
            </p>
          </div>
        ) : (
          <>
            {validation && (
              <ValidationPanel title="Analysis Validator" result={validation} icon="📋" />
            )}

            {consistency && (
              <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded border border-gray-200 dark:border-gray-700">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🔄</span>
                  <h4 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
                    Pipeline Consistency
                  </h4>
                </div>
                <div className="mt-2">
                  <StatusIndicator
                    valid={consistency.consistent}
                    label={consistency.consistent ? 'Consistent' : 'Has differences'}
                    count={consistency.differences}
                  />
                </div>
              </div>
            )}

            <button
              onClick={handleValidate}
              className="w-full px-3 py-2 bg-blue-600 text-white text-xs font-semibold rounded hover:bg-blue-700 transition-colors"
            >
              🔍 Validate Now
            </button>
          </>
        )}
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-xs text-gray-600 dark:text-gray-400">
        Data points: {[analysisData && 'analysis', apiResponse && 'api', transformedData && 'transformed']
          .filter(Boolean)
          .join(', ') || 'none'}
      </div>
    </div>
  );
}
