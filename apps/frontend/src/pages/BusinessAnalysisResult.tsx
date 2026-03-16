import { useState, useEffect } from "react"
import { useNavigate, useParams } from "react-router-dom"
import { motion } from "framer-motion"
import api from "../lib/api"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"

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

export default function BusinessAnalysisResult() {
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

        console.log("💼 Business Analysis Data:", analysis)

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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-500"></div>
          <p className="text-slate-300 mt-4">Loading business analysis...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6 flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-400 mb-4">Error: {error}</p>
          <button onClick={() => navigate(-1)} className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700">
            Go Back
          </button>
        </div>
      </div>
    )
  }

  if (!result) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 p-6 flex items-center justify-center">
        <p className="text-slate-300">No results available</p>
      </div>
    )
  }

  const chartData = [
    { label: "Face", value: result.modality_breakdown.video },
    { label: "Voice", value: result.modality_breakdown.audio },
    { label: "Text", value: result.modality_breakdown.text },
  ]

  const professionalismScore = 100 - result.overall_risk_score
  const getProfessionalismGrade = (score: number) => {
    if (score >= 90) return { grade: "A", color: "text-emerald-400", bg: "bg-emerald-900/20" }
    if (score >= 80) return { grade: "B", color: "text-blue-400", bg: "bg-blue-900/20" }
    if (score >= 70) return { grade: "C", color: "text-yellow-400", bg: "bg-yellow-900/20" }
    if (score >= 60) return { grade: "D", color: "text-orange-400", bg: "bg-orange-900/20" }
    return { grade: "F", color: "text-red-400", bg: "bg-red-900/20" }
  }

  const grade = getProfessionalismGrade(professionalismScore)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-teal-900 to-slate-900">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-teal-500 rounded-full blur-3xl"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto p-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-teal-400 font-semibold text-sm mb-2">💼 BUSINESS MEETING ANALYSIS</p>
              <h1 className="text-4xl font-bold text-slate-100">Professional Assessment Report</h1>
            </div>
            <button
              onClick={() => navigate("/modes")}
              className="px-6 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition"
            >
              New Analysis
            </button>
          </div>
        </motion.div>

        {/* Executive Summary */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {/* Professionalism Grade */}
          <div className={`${grade.bg} border-2 border-teal-500 rounded-xl p-6 backdrop-blur`}>
            <p className="text-slate-400 text-xs font-semibold mb-2">PROFESSIONALISM</p>
            <p className={`text-5xl font-black ${grade.color} mb-2`}>{grade.grade}</p>
            <p className="text-sm text-slate-300">{professionalismScore.toFixed(0)}/100</p>
          </div>

          {/* Risk Score */}
          <div className="bg-slate-700/30 border-2 border-slate-600 rounded-xl p-6 backdrop-blur">
            <p className="text-slate-400 text-xs font-semibold mb-2">DECEPTION RISK</p>
            <p className="text-5xl font-bold text-amber-400">{result.overall_risk_score.toFixed(0)}</p>
            <p className="text-sm text-slate-300">Out of 100</p>
          </div>

          {/* Confidence */}
          <div className="bg-teal-900/30 border-2 border-teal-600 rounded-xl p-6 backdrop-blur">
            <p className="text-slate-400 text-xs font-semibold mb-2">ANALYSIS CONFIDENCE</p>
            <p className="text-5xl font-bold text-teal-300">{result.confidence_level.toFixed(0)}%</p>
            <p className="text-sm text-slate-300">Reliability: HIGH</p>
          </div>

          {/* Stress Level */}
          <div className="bg-slate-700/30 border-2 border-slate-600 rounded-xl p-6 backdrop-blur">
            <p className="text-slate-400 text-xs font-semibold mb-2">STRESS INDICATORS</p>
            <p className="text-5xl font-bold text-orange-400">{result.audio_analysis?.stress_level || 0}%</p>
            <p className="text-sm text-slate-300">Vocal Tension</p>
          </div>
        </motion.div>

        {/* Modality Analysis */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Line Chart */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 backdrop-blur">
            <h3 className="text-lg font-bold text-slate-100 mb-4">Behavioral Pattern Analysis</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#4a5568" />
                <XAxis dataKey="label" stroke="#a0aec0" />
                <YAxis stroke="#a0aec0" domain={[0, 100]} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1a202c",
                    border: "1px solid #0d9488",
                    borderRadius: "8px",
                  }}
                  formatter={(value: any) => `${Number(value).toFixed(1)}%`}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#14b8a6"
                  strokeWidth={3}
                  dot={{ fill: "#14b8a6", r: 6 }}
                  activeDot={{ r: 8 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Performance Metrics */}
          <div className="space-y-4">
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 backdrop-blur">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-slate-100">Visual Authenticity</h4>
                <span className="text-2xl font-bold text-emerald-400">{result.modality_breakdown.video.toFixed(0)}%</span>
              </div>
              <p className="text-sm text-slate-400 mb-2">Facial Expression Consistency</p>
              <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${100 - result.modality_breakdown.video}%` }}
                  className="h-full bg-emerald-500 rounded-full"
                />
              </div>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 backdrop-blur">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-slate-100">Vocal Authenticity</h4>
                <span className="text-2xl font-bold text-blue-400">{result.modality_breakdown.audio.toFixed(0)}%</span>
              </div>
              <p className="text-sm text-slate-400 mb-2">Speech Pattern Stability</p>
              <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${100 - result.modality_breakdown.audio}%` }}
                  className="h-full bg-blue-500 rounded-full"
                />
              </div>
            </div>

            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 backdrop-blur">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-slate-100">Message Authenticity</h4>
                <span className="text-2xl font-bold text-violet-400">{result.modality_breakdown.text.toFixed(0)}%</span>
              </div>
              <p className="text-sm text-slate-400 mb-2">Narrative Consistency</p>
              <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${100 - result.modality_breakdown.text}%` }}
                  className="h-full bg-violet-500 rounded-full"
                />
              </div>
            </div>
          </div>
        </motion.div>

        {/* Detected Patterns */}
        {result.detected_indicators && result.detected_indicators.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-6 backdrop-blur">
              <h3 className="text-lg font-bold text-slate-100 mb-4">Observed Behavioral Patterns</h3>
              <div className="flex flex-wrap gap-2">
                {result.detected_indicators.map((indicator, idx) => (
                  <motion.span
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                    className="px-4 py-2 bg-teal-900/40 text-teal-200 rounded-lg text-sm font-medium border border-teal-700/50 hover:bg-teal-900/60 transition"
                  >
                    • {indicator}
                  </motion.span>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Executive Recommendations */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-8 backdrop-blur">
            <h3 className="text-lg font-bold text-slate-100 mb-4">Executive Summary & Recommendations</h3>

            <div className="mb-6 pb-6 border-b border-slate-700">
              <p className="text-slate-200 leading-relaxed mb-4">{result.explanation_summary}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h4 className="text-teal-400 font-semibold text-sm mb-2">Assessment Status</h4>
                <div className="space-y-2">
                  <p className="text-slate-300">
                    Grade: <span className={`font-bold ${grade.color}`}>{grade.grade}</span>
                  </p>
                  <p className="text-slate-300">
                    Risk Level:{" "}
                    <span className="font-bold text-amber-400">
                      {result.overall_risk_score > 70 ? "HIGH" : result.overall_risk_score > 40 ? "MEDIUM" : "LOW"}
                    </span>
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-teal-400 font-semibold text-sm mb-2">Key Metrics</h4>
                <div className="space-y-2">
                  <p className="text-slate-300">
                    Professionalism: <span className="font-bold">{professionalismScore.toFixed(0)}%</span>
                  </p>
                  <p className="text-slate-300">
                    Confidence: <span className="font-bold">{result.confidence_level.toFixed(0)}%</span>
                  </p>
                </div>
              </div>

              <div>
                <h4 className="text-teal-400 font-semibold text-sm mb-2">Next Steps</h4>
                <p className="text-slate-300 text-sm">
                  {result.overall_risk_score > 70
                    ? "Conduct detailed follow-up interview"
                    : "Proceed with standard protocols"}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
