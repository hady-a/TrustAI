import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle, TrendingUp, Zap, Clock } from 'lucide-react';
import {
  checkDataAvailability,
  getSafeScore,
  getSafeString,
  getMissingDataMessage,
  getScoreColor,
  getScoreBgColor,
  getScoreLabel,
  getSafePercentage,
  isValidAnalysisData,
  type DataAvailability,
} from '../utils/dataValidation';

interface LiveAnalysisResult {
  timestamp: string;
  status: 'processing' | 'complete' | 'error';
  data?: Record<string, any> | null;
  error?: string;
}

interface LiveAnalysisDisplayProps {
  result: LiveAnalysisResult | null;
  isAnalyzing: boolean;
}

/**
 * EmptyStateCard - Displays when no data is available for a section
 */
function EmptyStateCard({ icon, title, message }: { icon: string; title: string; message: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 text-center"
    >
      <div className="text-2xl mb-2">{icon}</div>
      <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{title}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{message}</p>
    </motion.div>
  );
}

/**
 * SafeMetricCard - Safely displays a metric with fallback
 */
function SafeMetricCard({
  label,
  value,
  unit = '',
  icon = '📊',
  isBad = false,
}: {
  label: string;
  value: any;
  unit?: string;
  icon?: string;
  isBad?: boolean;
}) {
  if (value === undefined || value === null || value === 'N/A') {
    return <EmptyStateCard icon="⚠️" title={label} message="Data not available" />;
  }

  const safeValue = typeof value === 'number' ? value : value;
  const display = typeof safeValue === 'number' ? `${Math.round(safeValue)}${unit}` : String(value);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
    >
      <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 capitalize mb-2">{label}</p>
      <p className={`text-lg font-bold ${isBad ? getScoreColor(safeValue as number, true) : getScoreColor(safeValue as number, false)}`}>
        {display}
      </p>
    </motion.div>
  );
}

/**
 * Main Component: SafeLiveAnalysisDisplay
 */
export default function LiveAnalysisDisplay({
  result,
  isAnalyzing,
}: LiveAnalysisDisplayProps) {
  const [resultHistory, setResultHistory] = useState<LiveAnalysisResult[]>([]);
  const [animatedScores, setAnimatedScores] = useState({ deception: 0, credibility: 0 });
  const [dataAvailability, setDataAvailability] = useState<DataAvailability | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  // ============ SAFE DATA VALIDATION & ANIMATION ============
  useEffect(() => {
    if (!result) return;

    console.log('📊 [SafeLiveAnalysisDisplay] Result received:', result);

    // Validate result structure
    if (!result.data || !isValidAnalysisData(result.data)) {
      console.warn('⚠️ [SafeLiveAnalysisDisplay] Invalid or missing data structure');
      setDataAvailability(checkDataAvailability(null));
      setResultHistory((prev) => [...prev, result]);
      return;
    }

    // Check what data is available
    const availability = checkDataAvailability(result.data);
    setDataAvailability(availability);
    console.log('📊 [SafeLiveAnalysisDisplay] Data availability:', availability);

    setResultHistory((prev) => [...prev, result]);

    // Only animate if we have valid complete data
    if (result.status === 'complete' && availability.hasDeceptionScore && availability.hasCredibilityScore) {
      console.log('✓ [SafeLiveAnalysisDisplay] Starting score animation');
      const duration = 1000;
      const startTime = Date.now();

      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);

        setAnimatedScores({
          deception: getSafeScore(result.data?.deceptionScore, 0) * progress,
          credibility: getSafeScore(result.data?.credibilityScore, 0) * progress,
        });

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      animate();
    } else if (result.status === 'complete') {
      // No animation needed - just show static values
      setAnimatedScores({
        deception: getSafeScore(result.data?.deceptionScore, 0),
        credibility: getSafeScore(result.data?.credibilityScore, 0),
      });
    }

    // Auto-scroll
    setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, 100);
  }, [result]);

  // ============ EARLY GUARDS - NO DATA ============
  if (!result) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-8 text-center bg-gray-50 dark:bg-gray-900/30 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl"
      >
        <p className="text-gray-600 dark:text-gray-400">
          {isAnalyzing ? 'Analyzing...' : 'Start recording to see live analysis results...'}
        </p>
      </motion.div>
    );
  }

  // ============ ERROR STATE ============
  if (result.status === 'error') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl"
      >
        <div className="flex gap-3 mb-3">
          <AlertCircle className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0" />
          <div>
            <h3 className="font-semibold text-red-900 dark:text-red-100">Analysis Failed</h3>
            <p className="text-sm text-red-800 dark:text-red-200 mt-1">
              {getSafeString(result.error, 'An error occurred during analysis')}
            </p>
          </div>
        </div>
      </motion.div>
    );
  }

  // ============ PROCESSING STATE ============
  if (result.status === 'processing' || isAnalyzing) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-6 text-center"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity }}
          className="inline-block"
        >
          <Zap className="w-8 h-8 text-amber-500" />
        </motion.div>
        <p className="text-gray-600 dark:text-gray-400 mt-3">Processing analysis...</p>
      </motion.div>
    );
  }

  // ============ SAFE COMPLETE STATE - WITH GUARDS ============
  if (!dataAvailability) {
    return (
      <EmptyStateCard
        icon="⚠️"
        title="Invalid Data"
        message="Unable to process analysis data"
      />
    );
  }

  // If absolutely no data at all
  if (!dataAvailability.isComplete && !dataAvailability.hasFaceData &&
      !dataAvailability.hasVoiceData && !dataAvailability.hasCredibilityData) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="p-8 text-center bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl"
      >
        <AlertCircle className="w-8 h-8 text-yellow-600 dark:text-yellow-400 mx-auto mb-2" />
        <p className="text-yellow-800 dark:text-yellow-200 font-medium">Analysis Incomplete</p>
        <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-2">
          No face, voice, or credibility data available. Please ensure audio and/or image are properly provided.
        </p>
      </motion.div>
    );
  }

  return (
    <div className="w-full space-y-6" ref={resultRef}>
      {/* ============ HEADER ============ */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/30 rounded-xl"
      >
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Analysis Results</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {dataAvailability.isComplete ? 'Complete analysis' : 'Partial analysis available'}
          </p>
        </div>
        <div className="flex gap-2">
          {dataAvailability.hasFaceData && <span className="text-sm px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded">Face</span>}
          {dataAvailability.hasVoiceData && <span className="text-sm px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded">Voice</span>}
          {dataAvailability.hasCredibilityData && <span className="text-sm px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded">Credibility</span>}
        </div>
      </motion.div>

      {/* ============ MAIN SCORES SECTION ============ */}
      <AnimatePresence>
        {(dataAvailability.hasDeceptionScore || dataAvailability.hasCredibilityScore) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-2 md:grid-cols-3 gap-4"
          >
            {/* Deception Score */}
            {dataAvailability.hasDeceptionScore ? (
              <motion.div
                className={`p-4 rounded-lg border ${getScoreBgColor(animatedScores.deception, true)}`}
                whileHover={{ scale: 1.02 }}
              >
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Deception Risk</p>
                <div className="flex items-end gap-2 mb-3">
                  <motion.span
                    className={`text-3xl font-bold ${getScoreColor(animatedScores.deception, true)}`}
                    key={`deception-${animatedScores.deception}`}
                  >
                    {Math.round(animatedScores.deception)}
                  </motion.span>
                  <span className="text-sm text-gray-600 dark:text-gray-400 mb-1">%</span>
                </div>
                <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${animatedScores.deception}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-yellow-500 to-red-500"
                  />
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {getScoreLabel(animatedScores.deception, true)}
                </p>
              </motion.div>
            ) : (
              <EmptyStateCard icon="⚠️" title="Deception" message={getMissingDataMessage('deception')} />
            )}

            {/* Credibility Score */}
            {dataAvailability.hasCredibilityScore ? (
              <motion.div
                className={`p-4 rounded-lg border ${getScoreBgColor(animatedScores.credibility, false)}`}
                whileHover={{ scale: 1.02 }}
              >
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Credibility</p>
                <div className="flex items-end gap-2 mb-3">
                  <motion.span
                    className={`text-3xl font-bold ${getScoreColor(animatedScores.credibility, false)}`}
                    key={`credibility-${animatedScores.credibility}`}
                  >
                    {Math.round(animatedScores.credibility)}
                  </motion.span>
                  <span className="text-sm text-gray-600 dark:text-gray-400 mb-1">%</span>
                </div>
                <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${animatedScores.credibility}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-green-500 to-blue-500"
                  />
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                  {getScoreLabel(animatedScores.credibility, false)}
                </p>
              </motion.div>
            ) : (
              <EmptyStateCard icon="⚠️" title="Credibility" message={getMissingDataMessage('credibility')} />
            )}

            {/* Confidence */}
            {dataAvailability.hasConfidence ? (
              <motion.div
                className="p-4 rounded-lg border bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                whileHover={{ scale: 1.02 }}
              >
                <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Confidence</p>
                <div className="flex items-end gap-2 mb-3">
                  <motion.span className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                    {Math.round(getSafeScore(result.data?.confidence, 0) * 100)}
                  </motion.span>
                  <span className="text-sm text-gray-600 dark:text-gray-400 mb-1">%</span>
                </div>
                <div className="w-full h-2 bg-blue-200 dark:bg-blue-800 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.round(getSafeScore(result.data?.confidence, 0) * 100)}%` }}
                    transition={{ duration: 1.2, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500"
                  />
                </div>
              </motion.div>
            ) : (
              <EmptyStateCard icon="❓" title="Confidence" message={getMissingDataMessage('confidence')} />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============ METRICS SECTION ============ */}
      <AnimatePresence>
        {dataAvailability.hasMetrics && result.data?.metrics && Object.keys(result.data.metrics).length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-4 bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-800 rounded-xl"
          >
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Detailed Metrics</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(result.data.metrics).map(([key, value]) => (
                <SafeMetricCard
                  key={key}
                  label={key.replace(/_/g, ' ')}
                  value={value}
                  unit={typeof value === 'number' ? '%' : ''}
                />
              ))}
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* ============ INSIGHTS SECTION ============ */}
      <AnimatePresence>
        {dataAvailability.hasInsights && result.data?.insights && result.data.insights.length > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border border-blue-200 dark:border-blue-800 rounded-xl"
          >
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Key Insights</h4>
                <div className="space-y-2">
                  {result.data.insights.map((insight: any, idx: number) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="text-sm text-gray-700 dark:text-gray-300 flex gap-2"
                    >
                      <span className="text-blue-600 dark:text-blue-400 font-bold">•</span>
                      <span>{getSafeString(insight, 'Analysis insight')}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {/* ============ TIMESTAMP ============ */}
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 px-2"
          >
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>
                {result.timestamp
                  ? new Date(result.timestamp).toLocaleTimeString()
                  : 'Time unknown'}
              </span>
            </div>
            {result.status === 'complete' && dataAvailability?.isComplete && (
              <span className="flex items-center gap-1 text-green-600 dark:text-green-400">
                <CheckCircle className="w-4 h-4" />
                Complete
              </span>
            )}
            {result.status === 'complete' && !dataAvailability?.isComplete && (
              <span className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400">
                <AlertCircle className="w-4 h-4" />
                Partial
              </span>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ============ HISTORY ============ */}
      {resultHistory.length > 1 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-900/30 dark:to-slate-900/30 border border-gray-200 dark:border-gray-800 rounded-xl"
        >
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Analysis History</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {resultHistory.slice(-5).map((item, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between p-2 bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 text-xs"
              >
                <span className="text-gray-600 dark:text-gray-400">
                  {new Date(item.timestamp).toLocaleTimeString()}
                </span>
                <div className="flex items-center gap-2">
                  {item.status === 'complete' && (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  )}
                  {item.status === 'error' && (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  )}
                  {item.status === 'processing' && (
                    <Zap className="w-4 h-4 text-amber-500" />
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}
    </div>
  );
}
