import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import InputMethodSelector from "../components/InputMethodSelector";
import AnalysisError from "../components/AnalysisError";
import AnalysisProgress from "../components/AnalysisProgress";
import AnalysisResults from "../components/AnalysisResults";
import FileUploader from "../components/FileUploader";
import { useAnalysisState } from "../hooks/useAnalysisState";

export default function InterviewAnalysis() {
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
    console.log(`🔢 [InterviewAnalysis] Starting request ${requestId}`);

    // Abort any previous requests before starting new one
    if (currentController.current) {
      console.log(`🛑 [InterviewAnalysis] Aborting previous request`);
      currentController.current.abort();
    }

    // Create new AbortController for this request
    const controller = new AbortController();
    currentController.current = controller;

    analysis.setIsAnalyzing(true);
    analysis.setProgress(0);
    analysis.clearError();

    let progressInterval: ReturnType<typeof setInterval> | null = null;

    try {
      progressInterval = analysis.startProgress();

      const formData = new FormData();
      formData.append('audio', selectedFile, selectedFile.name);

      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:9999/api';
      console.log(`📁 [InterviewAnalysis] Sending file analysis request (ID: ${requestId})`);
      const token = localStorage.getItem('authToken');
      const res = await fetch(`${apiBase}/analyze/interview`, {
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
          `⚠️  [InterviewAnalysis] Ignoring stale response from request ${requestId} ` +
          `(latest is ${latestRequestId.current})`
        );
        return;
      }

      console.log(`✅ [InterviewAnalysis] Response received for request ${requestId}:`, response);

      // Extract analysis data with safe access
      // Backend structure: {success, data: {face, voice, credibility, errors}, timestamp, report_type}
      const analysisData = response?.data;
      console.log("🔍 FRONTEND DATA:", analysisData);
      console.log("📋 Data keys:", analysisData ? Object.keys(analysisData) : 'no data');

      if (!analysisData) {
        console.error(`❌ [InterviewAnalysis] No analysis data in response for request ${requestId}:`, response);
        throw new Error("Invalid response format from server");
      }

      console.log(`✅ [InterviewAnalysis] Analysis data extracted successfully for request ${requestId}`);
      if (analysisData.id) analysis.setAnalysisId(analysisData.id);
      analysis.setAnalysisSuccess(analysisData);
    } catch (err) {
      // Ignore abort errors (expected when canceling previous requests)
      if (err instanceof Error && err.name === 'AbortError') {
        console.log(`ℹ️  [InterviewAnalysis] Request ${requestId} was cancelled`);
        return;
      }

      // Only show error if this is still the latest request
      if (requestId === latestRequestId.current) {
        const errorMessage = err instanceof Error ? err.message : "Analysis failed";
        console.error(`❌ [InterviewAnalysis] File analysis error for request ${requestId}:`, errorMessage);
        analysis.setAnalysisError(errorMessage);
      }
    } finally {
      if (progressInterval) clearInterval(progressInterval);
      // Only reset analyzing if this was the latest request
      if (requestId === latestRequestId.current) {
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
      <div className="min-h-screen bg-gradient-to-br from-[#0A1128] via-[#0f1a2e] to-[#0A1128] relative overflow-hidden py-20 px-6">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
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
        </div>

        <div className="relative z-10 max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="grid md:grid-cols-2 gap-12 items-center mb-12"
          >
            <div>
              <h1 className="text-6xl md:text-7xl font-black text-white mb-4 tracking-tighter">
                Interview<br />
                <span className="bg-gradient-to-r from-cyan-500 to-blue-600 bg-clip-text text-transparent">Analysis</span>
              </h1>
              <p className="text-gray-400 text-lg max-w-xl">
                Analyze interviews for credibility, behavioral cues, and linguistic signals
              </p>
            </div>
            <motion.div
              animate={{ y: [0, -20, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-9xl drop-shadow-2xl"
            >
              🎙️
            </motion.div>
          </motion.div>

          <InputMethodSelector onSelect={handleInputMethodSelect} isLoading={analysis.isAnalyzing} />

          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(-1)}
            className="mt-12 px-8 py-3 border-2 border-gray-600 text-gray-300 rounded-lg font-bold hover:border-gray-500 transition-all mx-auto block"
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
      <div className="min-h-screen bg-gradient-to-br from-[#0A1128] via-[#0f1a2e] to-[#0A1128] relative overflow-hidden py-20 px-6">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute top-1/3 left-1/4 w-52 h-52 bg-cyan-500/15 rounded-full blur-3xl"
          />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-12"
          >
            <button
              onClick={() => setInputMethod(null)}
              className="text-gray-400 hover:text-gray-300 font-semibold flex items-center gap-2 mb-6"
            >
              ← Change Input Method
            </button>
            <h2 className="text-4xl font-bold text-white">Upload Interview File</h2>
            <p className="text-gray-400 mt-2">Upload audio or video file for analysis</p>
          </motion.div>

          {analysis.error && (
            <AnalysisError
              message={analysis.error}
              onRetry={() => {
                analysis.handleRetry();
                if (selectedFile) handleFileAnalysis();
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
                  ? "bg-gradient-to-r from-cyan-600 to-blue-700 text-white hover:shadow-2xl hover:shadow-cyan-600/50 shadow-lg"
                  : "bg-gray-700/50 text-gray-500 cursor-not-allowed"
              }`}
            >
              🎙️ {selectedFile ? "ANALYZE INTERVIEW" : "SELECT FILE"}
            </motion.button>
          </motion.div>
        </div>
      </div>
    );
  }

  // Show analyzing state
  if (analysis.isAnalyzing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A1128] via-[#0f1a2e] to-[#0A1128] relative overflow-hidden flex items-center justify-center py-20 px-6">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute top-1/3 left-1/4 w-52 h-52 bg-cyan-500/15 rounded-full blur-3xl"
          />
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative z-10 max-w-2xl w-full text-center"
        >
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
          <p className="text-gray-400 text-lg mb-8">Extracting insights from interview...</p>

          <AnalysisProgress progress={analysis.progress} isAnalyzing={analysis.isAnalyzing} />

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
                className={`p-4 rounded-lg border-2 transition-all ${
                  analysis.progress > i * 35 ? "border-cyan-600 bg-cyan-900/20" : "border-gray-700/50 bg-gray-900/20"
                }`}
              >
                <p className="text-2xl mb-2">{item.icon}</p>
                <p className={`font-bold ${analysis.progress > i * 35 ? "text-cyan-300" : "text-gray-400"}`}>{item.stage}</p>
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
      <div className="min-h-screen bg-gradient-to-br from-[#0A1128] via-[#0f1a2e] to-[#0A1128] relative overflow-hidden py-20 px-6">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute top-1/3 left-1/4 w-52 h-52 bg-cyan-500/15 rounded-full blur-3xl"
          />
        </div>

        <div className="relative z-10 max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <motion.div
              initial={{ scale: 0, rotate: 180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
              className="inline-block mb-6"
            >
              <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-green-600/40 to-green-900/40 border-2 border-green-700 flex items-center justify-center text-5xl">
                ✓
              </div>
            </motion.div>
            <h2 className="text-5xl font-black text-white mb-3">ANALYSIS COMPLETE</h2>
            <p className="text-gray-400 text-lg">Interview transcript analyzed and insights extracted</p>
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
              onClick={() => navigate(`/analysis/interview/result/${analysis.analysisId}`)}
              className="px-12 py-4 bg-gradient-to-r from-cyan-600 to-blue-700 text-white rounded-lg font-bold hover:shadow-2xl hover:shadow-cyan-600/50 transition-all shadow-lg"
            >
              📊 VIEW FULL REPORT
            </motion.button>
          </motion.div>
        </div>
      </div>
    );
  }
}
