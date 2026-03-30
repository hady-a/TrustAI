import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import FileUploader from "../components/FileUploader"
import ProgressBar from "../components/ProgressBar"
import LiveAnalysisDisplay from "../components/LiveAnalysisDisplay"
import { analysisAPI } from "../lib/api"
import { AxiosError } from "axios"

export default function UploadAnalysis() {
  const navigate = useNavigate()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [progress, setProgress] = useState(0)
  const [analysisComplete, setAnalysisComplete] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [liveResult, setLiveResult] = useState<any | null>(null)
  const [_analysisId, setAnalysisId] = useState<string>("")
  const selectedMode = sessionStorage.getItem("selectedMode") || "Unknown"
  const selectedModeValue = sessionStorage.getItem("selectedModeValue") || "CRIMINAL"

  const handleFileSelect = (file: File) => {
    setSelectedFile(file)
    setError(null)
  }

  const transformAnalysisData = (apiResponse: any) => {
    const analysis = apiResponse?.data?.analysis || apiResponse?.analysis || {}
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
    }
  }

  const startAnalysis = async () => {
    if (!selectedFile) return

    setIsAnalyzing(true)
    setAnalysisComplete(false)
    setProgress(0)
    setError(null)

    try {
      // In a real app, you'd upload the file first and get a fileUrl
      // For now, using a placeholder URL
      const response = await analysisAPI.create({
        fileUrl: `file:///${selectedFile.name}`,
        modes: [selectedModeValue],
      })

      // Extract analysis ID and transform data
      if (response.data.success && response.data.data?.id) {
        setAnalysisId(response.data.data.id)

        // Set live result for display
        const transformedData = transformAnalysisData(response.data.data)
        setLiveResult({
          timestamp: new Date().toISOString(),
          status: 'complete',
          data: transformedData,
        })

        setProgress(100)
        setTimeout(() => {
          setIsAnalyzing(false)
          setAnalysisComplete(true)
        }, 600)
      } else {
        setError(response.data.error || "Analysis failed")
        setIsAnalyzing(false)
      }
    } catch (err) {
      const axiosError = err as AxiosError<{ message: string }>
      const message =
        axiosError.response?.data?.message ||
        "Failed to start analysis. Please try again."
      setError(message)
      setIsAnalyzing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br dark:from-[#0B0F19] dark:via-[#1a1f3a] dark:to-[#0B0F19] from-slate-50 via-blue-50 to-slate-50 overflow-hidden">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/4 -left-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
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
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            className="inline-block mb-6 px-4 py-2 bg-indigo-500/20 border border-indigo-500/50 rounded-full"
          >
            <p className="text-indigo-300 text-sm font-semibold">UPLOAD & ANALYZE</p>
          </motion.div>

          <h1 className="text-6xl md:text-7xl font-bold text-white mb-4 tracking-tight">
            Upload Your <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">File</span>
          </h1>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-center gap-4 text-gray-400 text-lg"
          >
            <div className="px-4 py-2 bg-indigo-500/10 border border-indigo-500/30 rounded-lg">
              <span className="text-indigo-300">Mode:</span> <span className="text-indigo-400 font-semibold ml-2">{selectedMode}</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Error Alert */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20, x: -50 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0 }}
            className="mb-8 p-4 bg-red-500/15 border border-red-500/40 rounded-2xl backdrop-blur-sm flex items-start gap-4"
          >
            <div className="w-6 h-6 rounded-full bg-red-500/30 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg className="w-4 h-4 text-red-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-red-300 font-semibold">Error</p>
              <p className="text-red-200/70 text-sm mt-1">{error}</p>
            </div>
          </motion.div>
        )}

        {/* File Uploader */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-12"
        >
          <FileUploader onFileSelect={handleFileSelect} />
        </motion.div>

        {/* Analysis State */}
        {!isAnalyzing && !analysisComplete && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row justify-center gap-4"
          >
            <motion.button
              whileHover={{ scale: 1.05, x: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(-1)}
              className="px-8 py-3 border-2 border-gray-600 text-gray-300 rounded-xl font-semibold hover:border-gray-400 hover:text-gray-100 transition-all duration-300 flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back
            </motion.button>

            <motion.button
              whileHover={selectedFile ? { scale: 1.05, x: 5 } : {}}
              whileTap={selectedFile ? { scale: 0.95 } : {}}
              onClick={startAnalysis}
              disabled={!selectedFile}
              className={`px-8 py-3 rounded-xl font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                selectedFile
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-2xl hover:shadow-indigo-500/50 shadow-lg"
                  : "bg-gray-700/50 text-gray-500 cursor-not-allowed"
              }`}
            >
              {selectedFile ? (
                <>
                  Start Analysis
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              ) : (
                "Select a file to continue"
              )}
            </motion.button>
          </motion.div>
        )}

        {/* Analyzing State */}
        {isAnalyzing && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="max-w-2xl mx-auto"
          >
            <div className="text-center mb-12">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="inline-block mb-6"
              >
                <div className="relative w-20 h-20 rounded-full bg-gradient-to-br from-indigo-600/30 to-purple-600/30 border-2 border-indigo-500/50 flex items-center justify-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <svg
                      className="w-10 h-10 text-indigo-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 10V3L4 14h7v7l9-11h-7z"
                      />
                    </svg>
                  </motion.div>
                </div>
              </motion.div>

              <motion.h2
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-3xl font-bold text-white mb-3"
              >
                Analyzing your file...
              </motion.h2>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-gray-400 text-lg"
              >
                Using {selectedMode} analysis mode
              </motion.p>
            </div>

            {/* Progress Bar */}
            <div className="mb-12">
              <ProgressBar progress={progress} />
            </div>

            {/* Info cards during analysis */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { icon: "📂", label: "File Processing", desc: "Preparing file" },
                { icon: "🔍", label: "Analysis", desc: "Running models" },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.1 }}
                  className="p-4 bg-indigo-500/10 border border-indigo-500/30 rounded-xl backdrop-blur-sm"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{item.icon}</span>
                    <div>
                      <p className="text-white font-semibold text-sm">{item.label}</p>
                      <p className="text-gray-400 text-xs">{item.desc}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Complete State */}
        {analysisComplete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, type: "spring" }}
            className="max-w-4xl mx-auto"
          >
            {/* Header */}
            <div className="text-center mb-12">
              {/* Success badge */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                className="inline-block mb-6"
              >
                <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-green-500/30 to-emerald-500/30 border-2 border-green-500/50 flex items-center justify-center">
                  <motion.div
                    animate={{ scale: [0.8, 1, 0.8] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <svg className="w-12 h-12 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </motion.div>
                </div>
              </motion.div>

              <h2 className="text-4xl font-bold text-white mb-3">Analysis Complete!</h2>
              <p className="text-gray-400 text-lg mb-8">
                Your file has been successfully analyzed with {selectedMode} mode
              </p>
            </div>

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
              className="flex flex-col sm:flex-row gap-4 justify-center"
            >
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate("/modes")}
                className="px-10 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-2xl hover:shadow-indigo-500/50 transition-all shadow-lg flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                Try Another Analysis
              </motion.button>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setAnalysisComplete(false)
                  setLiveResult(null)
                  setSelectedFile(null)
                  setProgress(0)
                  setError(null)
                }}
                className="px-10 py-4 border-2 border-indigo-600 text-indigo-400 rounded-xl font-semibold hover:bg-indigo-900/20 transition-all flex items-center justify-center gap-3"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Upload Another File
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  )
}
