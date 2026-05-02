/**
 * Stress Test UI Component
 *
 * Interactive component for running and monitoring stress tests
 * with real-time progress and detailed results
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, RotateCcw, ChevronDown, AlertTriangle, CheckCircle } from 'lucide-react';
import {
  runAnalysisStressTest,
  printStressTestReport,
  type StressTestResult,
} from '../utils/stressTestAnalysisSystem';

interface StressTestUIProps {
  isOpen?: boolean;
}

export default function StressTestUI({ isOpen: initialOpen = false }: StressTestUIProps) {
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<StressTestResult | null>(null);
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    issues: true,
    recommendations: true,
  });

  const toggleSection = (section: string) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleRunTest = async () => {
    setIsRunning(true);
    setProgress(0);
    setResults(null);

    // Update progress every 100ms
    const progressInterval = setInterval(() => {
      setProgress((prev) => Math.min(prev + 2, 90));
    }, 100);

    try {
      const result = await runAnalysisStressTest({
        requestCount: 10,
        verbose: false,
      });

      setResults(result);
      setProgress(100);

      // Print to console for additional visibility
      printStressTestReport(result);
    } catch (error) {
      console.error('Stress test error:', error);
      setResults(null);
    } finally {
      clearInterval(progressInterval);
      setIsRunning(false);
    }
  };

  const handleReset = () => {
    setResults(null);
    setProgress(0);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 left-4 px-4 py-2 bg-orange-600 text-white text-xs font-semibold rounded-lg shadow-lg hover:bg-orange-700 transition-colors"
      >
        🔥 Stress Test
      </button>
    );
  }

  return (
    <div className="fixed bottom-4 left-4 w-96 max-h-[80vh] bg-white dark:bg-gray-900 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden flex flex-col z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-900/20 border-b border-gray-200 dark:border-gray-700">
        <h3 className="font-semibold text-sm text-gray-900 dark:text-gray-100">
          🔥 Analysis Stress Test
        </h3>
        <button
          onClick={() => setIsOpen(false)}
          className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
        >
          <ChevronDown className="w-4 h-4" />
        </button>
      </div>

      {/* Content */}
      <div className="overflow-y-auto flex-1 p-4 space-y-4">
        {/* Controls */}
        {!results && (
          <div className="space-y-2">
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Run 10 rapid analyses to detect race conditions, stale data, and async bugs
            </p>

            <button
              onClick={handleRunTest}
              disabled={isRunning}
              className="w-full px-3 py-2 bg-orange-600 text-white text-sm font-semibold rounded hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isRunning ? (
                <>
                  <div className="animate-spin">⏳</div>
                  Testing...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Start Stress Test
                </>
              )}
            </button>

            {/* Progress */}
            {isRunning && (
              <div className="space-y-1">
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded h-2 overflow-hidden">
                  <motion.div
                    className="h-full bg-orange-600"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                    transition={{ duration: 0.1 }}
                  />
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">{progress}%</p>
              </div>
            )}
          </div>
        )}

        {/* Results */}
        <AnimatePresence>
          {results && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              {/* Overall Status */}
              <div
                className={`p-3 rounded border ${
                  results.summary.passed
                    ? 'bg-emerald-50 dark:bg-emerald-900/20 border-emerald-200 dark:border-emerald-800'
                    : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
                }`}
              >
                <div className="flex items-center gap-2">
                  {results.summary.passed ? (
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-red-600" />
                  )}
                  <span
                    className={`text-sm font-semibold ${
                      results.summary.passed
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-red-700 dark:text-red-400'
                    }`}
                  >
                    {results.summary.passed ? '✅ PASSED' : '❌ FAILED'}
                  </span>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <p className="text-gray-600 dark:text-gray-400">Duration</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {results.duration}ms
                  </p>
                </div>
                <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded">
                  <p className="text-gray-600 dark:text-gray-400">Completed</p>
                  <p className="font-semibold text-gray-900 dark:text-gray-100">
                    {results.completedRequests}/{results.totalRequests}
                  </p>
                </div>
              </div>

              {/* Issues */}
              {results.summary.issues.length > 0 && (
                <div className="space-y-2">
                  <button
                    onClick={() => toggleSection('issues')}
                    className="w-full flex items-center justify-between p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                  >
                    <span className="text-xs font-semibold text-red-700 dark:text-red-400">
                      ❌ {results.summary.issues.length} Issue{results.summary.issues.length !== 1 ? 's' : ''}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${
                        expandedSections.issues ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  <AnimatePresence>
                    {expandedSections.issues && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="space-y-1 pl-2 border-l-2 border-red-200 dark:border-red-800"
                      >
                        {results.summary.issues.map((issue, i) => (
                          <p key={i} className="text-xs text-red-700 dark:text-red-400">
                            • {issue}
                          </p>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Race Conditions */}
              {results.raceConditions.length > 0 && (
                <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
                  <p className="text-xs font-semibold text-red-700 dark:text-red-400">
                    🔄 {results.raceConditions.length} Race Condition{results.raceConditions.length !== 1 ? 's' : ''}
                  </p>
                </div>
              )}

              {/* Stale Data */}
              {results.staleDataIssues.length > 0 && (
                <div className="p-2 bg-amber-50 dark:bg-amber-900/20 rounded border border-amber-200 dark:border-amber-800">
                  <p className="text-xs font-semibold text-amber-700 dark:text-amber-400">
                    ⚠️ {results.staleDataIssues.length} Stale Data Issue{results.staleDataIssues.length !== 1 ? 's' : ''}
                  </p>
                </div>
              )}

              {/* Flickering */}
              {results.flickeringDetected && (
                <div className="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
                  <p className="text-xs font-semibold text-yellow-700 dark:text-yellow-400">
                    📊 {results.flickeringInstances.length} Flickering Instance{results.flickeringInstances.length !== 1 ? 's' : ''}
                  </p>
                </div>
              )}

              {/* Recommendations */}
              {results.summary.recommendations.length > 0 && (
                <div className="space-y-2">
                  <button
                    onClick={() => toggleSection('recommendations')}
                    className="w-full flex items-center justify-between p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                  >
                    <span className="text-xs font-semibold text-blue-700 dark:text-blue-400">
                      💡 {results.summary.recommendations.length} Recommendation{results.summary.recommendations.length !== 1 ? 's' : ''}
                    </span>
                    <ChevronDown
                      className={`w-4 h-4 transition-transform ${
                        expandedSections.recommendations ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  <AnimatePresence>
                    {expandedSections.recommendations && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="space-y-1 pl-2 border-l-2 border-blue-200 dark:border-blue-800"
                      >
                        {results.summary.recommendations.map((rec, i) => (
                          <p key={i} className="text-xs text-blue-700 dark:text-blue-400">
                            • {rec}
                          </p>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Consistency */}
              <div className="space-y-1 p-2 bg-gray-50 dark:bg-gray-800 rounded text-xs">
                <p className="font-semibold text-gray-900 dark:text-gray-100 mb-1">Consistency:</p>
                <div className="space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Value Consistency</span>
                    <span>{results.consistency.valueConsistent ? '✅' : '❌'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">State History Clean</span>
                    <span>{results.consistency.stateHistoryClean ? '✅' : '❌'}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600 dark:text-gray-400">No Memory Leak</span>
                    <span>{results.consistency.noMemoryLeak ? '✅' : '❌'}</span>
                  </div>
                </div>
              </div>

              {/* Reset Button */}
              <button
                onClick={handleReset}
                className="w-full px-3 py-2 bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-gray-100 text-xs font-semibold rounded hover:bg-gray-400 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
              >
                <RotateCcw className="w-4 h-4" />
                Run Again
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div className="p-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 text-xs text-gray-600 dark:text-gray-400">
        Tests for: race conditions, stale data, flickering, memory leaks
      </div>
    </div>
  );
}
