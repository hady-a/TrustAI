/**
 * Master Test Runner UI
 *
 * Comprehensive test suite interface for running all system validations
 * and displaying results in real-time.
 */

import { useState } from 'react';
import { Play, StopCircle, CheckCircle, XCircle, AlertCircle, Settings } from 'lucide-react';
import { runMasterTest, type MasterTestResult } from '../utils/masterTestRunner';

export default function MasterTestRunnerUI() {
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<MasterTestResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [apiEndpoint, setApiEndpoint] = useState('http://localhost:3000/api/analyze/business');
  const [requestCount, setRequestCount] = useState(10);
  const [autoRunning, setAutoRunning] = useState(false);

  const handleRun = async () => {
    setIsRunning(true);
    setError(null);
    setResult(null);

    try {
      const testResult = await runMasterTest({
        apiEndpoint,
        requestCount,
        verbose: true,
      });
      setResult(testResult);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      console.error('Master test error:', err);
    } finally {
      setIsRunning(false);
    }
  };

  const handleAutoRun = async () => {
    if (autoRunning) return;
    setAutoRunning(true);

    // Run test every 30 seconds
    const interval = setInterval(async () => {
      try {
        const testResult = await runMasterTest({
          apiEndpoint,
          requestCount,
          verbose: false,
        });
        setResult(testResult);
      } catch (err) {
        console.error('Auto-run test error:', err);
      }
    }, 30000);

    // Run immediately
    await handleRun();

    // Store interval ID for cleanup
    (window as any).masterTestInterval = interval;
  };

  const handleStopAutoRun = () => {
    if ((window as any).masterTestInterval) {
      clearInterval((window as any).masterTestInterval);
    }
    setAutoRunning(false);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">🏁 Master Test Runner</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Run complete system validation: validators, UI stress test, and real API tests
        </p>
      </div>

      {/* Configuration */}
      <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Settings className="w-5 h-5" />
          Configuration
        </h2>

        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              API Endpoint
            </label>
            <input
              type="text"
              value={apiEndpoint}
              onChange={(e) => setApiEndpoint(e.target.value)}
              disabled={isRunning}
              placeholder="http://localhost:3000/api/analyze/business"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Request Count (Stress Test)
            </label>
            <input
              type="number"
              title="Number of requests for stress test"
              value={requestCount}
              onChange={(e) => setRequestCount(Math.max(1, parseInt(e.target.value) || 10))}
              disabled={isRunning}
              min="1"
              max="100"
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm
                         bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                         disabled:opacity-50 disabled:cursor-not-allowed"
            />
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-3 flex-wrap">
        <button
          onClick={handleRun}
          disabled={isRunning}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700
                     disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
        >
          <Play className="w-4 h-4" />
          {isRunning ? 'Running...' : 'Run Test'}
        </button>

        <button
          onClick={autoRunning ? handleStopAutoRun : handleAutoRun}
          disabled={isRunning}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium
                      ${autoRunning ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-amber-600 hover:bg-amber-700 text-white'}
                      disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          <StopCircle className="w-4 h-4" />
          {autoRunning ? 'Stop Auto-Run' : 'Auto-Run (30s)'}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
          <p className="text-red-700 dark:text-red-400 font-medium">❌ Error</p>
          <p className="text-red-600 dark:text-red-500 text-sm mt-1">{error}</p>
        </div>
      )}

      {/* Results */}
      {result && (
        <div className="space-y-4">
          {/* Overall Status */}
          <div
            className={`p-6 rounded-lg border-2 ${
              result.overallStatus === 'PASS'
                ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-300 dark:border-emerald-700'
                : 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'
            }`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  {result.overallStatus === 'PASS' ? (
                    <>
                      <CheckCircle className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                      All Tests Passed ✅
                    </>
                  ) : (
                    <>
                      <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
                      Tests Failed ❌
                    </>
                  )}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{result.verdicts.reason}</p>
              </div>
              <div className="text-right">
                <p className={`text-sm font-mono ${result.verdicts.production_ready ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                  {result.verdicts.production_ready ? '👉 Production Ready' : '👉 Requires Fixes'}
                </p>
              </div>
            </div>
          </div>

          {/* Test Summary */}
          <div className="grid grid-cols-3 gap-4">
            <TestStatusCard
              title="Validator Tests"
              status={result.summary.validator}
              details={
                result.details.validator
                  ? `${result.details.validator.successCount}/${result.details.validator.testCount} passed`
                  : 'N/A'
              }
            />
            <TestStatusCard
              title="UI Stress Test"
              status={result.summary.uiStress}
              details={
                result.details.uiStress
                  ? `${result.details.uiStress.raceConditions} race conditions`
                  : 'N/A'
              }
            />
            <TestStatusCard
              title="API Stress Test"
              status={result.summary.apiStress}
              details={
                result.details.apiStress
                  ? `${result.metrics.successfulRequests}/${result.metrics.totalRequests} successful`
                  : 'N/A'
              }
            />
          </div>

          {/* Metrics */}
          <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white">📊 Performance Metrics</h3>

            <div className="grid grid-cols-2 gap-4">
              <MetricWidget
                label="Avg Response Time"
                value={`${result.metrics.avgResponseTime.toFixed(0)}ms`}
                limit="< 2000ms"
                passed={result.metrics.avgResponseTime < 2000}
              />
              <MetricWidget
                label="Std Deviation"
                value={`${result.metrics.stdDeviation.toFixed(0)}ms`}
                limit="< 500ms"
                passed={result.metrics.stdDeviation < 500}
              />
              <MetricWidget
                label="Responses Consistent"
                value={result.metrics.responsesConsistent ? 'Yes' : 'No'}
                passed={result.metrics.responsesConsistent}
              />
              <MetricWidget
                label="Responses In Order"
                value={result.metrics.responsesInOrder ? 'Yes' : 'No'}
                passed={result.metrics.responsesInOrder}
              />
            </div>
          </div>

          {/* Issues */}
          {result.issues.length > 0 && (
            <div className="space-y-3 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
              <h3 className="font-semibold text-amber-900 dark:text-amber-100 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                Issues ({result.issues.length})
              </h3>
              <div className="space-y-2">
                {result.issues.map((issue: string, i: number) => (
                  <p key={i} className="text-sm text-amber-800 dark:text-amber-200">
                    {issue}
                  </p>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {result.recommendations.length > 0 && (
            <div className="space-y-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <h3 className="font-semibold text-blue-900 dark:text-blue-100">💡 Recommendations</h3>
              <ol className="space-y-2">
                {result.recommendations.map((rec: string, i: number) => (
                  <li key={i} className="text-sm text-blue-800 dark:text-blue-200">
                    {i + 1}. {rec}
                  </li>
                ))}
              </ol>
            </div>
          )}

          {/* Metadata */}
          <div className="text-xs text-gray-500 dark:text-gray-400 flex justify-between">
            <span>Duration: {result.duration}ms</span>
            <span>{new Date(result.timestamp).toLocaleTimeString()}</span>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Test status card component
 */
function TestStatusCard({
  title,
  status,
  details,
}: {
  title: string;
  status: 'PASS' | 'FAIL';
  details?: string;
}) {
  return (
    <div
      className={`p-4 rounded-lg border-2 ${
        status === 'PASS'
          ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-300 dark:border-emerald-700'
          : 'bg-red-50 dark:bg-red-900/10 border-red-300 dark:border-red-700'
      }`}
    >
      <p className="text-sm font-medium text-gray-900 dark:text-white">{title}</p>
      <p
        className={`text-lg font-bold mt-1 ${status === 'PASS' ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}
      >
        {status === 'PASS' ? '✅ PASS' : '❌ FAIL'}
      </p>
      {details && <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{details}</p>}
    </div>
  );
}

/**
 * Metric widget component
 */
function MetricWidget({
  label,
  value,
  limit,
  passed,
}: {
  label: string;
  value: string;
  limit?: string;
  passed?: boolean;
}) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-medium text-gray-700 dark:text-gray-300">{label}</p>
      <p className={`text-2xl font-bold ${passed === false ? 'text-red-600 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
        {value}
      </p>
      {limit && <p className="text-xs text-gray-500 dark:text-gray-500">{limit}</p>}
    </div>
  );
}
