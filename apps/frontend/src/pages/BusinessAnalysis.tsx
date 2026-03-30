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

export default function BusinessAnalysis() {
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

  // Transform API response to LiveAnalysisDisplay format
  const transformAnalysisData = (apiResponse: any) => {
    console.log('🔍 [transformAnalysisData] Raw API response:', JSON.stringify(apiResponse, null, 2));

    const analysis = apiResponse?.data?.data?.analysis || apiResponse?.data?.analysis || apiResponse?.analysis || {};
    console.log('🔍 [transformAnalysisData] Extracted analysis:', JSON.stringify(analysis, null, 2));

    // Safely extract nested fields with fallbacks
    const credibilityData = analysis?.credibility || {}
    const voiceData = analysis?.voice || {}
    const stressData = voiceData?.stress || {}
    const emotionData = voiceData?.emotion || {}
    const transcriptionData = voiceData?.transcription || {}

    const transformed = {
      deceptionScore: credibilityData?.lie_probability || 0,
      credibilityScore: 100 - (credibilityData?.lie_probability || 0),
      confidence: (credibilityData?.confidence || 0) / 100,
      metrics: {
        lie_probability: credibilityData?.lie_probability ?? 'N/A',
        credibility_confidence: credibilityData?.confidence ?? 'N/A',
        voice_stress: stressData?.stress_level ?? 'N/A',
        voice_emotion: emotionData?.emotion ?? 'N/A',
        transcription: transcriptionData?.transcript || '(No data)',
      },
      insights: [
        credibilityData?.analysis || 'Analysis complete',
        `Voice emotion: ${emotionData?.emotion || 'Unknown'}`,
        `Stress level: ${stressData?.stress_level || 0}/100`,
      ],
    };
    console.log('✅ [transformAnalysisData] Transformed data:', JSON.stringify(transformed, null, 2));
    return transformed;
  };

  const handleFileSelect = (file: File | null) => {
    setSelectedFile(file);
    setError("");
  };

  const handleLiveAnalysis = async (videoBlob: Blob, audioBlob: Blob, answers: InterviewResponse[]) => {
    setIsAnalyzing(true);
    setProgress(0);
    setError("");

    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, `business-audio-${Date.now()}.wav`);
      formData.append("image", videoBlob, `business-video-${Date.now()}.webm`);

      // Add answers as JSON
      formData.append("answers", JSON.stringify(answers));

      const progressInterval = setInterval(() => {
        setProgress((p) => Math.min(p + Math.random() * 20, 95));
      }, 500);

      console.log('📁 [handleLiveAnalysis] Sending analysis request to Flask API /analyze/business');
      // Call Flask API directly on port 8000
      const response = await fetch('http://localhost:8000/analyze/business', {
        method: 'POST',
        body: formData,
      }).then(r => r.json()).then(data => ({ data }));

      clearInterval(progressInterval);
      console.log('✅ [handleLiveAnalysis] API response received:', response);
      console.log('📊 [handleLiveAnalysis] Response data structure:', response.data);

      const analysisData = response.data?.data || response.data;

      if (analysisData?.success && analysisData?.data?.id) {
        console.log('✅ [handleLiveAnalysis] Analysis data extracted, ID:', analysisData.data.id);
        setAnalysisId(analysisData.data.id);

        // Set live result for display
        const transformedData = transformAnalysisData(analysisData.data);
        console.log('📊 [handleLiveAnalysis] Setting liveResult with transformed data:', transformedData);
        setLiveResult({
          timestamp: new Date().toISOString(),
          status: 'complete',
          data: transformedData,
        });

        setProgress(100);
        setAnalysisComplete(true);
      } else {
        console.error('❌ [handleLiveAnalysis] Analysis failed:', analysisData);
        setError(analysisData?.error || "Analysis failed");
      }
    } catch (err) {
      console.error('❌ [handleLiveAnalysis] Error:', err);
      setError(err instanceof Error ? err.message : "Analysis failed");
      setProgress(0);
    } finally {
      console.log('🔚 [handleLiveAnalysis] Analysis complete, setting isAnalyzing to false');
      setIsAnalyzing(false);
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

    const progressInterval = setInterval(() => {
      setProgress((p) => Math.min(p + Math.random() * 20, 95));
    }, 500);

    try {
      const fileUrl = URL.createObjectURL(selectedFile);
      console.log('📁 [handleFileAnalysis] Sending analysis request with fileUrl:', fileUrl);
      const response = await analysisAPI.create({ fileUrl, modes: ["BUSINESS"] });
      console.log('✅ [handleFileAnalysis] Response received:', response.data);
      console.log('📊 [handleFileAnalysis] Nested data (res.data.data):', response.data?.data);

      const analysisData = response.data?.data || response.data;

      if (analysisData?.id) {
        console.log('✅ [handleFileAnalysis] Analysis data extracted, ID:', analysisData.id);
        setAnalysisId(analysisData.id);

        // Set live result for display using setLiveResult
        const transformedData = transformAnalysisData(analysisData);
        console.log('📊 [handleFileAnalysis] Setting liveResult with transformed data:', transformedData);
        setLiveResult({
          timestamp: new Date().toISOString(),
          status: 'complete',
          data: transformedData,
        });

        setProgress(100);
        setAnalysisComplete(true);
      } else {
        console.error('❌ [handleFileAnalysis] No analysis ID in response:', analysisData);
        setError(analysisData?.error || "Analysis failed");
      }
    } catch (err) {
      console.error('❌ [handleFileAnalysis] Error:', err);
      setError(err instanceof Error ? err.message : "Analysis failed");
      setProgress(0);
    } finally {
      clearInterval(progressInterval);
      console.log('🔚 [handleFileAnalysis] Analysis complete, setting isAnalyzing to false');
      setIsAnalyzing(false);
    }
  };

  // Show input method selector if no method chosen
  if (inputMethod === null && !isAnalyzing && !analysisComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0B1628] via-[#0f2420] to-[#0B1628] relative overflow-hidden py-20 px-6">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
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
                Business<br />
                <span className="bg-gradient-to-r from-emerald-500 to-green-600 bg-clip-text text-transparent">Analysis</span>
              </h1>
              <p className="text-gray-400 text-lg max-w-xl">
                Analyze business interactions, negotiations, and communications with real-time insights
              </p>
            </div>
            <motion.div
              animate={{ y: [0, -15, 0] }}
              transition={{ duration: 2.5, repeat: Infinity }}
              className="text-9xl drop-shadow-2xl"
            >
              📈
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
      <div className="min-h-screen bg-gradient-to-br from-[#0B1628] via-[#0f2420] to-[#0B1628] relative overflow-hidden py-20 px-6">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute top-1/4 right-1/4 w-64 h-64 bg-cyan-500/12 rounded-full blur-3xl"
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
            <h2 className="text-4xl font-bold text-white">Live Business Analysis</h2>
            <p className="text-gray-400 mt-2">Answer the business questions in real-time</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <InterviewLiveForm
              onAnalysisStart={handleLiveAnalysis}
              isAnalyzing={isAnalyzing}
              mode="Business Analysis"
            />
          </motion.div>
        </div>
      </div>
    );
  }

  // Show file upload
  if (inputMethod === "upload" && !isAnalyzing && !analysisComplete) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0B1628] via-[#0f2420] to-[#0B1628] relative overflow-hidden py-20 px-6">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute top-1/4 right-1/4 w-64 h-64 bg-emerald-500/12 rounded-full blur-3xl"
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
              <h2 className="text-4xl font-bold text-white">Upload Business File</h2>
              <p className="text-gray-400 mt-2">Upload a video, audio, or image file for analysis</p>
            </div>
            <div className="text-7xl">📁</div>
          </motion.div>

          {error && (
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              className="mb-8 p-5 bg-red-950/40 border-l-4 border-red-600 backdrop-blur-sm"
            >
              <p className="text-red-300 font-mono text-sm">⚡ ERROR: {error}</p>
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
                  ? "bg-gradient-to-r from-emerald-600 to-green-700 text-white hover:shadow-2xl hover:shadow-emerald-600/50 shadow-lg"
                  : "bg-gray-700/50 text-gray-500 cursor-not-allowed"
              }`}
            >
              📈 {selectedFile ? "START ANALYSIS" : "UPLOAD FILE"}
            </motion.button>
          </motion.div>
        </div>
      </div>
    );
  }

  // Show analyzing state
  if (isAnalyzing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0B1628] via-[#0f2420] to-[#0B1628] relative overflow-hidden flex items-center justify-center py-20 px-6">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute top-1/4 right-1/4 w-64 h-64 bg-emerald-500/12 rounded-full blur-3xl"
          />
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="relative z-10 max-w-2xl w-full text-center"
        >
          <motion.div className="inline-block mb-8 p-8 rounded-lg bg-gradient-to-br from-emerald-700/20 to-green-900/20 border-2 border-emerald-700">
            <div className="flex items-center justify-center gap-1">
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
          <p className="text-gray-400 text-lg mb-8">Processing and generating insights...</p>

          <ProgressBar progress={progress} />

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
                className={`p-4 rounded-lg border-2 transition-all ${
                  progress > i * 35 ? "border-emerald-600 bg-emerald-900/20" : "border-gray-700/50 bg-gray-900/20"
                }`}
              >
                <p className="text-2xl mb-2">{item.icon}</p>
                <p className={`font-bold ${progress > i * 35 ? "text-emerald-300" : "text-gray-400"}`}>{item.stage}</p>
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
      <div className="min-h-screen bg-gradient-to-br from-[#0B1628] via-[#0f2420] to-[#0B1628] relative overflow-hidden py-20 px-6">
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute top-1/4 right-1/4 w-64 h-64 bg-green-500/12 rounded-full blur-3xl"
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
            <h2 className="text-5xl font-black text-white mb-3">ANALYSIS COMPLETE</h2>
            <p className="text-gray-400 text-xl">Business intelligence insights are ready below</p>
          </motion.div>

          {/* Display Live Analysis Results */}
          {liveResult && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mb-12 p-8 bg-gray-900/50 border border-gray-800 rounded-xl"
            >
              <LiveAnalysisDisplay
                result={liveResult}
                isAnalyzing={false}
              />
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(`/analysis/business/result/${analysisId}`)}
              className="px-12 py-4 bg-gradient-to-r from-emerald-600 to-green-700 text-white rounded-lg font-bold hover:shadow-2xl hover:shadow-emerald-600/50 transition-all shadow-lg"
            >
              📊 VIEW FULL REPORT
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                setAnalysisComplete(false);
                setInputMethod(null);
                setLiveResult(null);
              }}
              className="px-12 py-4 border-2 border-emerald-600 text-emerald-300 rounded-lg font-bold hover:bg-emerald-600/10 transition-all"
            >
              🔄 NEW ANALYSIS
            </motion.button>
          </motion.div>
        </div>
      </div>
    );
  }
}
