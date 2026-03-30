import { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, AlertCircle, CheckCircle, Play, Square, Send, RotateCcw } from 'lucide-react';
import { useMicrophoneStream } from '../hooks/useMicrophoneStream';

interface MicrophoneStreamingProps {
  onAnalysisComplete?: (result: any) => void;
  wsUrl?: string;
}

interface LiveResult {
  timestamp: string;
  score: number;
  status: 'processing' | 'complete' | 'error';
  data?: any;
}

export default function MicrophoneStreaming({ onAnalysisComplete, wsUrl = 'ws://localhost:8080' }: MicrophoneStreamingProps) {
  const { state, connect, startRecording, stopRecording, analyzeBuffer, clearBuffer, disconnect, getStatus } =
    useMicrophoneStream(wsUrl);

  const [micLevel, setMicLevel] = useState(0);
  const [liveResults, setLiveResults] = useState<LiveResult | null>(null);
  const [resultHistory, setResultHistory] = useState<LiveResult[]>([]);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Update live results when hook state changes
  useEffect(() => {
    if (state.liveResult) {
      const newResult: LiveResult = {
        timestamp: state.liveResult.timestamp || new Date().toISOString(),
        score: state.liveResult.data?.deceptionScore || 0,
        status: state.liveResult.status,
        data: state.liveResult.data,
      };

      setLiveResults(newResult);
      setResultHistory((prev) => [...prev, newResult].slice(-10)); // Keep last 10 results
      console.log('Live result update:', newResult);
    }
  }, [state.liveResult]);

  // Connect on mount
  useEffect(() => {
    const initialize = async () => {
      try {
        const stream = await connect();

        // Setup audio visualization
        if (stream) {
          setupAudioVisualization(stream);
        }
      } catch (err) {
        console.error('Failed to initialize microphone stream:', err);
      }
    };

    initialize();

    return () => {
      disconnect();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [connect, disconnect]);

  // Setup audio visualization
  const setupAudioVisualization = (stream: MediaStream) => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      analyser.fftSize = 256;
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const updateMicLevel = () => {
        if (analyserRef.current) {
          analyserRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          setMicLevel(average / 255); // Normalize to 0-1
        }
        animationFrameRef.current = requestAnimationFrame(updateMicLevel);
      };

      updateMicLevel();
    } catch (err) {
      console.error('Audio visualization setup failed:', err);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnalysisComplete = () => {
    if (onAnalysisComplete && state.analysisResult) {
      onAnalysisComplete(state.analysisResult);
    }
  };

  useEffect(() => {
    if (state.analysisResult) {
      handleAnalysisComplete();
    }
  }, [state.analysisResult]);

  return (
    <div className="w-full space-y-6">
      {/* Error Alert */}
      <AnimatePresence>
        {state.error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-red-900 dark:text-red-300">Error</p>
              <p className="text-sm text-red-800 dark:text-red-400">{state.error}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Connection Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="p-4 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
        >
          <div className="flex items-center gap-2 mb-2">
            <div
              className={`w-3 h-3 rounded-full ${state.isConnected ? 'bg-green-500' : 'bg-red-500'}`}
            />
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">Connection</p>
          </div>
          <p className={`text-sm font-bold ${state.isConnected ? 'text-blue-600 dark:text-blue-400' : 'text-red-600'}`}>
            {state.isConnected ? 'Connected' : 'Disconnected'}
          </p>
        </motion.div>

        {/* Recording Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg border border-purple-200 dark:border-purple-800"
        >
          <div className="flex items-center gap-2 mb-2">
            <motion.div
              animate={state.isRecording ? { scale: [1, 1.2, 1] } : {}}
              transition={{ duration: 1, repeat: Infinity }}
            >
              {state.isRecording ? (
                <div className="w-3 h-3 rounded-full bg-red-500" />
              ) : (
                <div className="w-3 h-3 rounded-full bg-gray-400" />
              )}
            </motion.div>
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-400">Recording</p>
          </div>
          <p className={`text-sm font-bold ${state.isRecording ? 'text-purple-600 dark:text-purple-400' : 'text-gray-600'}`}>
            {state.isRecording ? 'Active' : 'Idle'}
          </p>
        </motion.div>

        {/* Buffered Chunks */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-lg border border-emerald-200 dark:border-emerald-800"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Buffer</span>
          </div>
          <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
            {state.bufferedChunks}/5 chunks
          </p>
        </motion.div>

        {/* Recording Time */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="p-4 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-900/20 dark:to-red-900/20 rounded-lg border border-orange-200 dark:border-orange-800"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Duration</span>
          </div>
          <p className="text-sm font-bold text-orange-600 dark:text-orange-400">{formatTime(state.recordingTime)}</p>
        </motion.div>
      </div>

      {/* Microphone Level Indicator */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="p-6 bg-gradient-to-br from-gray-50 to-slate-50 dark:from-gray-900/20 dark:to-slate-900/20 rounded-xl border border-gray-200 dark:border-gray-800"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100">Microphone Level</h3>
          <span className="text-sm text-gray-600 dark:text-gray-400">{Math.round(micLevel * 100)}%</span>
        </div>
        <div className="flex gap-1">
          {Array.from({ length: 16 }).map((_, i) => (
            <motion.div
              key={i}
              animate={{
                height: micLevel > (i + 1) / 16 ? '32px' : '4px',
              }}
              transition={{ duration: 0.1 }}
              className="w-1 bg-gradient-to-t from-cyan-500 to-cyan-300 rounded-full"
            />
          ))}
        </div>
      </motion.div>

      {/* Analysis Result */}
      <AnimatePresence>
        {state.analysisResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="p-6 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800"
          >
            <div className="flex items-start gap-4">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200 }}
              >
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0" />
              </motion.div>
              <div className="flex-1">
                <h3 className="font-semibold text-green-900 dark:text-green-300 mb-2">Analysis Complete</h3>
                <pre className="bg-black/10 dark:bg-black/30 p-4 rounded-lg text-sm text-gray-800 dark:text-gray-200 overflow-auto max-h-48">
                  {JSON.stringify(state.analysisResult, null, 2)}
                </pre>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Control Buttons */}
      <div className="flex flex-wrap gap-4 justify-center">
        {!state.isRecording ? (
          <>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={startRecording}
              disabled={!state.isConnected || state.isAnalyzing}
              className="px-8 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white font-semibold rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              <Play className="w-5 h-5" />
              Start Recording
            </motion.button>
          </>
        ) : (
          <>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={stopRecording}
              className="px-8 py-3 bg-gradient-to-r from-red-600 to-pink-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all flex items-center gap-2"
            >
              <Square className="w-5 h-5" />
              Stop Recording
            </motion.button>
          </>
        )}

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={analyzeBuffer}
          disabled={!state.isConnected || state.bufferedChunks === 0 || state.isAnalyzing}
          className="px-8 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-semibold rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
        >
          <Send className="w-5 h-5" />
          {state.isAnalyzing ? 'Analyzing...' : 'Analyze Now'}
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={clearBuffer}
          disabled={!state.isConnected || state.bufferedChunks === 0}
          className="px-8 py-3 bg-gray-600 text-white font-semibold rounded-xl hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
        >
          <RotateCcw className="w-5 h-5" />
          Clear Buffer
        </motion.button>
      </div>

      {/* Info */}
      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
        <p className="text-sm text-blue-900 dark:text-blue-300">
          <span className="font-semibold">💡 How it works:</span> Connect to start streaming 2-second audio chunks to the
          server. Chunks are buffered (max 5), then automatically analyzed. You can also send for immediate analysis with
          "Analyze Now".
        </p>
      </div>
    </div>
  );
}
