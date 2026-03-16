import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { motion } from "framer-motion"
import api from "../lib/api"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

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

export default function CriminalAnalysisResult() {
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

        const response = await api.get(`/analyses/${analysisId}`)
        const analysis = response.data.data

        console.log("🔍 Criminal Analysis Data:", analysis)

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
      <div className="min-h-screen bg-red-950 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          <p className="text-red-200 mt-4">Loading interrogation analysis...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-red-950 p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-200 mb-4">Error: {error}</p>
          <button onClick={() => navigate(-1)} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
            Go Back
          </button>
        </div>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-red-950 p-6 flex items-center justify-center">
        <p className="text-red-200">No results available</p>
      </div>
    )
  }

  const chartData = [
    { name: "Face", value: result.modality_breakdown.video },
    { name: "Voice", value: result.modality_breakdown.audio },
    { name: "Text", value: result.modality_breakdown.text },
  ]

  const getRiskLevel = (score: number) => {
    if (score < 25) return { label: "LOW", color: "text-green-400", bg: "bg-green-900/20" }
    if (score < 50) return { label: "MEDIUM", color: "text-yellow-400", bg: "bg-yellow-900/20" }
    if (score < 75) return { label: "HIGH", color: "text-orange-400", bg: "bg-orange-900/20" }
    return { label: "CRITICAL", color: "text-red-400", bg: "bg-red-900/20" }
  }

  const riskLevel = getRiskLevel(result.overall_risk_score)

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-950 via-red-900 to-slate-900">
      {/* Scan lines effect */}
      <div className="fixed inset-0 pointer-events-none opacity-10">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-red-500 to-transparent animate-pulse"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-red-400 font-mono font-bold text-sm mb-2">🔍 INTERROGATION ANALYSIS</p>
              <h1 className="text-5xl font-black text-red-100">DECEPTION ASSESSMENT REPORT</h1>
            </div>
            <button
              onClick={() => navigate("/modes")}
              className="px-6 py-2 bg-red-700 text-white rounded-lg hover:bg-red-600 transition border border-red-500"
            >
              New Analysis
            </button>
          </div>
        </motion.div>

        {/* Risk Level Alert */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className={`${riskLevel.bg} border-2 border-red-500 rounded-xl p-8 mb-8 backdrop-blur`}
        >
          <div className="flex items-center justify-between md:flex-row flex-col gap-4">
            <div>
              <p className="text-red-300 text-sm font-mono mb-2">DECEPTION RISK LEVEL</p>
              <p className={`text-6xl font-black ${riskLevel.color}`}>{riskLevel.label}</p>
            </div>

            <div className="text-right">
              <p className="text-red-300 text-sm font-mono mb-2">OVERALL SCORE</p>
              <p className="text-5xl font-black text-red-300">{result.overall_risk_score.toFixed(1)}</p>
              <div className="mt-4 w-48 h-2 bg-red-900 rounded-full overflow-hidden border border-red-500">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${result.overall_risk_score}%` }}
                  transition={{ duration: 1.5 }}
                  className="h-full bg-gradient-to-r from-yellow-500 via-orange-500 to-red-600"
                />
              </div>
            </div>

            <div className="text-center">
              <p className="text-red-300 text-sm font-mono mb-2">ANALYSIS CONFIDENCE</p>
              <p className="text-4xl font-black text-red-400">{result.confidence_level.toFixed(0)}%</p>
              <p className="text-xs text-red-400 mt-2">Reliability: HIGH</p>
            </div>
          </div>
        </motion.div>

        {/* Modality Breakdown */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Bar Chart */}
          <div className="bg-red-900/30 border border-red-700 rounded-xl p-6 backdrop-blur">
            <h3 className="text-lg font-bold text-red-200 mb-4 font-mono">DECEPTION INDICATORS BY MODALITY</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#7f1d1d" />
                <XAxis dataKey="name" stroke="#fca5a5" />
                <YAxis stroke="#fca5a5" domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f1f1f",
                    border: "1px solid #dc2626",
                    borderRadius: "8px",
                  }}
                  formatter={(value: any) => `${Number(value).toFixed(1)}%`}
                />
                <Bar dataKey="value" fill="#dc2626" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Deception Findings */}
          <div className="space-y-4">
            <div className="bg-red-900/30 border border-red-700 rounded-xl p-6 backdrop-blur">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-red-200 font-mono">FACIAL ANALYSIS</h4>
                <span className="text-3xl font-black text-red-400">{result.modality_breakdown.video.toFixed(1)}%</span>
              </div>
              <p className="text-sm text-red-300 mb-2">Microexpression Detection</p>
              <div className="w-full bg-red-900 rounded-full h-2 border border-red-700 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${result.modality_breakdown.video}%` }}
                  className="h-full bg-red-600 rounded-full"
                />
              </div>
              <p className="text-xs text-red-400 mt-2">Emotion Detected: {result.video_analysis?.dominant_emotion || "NEUTRAL"}</p>
            </div>

            <div className="bg-red-900/30 border border-red-700 rounded-xl p-6 backdrop-blur">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-red-200 font-mono">VOCAL ANALYSIS</h4>
                <span className="text-3xl font-black text-orange-400">{result.modality_breakdown.audio.toFixed(1)}%</span>
              </div>
              <p className="text-sm text-red-300 mb-2">Stress Indicators</p>
              <div className="w-full bg-red-900 rounded-full h-2 border border-red-700 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${result.modality_breakdown.audio}%` }}
                  className="h-full bg-orange-500 rounded-full"
                />
              </div>
              <p className="text-xs text-red-400 mt-2">Stress Level: {result.audio_analysis?.stress_level || 0}%</p>
            </div>

            <div className="bg-red-900/30 border border-red-700 rounded-xl p-6 backdrop-blur">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-red-200 font-mono">LINGUISTIC ANALYSIS</h4>
                <span className="text-3xl font-black text-yellow-400">{result.modality_breakdown.text.toFixed(1)}%</span>
              </div>
              <p className="text-sm text-red-300 mb-2">Narrative Inconsistency</p>
              <div className="w-full bg-red-900 rounded-full h-2 border border-red-700 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${result.modality_breakdown.text}%` }}
                  className="h-full bg-yellow-500 rounded-full"
                />
              </div>
              <p className="text-xs text-red-400 mt-2">Pattern Analysis: ACTIVE</p>
            </div>
          </div>
        </motion.div>

        {/* Critical Indicators */}
        {result.detected_indicators && result.detected_indicators.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="bg-red-900/30 border border-red-700 rounded-xl p-6 backdrop-blur">
              <h3 className="text-lg font-bold text-red-200 mb-4 font-mono">🚨 CRITICAL DECEPTION INDICATORS</h3>
              <div className="flex flex-wrap gap-2">
                {result.detected_indicators.map((indicator, idx) => (
                  <motion.span
                    key={idx}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.1 }}
                    className="px-4 py-2 bg-red-700 text-red-100 rounded-lg text-sm font-bold border border-red-500 animate-pulse"
                  >
                    {indicator}
                  </motion.span>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Analysis Report */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="bg-red-900/30 border border-red-700 rounded-xl p-8 backdrop-blur">
            <h3 className="text-lg font-bold text-red-200 mb-4 font-mono">INVESTIGATOR REPORT</h3>
            <div className="prose prose-invert max-w-none">
              <p className="text-red-100 leading-relaxed">{result.explanation_summary}</p>
            </div>

            <div className="mt-6 pt-6 border-t border-red-700 flex gap-4">
              <div className="flex-1">
                <p className="text-xs text-red-400 font-mono mb-1">Risk Classification</p>
                <p className={`text-lg font-bold ${riskLevel.color}`}>{riskLevel.label}</p>
              </div>
              <div className="flex-1">
                <p className="text-xs text-red-400 font-mono mb-1">Recommendation</p>
                <p className="text-lg font-bold text-red-300">
                  {result.overall_risk_score > 70 ? "FURTHER INVESTIGATION" : "MONITOR"}
                </p>
              </div>
              <div className="flex-1">
                <p className="text-xs text-red-400 font-mono mb-1">Timeline</p>
                <p className="text-lg font-bold text-red-300">{new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
