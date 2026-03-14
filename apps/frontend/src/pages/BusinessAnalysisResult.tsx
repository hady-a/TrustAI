import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { Icon } from "../components/UI/IconRenderer"

interface BusinessMetric {
  name: string
  current: number
  benchmark: number
  trend: "up" | "down" | "stable"
  category: string
}

interface BusinessRecommendation {
  priority: "Critical" | "High" | "Medium" | "Low"
  title: string
  description: string
  impact: string
  timeline: string
}

export default function BusinessAnalysisResult() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<"metrics" | "recommendations" | "forecast">("metrics")

  // Mock data - would come from analysis backend
  const metrics: BusinessMetric[] = [
    { name: "Revenue Growth", current: 23.5, benchmark: 18, trend: "up", category: "Financial" },
    { name: "Market Share", current: 15.2, benchmark: 12, trend: "up", category: "Market" },
    { name: "Customer Satisfaction", current: 8.7, benchmark: 8, trend: "up", category: "Customer" },
    { name: "Operational Efficiency", current: 82, benchmark: 75, trend: "up", category: "Operations" },
  ]

  const recommendations: BusinessRecommendation[] = [
    {
      priority: "Critical",
      title: "Expand Market Presence",
      description: "Analyze expansion opportunities in emerging markets with growth potential above 20% annually",
      impact: "Potential revenue increase of 35-40%",
      timeline: "Q2-Q3 2024",
    },
    {
      priority: "High",
      title: "Digital Transformation Initiative",
      description: "Implement AI-driven analytics and automation to improve decision-making processes",
      impact: "20% reduction in operational costs",
      timeline: "Q1-Q4 2024",
    },
    {
      priority: "High",
      title: "Customer Retention Program",
      description: "Develop loyalty program targeting high-value customer segments",
      impact: "15% improvement in customer retention",
      timeline: "Q2 2024",
    },
    {
      priority: "Medium",
      title: "Supply Chain Optimization",
      description: "Restructure supply chain for cost efficiency and sustainability",
      impact: "12-15% cost reduction per unit",
      timeline: "Q3-Q4 2024",
    },
  ]

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "up":
        return <Icon emoji="📈" size="md" inline={true} />
      case "down":
        return <Icon emoji="📉" size="md" inline={true} />
      case "stable":
        return <Icon emoji="➡️" size="md" inline={true} />
      default:
        return <Icon emoji="➡️" size="md" inline={true} />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "Critical":
        return "from-red-600 to-red-800"
      case "High":
        return "from-orange-600 to-orange-700"
      case "Medium":
        return "from-yellow-600 to-amber-700"
      case "Low":
        return "from-green-600 to-emerald-700"
      default:
        return "from-gray-600 to-gray-800"
    }
  }

  const getPriorityBadgeColor = (priority: string) => {
    switch (priority) {
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
    <div className="min-h-screen bg-gradient-to-br from-[#0B1415] via-[#0f2420] to-[#0B1415] relative overflow-hidden">
      {/* Professional Business Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 5, repeat: Infinity }}
          className="absolute top-1/3 -left-32 w-64 h-64 bg-emerald-600/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ scale: [1.1, 1, 1.1] }}
          transition={{ duration: 6, repeat: Infinity }}
          className="absolute bottom-1/3 -right-32 w-64 h-64 bg-teal-600/10 rounded-full blur-3xl"
        />
        {/* Grid pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" />
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
              <p className="text-emerald-400 text-lg font-semibold mb-2"><Icon emoji="💼" inline={true} />BUSINESS ANALYSIS RESULTS</p>
              <h1 className="text-5xl font-bold text-white">Strategic Business Intelligence</h1>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/modes")}
              className="px-6 py-2 bg-emerald-600/20 border border-emerald-500/50 text-emerald-300 rounded-lg hover:bg-emerald-600/30 transition"
            >
              New Analysis
            </motion.button>
          </div>
        </motion.div>

        {/* KPI Overview Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
        >
          {metrics.map((metric, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.05, y: -5 }}
              className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-6 backdrop-blur overflow-hidden relative group"
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-emerald-500 to-transparent opacity-0 group-hover:opacity-100 transition" />

              <p className="text-emerald-400 text-sm font-semibold mb-3">{metric.category}</p>
              <h3 className="text-lg font-bold text-white mb-4">{metric.name}</h3>

              <div className="flex items-baseline gap-3 mb-4">
                <span className="text-3xl font-bold text-emerald-300">{metric.current}</span>
                <span className="text-2xl">{getTrendIcon(metric.trend)}</span>
              </div>

              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">vs Benchmark</span>
                <span className={`font-semibold ${metric.current > metric.benchmark ? "text-emerald-400" : "text-red-400"}`}>
                  {metric.current > metric.benchmark ? "+" : ""}{(metric.current - metric.benchmark).toFixed(1)}
                </span>
              </div>

              <div className="mt-4 pt-4 border-t border-emerald-500/20">
                <div className="flex gap-2 text-xs float-right">
                  <span className="px-2 py-1 bg-emerald-500/20 text-emerald-300 rounded">vs {metric.benchmark}</span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Tabs */}
        <div className="mb-8 border-b border-emerald-500/20">
          <div className="flex gap-8">
            {["metrics", "recommendations", "forecast"].map((tab) => (
              <motion.button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`pb-4 font-semibold text-lg transition-colors relative ${
                  activeTab === tab ? "text-emerald-400" : "text-gray-400 hover:text-gray-300"
                }`}
              >
                <>
                  {tab === "metrics" && <><Icon emoji="📊" inline={true} />Key Metrics</>}
                  {tab === "recommendations" && <><Icon emoji="🎯" inline={true} />Recommendations</>}
                  {tab === "forecast" && <><Icon emoji="🔮" inline={true} />Forecast</>}
                  {activeTab === tab && (
                    <motion.div
                      layoutId="underline"
                      className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-600 to-teal-400"
                    />
                  )}
                </>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Metrics Tab */}
        {activeTab === "metrics" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="space-y-8 mb-16"
          >
            {[
              {
                title: "Revenue Performance",
                metrics: [
                  { label: "YoY Growth", value: "23.5%", status: "excellent" },
                  { label: "Quarterly Average", value: "$4.2M", status: "excellent" },
                  { label: "Projection", value: "$5.1M", status: "excellent" },
                ],
              },
              {
                title: "Market Position",
                metrics: [
                  { label: "Market Share", value: "15.2%", status: "good" },
                  { label: "Competitor Gap", value: "+3.2%", status: "excellent" },
                  { label: "Growth Trajectory", value: "Accelerating", status: "excellent" },
                ],
              },
              {
                title: "Operational Metrics",
                metrics: [
                  { label: "Efficiency Rate", value: "82%", status: "excellent" },
                  { label: "Cost per Unit", value: "-12%", status: "excellent" },
                  { label: "Delivery Time", value: "-18%", status: "excellent" },
                ],
              },
            ].map((section, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-8 backdrop-blur"
              >
                <h3 className="text-2xl font-bold text-white mb-6">{section.title}</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {section.metrics.map((metric, j) => (
                    <motion.div
                      key={j}
                      whileHover={{ scale: 1.05 }}
                      className="bg-black/40 border border-emerald-500/20 rounded-lg p-4"
                    >
                      <p className="text-gray-400 text-sm mb-2">{metric.label}</p>
                      <p className="text-2xl font-bold text-emerald-300">{metric.value}</p>
                      {metric.status === "excellent" && (
                        <div className="mt-2 flex gap-1">
                          {[1, 2, 3].map((i) => (
                            <motion.div
                              key={i}
                              animate={{ scale: [1, 1.2, 1] }}
                              transition={{ duration: 1, delay: i * 0.1, repeat: Infinity }}
                              className="w-2 h-2 rounded-full bg-emerald-500"
                            />
                          ))}
                        </div>
                      )}
                    </motion.div>
                  ))}
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
            className="space-y-6 mb-16"
          >
            {recommendations.map((rec, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`rounded-xl border border-emerald-500/30 bg-gradient-to-br ${getPriorityColor(
                  rec.priority
                )} bg-opacity-5 p-8 backdrop-blur hover:border-emerald-500/50 transition`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex gap-3 items-flex-start mb-3">
                      <span
                        className={`px-3 py-1 bg-black/40 rounded-full text-xs font-semibold border ${getPriorityBadgeColor(
                          rec.priority
                        )}`}
                      >
                        {rec.priority} Priority
                      </span>
                      <span className="text-emerald-400 text-xs font-semibold"><Icon emoji="⏱️" inline={true} /> {rec.timeline}</span>
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2">{rec.title}</h3>
                    <p className="text-gray-300 mb-4">{rec.description}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6 pt-6 border-t border-emerald-500/20">
                  <div>
                    <p className="text-emerald-400 font-semibold text-sm mb-2">Expected Impact</p>
                    <p className="text-white font-bold text-lg">{rec.impact}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-emerald-400 font-semibold text-sm mb-2">Implementation</p>
                    <p className="text-white font-bold text-lg">{rec.timeline}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Forecast Tab */}
        {activeTab === "forecast" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="space-y-8 mb-16"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Revenue Forecast */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0 }}
                className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-8 backdrop-blur"
              >
                <h3 className="text-xl font-bold text-white mb-6">Revenue Forecast (12 months)</h3>
                <div className="space-y-4">
                  {["Q1", "Q2", "Q3", "Q4"].map((quarter, i) => (
                    <div key={i}>
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-300">{quarter} 2024</span>
                        <span className="text-emerald-300 font-bold">${4.2 + i * 0.3}M</span>
                      </div>
                      <div className="w-full bg-black/40 rounded-full h-3 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${(80 + i * 10)}%` }}
                          transition={{ duration: 1.5, delay: i * 0.1 }}
                          className="h-full bg-gradient-to-r from-emerald-600 to-teal-600"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              {/* Market Share Forecast */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-8 backdrop-blur"
              >
                <h3 className="text-xl font-bold text-white mb-6">Market Share Growth</h3>
                <div className="space-y-4">
                  {[
                    { label: "Current", value: "15.2%" },
                    { label: "Q2 Target", value: "16.1%" },
                    { label: "Q4 Target", value: "17.5%" },
                    { label: "EOY Goal", value: "19.2%" },
                  ].map((item, i) => (
                    <div key={i}>
                      <div className="flex justify-between mb-2">
                        <span className="text-gray-300">{item.label}</span>
                        <span className="text-teal-300 font-bold">{item.value}</span>
                      </div>
                      <div className="w-full bg-black/40 rounded-full h-3 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: item.value }}
                          transition={{ duration: 1.5, delay: i * 0.1 }}
                          className="h-full bg-gradient-to-r from-teal-600 to-emerald-600"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>

            {/* Risk Assessment */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-8 backdrop-blur"
            >
              <h3 className="text-xl font-bold text-white mb-6">Risk Factors to Monitor</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[
                  "Market volatility in key regions",
                  "Supply chain disruptions",
                  "Increased competitive pressure",
                  "Regulatory changes",
                ].map((risk, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex gap-3 p-4 bg-black/40 rounded-lg border border-yellow-500/20"
                  >
                    <Icon emoji="⚠️" inline={true} className="text-yellow-400" />
                    <span className="text-gray-300">{risk}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
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
            className="px-8 py-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-emerald-500/50 transition"
          >
            📥 Export Report
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-3 bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 rounded-lg font-semibold hover:bg-emerald-500/30 transition"
          >
            <>
              <Icon emoji="📊" inline={true} />
              <span>Share Dashboard</span>
            </>
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
