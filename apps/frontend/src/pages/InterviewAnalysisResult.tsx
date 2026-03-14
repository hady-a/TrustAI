import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { Icon } from "../components/UI/IconRenderer"

interface InterviewInsight {
  category: string
  confidence: number
  insights: string[]
  tone: "Professional" | "Confident" | "Uncertain" | "Defensive"
  keyPhrases: string[]
}

export default function InterviewAnalysisResult() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState<"insights" | "transcript" | "emotions">("insights")

  // Mock data - would come from analysis backend
  const insights: InterviewInsight[] = [
    {
      category: "Communication Style",
      confidence: 94,
      insights: ["Clear articulation", "Good pacing", "Strong vocabulary usage", "Confident delivery"],
      tone: "Professional",
      keyPhrases: ["Clearly stated", "Well articulated", "Speaking with confidence"],
    },
    {
      category: "Credibility Assessment",
      confidence: 87,
      insights: ["Consistent narratives", "Minimal hesitation", "Relevant examples"],
      tone: "Confident",
      keyPhrases: ["Detailed accounts", "Specific examples", "Timeline clarity"],
    },
    {
      category: "Stress Indicators",
      confidence: 72,
      insights: ["Some vocal tension detected", "Slight speech variations", "Minor hesitation patterns"],
      tone: "Uncertain",
      keyPhrases: ["Shifting patterns", "Tone variations", "Pacing changes"],
    },
  ]

  const getToneColor = (tone: string) => {
    switch (tone) {
      case "Professional":
        return "from-blue-600 to-cyan-600"
      case "Confident":
        return "from-emerald-600 to-teal-600"
      case "Uncertain":
        return "from-yellow-600 to-orange-600"
      case "Defensive":
        return "from-orange-600 to-red-600"
      default:
        return "from-blue-600 to-cyan-600"
    }
  }

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 90) return "from-emerald-600 to-teal-600"
    if (confidence >= 80) return "from-cyan-600 to-blue-600"
    if (confidence >= 70) return "from-yellow-600 to-orange-600"
    return "from-orange-600 to-red-600"
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0A1128] via-[#0f1a2e] to-[#0A1128] relative overflow-hidden">
      {/* Podcast Studio Background */}
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
        {/* Sound wave lines */}
        {[0, 1, 2, 3].map((i) => (
          <motion.div
            key={i}
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 2 + i * 0.3, repeat: Infinity }}
            className="absolute left-1/3 top-1/2 w-1 bg-gradient-to-b from-cyan-600/0 via-cyan-500/40 to-cyan-600/0"
            style={{ height: `${60 + i * 20}px`, opacity: 0.6 - i * 0.15 }}
          />
        ))}
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
              <p className="text-cyan-400 text-lg font-semibold mb-2"><Icon emoji="🎤" inline={true} />INTERVIEW ANALYSIS RESULTS</p>
              <h1 className="text-5xl font-bold text-white">Detailed Insights & Assessment</h1>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/modes")}
              className="px-6 py-2 bg-cyan-600/20 border border-cyan-500/50 text-cyan-300 rounded-lg hover:bg-cyan-600/30 transition"
            >
              New Analysis
            </motion.button>
          </div>
        </motion.div>

        {/* Overall Assessment Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
        >
          {insights.map((item, index) => (
            <motion.div
              key={index}
              whileHover={{ scale: 1.05, y: -5 }}
              className={`rounded-xl border border-cyan-500/30 bg-gradient-to-br ${getToneColor(item.tone)} bg-opacity-10 p-6 backdrop-blur overflow-hidden relative group`}
            >
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-cyan-500 to-transparent opacity-0 group-hover:opacity-100 transition" />

              <div className="flex items-start justify-between mb-4">
                <h3 className="text-xl font-bold text-white flex-1">{item.category}</h3>
                <span className="px-2 py-1 bg-black/40 rounded text-xs font-semibold text-cyan-300">
                  {item.tone}
                </span>
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-cyan-400 text-sm font-semibold">Confidence</p>
                  <p className="text-lg font-bold text-cyan-300">{item.confidence}%</p>
                </div>
                <div className="w-full bg-black/40 rounded-full h-2">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${item.confidence}%` }}
                    transition={{ duration: 1.5 }}
                    className={`h-full bg-gradient-to-r ${getConfidenceColor(item.confidence)} rounded-full`}
                  />
                </div>
              </div>

              <div className="space-y-2">
                {item.insights.map((insight, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex gap-2 text-sm text-gray-300"
                  >
                    <span className="text-cyan-400">✓</span>
                    <span>{insight}</span>
                  </motion.div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-cyan-500/20">
                <p className="text-xs font-semibold text-cyan-400 mb-2">Key Phrases</p>
                <div className="flex flex-wrap gap-2">
                  {item.keyPhrases.map((phrase, i) => (
                    <motion.span
                      key={i}
                      whileHover={{ scale: 1.1 }}
                      className="px-2 py-1 bg-cyan-500/20 border border-cyan-500/40 text-cyan-200 text-xs rounded-full"
                    >
                      {phrase}
                    </motion.span>
                  ))}
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Tabs */}
        <div className="mb-8 border-b border-cyan-500/20">
          <div className="flex gap-8">
            {["insights", "transcript", "emotions"].map((tab) => (
              <motion.button
                key={tab}
                onClick={() => setActiveTab(tab as any)}
                className={`pb-4 font-semibold text-lg transition-colors relative ${
                  activeTab === tab ? "text-cyan-400" : "text-gray-400 hover:text-gray-300"
                }`}
              >
                <>
                  {tab === "insights" && <><Icon emoji="📊" inline={true} />Key Insights</>}
                  {tab === "transcript" && <><Icon emoji="📝" inline={true} />Transcript</>}
                  {tab === "emotions" && <><Icon emoji="💭" inline={true} />Emotional Analysis</>}
                  {activeTab === tab && (
                    <motion.div
                      layoutId="underline"
                      className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-cyan-600 to-blue-400"
                    />
                  )}
                </>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Insights Tab */}
        {activeTab === "insights" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="space-y-6 mb-16"
          >
            {[
              { emoji: "🎯", title: "Primary Strength", desc: "Exceptional clarity in communication with minimal verbal fillers" },
              { emoji: "📈", title: "Engagement Level", desc: "High engagement demonstrated through consistent vocal modulation" },
              { emoji: "🔍", title: "Consistency Score", desc: "Narrative consistency maintained throughout the interview" },
              { emoji: "⚡", title: "Notable Patterns", desc: "Speech acceleration detected during specific topic discussions" },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-6 backdrop-blur hover:border-cyan-500/40 transition"
              >
                <div className="flex items-start gap-4">
                  <Icon emoji={item.emoji} size="lg" inline={false} />
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-2">{item.title}</h3>
                    <p className="text-gray-300">{item.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Transcript Tab */}
        {activeTab === "transcript" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-16"
          >
            <div className="bg-black/40 border border-cyan-500/20 rounded-xl p-8 backdrop-blur max-h-96 overflow-y-auto">
              <p className="text-gray-300 leading-relaxed space-y-4">
                <div className="text-cyan-400 font-semibold">Interviewer:</div>
                <div className="text-gray-300">Can you tell us about your background and experience in this field?</div>
                
                <div className="mt-4 text-teal-400 font-semibold">Candidate:</div>
                <div className="text-gray-300">
                  Absolutely. I have been working in this industry for over 10 years, starting as an entry-level position
                  and progressively taking on more responsibilities. Throughout this time, I've developed a comprehensive
                  understanding of both the technical and interpersonal aspects of the work...
                </div>

                <div className="mt-4 text-cyan-400 font-semibold">Interviewer:</div>
                <div className="text-gray-300">What would you say is your greatest achievement?</div>

                <div className="mt-4 text-teal-400 font-semibold">Candidate:</div>
                <div className="text-gray-300">
                  I'm particularly proud of a project where I led a team that increased efficiency by 40%. It required
                  careful planning, stakeholder management, and a commitment to continuous improvement...
                </div>
              </p>
            </div>
          </motion.div>
        )}

        {/* Emotions Tab */}
        {activeTab === "emotions" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="mb-16"
          >
            <div className="space-y-6">
              {[
                { emotion: "Confidence", level: 92 },
                { emotion: "Engagement", level: 88 },
                { emotion: "Clarity", level: 95 },
                { emotion: "Anxiety", level: 15 },
                { emotion: "Hesitation", level: 12 },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-cyan-500/10 border border-cyan-500/20 rounded-xl p-6 backdrop-blur"
                >
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-bold text-white">{item.emotion}</h3>
                    <span className="text-2xl font-bold text-cyan-300">{item.level}%</span>
                  </div>
                  <div className="w-full bg-black/40 rounded-full h-3 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${item.level}%` }}
                      transition={{ duration: 1.5, delay: i * 0.1 }}
                      className={`h-full bg-gradient-to-r ${
                        item.level > 70 ? "from-emerald-600 to-teal-600" : "from-yellow-600 to-orange-600"
                      }`}
                    />
                  </div>
                </motion.div>
              ))}
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
            className="px-8 py-3 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-lg font-semibold hover:shadow-lg hover:shadow-cyan-500/50 transition"
          >
            📥 Export Report
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-8 py-3 bg-cyan-500/20 border border-cyan-500/50 text-cyan-300 rounded-lg font-semibold hover:bg-cyan-500/30 transition"
          >
            🔊 Listen Again
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
