import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import InputMethodSelector from "../components/InputMethodSelector";
import AnalysisError from "../components/AnalysisError";
import AnalysisProgress from "../components/AnalysisProgress";
import AnalysisResults from "../components/AnalysisResults";
import FileUploader from "../components/FileUploader";
import { useAnalysisState } from "../hooks/useAnalysisState";

export default function CriminalAnalysis() {
  const navigate = useNavigate();
  const [inputMethod, setInputMethod] = useState<"upload" | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const analysis = useAnalysisState();

  // Request ID tracking to prevent stale data updates (race conditions)
  const latestRequestId = useRef(0);
  // AbortController for canceling previous requests
  const currentController = useRef<AbortController | null>(null);

  const handleInputMethodSelect = (method: "upload") => {
    setInputMethod(method);
    analysis.clearError();
    setSelectedFile(null);
  };

  const handleFileSelect = (file: File | null) => {
    setSelectedFile(file);
    analysis.clearError();
  };

  const handleFileAnalysis = async () => {
    if (!selectedFile) {
      analysis.setAnalysisError("Please select a file to analyze");
      return;
    }

    // Use timestamp as unique request ID for this request
    const requestId = Date.now();
    latestRequestId.current = requestId;
    console.log(`🔢 [CriminalAnalysis] Starting request ${requestId}`);

    // Abort any previous requests before starting new one
    if (currentController.current) {
      console.log(`🛑 [CriminalAnalysis] Aborting previous request`);
      currentController.current.abort();
    }

    // Create new AbortController for this request
    const controller = new AbortController();
    currentController.current = controller;

    // Reset state before starting new analysis
    analysis.setLiveResult(null);
    analysis.setIsAnalyzing(true);
    analysis.setProgress(0);
    analysis.clearError();

    const progressInterval = analysis.startProgress();

    try {
      const formData = new FormData();
      formData.append('audio', selectedFile, selectedFile.name);

      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:9999/api';
      const token = localStorage.getItem('authToken');
      console.log(`📁 [CriminalAnalysis] Sending analysis request (ID: ${requestId})...`);
      const res = await fetch(`${apiBase}/analyze/investigation`, {
        method: 'POST',
        body: formData,
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        signal: controller.signal, // ← Pass abort signal
        timeout: 120000,
      });

      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }

      const response = await res.json();

      // CRITICAL: Check if this is still the latest request
      if (requestId !== latestRequestId.current) {
        console.warn(
          `⚠️  [CriminalAnalysis] Ignoring stale response from request ${requestId} ` +
          `(latest is ${latestRequestId.current})`
        );
        return;
      }

      console.log(`✅ [CriminalAnalysis] Response received for request ${requestId}:`, response);

      // Extract analysis data with safe access
      // Backend structure: {success, data: {face, voice, credibility, errors}, timestamp, report_type}
      const analysisData = response?.data;
      console.log("🔍 FRONTEND DATA:", analysisData);
      console.log("📋 Data keys:", analysisData ? Object.keys(analysisData) : 'no data');

      if (analysisData) {
        console.log(`✅ [CriminalAnalysis] Analysis data extracted successfully for request ${requestId}`);
        if (analysisData.id) analysis.setAnalysisId(analysisData.id);
        analysis.setAnalysisSuccess(analysisData);
      } else {
        console.error(`❌ [CriminalAnalysis] No data in response for request ${requestId}:`, response);
        analysis.setAnalysisError("Analysis failed");
      }
    } catch (err) {
      // Ignore abort errors (expected when canceling previous requests)
      if (err instanceof Error && err.name === 'AbortError') {
        console.log(`ℹ️  [CriminalAnalysis] Request ${requestId} was cancelled`);
        return;
      }

      // Only show error if this is still the latest request
      if (requestId === latestRequestId.current) {
        console.error(`❌ [CriminalAnalysis] Error for request ${requestId}:`, err);
        analysis.setAnalysisError(err instanceof Error ? err.message : "Analysis failed");
      }
    } finally {
      clearInterval(progressInterval);
      // Only reset analyzing if this was the latest request
      if (requestId === latestRequestId.current) {
        console.log(`🔚 [CriminalAnalysis] Analysis complete for request ${requestId}, setting isAnalyzing to false`);
        analysis.setIsAnalyzing(false);
      }
    }
  };

  const handleReset = () => {
    analysis.resetState();
    setInputMethod(null);
    setSelectedFile(null);
  };

  // Show input method selector
  if (inputMethod === null && !analysis.isAnalyzing && !analysis.analysisComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0B0F19] via-[#1a1515] to-[#0B0F19] relative overflow-hidden py-12 sm:py-16 md:py-20 px-4 sm:px-6">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
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
        </div>

        <div className="relative z-10 max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="grid sm:grid-cols-2 gap-8 sm:gap-12 items-center mb-12 sm:mb-16"
          >
            <div>
              <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white mb-2 sm:mb-4 tracking-tighter leading-tight">
                Criminal<br />
                <span className="bg-gradient-to-r from-red-500 to-red-700 bg-clip-text text-transparent">Investigation</span>
              </h1>
              <p className="text-gray-400 text-xs sm:text-sm md:text-base lg:text-lg max-w-xl leading-relaxed">
                Analyze suspects, detect deception, and identify inconsistencies in speech patterns
              </p>
            </div>
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 6, repeat: Infinity }}
              className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl drop-shadow-2xl hidden sm:block"
            >
              🔬
            </motion.div>
          </motion.div>

          <InputMethodSelector onSelect={handleInputMethodSelect} isLoading={analysis.isAnalyzing} />

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(-1)}
            className="mt-12 px-4 sm:px-8 py-2 sm:py-3 border-2 border-gray-600 text-gray-300 text-sm sm:text-base rounded-lg font-bold hover:border-gray-500 transition-all mx-auto block min-h-10 sm:min-h-12"
          >
            ← Back
          </motion.button>
        </div>
      </div>
    );
  }

  // Show file upload
  if (inputMethod === "upload" && !analysis.isAnalyzing && !analysis.analysisComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0B0F19] via-[#1a1515] to-[#0B0F19] relative overflow-hidden py-12 sm:py-16 md:py-20 px-4 sm:px-6">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute top-1/4 -left-20 w-40 h-40 bg-red-600/20 rounded-full blur-3xl"
          />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-0">
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 sm:mb-12 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-8"
          >
            <div className="flex-1">
              <button
                onClick={() => setInputMethod(null)}
                className="text-gray-400 hover:text-gray-300 font-semibold text-xs sm:text-sm flex items-center gap-2 mb-3 sm:mb-6"
              >
                ← Change Input Method
              </button>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight">Upload Evidence File</h2>
              <p className="text-gray-400 text-xs sm:text-sm md:text-base mt-2 leading-relaxed">Upload video, audio, or image evidence for analysis</p>
            </div>
            <div className="text-5xl sm:text-6xl md:text-7xl flex-shrink-0">📁</div>
          </motion.div>

          {analysis.error && (
            <AnalysisError 
              message={analysis.error} 
              onRetry={() => {
                analysis.handleRetry()
                if (selectedFile) handleFileAnalysis()
              }}
            />
          )}

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-12"
          >
            <FileUploader onFileSelect={handleFileSelect} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setInputMethod(null)}
              className="px-8 py-3 border-2 border-gray-600 text-gray-300 rounded-lg font-bold hover:border-gray-500 transition-all"
            >
              ← Back
            </motion.button>
            <motion.button
              whileHover={selectedFile ? { scale: 1.05 } : {}}
              whileTap={selectedFile ? { scale: 0.95 } : {}}
              onClick={handleFileAnalysis}
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
        </div>
      </div>
    );
  }

  // Show analyzing state
  if (analysis.isAnalyzing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0B0F19] via-[#1a1515] to-[#0B0F19] relative overflow-hidden flex items-center justify-center py-20 px-6">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute top-1/4 -left-20 w-40 h-40 bg-red-600/20 rounded-full blur-3xl"
          />
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative z-10 max-w-2xl w-full text-center"
        >
          <motion.div className="inline-block mb-8 p-8 rounded-lg bg-gradient-to-br from-red-700/20 to-red-900/20 border-2 border-red-700">
            <div className="flex items-center justify-center gap-1">
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  animate={{ height: ["20px", "50px", "20px"] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.08 }}
                  className="w-2 bg-gradient-to-t from-red-500 to-red-400 rounded-full"
                />
              ))}
            </div>
          </motion.div>

          <h2 className="text-4xl font-black text-white mb-2">PROCESSING EVIDENCE</h2>
          <p className="text-gray-400 text-lg mb-8">Forensic analysis in progress...</p>

          <AnalysisProgress progress={analysis.progress} isAnalyzing={analysis.isAnalyzing} />

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
                className={`p-4 rounded-lg border-2 transition-all ${
                  analysis.progress > i * 35 ? "border-red-600 bg-red-900/20" : "border-gray-700/50 bg-gray-900/20"
                }`}
              >
                <p className="text-2xl mb-2">{item.icon}</p>
                <p className={`font-bold ${analysis.progress > i * 35 ? "text-red-300" : "text-gray-400"}`}>{item.stage}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // Show completion state
  if (analysis.analysisComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0B0F19] via-[#1a1515] to-[#0B0F19] relative overflow-hidden py-20 px-6">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute top-1/4 -left-20 w-40 h-40 bg-green-600/20 rounded-full blur-3xl"
          />
        </div>

        <div className="relative z-10 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-12 text-center"
          >
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              className="inline-block mb-8"
            >
              <div className="w-28 h-28 rounded-lg bg-gradient-to-br from-green-600/40 to-green-900/40 border-2 border-green-700 flex items-center justify-center text-6xl">
                ✓
              </div>
            </motion.div>
            <h2 className="text-5xl font-black text-white mb-3">CASE CLOSED</h2>
            <p className="text-gray-400 text-xl">Evidence processed and analyzed successfully</p>
          </motion.div>

          <AnalysisResults 
            liveResult={analysis.liveResult}
            analysisId={analysis.analysisId}
            onReset={handleReset}
          />

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mt-8"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(`/analysis/criminal/result/${analysis.analysisId}`)}
              className="px-12 py-4 bg-gradient-to-r from-red-700 to-red-900 text-white rounded-lg font-bold hover:shadow-2xl hover:shadow-red-600/50 transition-all shadow-lg"
            >
              📊 VIEW FULL REPORT
            </motion.button>
          </motion.div>
        </div>
      </div>
    );
  }
}

