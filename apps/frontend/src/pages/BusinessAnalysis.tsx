import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import FileUploader from "../components/FileUploader";
import ProgressBar from "../components/ProgressBar";
import { analysisAPI } from "../lib/api";

export default function BusinessAnalysis() {
  const navigate = useNavigate();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string>("");

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
      await analysisAPI.create({ fileUrl, modes: ["BUSINESS"] });

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
    <div className="min-h-screen bg-gradient-to-br from-[#0B1628] via-[#0f2420] to-[#0B1628] relative overflow-hidden">
      {/* Trading floor / data analytics dashboard theme */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Market glow effects */}
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute top-1/4 right-1/4 w-64 h-64 bg-emerald-500/12 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ scale: [1.2, 1, 1.2] }}
          transition={{ duration: 5, repeat: Infinity }}
          className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-green-600/10 rounded-full blur-3xl"
        />
        {/* Trading ticker tape lines */}
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            animate={{ opacity: [0.2, 0.4, 0.2] }}
            transition={{ duration: 3 + i * 0.5, repeat: Infinity }}
            className="absolute h-px bg-gradient-to-r from-emerald-600/0 via-emerald-500/40 to-emerald-600/0"
            style={{ top: `${20 + i * 30}%`, width: "100%" }}
          />
        ))}
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-20">
        {/* Trading Floor Header */}
        <motion.div
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9 }}
          className="mb-20"
        >
          {/* Market status badge */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-3 mb-8 px-5 py-3 bg-emerald-950/40 border border-emerald-700/50 rounded-full"
          >
            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }} className="w-2 h-2 bg-emerald-500 rounded-full" />
            <p className="text-emerald-300 text-sm font-mono tracking-wider">MARKET ANALYSIS ACTIVE</p>
          </motion.div>

          <div className="md:flex md:items-end md:justify-between">
            <div className="flex-1">
              <h1 className="text-7xl md:text-8xl font-black text-white mb-4 tracking-tighter">
                Market<br />
                <span className="bg-gradient-to-r from-emerald-500 to-green-600 bg-clip-text text-transparent">Intelligence</span>
              </h1>
              <p className="text-gray-400 text-lg max-w-xl">
                Upload your business data for real-time analytics, forecasting, and strategic insights
              </p>
            </div>

            {/* Animated chart icon */}
            <motion.div
              animate={{ y: [0, -15, 0] }}
              transition={{ duration: 2.5, repeat: Infinity }}
              className="mt-8 md:mt-0"
            >
              <div className="text-9xl drop-shadow-2xl">📈</div>
            </motion.div>
          </div>
        </motion.div>

        {/* Error Alert */}
        {error && (
          <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} className="mb-8 p-5 bg-red-950/40 border-l-4 border-red-600 backdrop-blur-sm">
            <p className="text-red-300 font-mono text-sm">⚡ ERROR: {error}</p>
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

          {/* Right: Data Intelligence */}
          <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="space-y-6">
            {[
              { emoji: "📊", title: "Sales & Revenue", desc: "Track metrics, KPIs, and forecasts" },
              { emoji: "🎯", title: "Market Trends", desc: "Competitive analysis and positioning" },
              { emoji: "👥", title: "Customer Data", desc: "Segmentation and behavioral insights" },
              { emoji: "💰", title: "Financial Reports", desc: "P&L, cash flow, and ROI analysis" },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="p-4 bg-gradient-to-br from-emerald-900/20 to-green-950/10 border border-emerald-700/30 rounded-lg hover:border-emerald-600/60 transition-all cursor-pointer hover:bg-emerald-900/30"
              >
                <div className="flex gap-4">
                  <span className="text-3xl">{item.emoji}</span>
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
                  ? "bg-gradient-to-r from-emerald-600 to-green-700 text-white hover:shadow-2xl hover:shadow-emerald-600/50 shadow-lg"
                  : "bg-gray-700/50 text-gray-500 cursor-not-allowed"
              }`}
            >
              📈 {selectedFile ? "START ANALYSIS" : "UPLOAD DATA"}
            </motion.button>
          </motion.div>
        )}

        {/* Analyzing State */}
        {isAnalyzing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto">
            <div className="text-center">
              {/* Animated trading board */}
              <motion.div className="inline-block mb-8 p-8 rounded-lg bg-gradient-to-br from-emerald-700/20 to-green-900/20 border-2 border-emerald-700">
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {[
                    { value: "↑ 24.5%", label: "Growth" },
                    { value: "✓ 98%", label: "Accuracy" },
                    { value: "⚡ Real-time", label: "Updates" },
                  ].map((item, i) => (
                    <motion.div
                      key={i}
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity, delay: i * 0.2 }}
                      className="text-center"
                    >
                      <p className="text-emerald-400 font-bold text-lg">{item.value}</p>
                      <p className="text-gray-400 text-xs">{item.label}</p>
                    </motion.div>
                  ))}
                </div>
                <div className="border-t border-emerald-700/40 pt-4 flex items-center justify-center gap-1">
                  {[...Array(12)].map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{ height: ["20px", "50px", "20px"] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.08 }}
                      className="w-2 bg-gradient-to-t from-emerald-500 to-green-400 rounded-full"
                    />
                  ))}
                </div>
              </motion.div>

              <h2 className="text-4xl font-black text-white mb-2">ANALYZING BUSINESS DATA</h2>
              <p className="text-gray-400 text-lg mb-8">Processing markets and generating insights...</p>

              <ProgressBar progress={progress} />

              {/* Analysis stages */}
              <motion.div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { stage: "Data Import", icon: "📥" },
                  { stage: "Processing", icon: "⚙️" },
                  { stage: "Intelligence", icon: "🧠" },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                    className={`p-4 rounded-lg border-2 transition-all ${progress > i * 35 ? "border-emerald-600 bg-emerald-900/20" : "border-gray-700/50 bg-gray-900/20"}`}
                  >
                    <p className="text-2xl mb-2">{item.icon}</p>
                    <p className={`font-bold ${progress > i * 35 ? "text-emerald-300" : "text-gray-400"}`}>{item.stage}</p>
                  </motion.div>
                ))}
              </motion.div>
            </div>
          </motion.div>
        )}

        {/* Completion State */}
        {analysisComplete && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="max-w-2xl mx-auto text-center">
            <motion.div initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 200, delay: 0.2 }} className="inline-block mb-8">
              <div className="w-28 h-28 rounded-lg bg-gradient-to-br from-green-600/40 to-green-900/40 border-2 border-green-700 flex items-center justify-center text-6xl">
                ✓
              </div>
            </motion.div>
            <h2 className="text-5xl font-black text-white mb-3">ANALYSIS COMPLETE</h2>
            <p className="text-gray-400 text-xl mb-10">Business intelligence dashboard ready for review</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/analysis/business/result")}
              className="px-12 py-4 bg-gradient-to-r from-emerald-600 to-green-700 text-white rounded-lg font-bold hover:shadow-2xl hover:shadow-emerald-600/50 transition-all shadow-lg"
            >
              📊 VIEW DASHBOARD
            </motion.button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
