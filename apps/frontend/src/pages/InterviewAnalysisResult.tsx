import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { motion } from "framer-motion"
import api from "../lib/api"
import { RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts"

interface AnalysisResult {
  overall_risk_score: number
  confidence_level: number
  modality_breakdown: {
    video: number
    audio: number
    text: number
  }
  detected_indicators: string[]
  explanation_summary: string
  audio_analysis?: {
    transcript?: string
    emotion?: string
    stress_level?: number
  }
  video_analysis?: {
    dominant_emotion?: string
  }
}

export default function InterviewAnalysisResult() {
  const navigate = useNavigate()
  const { analysisId } = useParams()
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchAnalysisResults = async () => {
      try {
        if (!analysisId) {
          setError("No analysis ID provided")
          setLoading(false)
          return
        }

        const response = await api.get(`/api/analyses/${analysisId}`)
        const analysis = response.data.data

        console.log("🎤 Interview Analysis Data:", analysis)

        const result: AnalysisResult = {
          overall_risk_score: analysis.overall_risk_score || 0,
          confidence_level: analysis.confidence_level || 0,
          modality_breakdown: analysis.modality_breakdown || {
            video: 0,
            audio: 0,
            text: 0,
          },
          detected_indicators: analysis.detected_indicators || [],
          explanation_summary: analysis.explanation_summary || "Analysis complete",
          audio_analysis: analysis.results?.audio_analysis,
          video_analysis: analysis.results?.video_analysis,
        }

        console.log("✅ Mapped Result:", result)
        setResult(result)
      } catch (err: any) {
        console.error("❌ Error fetching analysis:", err)
        setError(err.message || "Failed to load analysis results")
      } finally {
        setLoading(false)
      }
    }

    fetchAnalysisResults()
  }, [analysisId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600 mt-4">Loading analysis results...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <button onClick={() => navigate(-1)} className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700">
            Go Back
          </button>
        </div>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-6 flex items-center justify-center">
        <p className="text-gray-600">No results available</p>
      </div>
    )
  }

  const radarData = [
    { name: "Face", value: result.modality_breakdown.video, fullMark: 100 },
    { name: "Voice", value: result.modality_breakdown.audio, fullMark: 100 },
    { name: "Text", value: result.modality_breakdown.text, fullMark: 100 },
  ]

  const getRiskColor = (score: number) => {
    if (score < 20) return "text-green-600"
    if (score < 40) return "text-yellow-600"
    if (score < 70) return "text-orange-600"
    return "text-red-600"
  }

  const getRiskBg = (score: number) => {
    if (score < 20) return "bg-green-50 border-green-200"
    if (score < 40) return "bg-yellow-50 border-yellow-200"
    if (score < 70) return "bg-orange-50 border-orange-200"
    return "bg-red-50 border-red-200"
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-blue-600 font-semibold text-sm mb-2">👤 HR INTERVIEW ANALYSIS</p>
              <h1 className="text-4xl font-bold text-gray-900">Candidate Assessment Results</h1>
            </div>
            <button
              onClick={() => navigate("/modes")}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              New Analysis
            </button>
          </div>
        </motion.div>

        {/* Risk Assessment Grid */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Risk Score */}
          <div className={`${getRiskBg(result.overall_risk_score)} border-2 rounded-xl p-6 backdrop-blur`}>
            <p className="text-gray-600 text-sm font-semibold mb-2">Risk Score</p>
            <p className={`text-5xl font-bold ${getRiskColor(result.overall_risk_score)} mb-2`}>
              {result.overall_risk_score.toFixed(1)}
            </p>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${result.overall_risk_score}%` }}
                transition={{ duration: 1 }}
                className={`h-full ${
                  result.overall_risk_score < 40
                    ? "bg-green-500"
                    : result.overall_risk_score < 70
                      ? "bg-orange-500"
                      : "bg-red-500"
                }`}
              />
            </div>
          </div>

          {/* Confidence */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6 backdrop-blur">
            <p className="text-gray-600 text-sm font-semibold mb-2">Confidence Level</p>
            <p className="text-5xl font-bold text-blue-600 mb-2">{result.confidence_level.toFixed(0)}%</p>
            <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${result.confidence_level}%` }}
                transition={{ duration: 1 }}
                className="h-full bg-blue-500"
              />
            </div>
          </div>

          {/* Stress Level */}
          <div className="bg-purple-50 border-2 border-purple-200 rounded-xl p-6 backdrop-blur">
            <p className="text-gray-600 text-sm font-semibold mb-2">Voice Stress</p>
            <p className="text-5xl font-bold text-purple-600 mb-2">{result.audio_analysis?.stress_level || 0}%</p>
            <p className="text-sm text-gray-600">
              Emotion: <span className="font-semibold">{result.audio_analysis?.emotion || "N/A"}</span>
            </p>
          </div>
        </motion.div>

        {/* Modality Breakdown */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Radar Chart */}
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Modality Analysis</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="name" stroke="#6b7280" />
                <PolarRadiusAxis stroke="#d1d5db" angle={90} domain={[0, 100]} />
                <Radar name="Score" dataKey="value" stroke="#2563eb" fill="#3b82f6" fillOpacity={0.6} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Modality Details */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900">Face Analysis</h4>
                <span className="text-2xl font-bold text-blue-600">{result.modality_breakdown.video.toFixed(1)}</span>
              </div>
              <p className="text-sm text-gray-600 mb-2">Deception Probability</p>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${result.modality_breakdown.video}%` }}
                  className="h-full bg-blue-500 rounded-full"
                />
              </div>
              <p className="text-xs text-gray-600 mt-2">Emotion: {result.video_analysis?.dominant_emotion || "N/A"}</p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900">Voice Analysis</h4>
                <span className="text-2xl font-bold text-purple-600">{result.modality_breakdown.audio.toFixed(1)}</span>
              </div>
              <p className="text-sm text-gray-600 mb-2">Stress Probability</p>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${result.modality_breakdown.audio}%` }}
                  className="h-full bg-purple-500 rounded-full"
                />
              </div>
              <p className="text-xs text-gray-600 mt-2">Speech Pattern: Stress Level</p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-gray-900">Text Analysis</h4>
                <span className="text-2xl font-bold text-green-600">{result.modality_breakdown.text.toFixed(1)}</span>
              </div>
              <p className="text-sm text-gray-600 mb-2">Inconsistency Probability</p>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${result.modality_breakdown.text}%` }}
                  className="h-full bg-green-500 rounded-full"
                />
              </div>
              <p className="text-xs text-gray-600 mt-2">Linguistic Pattern Analysis</p>
            </div>
          </div>
        </motion.div>

        {/* Indicators */}
        {result.detected_indicators && result.detected_indicators.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
              <h3 className="text-lg font-bold text-gray-900 mb-4">Detected Indicators</h3>
              <div className="flex flex-wrap gap-2">
                {result.detected_indicators.map((indicator, idx) => (
                  <span
                    key={idx}
                    className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium border border-blue-300"
                  >
                    {indicator}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Explanation */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Analysis Summary</h3>
            <p className="text-gray-700 leading-relaxed">{result.explanation_summary}</p>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
