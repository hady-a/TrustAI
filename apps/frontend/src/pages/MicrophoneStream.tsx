import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAudioRecorder } from '../hooks/useAudioRecorder';

interface AnalysisMetrics {
  emotion?: string;
  stress?: number | string;
  confidence?: number | string;
  stress_level?: string;
  credibility_score?: number | string;
  risk_level?: string;
  behavioral_signals?: string[];
  voice_metrics?: Record<string, any>;
  face_metrics?: Record<string, any>;
}

interface AnalysisResult {
  id: string;
  mode: string;
  timestamp: string;
  insights?: string;
  metrics?: AnalysisMetrics;
  isLoading?: boolean;
  status?: 'processing' | 'complete' | 'error';
}

export default function MicrophoneStream() {
  const [selectedMode, setSelectedMode] = useState<'BUSINESS' | 'INTERVIEW' | 'INVESTIGATION'>('BUSINESS');
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [isLoadingChunk, setIsLoadingChunk] = useState(false);
  const resultsEndRef = useRef<HTMLDivElement>(null);

  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:9999/api';

  const handleChunkReady = async (blob: Blob) => {
    const chunkId = `chunk-${Date.now()}-${Math.random()}`;
    
    // Add loading state immediately
    setAnalysisResults((prev) => [
      ...prev,
      {
        id: chunkId,
        mode: selectedMode,
        timestamp: new Date().toLocaleTimeString(),
        insights: 'Processing...',
        isLoading: true,
        status: 'processing',
      },
    ]);

    setIsLoadingChunk(true);
    try {
      const formData = new FormData();
      formData.append('audio', blob, 'chunk.webm');
      formData.append('mode', selectedMode);

      const response = await fetch(`${apiBase}/analyze/live`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.statusText}`);
      }

      const data = await response.json();

      // Extract metrics from response
      const metrics: AnalysisMetrics = {
        emotion: data.data?.emotion || 'Unknown',
        stress: data.data?.stress_level || data.data?.stress || 'N/A',
        confidence: data.data?.confidence || 'N/A',
        stress_level: data.data?.stress_level,
        credibility_score: data.data?.credibility_score,
        risk_level: data.data?.risk_level,
        behavioral_signals: data.data?.behavioral_signals,
        voice_metrics: data.data?.voice_metrics,
        face_metrics: data.data?.face_metrics,
      };

      // Update the result with actual data
      setAnalysisResults((prev) =>
        prev.map((result) =>
          result.id === chunkId
            ? {
                ...result,
                insights: data.insights || data.message || 'Analysis complete',
                metrics,
                isLoading: false,
                status: 'complete',
              }
            : result
        )
      );

      // Auto-scroll to latest result
      setTimeout(() => {
        resultsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } catch (error) {
      console.error('Chunk analysis error:', error);
      
      // Update result with error
      setAnalysisResults((prev) =>
        prev.map((result) =>
          result.id === chunkId
            ? {
                ...result,
                insights: `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                isLoading: false,
                status: 'error',
              }
            : result
        )
      );
    } finally {
      setIsLoadingChunk(false);
    }
  };

  const { startRecording, stopRecording, isRecording, error, isProcessing } = useAudioRecorder({
    chunkDurationMs: 2500,
    onChunkReady: handleChunkReady,
    onError: (err) => console.error('Recording error:', err),
  });

  const liveStatus: 'recording' | 'processing' | 'idle' = isRecording
    ? 'recording'
    : (isProcessing || isLoadingChunk)
      ? 'processing'
      : 'idle';

  const statusConfig = {
    recording: {
      dotClass: 'bg-red-500',
      textClass: 'text-red-300',
      label: 'Recording',
    },
    processing: {
      dotClass: 'bg-amber-400',
      textClass: 'text-amber-300',
      label: 'Processing',
    },
    idle: {
      dotClass: 'bg-emerald-400',
      textClass: 'text-emerald-300',
      label: 'Idle',
    },
  } as const;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (isRecording) {
        stopRecording();
      }
    };
  }, [isRecording, stopRecording]);

  return (
    <div className="min-h-screen bg-gradient-to-br dark:from-[#0B0F19] dark:via-[#1a1f3a] dark:to-[#0B0F19] from-slate-50 via-blue-50 to-slate-50 overflow-hidden">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
          className="absolute top-1/4 -left-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 50, repeat: Infinity, ease: 'linear' }}
          className="absolute bottom-1/4 -right-32 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12"
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            className="inline-block mb-6 px-4 py-2 bg-blue-500/20 border border-blue-500/50 rounded-full"
          >
            <p className="text-blue-300 text-sm font-semibold">LIVE ANALYSIS</p>
          </motion.div>

          <h1 className="text-6xl md:text-7xl font-bold text-white mb-4 tracking-tight">
            Live <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Audio</span> Analysis
          </h1>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-gray-300 text-lg mt-6 max-w-2xl mx-auto"
          >
            <p>
              Record live audio and get real-time analysis. Audio is sent in 2-3 second chunks for continuous feedback.
            </p>
          </motion.div>
        </motion.div>

        {/* Main Content */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          {/* Controls Panel */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="md:col-span-1 space-y-6"
          >
            <div className="p-6 bg-slate-900/50 border border-blue-500/30 rounded-2xl">
              <h2 className="text-lg font-semibold text-white mb-4">Recording Control</h2>

              {/* Mode Selection */}
              <div className="mb-6">
                <label htmlFor="analysis-mode" className="block text-sm font-medium text-gray-300 mb-2">Analysis Mode:</label>
                <select
                  id="analysis-mode"
                  value={selectedMode}
                  onChange={(e) => setSelectedMode(e.target.value as any)}
                  disabled={isRecording}
                  className="w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-white disabled:opacity-50"
                >
                  <option value="BUSINESS">Business</option>
                  <option value="INTERVIEW">Interview</option>
                  <option value="INVESTIGATION">Investigation</option>
                </select>
              </div>

              {/* Recording Status */}
              <div className="mb-6 p-4 bg-slate-800/50 rounded-lg">
                <div className="mb-3 pb-3 border-b border-slate-700/50">
                  <span className="text-xs font-medium text-gray-400 block mb-2">Live Status</span>
                  <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                      key={liveStatus}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.2, ease: 'easeOut' }}
                      className="flex items-center gap-2"
                    >
                      <motion.span
                        animate={
                          liveStatus === 'recording'
                            ? { scale: [1, 1.25, 1] }
                            : liveStatus === 'processing'
                              ? { opacity: [0.45, 1, 0.45] }
                              : { scale: 1, opacity: 1 }
                        }
                        transition={{ duration: 1, repeat: Infinity, ease: 'easeInOut' }}
                        className={`w-2.5 h-2.5 rounded-full ${statusConfig[liveStatus].dotClass}`}
                      />
                      <span className={`text-sm font-semibold ${statusConfig[liveStatus].textClass}`}>
                        {statusConfig[liveStatus].label}
                      </span>
                    </motion.div>
                  </AnimatePresence>
                </div>
                {isProcessing && (
                  <p className="text-xs text-blue-400">Processing chunk...</p>
                )}
                {isLoadingChunk && (
                  <p className="text-xs text-cyan-400">Sending to backend...</p>
                )}
              </div>

              {/* Control Buttons */}
              <div className="space-y-3">
                <button
                  onClick={startRecording}
                  disabled={isRecording || isProcessing}
                  className="w-full px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:from-green-500 hover:to-emerald-500 transition"
                >
                  Start Recording
                </button>
                <button
                  onClick={stopRecording}
                  disabled={!isRecording || isProcessing}
                  className="w-full px-4 py-2 bg-gradient-to-r from-red-600 to-rose-600 text-white font-semibold rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:from-red-500 hover:to-rose-500 transition"
                >
                  Stop Recording
                </button>
              </div>

              {/* Error Display */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg"
                >
                  <p className="text-sm text-red-300">{error.message}</p>
                </motion.div>
              )}
            </div>

            {/* Info */}
            <div className="p-4 bg-slate-800/50 border border-slate-700/50 rounded-2xl">
              <h3 className="text-sm font-semibold text-white mb-2">Live Metrics:</h3>
              <ul className="text-xs text-gray-300 space-y-1">
                <li>🎭 Emotion - Detected emotional state</li>
                <li>😰 Stress - Stress level 0-100%</li>
                <li>✓ Confidence - Analysis confidence 0-100%</li>
                <li>📊 Real-time updates every 2.5s</li>
              </ul>
            </div>
          </motion.div>

          {/* Results Panel */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="md:col-span-2"
          >
            <div className="p-6 bg-slate-900/50 border border-blue-500/30 rounded-2xl h-[600px] flex flex-col">
              <h2 className="text-lg font-semibold text-white mb-4">Real-time Results</h2>

              <div className="flex-1 overflow-y-auto space-y-3 mb-4 pr-2 custom-scrollbar">
                {analysisResults.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <p className="text-gray-400 text-center">
                      Start recording to see real-time analysis results here
                    </p>
                  </div>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {analysisResults.map((result) => (
                      <motion.div
                        key={result.id}
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -20, scale: 0.95 }}
                        transition={{ type: 'spring', damping: 15, stiffness: 100 }}
                        className={`p-4 rounded-lg border transition-all duration-300 ${
                          result.status === 'processing'
                            ? 'bg-blue-500/10 border-blue-500/30 animate-pulse'
                            : result.status === 'error'
                            ? 'bg-red-500/10 border-red-500/30'
                            : 'bg-slate-800/50 border-slate-700'
                        }`}
                      >
                        {/* Header */}
                        <div className="flex justify-between items-center mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-semibold text-blue-300">{result.mode}</span>
                            {result.status === 'processing' && (
                              <motion.span
                                animate={{ opacity: [0.5, 1, 0.5] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                                className="inline-block px-2 py-1 bg-blue-500/20 text-blue-300 text-xs rounded"
                              >
                                Processing
                              </motion.span>
                            )}
                            {result.status === 'error' && (
                              <span className="inline-block px-2 py-1 bg-red-500/20 text-red-300 text-xs rounded">
                                Error
                              </span>
                            )}
                            {result.status === 'complete' && (
                              <span className="inline-block px-2 py-1 bg-green-500/20 text-green-300 text-xs rounded">
                                Complete
                              </span>
                            )}
                          </div>
                          <span className="text-xs text-gray-500">{result.timestamp}</span>
                        </div>

                        {/* Insights */}
                        {result.insights && (
                          <p className="text-sm text-gray-300 mb-3">{result.insights}</p>
                        )}

                        {/* Metrics Display */}
                        {result.metrics && result.status === 'complete' && (
                          <div className="space-y-2 pt-2 border-t border-slate-700/50">
                            {/* Emotion */}
                            {result.metrics.emotion && (
                              <div className="flex items-center gap-3">
                                <span className="text-xs font-medium text-gray-400 min-w-20">Emotion:</span>
                                <div className="flex-1">
                                  <span className="text-sm font-semibold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                                    {result.metrics.emotion}
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* Stress */}
                            {result.metrics.stress && (
                              <div className="flex items-center gap-3">
                                <span className="text-xs font-medium text-gray-400 min-w-20">Stress:</span>
                                <div className="flex-1 flex items-center gap-2">
                                  {typeof result.metrics.stress === 'number' ? (
                                    <>
                                      <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                        <motion.div
                                          initial={{ width: 0 }}
                                          animate={{
                                            width: `${Math.min(
                                              Number(result.metrics.stress) * 100,
                                              100
                                            )}%`,
                                          }}
                                          transition={{ duration: 0.8, ease: 'easeOut' }}
                                          className="h-full bg-gradient-to-r from-orange-400 to-red-500"
                                        />
                                      </div>
                                      <span className="text-xs font-semibold text-orange-400 min-w-10">
                                        {(Number(result.metrics.stress) * 100).toFixed(0)}%
                                      </span>
                                    </>
                                  ) : (
                                    <span className="text-sm text-gray-300">{result.metrics.stress}</span>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Confidence */}
                            {result.metrics.confidence && (
                              <div className="flex items-center gap-3">
                                <span className="text-xs font-medium text-gray-400 min-w-20">Confidence:</span>
                                <div className="flex-1 flex items-center gap-2">
                                  {typeof result.metrics.confidence === 'number' ? (
                                    <>
                                      <div className="flex-1 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                                        <motion.div
                                          initial={{ width: 0 }}
                                          animate={{
                                            width: `${Math.min(
                                              Number(result.metrics.confidence) * 100,
                                              100
                                            )}%`,
                                          }}
                                          transition={{ duration: 0.8, ease: 'easeOut' }}
                                          className="h-full bg-gradient-to-r from-green-400 to-emerald-500"
                                        />
                                      </div>
                                      <span className="text-xs font-semibold text-green-400 min-w-10">
                                        {(Number(result.metrics.confidence) * 100).toFixed(0)}%
                                      </span>
                                    </>
                                  ) : (
                                    <span className="text-sm text-gray-300">{result.metrics.confidence}</span>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Stress Level Badge */}
                            {result.metrics.stress_level && (
                              <div className="flex items-center gap-3 pt-1">
                                <span className="text-xs font-medium text-gray-400 min-w-20">Level:</span>
                                <div>
                                  <span
                                    className={`inline-block px-2 py-0.5 text-xs font-semibold rounded ${
                                      result.metrics.stress_level === 'low' || result.metrics.stress_level === 'Low'
                                        ? 'bg-green-500/20 text-green-300'
                                        : result.metrics.stress_level === 'moderate' ||
                                          result.metrics.stress_level === 'Moderate'
                                        ? 'bg-yellow-500/20 text-yellow-300'
                                        : 'bg-red-500/20 text-red-300'
                                    }`}
                                  >
                                    {result.metrics.stress_level}
                                  </span>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Loading Skeleton */}
                        {result.isLoading && (
                          <div className="space-y-2 pt-2 border-t border-slate-700/50">
                            <div className="h-3 bg-slate-700/50 rounded animate-pulse" />
                            <div className="h-3 bg-slate-700/50 rounded animate-pulse w-4/5" />
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
                <div ref={resultsEndRef} />
              </div>

              {/* Clear Results */}
              {analysisResults.length > 0 && (
                <button
                  onClick={() => setAnalysisResults([])}
                  className="px-3 py-2 text-sm bg-slate-800 border border-slate-700 text-gray-300 rounded-lg hover:bg-slate-700 transition"
                >
                  Clear Results
                </button>
              )}
            </div>
          </motion.div>
        </div>

        {/* Navigation */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="text-center"
        >
          <Link
            to="/selectmodes"
            className="inline-block px-6 py-3 rounded-lg border border-blue-500/50 text-blue-300 font-semibold hover:bg-blue-500/10 transition"
          >
            Back to Mode Selection
          </Link>
        </motion.div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(15, 23, 42, 0.5);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.3);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.5);
        }
      `}</style>
    </div>
  );
}
