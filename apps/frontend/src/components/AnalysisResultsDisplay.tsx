import { useMemo } from 'react'
import { motion } from 'framer-motion'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts'
import { CheckCircle2, Heart, Brain } from 'lucide-react'
import { Card } from './UI/Card'
import { Button } from './UI/Button'

interface AnalysisResult {
  credibilityScore: number
  deceptionIndicators: number
  emotionalState: string
  confidence: number
  details: {
    voiceStress: number
    micExpressions: number
    speechPatterns: number
    bodyLanguage: number
  }
}

export default function AnalysisResultsDisplay({ result }: { result?: AnalysisResult }) {
  const sampleResult = result || {
    credibilityScore: 78,
    deceptionIndicators: 3,
    emotionalState: 'Confident',
    confidence: 92,
    details: {
      voiceStress: 65,
      micExpressions: 72,
      speechPatterns: 85,
      bodyLanguage: 78,
    },
  }

  const radarData = useMemo(() => [
    { metric: 'Voice Stress', value: sampleResult.details.voiceStress },
    { metric: 'Micro Expressions', value: sampleResult.details.micExpressions },
    { metric: 'Speech Patterns', value: sampleResult.details.speechPatterns },
    { metric: 'Body Language', value: sampleResult.details.bodyLanguage },
  ], [sampleResult.details])

  const timelineData = useMemo(() => [
    { time: '0:00', credibility: 75, stress: 40 },
    { time: '0:30', credibility: 78, stress: 38 },
    { time: '1:00', credibility: 80, stress: 35 },
    { time: '1:30', credibility: 78, stress: 40 },
    { time: '2:00', credibility: 78, stress: 42 },
  ], [])

  const getScoreColor = (score: number) => {
    if (score >= 75) return 'text-emerald-600 dark:text-emerald-400'
    if (score >= 50) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  const getScoreBg = (score: number) => {
    if (score >= 75) return 'bg-emerald-100 dark:bg-emerald-900/30'
    if (score >= 50) return 'bg-yellow-100 dark:bg-yellow-900/30'
    return 'bg-red-100 dark:bg-red-900/30'
  }

  return (
    <motion.div
      className="space-y-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* Header Summary */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Credibility Score */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <Card variant="elevated" className="p-8 text-center">
            <div className="relative w-32 h-32 mx-auto mb-4">
              <svg className="w-full h-full" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="54" fill="none" stroke="#e5e7eb" strokeWidth="8" />
                <motion.circle
                  cx="60"
                  cy="60"
                  r="54"
                  fill="none"
                  stroke={
                    sampleResult.credibilityScore >= 75
                      ? '#10b981'
                      : sampleResult.credibilityScore >= 50
                      ? '#f59e0b'
                      : '#ef4444'
                  }
                  strokeWidth="8"
                  strokeDasharray={`${(sampleResult.credibilityScore / 100) * 2 * Math.PI * 54} ${2 * Math.PI * 54}`}
                  strokeLinecap="round"
                  initial={{ strokeDashoffset: 2 * Math.PI * 54 }}
                  animate={{ strokeDashoffset: 0 }}
                  transition={{ duration: 1 }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className={`text-4xl font-bold ${getScoreColor(sampleResult.credibilityScore)}`}>
                  {sampleResult.credibilityScore}%
                </span>
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Credibility Score</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {sampleResult.credibilityScore >= 75
                ? 'High credibility indicators detected'
                : sampleResult.credibilityScore >= 50
                ? 'Mixed credibility indicators'
                : 'Low credibility indicators detected'}
            </p>
          </Card>
        </motion.div>

        {/* Key Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <Card variant="elevated" className="p-8">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">Key Metrics</h3>
            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <Brain size={16} className="text-purple-600" />
                    Emotional State
                  </span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {sampleResult.emotionalState}
                  </span>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <CheckCircle2 size={16} className="text-red-600" />
                    Behavioral Signals
                  </span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {sampleResult.deceptionIndicators}
                  </span>
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                    <Heart size={16} className="text-emerald-600" />
                    Confidence Level
                  </span>
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">
                    {sampleResult.confidence}%
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <Card variant="elevated" className={`p-8 ${getScoreBg(sampleResult.credibilityScore)}`}>
            <div className="flex flex-col items-center text-center gap-4">
              <CheckCircle2
                className={`w-16 h-16 ${getScoreColor(sampleResult.credibilityScore)}`}
              />
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                  {sampleResult.credibilityScore >= 75 ? 'Credible' : sampleResult.credibilityScore >= 50 ? 'Moderate' : 'Questionable'}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Analysis Complete
                </p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>

      {/* Detailed Analysis */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Radar Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <Card variant="elevated" className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Analysis Breakdown</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e5e7eb" />
                <PolarAngleAxis dataKey="metric" stroke="#9ca3af" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} stroke="#9ca3af" />
                <Radar
                  name="Score"
                  dataKey="value"
                  stroke="#8b5cf6"
                  fill="#8b5cf6"
                  fillOpacity={0.2}
                  isAnimationActive={false}
                />
              </RadarChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>

        {/* Timeline */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
        >
          <Card variant="elevated" className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Timeline Analysis</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={timelineData} margin={{ top: 5, right: 20, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="time" stroke="#9ca3af" />
                <YAxis stroke="#9ca3af" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1a1f3a',
                    border: 'none',
                    borderRadius: '8px',
                    color: '#fff',
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="credibility"
                  stroke="#10b981"
                  dot={false}
                  strokeWidth={2}
                  isAnimationActive={false}
                />
                <Line
                  type="monotone"
                  dataKey="stress"
                  stroke="#ef4444"
                  dot={false}
                  strokeWidth={2}
                  isAnimationActive={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>
      </div>

      {/* Detailed Findings */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.5 }}
      >
        <Card variant="elevated" className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Detailed Findings</h3>

          <div className="space-y-4">
            {[
              {
                title: 'Voice Analysis',
                indicators: ['Consistent tone', 'Normal speech rate', 'Voice stress minimal'],
                score: 78,
              },
              {
                title: 'Behavioral Cues',
                indicators: ['Confident posture', 'Maintained eye contact', 'Natural gestures'],
                score: 82,
              },
              {
                title: 'Linguistic Patterns',
                indicators: ['Consistent narrative', 'Specific details', 'Logical flow'],
                score: 85,
              },
            ].map((finding, idx) => (
              <motion.div
                key={finding.title}
                className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + idx * 0.05 }}
              >
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold text-gray-900 dark:text-white">{finding.title}</h4>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getScoreBg(finding.score)} ${getScoreColor(finding.score)}`}>
                    {finding.score}%
                  </span>
                </div>
                <ul className="space-y-1">
                  {finding.indicators.map((indicator) => (
                    <li key={indicator} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                      <CheckCircle2 size={14} className="text-emerald-600 flex-shrink-0" />
                      {indicator}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </Card>
      </motion.div>

      {/* Action Buttons */}
      <motion.div
        className="flex gap-4 justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.6 }}
      >
        <Button variant="secondary" size="lg">
          Download Report
        </Button>
        <Button variant="primary" size="lg">
          Share Results
        </Button>
        <Button variant="outline" size="lg">
          New Analysis
        </Button>
      </motion.div>
    </motion.div>
  )
}
