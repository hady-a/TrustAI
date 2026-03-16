import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import FileUploader from "../components/FileUploader";
import ProgressBar from "../components/ProgressBar";
import { analysisAPI } from "../lib/api";
import { Icon } from "../components/UI/IconRenderer";

export default function InterviewAnalysis() {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string>("");
  const [analysisId, setAnalysisId] = useState<string>("");

  const handleFileSelect = (file: File | null) => {
    setSelectedFile(file);
    setError("");
  };

  const startAnalysis = async () => {
    if (!selectedFile) {
      setError("Please select a file to analyze");
      return;
    }

    setIsAnalyzing(true);
    setError("");
    setProgress(0);

    const interval = setInterval(
      () => setProgress((p) => Math.min(p + Math.random() * 30, 95)),
      1000
    );

    try {
      const fileUrl = URL.createObjectURL(selectedFile);
      const response = await analysisAPI.create({ fileUrl, modes: ["INTERVIEW"] });
      const newAnalysisId = response.data.data.id;
      setAnalysisId(newAnalysisId);

      setProgress(100);
      clearInterval(interval);
      setTimeout(() => setAnalysisComplete(true), 600);
    } catch (err) {
      clearInterval(interval);
      setIsAnalyzing(false);
      setError(err instanceof Error ? err.message : "Analysis failed");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A1128] via-[#0f1a2e] to-[#0A1128] relative overflow-hidden">
      {/* Podcast studio theme with waveform vibes */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Microphone glow effect */}
        <motion.div
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 3, repeat: Infinity }}
          className="absolute top-1/3 left-1/4 w-52 h-52 bg-cyan-500/15 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ scale: [1.15, 1, 1.15] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute bottom-1/4 right-1/4 w-52 h-52 bg-blue-600/10 rounded-full blur-3xl"
        />
        {/* Sound wave lines */}
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2 + i * 0.3, repeat: Infinity }}
            className="absolute left-1/3 top-1/2 w-1 bg-gradient-to-b from-cyan-600/0 via-cyan-500/40 to-cyan-600/0"
            style={{ height: `${60 + i * 20}px`, opacity: 0.6 - i * 0.15 }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-20">
        {/* Studio Header */}
        <motion.div
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9 }}
          className="mb-20"
        >
          {/* Recording indicator */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-3 mb-8 px-5 py-3 bg-cyan-950/40 border border-cyan-700/50 rounded-full"
          >
            <motion.div animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className="w-3 h-3 bg-cyan-500 rounded-full" />
            <p className="text-cyan-300 text-sm font-mono tracking-wide">STUDIO MODE ACTIVE</p>
          </motion.div>

          <div className="md:flex md:items-end md:justify-between">
            <div className="flex-1">
              <h1 className="text-7xl md:text-8xl font-black text-white mb-4 tracking-tighter">
                Audio<br />
                <span className="bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">Intelligence</span>
              </h1>
              <p className="text-gray-400 text-lg max-w-xl">
                Upload your interview recordings for advanced conversation analysis and insights
              </p>
            </div>

            {/* Animated microphone */}
            <motion.div
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="mt-8 md:mt-0"
            >
              <div className="text-9xl drop-shadow-2xl">🎙️</div>
            </motion.div>
          </div>
        </motion.div>

        {/* Error Alert */}
        {error && (
          <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} className="mb-8 p-5 bg-blue-950/40 border-l-4 border-blue-600 backdrop-blur-sm">
            <p className="text-blue-300 font-mono text-sm">⚠️ ERROR: {error}</p>
          </motion.div>
        )}

        {/* Two column layout */}
        <div className="grid md:grid-cols-2 gap-12 mb-12">
          {/* Left: Upload zone */}
          <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <div className="sticky top-32">
              <FileUploader onFileSelect={handleFileSelect} />
            </div>
          </motion.div>

          {/* Right: Features */}
          <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="space-y-6">
            {[
              { emoji: "🎵", title: "Audio Formats", desc: "MP3, WAV, M4A, FLAC (up to 500MB)" },
              { emoji: "📝", title: "Transcripts", desc: "Auto-transcription with speaker IDs" },
              { emoji: "💭", title: "Sentiment Analysis", desc: "Emotional tone and conversation flow" },
              { emoji: "🎯", title: "Key Insights", desc: "Extract topics, themes, and patterns" },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="p-4 bg-gradient-to-br from-cyan-900/20 to-blue-950/10 border border-cyan-700/30 rounded-lg hover:border-cyan-600/60 transition-all cursor-pointer hover:bg-cyan-900/30"
              >
                <div className="flex gap-4">
                  <Icon emoji={item.emoji} size="lg" className="text-3xl shrink-0" inline={false} />
                  <div>
                    <p className="text-white font-bold">{item.title}</p>
                    <p className="text-gray-400 text-sm">{item.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>

        {/* Action buttons */}
        {!isAnalyzing && !analysisComplete && (
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="flex flex-col sm:flex-row gap-4 md:justify-end">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(-1)}
              className="px-8 py-3 border-2 border-gray-600 text-gray-300 rounded-lg font-bold hover:border-gray-500 transition-all"
            >
              ← Back
            </motion.button>
            <motion.button
              whileHover={selectedFile ? { scale: 1.05 } : {}}
              whileTap={selectedFile ? { scale: 0.95 } : {}}
              onClick={startAnalysis}
              disabled={!selectedFile}
              className={`px-10 py-3 rounded-lg font-bold transition-all ${
                selectedFile
                  ? "bg-gradient-to-r from-cyan-600 to-blue-700 text-white hover:shadow-2xl hover:shadow-cyan-600/50 shadow-lg"
                  : "bg-gray-700/50 text-gray-500 cursor-not-allowed"
              }`}
            >
              🎙️ {selectedFile ? "ANALYZE AUDIO" : "SELECT FILE"}
            </motion.button>
          </motion.div>
        )}

        {/* Analyzing State */}
        {isAnalyzing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto">
            <div className="text-center">
              {/* Animated waveform */}
              <motion.div className="inline-block mb-8 p-8 rounded-lg bg-gradient-to-br from-cyan-700/20 to-blue-900/20 border-2 border-cyan-700">
                <div className="flex items-center justify-center gap-2 h-16">
                  {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ height: [20, 60, 20] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }}
                      className="w-2 bg-gradient-to-t from-cyan-500 to-blue-400 rounded-full"
                    />
                  ))}
                </div>
              </motion.div>

              <h2 className="text-4xl font-black text-white mb-2">ANALYZING CONVERSATION</h2>
              <p className="text-gray-400 text-lg mb-8">Extracting insights from audio...</p>

              <ProgressBar progress={progress} />

              {/* Analysis stages */}
              <motion.div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { stage: "Transcribe", icon: "📝" },
                  { stage: "Analyze", icon: "🧠" },
                  { stage: "Report", icon: "📊" },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                    className={`p-4 rounded-lg border-2 transition-all ${progress > i * 35 ? "border-cyan-600 bg-cyan-900/20" : "border-gray-700/50 bg-gray-900/20"}`}
                  >
                    <Icon emoji={item.icon} size="lg" className="mb-2 block text-2xl" inline={false} />
                    <p className={`font-bold ${progress > i * 35 ? "text-cyan-300" : "text-gray-400"}`}>{item.stage}</p>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Completion State */}
        {analysisComplete && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-2xl mx-auto text-center">
            <motion.div initial={{ scale: 0, rotate: 180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 200, delay: 0.2 }} className="inline-block mb-8">
              <div className="w-28 h-28 rounded-lg bg-gradient-to-br from-green-600/40 to-green-900/40 border-2 border-green-700 flex items-center justify-center text-6xl">
                ✓
              </div>
            </motion.div>
            <h2 className="text-5xl font-black text-white mb-3">ANALYSIS COMPLETE</h2>
            <p className="text-gray-400 text-xl mb-10">Interview transcript analyzed and insights extracted</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(`/analysis/interview/result/${analysisId}`)}
              className="px-12 py-4 bg-gradient-to-r from-cyan-600 to-blue-700 text-white rounded-lg font-bold hover:shadow-2xl hover:shadow-cyan-600/50 transition-all shadow-lg"
            >
              📊 VIEW TRANSCRIPT
            </motion.button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
