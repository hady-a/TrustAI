import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import InputMethodSelector from "../components/InputMethodSelector";
import InterviewLiveForm from "../components/InterviewLiveForm";
import FileUploader from "../components/FileUploader";
import ProgressBar from "../components/ProgressBar";
import LiveAnalysisDisplay from "../components/LiveAnalysisDisplay";
import { analysisAPI } from "../lib/api";

interface InterviewResponse {
  questionIndex: number;
  questionText: string;
  answerText: string;
  answerVoice: boolean;
  audioBlob?: Blob;
  recordedAt: number;
  duration?: number;
}

export default function InterviewAnalysis() {
  const navigate = useNavigate();
  const [inputMethod, setInputMethod] = useState<"live" | "upload" | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string>("");
  const [analysisId, setAnalysisId] = useState<string>("");
  const [analysisComplete, setAnalysisComplete] = useState(false);
  const [liveResult, setLiveResult] = useState<any | null>(null);

  const handleInputMethodSelect = (method: "live" | "upload") => {
    setInputMethod(method);
    setError("");
    setSelectedFile(null);
  };

  const handleFileSelect = (file: File | null) => {
    setSelectedFile(file);
    setError("");
  };

  const transformAnalysisData = (apiResponse: any) => {
    const analysis = apiResponse?.data?.analysis || apiResponse?.analysis || {};
    return {
      deceptionScore: analysis?.credibility?.lie_probability || 0,
      credibilityScore: 100 - (analysis?.credibility?.lie_probability || 0),
      confidence: (analysis?.credibility?.confidence || 0) / 100,
      metrics: {
        lie_probability: analysis?.credibility?.lie_probability,
        credibility_confidence: analysis?.credibility?.confidence,
        voice_stress: analysis?.voice?.stress?.stress_level,
        voice_emotion: analysis?.voice?.emotion?.emotion,
        transcription: analysis?.voice?.transcription?.transcript || '(No data)',
      },
      insights: [
        analysis?.credibility?.analysis || 'Analysis complete',
        `Voice emotion: ${analysis?.voice?.emotion?.emotion || 'Unknown'}`,
        `Stress level: ${analysis?.voice?.stress?.stress_level || 0}/100`,
      ],
    };
  };

  const handleLiveAnalysis = async (videoBlob: Blob, audioBlob: Blob, answers: InterviewResponse[]) => {
    setIsAnalyzing(true);
    setProgress(0);
    setError("");

    let progressInterval: NodeJS.Timeout | null = null;

    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, `interview-audio-${Date.now()}.wav`);
      formData.append("image", videoBlob, `interview-video-${Date.now()}.webm`);

      // Add answers as JSON
      formData.append("answers", JSON.stringify(answers));

      // Start progress animation
      progressInterval = setInterval(() => {
        setProgress((p) => Math.min(p + Math.random() * 20, 95));
      }, 500);

      // Make fetch request with proper error handling
      const response = await fetch("http://localhost:8000/analyze/business", {
        method: "POST",
        body: formData,
        signal: AbortSignal.timeout(120000), // 2 minute timeout
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Clear progress interval before completing
      if (progressInterval) clearInterval(progressInterval);

      // Check response format: { success: true, data: {...} }
      if (data?.success && data?.data) {
        setAnalysisId(data.data.id || `interview-${Date.now()}`);
        setProgress(100);

        // Set live result for display
        const transformedData = transformAnalysisData(data.data);
        setLiveResult({
          timestamp: new Date().toISOString(),
          status: 'complete',
          data: transformedData,
        });

        setTimeout(() => {
          setIsAnalyzing(false);
          setAnalysisComplete(true);
        }, 600);
      } else {
        throw new Error(data?.message || "Invalid response format from server");
      }
    } catch (err) {
      if (progressInterval) clearInterval(progressInterval);
      
      const errorMessage = err instanceof Error ? err.message : "Analysis failed";
      console.error("Analysis error:", errorMessage, err);
      
      setError(errorMessage);
      setIsAnalyzing(false);
      setProgress(0);
    }
  };

  const handleFileAnalysis = async () => {
    if (!selectedFile) {
      setError("Please select a file to analyze");
      return;
    }

    setIsAnalyzing(true);
    setProgress(0);
    setError("");

    let progressInterval: NodeJS.Timeout | null = null;

    try {
      progressInterval = setInterval(() => {
        setProgress((p) => Math.min(p + Math.random() * 20, 95));
      }, 500);

      const fileUrl = URL.createObjectURL(selectedFile);
      const response = await analysisAPI.create({ fileUrl, modes: ["INTERVIEW"] });
      
      if (!response?.data?.data?.id) {
        throw new Error("Invalid response format from server");
      }

      const newAnalysisId = response.data.data.id;
      setAnalysisId(newAnalysisId);

      // Set live result for display
      const transformedData = transformAnalysisData(response.data.data);
      setLiveResult({
        timestamp: new Date().toISOString(),
        status: 'complete',
        data: transformedData,
      });

      setProgress(100);
      if (progressInterval) clearInterval(progressInterval);
      setTimeout(() => {
        setIsAnalyzing(false);
        setAnalysisComplete(true);
      }, 600);
    } catch (err) {
      if (progressInterval) clearInterval(progressInterval);
      
      const errorMessage = err instanceof Error ? err.message : "Analysis failed";
      console.error("File analysis error:", errorMessage, err);
      
      setError(errorMessage);
      setIsAnalyzing(false);
      setProgress(0);
    }
  };

  // Show input method selector if no method chosen
  if (inputMethod === null && !isAnalyzing && !analysisComplete) {
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
                Analyze interviews for credibility, behavioral cues, and linguistic signals in real-time
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

          <InputMethodSelector onSelect={handleInputMethodSelect} isLoading={isAnalyzing} />

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

  // Show live capture
  if (inputMethod === "live" && !isAnalyzing && !analysisComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0A1128] via-[#0f1a2e] to-[#0A1128] relative overflow-hidden py-20 px-6">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute top-1/3 left-1/4 w-52 h-52 bg-cyan-500/15 rounded-full blur-3xl"
          />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <button
              onClick={() => setInputMethod(null)}
              className="text-gray-400 hover:text-gray-300 font-semibold flex items-center gap-2 mb-6"
            >
              ← Change Input Method
            </button>
            <h2 className="text-4xl font-bold text-white">Live Interview Analysis</h2>
            <p className="text-gray-400 mt-2">Answer the interview questions in real-time</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <InterviewLiveForm
              onAnalysisStart={handleLiveAnalysis}
              isAnalyzing={isAnalyzing}
              mode="Interview Analysis"
            />
          </motion.div>
        </div>
      </div>
    );
  }

  // Show file upload
  if (inputMethod === "upload" && !isAnalyzing && !analysisComplete) {
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
            className="mb-12 flex items-center justify-between"
          >
            <div>
              <button
                onClick={() => setInputMethod(null)}
                className="text-gray-400 hover:text-gray-300 font-semibold flex items-center gap-2 mb-6"
              >
                ← Change Input Method
              </button>
              <h2 className="text-4xl font-bold text-white">Upload Interview File</h2>
              <p className="text-gray-400 mt-2">Upload audio or video file of an interview for analysis</p>
            </div>
            <div className="text-7xl">📁</div>
          </motion.div>

          {error && (
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              className="mb-8 p-5 bg-blue-950/40 border-l-4 border-blue-600 backdrop-blur-sm"
            >
              <p className="text-blue-300 font-mono text-sm">⚠️ ERROR: {error}</p>
            </motion.div>
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
  if (isAnalyzing) {
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

          <ProgressBar progress={progress} />

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
                  progress > i * 35 ? "border-cyan-600 bg-cyan-900/20" : "border-gray-700/50 bg-gray-900/20"
                }`}
              >
                <p className="text-2xl mb-2">{item.icon}</p>
                <p className={`font-bold ${progress > i * 35 ? "text-cyan-300" : "text-gray-400"}`}>{item.stage}</p>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // Show completion state
  if (analysisComplete) {
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
          {/* Header */}
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

          {/* Live Analysis Display */}
          {liveResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-12 p-8 bg-gray-900/50 border border-gray-800 rounded-xl"
            >
              <LiveAnalysisDisplay
                result={liveResult}
                isAnalyzing={false}
              />
            </motion.div>
          )}

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-8"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(`/analysis/interview/result/${analysisId}`)}
              className="px-12 py-4 bg-gradient-to-r from-cyan-600 to-blue-700 text-white rounded-lg font-bold hover:shadow-2xl hover:shadow-cyan-600/50 transition-all shadow-lg"
            >
              📊 VIEW FULL REPORT
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setInputMethod(null);
                setAnalysisComplete(false);
                setLiveResult(null);
                setSelectedFile(null);
              }}
              className="px-12 py-4 border-2 border-cyan-600 text-cyan-400 rounded-lg font-bold hover:bg-cyan-900/20 transition-all"
            >
              🔄 NEW ANALYSIS
            </motion.button>
          </motion.div>
        </div>
      </div>
    );
  }
}
