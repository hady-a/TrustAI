import { useState } from 'react';
import { motion } from 'framer-motion';
import MicrophoneStreaming from '../components/MicrophoneStreaming';

export default function MicrophoneStream() {
  const [_analysisResult, setAnalysisResult] = useState<any | null>(null);

  const handleAnalysisComplete = (result: any) => {
    console.log('Analysis completed:', result);
    setAnalysisResult(result);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br dark:from-[#0B0F19] dark:via-[#1a1f3a] dark:to-[#0B0F19] from-slate-50 via-blue-50 to-slate-50 overflow-hidden">
      {/* Animated background elements */}
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

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-16">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200, delay: 0.2 }}
            className="inline-block mb-6 px-4 py-2 bg-indigo-500/20 border border-indigo-500/50 rounded-full"
          >
            <p className="text-indigo-300 text-sm font-semibold">MICROPHONE STREAMING</p>
          </motion.div>

          <h1 className="text-6xl md:text-7xl font-bold text-white mb-4 tracking-tight">
            Live <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">Microphone</span>{' '}
            Stream
          </h1>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-gray-400 text-lg mt-6"
          >
            <p>Stream audio from your microphone in real-time with automatic buffering and analysis</p>
          </motion.div>
        </motion.div>

        {/* Main Content */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <MicrophoneStreaming onAnalysisComplete={handleAnalysisComplete} />
        </motion.div>

        {/* How it Works Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="mt-16"
        >
          <h2 className="text-2xl font-bold text-white mb-8 text-center">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                step: 1,
                title: 'Open Microphone',
                description: 'Click "Start Recording" to begin capturing audio from your microphone',
              },
              {
                step: 2,
                title: '2-Second Chunks',
                description: 'Audio is automatically sent in 2-second intervals via WebSocket to the server',
              },
              {
                step: 3,
                title: 'Auto-Analysis',
                description: 'When 5 chunks are buffered, analysis begins automatically. Manual trigger available.',
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 + i * 0.1 }}
                className="p-6 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/30 rounded-xl"
              >
                <div className="mb-4">
                  <div className="inline-block px-3 py-1 bg-indigo-600 rounded-full text-white font-bold text-sm">
                    {item.step}
                  </div>
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-gray-400 text-sm">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Features Section */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-16"
        >
          <h2 className="text-2xl font-bold text-white mb-8 text-center">Features</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                icon: '🎙️',
                title: 'Real-Time Streaming',
                description: 'Stream audio chunks every 2 seconds with automatic WebSocket handling',
              },
              {
                icon: '📊',
                title: 'Buffer Management',
                description: 'Visual buffer indicator showing pending chunks for analysis',
              },
              {
                icon: '⏱️',
                title: 'Recording Timer',
                description: 'Track total recording duration with formatted time display',
              },
              {
                icon: '🔊',
                title: 'Audio Level Meter',
                description: 'Real-time microphone level visualization with frequency analysis',
              },
              {
                icon: '⚡',
                title: 'Auto-Analysis',
                description: 'Automatic analysis triggers when 5 chunks are buffered',
              },
              {
                icon: '🎯',
                title: 'Manual Control',
                description: 'Analyze now, clear buffer, and get status on demand',
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 + i * 0.05 }}
                className="p-4 bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700 rounded-lg"
              >
                <div className="flex gap-3">
                  <span className="text-2xl flex-shrink-0">{item.icon}</span>
                  <div>
                    <h3 className="font-semibold text-white">{item.title}</h3>
                    <p className="text-sm text-gray-400 mt-1">{item.description}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Technical Details */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.8 }}
          className="mt-16 p-6 bg-gradient-to-br from-gray-800/50 to-gray-900/50 border border-gray-700 rounded-xl"
        >
          <h3 className="text-xl font-semibold text-white mb-4">Technical Specifications</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-gray-400">
                <span className="font-semibold">Sample Rate:</span> 16kHz
              </p>
              <p className="text-gray-400 mt-2">
                <span className="font-semibold">Audio Format:</span> Mono PCM
              </p>
              <p className="text-gray-400 mt-2">
                <span className="font-semibold">Chunk Interval:</span> 2000ms
              </p>
            </div>
            <div>
              <p className="text-gray-400">
                <span className="font-semibold">Bits Per Sample:</span> 16-bit
              </p>
              <p className="text-gray-400 mt-2">
                <span className="font-semibold">Buffer Threshold:</span> 5 chunks
              </p>
              <p className="text-gray-400 mt-2">
                <span className="font-semibold">Server:</span> ws://localhost:8080
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
