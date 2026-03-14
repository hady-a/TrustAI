import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"

interface AnalysisResult {
  riskLevel: "Critical" | "High" | "Medium" | "Low"
  confidence: number
  findings: {
    category: string
    severity: "Critical" | "High" | "Medium" | "Low"
    description: string
    evidence: string[]
  }[]
  recommendations: string[]
  timeline?: string
  suspectProfile?: string
}

export default function CriminalAnalysisResult() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<"findings" | "recommendations" | "timeline">("findings")
  
  // Mock data - would come from analysis backend
  const result: AnalysisResult = {
    riskLevel: "High",
    confidence: 92,
    findings: [
      {
        category: "Behavioral Anomalies",
        severity: "Critical",
        description: "Detected suspicious behavioral patterns inconsistent with stated narrative",
        evidence: ["Timeline inconsistencies", "Contradictory statements", "Emotional responses out of pattern"],
      },
      {
        category: "Evidence Discrepancies",
        severity: "High",
        description: "Physical evidence conflicts with witness testimony",
        evidence: ["DNA mismatch", "Forensic timeline conflict", "Incomplete alibi verification"],
      },
      {
        category: "Motive Analysis",
        severity: "Medium",
        description: "Potential motives identified based on case investigation",
        evidence: ["Financial pressure", "Relationship conflicts", "Prior incidents"],
      },
    ],
    recommendations: [
      "Conduct comprehensive forensic re-examination of primary evidence",
      "Perform polygraph examination on primary suspect",
      "Investigate financial records for past 12 months",
      "Interview secondary witnesses with focus on timeline verification",
      "Cross-reference alibi claims with surveillance footage",
    ],
    timeline: "2024-03-06",
    suspectProfile: "Subject shows signs of premeditation with calculated deception",
  }

  const getRiskColor = (level: string) => {
    switch (level) {
      case "Critical":
        return "from-red-600 to-red-800"
      case "High":
        return "from-orange-600 to-red-700"
      case "Medium":
        return "from-yellow-600 to-orange-600"
      case "Low":
        return "from-green-600 to-emerald-600"
      default:
        return "from-gray-600 to-gray-800"
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "Critical":
        return "bg-red-500/20 border-red-500/50 text-red-300"
      case "High":
        return "bg-orange-500/20 border-orange-500/50 text-orange-300"
      case "Medium":
        return "bg-yellow-500/20 border-yellow-500/50 text-yellow-300"
      case "Low":
        return "bg-green-500/20 border-green-500/50 text-green-300"
      default:
        return "bg-gray-500/20 border-gray-500/50 text-gray-300"
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B0F19] via-[#1a1515] to-[#0B0F19] relative overflow-hidden">
      {/* Forensic Evidence Background */}
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
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-red-700/0 via-red-700/50 to-red-700/0" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-20">
        {/* Result Header */}
        <motion.div
          initial={{ opacity: 0, y: -40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9 }}
          className="mb-16"
        >
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-red-400 text-lg font-semibold mb-2">⚖️ CRIMINAL ANALYSIS RESULTS</p>
              <h1 className="text-5xl font-bold text-white">Investigation Findings</h1>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/modes")}
              className="px-6 py-2 bg-red-600/20 border border-red-500/50 text-red-300 rounded-lg hover:bg-red-600/30 transition"
            >
              New Analysis
            </motion.button>
          </div>
        </motion.div>

        {/* Risk Assessment Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className={`mb-12 rounded-2xl border border-red-500/30 bg-gradient-to-br ${getRiskColor(result.riskLevel)} bg-opacity-10 p-8 overflow-hidden relative`}
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-red-500 to-transparent" />
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Risk Level */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-black/40 rounded-xl p-6 border border-red-500/20 backdrop-blur"
            >
              <p className="text-red-400 text-sm font-semibold mb-3">RISK LEVEL</p>
              <p className="text-4xl font-bold text-red-300 mb-2">{result.riskLevel}</p>
              <div className="w-full bg-red-900/30 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "75%" }}
                  transition={{ duration: 1.5 }}
                  className="h-full bg-gradient-to-r from-red-600 to-red-400 rounded-full"
                />
              </div>
            </motion.div>

            {/* Confidence Score */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-black/40 rounded-xl p-6 border border-red-500/20 backdrop-blur"
            >
              <p className="text-red-400 text-sm font-semibold mb-3">CONFIDENCE LEVEL</p>
              <p className="text-4xl font-bold text-red-300 mb-2">{result.confidence}%</p>
              <div className="w-full bg-red-900/30 rounded-full h-2">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${result.confidence}%` }}
                  transition={{ duration: 1.5 }}
                  className="h-full bg-gradient-to-r from-green-600 to-emerald-400 rounded-full"
                />
              </div>
            </motion.div>

            {/* Analysis Status */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-black/40 rounded-xl p-6 border border-red-500/20 backdrop-blur"
            >
              <p className="text-red-400 text-sm font-semibold mb-3">ANALYSIS TIMESTAMP</p>
              <p className="text-lg font-bold text-red-300 mb-3">{result.timeline}</p>
              <div className="flex gap-2">
                <span className="px-3 py-1 bg-red-500/20 border border-red-500/50 text-red-300 text-xs rounded-full font-medium">
                  Completed
                </span>
              </div>
            </motion.div>
          </div>
        </motion.div>

        {/* Tabs */}
        <div className="mb-8 border-b border-red-500/20">
          <div className="flex gap-8">
            {["findings", "recommendations", "timeline"].map((tab) => (
              <motion.button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`pb-4 font-semibold text-lg transition-colors relative ${
                  activeTab === tab ? "text-red-400" : "text-gray-400 hover:text-gray-300"
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
                {activeTab === tab && (
                  <motion.div
                    layoutId="underline"
                    className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-red-600 to-red-400"
                  />
                )}
              </motion.button>
            ))}
          </div>
        </div>

        {/* Findings Tab */}
        {activeTab === "findings" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="space-y-6 mb-16"
          >
            {result.findings.map((finding, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`rounded-xl border p-6 backdrop-blur ${getSeverityColor(finding.severity)}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">{finding.category}</h3>
                    <p className="text-gray-300">{finding.description}</p>
                  </div>
                  <span className={`px-3 py-1 bg-black/40 rounded-full text-xs font-semibold whitespace-nowrap`}>
                    {finding.severity}
                  </span>
                </div>
                
                <div>
                  <p className="text-xs font-semibold text-gray-400 mb-3 uppercase">Evidence Points</p>
                  <div className="flex flex-wrap gap-2">
                    {finding.evidence.map((ev, i) => (
                      <motion.span
                        key={i}
                        whileHover={{ scale: 1.05 }}
                        className="px-3 py-1 bg-black/30 border border-red-500/20 text-red-300 text-sm rounded-full"
                      >
                        {ev}
                      </motion.span>
                    ))}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Recommendations Tab */}
        {activeTab === "recommendations" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="space-y-4 mb-16"
          >
            {result.recommendations.map((rec, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="flex gap-4 p-6 rounded-xl bg-red-500/10 border border-red-500/20 backdrop-blur"
              >
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-red-600 to-red-400 flex items-center justify-center text-white font-bold"
                >
                  {index + 1}
                </motion.div>
                <p className="text-gray-300 flex-1">{rec}</p>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Timeline Tab */}
        {activeTab === "timeline" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-16"
          >
            <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-8 backdrop-blur">
              <h3 className="text-xl font-bold text-white mb-6">Analysis Timeline</h3>
              <div className="space-y-6">
                {[
                  { time: "14:32", event: "Analysis Initiated", status: "completed" },
                  { time: "14:45", event: "Evidence Scanning", status: "completed" },
                  { time: "15:12", event: "Pattern Recognition", status: "completed" },
                  { time: "15:38", event: "Report Generation", status: "completed" },
                  { time: "15:42", event: "Analysis Complete", status: "completed" },
                ].map((item, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.5, delay: i * 0.1 }}
                    className="flex gap-4"
                  >
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-red-600 to-red-400 flex items-center justify-center text-white font-bold">
                        ✓
                      </div>
                      {i < 4 && <div className="absolute top-12 left-1/2 transform -translate-x-1/2 w-1 h-8 bg-red-600/50" />}
                    </div>
                    <div className="flex-1 pt-2">
                      <p className="text-red-400 font-semibold">{item.time}</p>
                      <p className="text-gray-300">{item.event}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {/* Export Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="flex gap-4 justify-center"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-3 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-red-500/50 transition"
          >
            📥 Export Report
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-3 bg-red-500/20 border border-red-500/50 text-red-300 rounded-lg font-semibold hover:bg-red-500/30 transition"
          >
            📧 Share Analysis
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate("/modes")}
            className="px-8 py-3 bg-gray-800/50 border border-gray-700 text-gray-300 rounded-lg font-semibold hover:bg-gray-800 transition"
          >
            ↻ New Analysis
          </motion.button>
        </motion.div>
      </div>
    </div>
  )
}
