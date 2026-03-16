import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import FileUploader from "../components/FileUploader";
import ProgressBar from "../components/ProgressBar";
import { analysisAPI } from "../lib/api";
import { Icon } from "../components/UI/IconRenderer";

export default function CriminalAnalysis() {
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
      const response = await analysisAPI.create({ fileUrl, modes: ["CRIMINAL"] });
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
    <div className="min-h-screen bg-gradient-to-br from-[#0B0F19] via-[#1a1515] to-[#0B0F19] relative overflow-hidden">
      {/* Forensic lab theme with evidence processing vibes */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Biohazard animated glow */}
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute top-1/4 -left-20 w-40 h-40 bg-red-600/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ scale: [1.2, 1, 1.2] }}
          transition={{ duration: 5, repeat: Infinity }}
          className="absolute bottom-1/4 -right-20 w-40 h-40 bg-red-800/15 rounded-full blur-3xl"
        />
        {/* Evidence tape accent */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-700/0 via-red-700/50 to-red-700/0" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-20">
        {/* Forensic Lab Header */}
        <motion.div
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9 }}
          className="mb-20"
        >
          {/* Evidence stamp */}
          <motion.div
            initial={{ rotate: -15, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
            className="inline-block mb-8 px-6 py-3 border-2 border-red-700 rounded transform -rotate-3 bg-red-950/40"
          >
            <p className="text-red-400 text-sm font-mono tracking-widest">[ EVIDENCE #0847 ]</p>
          </motion.div>

          <div className="md:flex md:items-end md:justify-between">
            <div className="flex-1">
              <h1 className="text-7xl md:text-8xl font-black text-white mb-4 tracking-tighter">
                Forensic<br />
                <span className="bg-gradient-to-r from-red-500 via-red-600 to-red-700 bg-clip-text text-transparent">Evidence</span>
              </h1>
              <p className="text-gray-400 text-lg max-w-xl">
                Upload evidence files for comprehensive forensic analysis and investigation
              </p>
            </div>

            {/* Large forensic icon */}
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 6, repeat: Infinity }}
              className="mt-8 md:mt-0"
            >
              <div className="text-9xl drop-shadow-2xl">🔬</div>
            </motion.div>
          </div>
        </motion.div>

        {/* Error Alert */}
        {error && (
          <motion.div initial={{ opacity: 0, x: -50 }} animate={{ opacity: 1, x: 0 }} className="mb-8 p-5 bg-red-950/40 border-l-4 border-red-600 backdrop-blur-sm">
            <p className="text-red-300 font-mono text-sm">⚠️ ALERT: {error}</p>
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

          {/* Right: Info cards */}
          <motion.div initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="space-y-6">
            {[
              { emoji: "📋", title: "Case File", desc: "PDF, DOC, TXT reports" },
              { emoji: "🖼️", title: "Evidence Photos", desc: "JPG, PNG, TIFF (up to 100MB)" },
              { emoji: "🔊", title: "Audio Records", desc: "MP3, WAV interviews" },
              { emoji: "📊", title: "Data Analysis", desc: "Logs, spreadsheets, CSV" },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + i * 0.1 }}
                className="p-4 bg-gradient-to-br from-red-900/20 to-red-950/10 border border-red-700/30 rounded-lg hover:border-red-600/60 transition-all"
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
                  ? "bg-gradient-to-r from-red-700 to-red-900 text-white hover:shadow-2xl hover:shadow-red-600/50 shadow-lg"
                  : "bg-gray-700/50 text-gray-500 cursor-not-allowed"
              }`}
            >
              🔬 {selectedFile ? "PROCESS EVIDENCE" : "SELECT FILE"}
            </motion.button>
          </motion.div>
        )}

        {/* Analyzing State */}
        {isAnalyzing && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-2xl mx-auto">
            <div className="text-center">
              <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ duration: 2, repeat: Infinity }} className="inline-block mb-8">
                <div className="relative w-24 h-24 rounded-lg bg-gradient-to-br from-red-700/40 to-red-900/40 border-2 border-red-700 flex items-center justify-center">
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }} className="text-5xl">
                    🔬
                  </motion.div>
                </div>
              </motion.div>

              <h2 className="text-4xl font-black text-white mb-2">PROCESSING EVIDENCE</h2>
              <p className="text-gray-400 text-lg mb-8">Forensic analysis in progress...</p>

              <ProgressBar progress={progress} />

              {/* Analysis stages */}
              <motion.div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { stage: "Extraction", icon: "📦" },
                  { stage: "Analysis", icon: "🔍" },
                  { stage: "Report", icon: "📄" },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 + i * 0.1 }}
                    className={`p-4 rounded-lg border-2 transition-all ${progress > i * 35 ? "border-red-600 bg-red-900/20" : "border-gray-700/50 bg-gray-900/20"}`}
                  >
                    <Icon emoji={item.icon} size="lg" className="mb-2 block text-2xl" inline={false} />
                    <p className={`font-bold ${progress > i * 35 ? "text-red-300" : "text-gray-400"}`}>{item.stage}</p>
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
            <h2 className="text-5xl font-black text-white mb-3">CASE CLOSED</h2>
            <p className="text-gray-400 text-xl mb-10">Evidence processed and analyzed successfully</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(`/analysis/criminal/result/${analysisId}`)}
              className="px-12 py-4 bg-gradient-to-r from-red-700 to-red-900 text-white rounded-lg font-bold hover:shadow-2xl hover:shadow-red-600/50 transition-all shadow-lg"
            >
              📊 VIEW RESULTS
            </motion.button>
          </motion.div>
        )}
      </div>
    </div>
  );
}

