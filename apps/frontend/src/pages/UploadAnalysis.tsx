import React, { useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import AnalysisError from "../components/AnalysisError"
import AnalysisProgress from "../components/AnalysisProgress"
import AnalysisResults from "../components/AnalysisResults"
import FileUploader from "../components/FileUploader"
import { analysisAPI } from "../lib/api"
import { useAnalysisState } from "../hooks/useAnalysisState"
import { AxiosError } from "axios"

export default function UploadAnalysis() {
  const navigate = useNavigate()
  const selectedMode = sessionStorage.getItem("selectedMode") || "Unknown"
  const selectedModeValue = sessionStorage.getItem("selectedModeValue") || "INVESTIGATION"

  const analysis = useAnalysisState()
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleFileSelect = (file: File) => {
    setSelectedFile(file)
    analysis.clearError()
  }

  const startAnalysis = async () => {
    if (!selectedFile) return

    analysis.setIsAnalyzing(true)
    analysis.setAnalysisComplete(false)
    analysis.setProgress(0)
    analysis.clearError()

    try {
      console.log('📁 [UploadAnalysis] Starting analysis with file:', selectedFile.name);
      
      const response = await analysisAPI.create({
        fileUrl: `file:///${selectedFile.name}`,
        modes: [selectedModeValue],
      })

      console.log('📊 [UploadAnalysis] API response received:', response);

      // Extract analysis data with safe access
      // Backend structure: {success, data: {face, voice, credibility, errors}, timestamp, report_type}
      const analysisData = response?.data;
      console.log("🔍 FRONTEND DATA:", analysisData);
      console.log("📋 Data keys:", analysisData ? Object.keys(analysisData) : 'no data');

      if (analysisData && analysisData.id) {
        console.log('✅ [UploadAnalysis] Analysis data extracted, ID:', analysisData.id);
        analysis.setAnalysisId(analysisData.id)
        analysis.setAnalysisSuccess(analysisData)
      } else {
        const errorMsg = analysisData?.error || response?.error || "Analysis failed"
        console.error('❌ [UploadAnalysis] No analysis ID in response:', errorMsg);
        analysis.setAnalysisError(errorMsg)
      }
    } catch (err) {
      const axiosError = err as AxiosError<{ message: string }>
      const message =
        axiosError.response?.data?.message ||
        "Failed to start analysis. Please try again."
      console.error('❌ [UploadAnalysis] Error during analysis:', message);
      analysis.setAnalysisError(message)
    } finally {
      console.log('🔚 [UploadAnalysis] Analysis complete, setting isAnalyzing to false');
      analysis.setIsAnalyzing(false)
    }
  }

  const handleReset = () => {
    analysis.resetState()
    setSelectedFile(null)
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

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-12 sm:py-16 md:py-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-12 sm:mb-16"
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
            className="inline-block mb-4 sm:mb-6 px-3 sm:px-4 py-1.5 sm:py-2 bg-indigo-500/20 border border-indigo-500/50 rounded-full"
          >
            <p className="text-indigo-300 text-xs sm:text-sm font-semibold tracking-wide">UPLOAD & ANALYZE</p>
          </motion.div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-white mb-3 sm:mb-4 tracking-tight leading-tight">
            Upload Your <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">File</span>
          </h1>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 text-gray-400 text-sm sm:text-base mt-4 sm:mt-6"
          >
            <div className="px-3 sm:px-4 py-2 bg-indigo-500/10 border border-indigo-500/30 rounded-lg">
              <span className="text-indigo-300 text-xs sm:text-sm">Mode:</span> <span className="text-indigo-400 font-semibold ml-1 sm:ml-2">{selectedMode}</span>
            </div>
          </motion.div>
        </motion.div>

        {/* Error Alert with Retry */}
        {analysis.error && (
          <AnalysisError 
            message={analysis.error} 
            onRetry={() => {
              analysis.handleRetry()
              if (selectedFile) startAnalysis()
            }}
          />
        )}

        {/* Progress Display */}
        <AnalysisProgress 
          progress={analysis.progress} 
          isAnalyzing={analysis.isAnalyzing}
        />

        {/* File Uploader */}
        {!analysis.isAnalyzing && !analysis.analysisComplete && (
          <motion.div
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="mb-8 sm:mb-12"
          >
            <FileUploader onFileSelect={handleFileSelect} selectedFile={selectedFile} />
          </motion.div>
        )}

        {/* Analysis State */}
        {!analysis.isAnalyzing && !analysis.analysisComplete && selectedFile && (
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4"
          >
            <motion.button
              whileHover={{ scale: 1.05, x: -5 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate(-1)}
              className="px-4 sm:px-8 py-2.5 sm:py-3 border-2 border-gray-600 text-gray-300 text-sm sm:text-base rounded-lg sm:rounded-xl font-semibold hover:border-gray-400 hover:text-gray-100 transition-all duration-300 flex items-center justify-center gap-2 min-h-10 sm:min-h-12"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              <span>Back</span>
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.05, x: 5 }}
              whileTap={{ scale: 0.95 }}
              onClick={startAnalysis}
              className="px-4 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm sm:text-base rounded-lg sm:rounded-xl font-semibold hover:shadow-2xl hover:shadow-indigo-500/50 transition-all duration-300 flex items-center justify-center gap-2 shadow-lg min-h-10 sm:min-h-12"
            >
              <span>Start Analysis</span>
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </motion.button>
          </motion.div>
        )}

        {/* Analyzing State */}
        {analysis.isAnalyzing && (
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
                className="inline-block mb-4 sm:mb-6"
              >
                <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-indigo-600/30 to-purple-600/30 border-2 border-indigo-500/50 flex items-center justify-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  >
                    <svg
                      className="w-8 h-8 sm:w-10 sm:h-10 text-indigo-400"
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
                className="text-2xl sm:text-3xl font-bold text-white mb-2 sm:mb-3 leading-tight"
              >
                Analyzing your file...
              </motion.h2>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="text-gray-400 text-sm sm:text-base leading-relaxed"
              >
                Using {selectedMode} analysis mode
              </motion.p>
            </div>
          </motion.div>
        )}

        {/* Complete State */}
        {analysis.analysisComplete && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, type: "spring" }}
            className="max-w-4xl mx-auto"
          >
            {/* Header */}
            <div className="text-center mb-8 sm:mb-12">
              {/* Success badge */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, delay: 0.2 }}
                className="inline-block mb-4 sm:mb-6"
              >
                <div className="relative w-16 h-16 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-green-500/30 to-emerald-500/30 border-2 border-green-500/50 flex items-center justify-center">
                  <motion.div
                    animate={{ scale: [0.8, 1, 0.8] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <svg className="w-8 h-8 sm:w-12 sm:h-12 text-green-400" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </motion.div>
                </div>
              </motion.div>

              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-2 sm:mb-3 leading-tight">Analysis Complete!</h2>
              <p className="text-gray-400 text-sm sm:text-base md:text-lg leading-relaxed mb-6 sm:mb-8">
                Your file has been successfully analyzed with {selectedMode} mode
              </p>
            </div>

            {/* Results Component */}
            <AnalysisResults 
              liveResult={analysis.liveResult}
              analysisId={analysis.analysisId}
              onReset={handleReset}
            />
          </motion.div>
        )}
      </div>
    </div>
  )
}
