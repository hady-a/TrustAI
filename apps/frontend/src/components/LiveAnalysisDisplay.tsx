import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle, TrendingUp, Zap, Clock } from 'lucide-react';

interface LiveAnalysisResult {
  timestamp: string;
  status: 'processing' | 'complete' | 'error';
  data?: {
    deceptionScore?: number;
    credibilityScore?: number;
    confidence?: number;
    metrics?: {
      [key: string]: number | string;
    };
    insights?: string[];
  };
  error?: string;
}

interface LiveAnalysisDisplayProps {
  result: LiveAnalysisResult | null;
  isAnalyzing: boolean;
}

export default function LiveAnalysisDisplay({
  result,
  isAnalyzing,
}: LiveAnalysisDisplayProps) {
  const [resultHistory, setResultHistory] = useState<LiveAnalysisResult[]>([]);
  const [animatedScores, setAnimatedScores] = useState({ deception: 0, credibility: 0 });
  const resultRef = useRef<HTMLDivElement>(null);

  // Add new result to history and animate scores
  useEffect(() => {
    if (result) {
      console.log('📊 LiveAnalysisDisplay received result:', result);
      console.log('   - Status:', result.status);
      console.log('   - Data:', result.data);
      setResultHistory((prev) => [...prev, result]);

      // Animate scores when new result arrives
      if (result.data && result.status === 'complete') {
        console.log('✓ Starting score animation...');
        const duration = 1000; // 1 second animation
        const startTime = Date.now();

        const animate = () => {
          const elapsed = Date.now() - startTime;
          const progress = Math.min(elapsed / duration, 1);

          setAnimatedScores({
            deception: (result.data?.deceptionScore || 0) * progress,
            credibility: (result.data?.credibilityScore || 0) * progress,
          });

          if (progress < 1) {
            requestAnimationFrame(animate);
          }
        };

        animate();
      }

      // Auto-scroll to latest result
      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }, 100);
    }
  }, [result]);

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-red-600 dark:text-red-400';
    if (score >= 50) return 'text-orange-600 dark:text-orange-400';
    if (score >= 25) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  };

  const getScoreBgColor = (score: number) => {
    if (score >= 75) return 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800';
    if (score >= 50) return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
    if (score >= 25) return 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800';
    return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
  };

  const getScoreLabel = (type: 'deception' | 'credibility', score: number) => {
    if (type === 'deception') {
      if (score >= 75) return 'Very High';
      if (score >= 50) return 'Moderate';
      if (score >= 25) return 'Low';
      return 'Very Low';
    } else {
      if (score >= 75) return 'Highly Credible';
      if (score >= 50) return 'Credible';
      if (score >= 25) return 'Low Credibility';
      return 'Very Low';
    }
  };

  // Get risk level color coding
  const getRiskLevelColor = (score: number) => {
    if (score >= 75) return { bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-300 dark:border-red-700', text: 'text-red-700 dark:text-red-300', label: 'Critical' };
    if (score >= 50) return { bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-300 dark:border-orange-700', text: 'text-orange-700 dark:text-orange-300', label: 'High' };
    if (score >= 25) return { bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-300 dark:border-yellow-700', text: 'text-yellow-700 dark:text-yellow-300', label: 'Medium' };
    return { bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-300 dark:border-green-700', text: 'text-green-700 dark:text-green-300', label: 'Low' };
  };

  const getMetricColor = (value: string | number) => {
    if (typeof value === 'number') {
      if (value >= 75) return 'text-red-600 dark:text-red-400';
      if (value >= 50) return 'text-orange-600 dark:text-orange-400';
      if (value >= 25) return 'text-yellow-600 dark:text-yellow-400';
      return 'text-green-600 dark:text-green-400';
    }
    return 'text-gray-600 dark:text-gray-400';
  };

  // Guard: ensure result has valid data before rendering
  const hasValidData = result?.data && typeof result.data === 'object';

  return (
    <div className="w-full space-y-6" ref={resultRef}>
      {/* Analysis Status Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between p-4 bg-gradient-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/30 rounded-xl"
      >
        <div>
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Live Analysis</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Real-time results</p>
        </div>
        <div className="text-right">
          {isAnalyzing ? (
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
              <Zap className="w-6 h-6 text-amber-500" />
            </motion.div>
          ) : result && result.status === 'complete' ? (
            <CheckCircle className="w-6 h-6 text-green-500" />
          ) : result && result.status === 'error' ? (
            <AlertCircle className="w-6 h-6 text-red-500" />
          ) : null}
        </div>
      </motion.div>

      {/* No Analysis Available Fallback */}
      {result && !hasValidData && result.status !== 'error' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-6 text-center bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-xl"
        >
          <AlertCircle className="w-8 h-8 text-yellow-600 dark:text-yellow-400 mx-auto mb-2" />
          <p className="text-yellow-800 dark:text-yellow-200 font-medium">
            No analysis data available
          </p>
          <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
            The analysis is still processing or the response is incomplete.
          </p>
        </motion.div>
      )}

      {/* Current Metrics */}
      <AnimatePresence>
        {(isAnalyzing || (result && hasValidData)) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-3 gap-4"
          >
            {/* Deception Score */}
            <motion.div
              className={`p-4 rounded-lg border ${getScoreBgColor(animatedScores.deception)}`}
              whileHover={{ scale: 1.02 }}
            >
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Deception Score</p>
              <div className="flex items-end gap-2">
                <motion.span
                  className={`text-3xl font-bold ${getScoreColor(animatedScores.deception)}`}
                  key={`deception-${animatedScores.deception}`}
                >
                  {Math.round(animatedScores.deception)}
                </motion.span>
                <span className="text-sm text-gray-600 dark:text-gray-400 mb-1">%</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                {getScoreLabel('deception', animatedScores.deception)}
              </p>
            </motion.div>

            {/* Credibility Score */}
            <motion.div
              className={`p-4 rounded-lg border ${getScoreBgColor(100 - animatedScores.credibility)}`}
              whileHover={{ scale: 1.02 }}
            >
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Credibility Score</p>
              <div className="flex items-end gap-2">
                <motion.span
                  className={`text-3xl font-bold ${getScoreColor(100 - animatedScores.credibility)}`}
                  key={`credibility-${animatedScores.credibility}`}
                >
                  {Math.round(animatedScores.credibility)}
                </motion.span>
                <span className="text-sm text-gray-600 dark:text-gray-400 mb-1">%</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
                {getScoreLabel('credibility', animatedScores.credibility)}
              </p>
            </motion.div>

            {/* Confidence */}
            <motion.div
              className="p-4 rounded-lg border bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
              whileHover={{ scale: 1.02 }}
            >
              <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">Confidence</p>
              <div className="flex items-end gap-2">
                <motion.span
                  className="text-3xl font-bold text-blue-600 dark:text-blue-400"
                  key={`confidence-${result?.data?.confidence}`}
                >
                  {Math.round(((result?.data?.confidence as number) ?? 0) * 100)}
                </motion.span>
                <span className="text-sm text-gray-600 dark:text-gray-400 mb-1">%</span>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">Model confidence</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Score Progress Bars */}
      <AnimatePresence>
        {result && result.status === 'complete' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Deception Progress */}
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Deception Score</span>
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  {Math.round(animatedScores.deception)}%
                </span>
              </div>
              <motion.div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${animatedScores.deception}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-yellow-500 to-red-500"
                />
              </motion.div>
            </div>

            {/* Credibility Progress */}
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Credibility Score</span>
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">
                  {Math.round(animatedScores.credibility)}%
                </span>
              </div>
              <motion.div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${animatedScores.credibility}%` }}
                  transition={{ duration: 1, ease: 'easeOut' }}
                  className="h-full bg-gradient-to-r from-green-500 to-blue-500"
                />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Analysis Cards Section */}
      <AnimatePresence>
        {result && hasValidData && result.status === 'complete' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-4"
          >
            {/* Risk Level Card */}
            {result.data?.deceptionScore !== undefined && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className={`p-6 rounded-xl border-2 shadow-md ${getRiskLevelColor(result.data.deceptionScore).bg} ${getRiskLevelColor(result.data.deceptionScore).border}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-2">Risk Assessment</p>
                    <p className={`text-2xl font-bold ${getRiskLevelColor(result.data.deceptionScore).text}`}>
                      {getRiskLevelColor(result.data.deceptionScore).label}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Deception Score</p>
                    <p className={`text-3xl font-bold ${getScoreColor(result.data.deceptionScore)}`}>
                      {Math.round(result.data.deceptionScore)}%
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Analysis Details Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Transcript Card */}
              {result.data?.metrics?.transcription && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 }}
                  className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow"
                >
                  <h5 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">📝 Transcript</h5>
                  <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3">
                    {result.data.metrics.transcription || '(No transcription available)'}
                  </p>
                </motion.div>
              )}

              {/* Emotion Card */}
              {result.data?.metrics?.voice_emotion && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.15 }}
                  className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow"
                >
                  <h5 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">😊 Emotion</h5>
                  <p className={`text-lg font-bold ${getMetricColor(result.data.metrics.voice_emotion)}`}>
                    {result.data.metrics.voice_emotion || 'N/A'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Detected emotion from voice</p>
                </motion.div>
              )}

              {/* Stress Level Card */}
              {result.data?.metrics?.voice_stress !== undefined && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow"
                >
                  <h5 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">⚡ Stress Level</h5>
                  <div className="flex items-center gap-3">
                    <div className="flex-1">
                      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min((result.data.metrics.voice_stress as number) || 0, 100)}%` }}
                          transition={{ duration: 1 }}
                          className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500"
                        />
                      </div>
                    </div>
                    <p className={`text-lg font-bold min-w-fit ${getMetricColor(result.data.metrics.voice_stress)}`}>
                      {typeof result.data.metrics.voice_stress === 'number' ? `${Math.round(result.data.metrics.voice_stress)}%` : result.data.metrics.voice_stress}
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Credibility Card */}
              {result.data?.credibilityScore !== undefined && result.data?.deceptionScore !== undefined && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.25 }}
                  className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow"
                >
                  <h5 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-3">✓ Credibility</h5>
                  <p className={`text-2xl font-bold ${getScoreColor(100 - (result.data.deceptionScore || 0))}`}>
                    {Math.round(result.data.credibilityScore)}%
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">Overall credibility assessment</p>
                </motion.div>
              )}
            </div>

            {/* Confidence Report */}
            {result.data?.confidence !== undefined && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.3 }}
                  className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700 shadow-sm"
                >
                  <h5 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-3">📊 Model Confidence Report</h5>
                  <div className="flex items-center gap-4">
                    <div className="flex-1">
                      <div className="w-full h-3 bg-blue-200 dark:bg-blue-800 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(result.data.confidence * 100) || 0}%` }}
                          transition={{ duration: 1.2 }}
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-500"
                        />
                      </div>
                    </div>
                    <p className="text-sm font-bold text-blue-700 dark:text-blue-300 min-w-fit">
                      {Math.round((result.data.confidence || 0) * 100)}%
                    </p>
                  </div>
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">Confidence in analysis accuracy</p>
                </motion.div>
              )}
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {result?.data?.insights && Array.isArray(result.data.insights) && result.data.insights.length > 0 && (
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
                  {result.data.insights.map((insight, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="text-sm text-gray-700 dark:text-gray-300 flex gap-2"
                    >
                      <span className="text-blue-600 dark:text-blue-400 font-bold">•</span>
                      <span>{insight || 'Analysis insight'}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Detailed Metrics */}
      <AnimatePresence>
        {result?.data?.metrics && Object.keys(result.data.metrics).length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-4 bg-gray-50 dark:bg-gray-900/30 border border-gray-200 dark:border-gray-800 rounded-xl"
          >
            <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">Detailed Metrics</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(result.data.metrics).map(([key, value], idx) => {
                // Safe rendering with fallback for N/A values
                let displayValue = value;
                if (value === 'N/A' || value === null || value === undefined) {
                  displayValue = 'N/A';
                } else if (typeof value === 'number') {
                  displayValue = value.toFixed(2);
                }
                
                return (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    className="p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
                  >
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 capitalize mb-1">
                      {key.replace(/_/g, ' ')}
                    </p>
                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100">
                      {displayValue}
                    </p>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result Timestamp */}
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
                  : 'Processing...'}
              </span>
            </div>
            {result.status === 'error' && (
              <span className="text-red-600 dark:text-red-400 font-semibold">Error: {result.error}</span>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Result History */}
      {resultHistory.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-900/30 dark:to-slate-900/30 border border-gray-200 dark:border-gray-800 rounded-xl"
        >
          <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-3">Analysis History</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {resultHistory.map((item, idx) => (
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
                  {item.data?.deceptionScore !== undefined && (
                    <span className={`font-semibold ${getScoreColor(item.data.deceptionScore)}`}>
                      D: {Math.round(item.data.deceptionScore)}%
                    </span>
                  )}
                  {item.status === 'complete' && (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  )}
                  {item.status === 'error' && (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Empty State */}
      {!isAnalyzing && !result && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-8 text-center bg-gray-50 dark:bg-gray-900/30 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl"
        >
          <p className="text-gray-600 dark:text-gray-400">
            Start recording to see live analysis results...
          </p>
        </motion.div>
      )}
    </div>
  );
}
