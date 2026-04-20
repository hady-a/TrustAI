import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ShieldAlert, UserCheck, Briefcase, ArrowRight, Brain, Zap } from 'lucide-react'
import { Button } from '../components/UI/Button'
import { Card } from '../components/UI/Card'

export default function ModeSelectionNew() {
  console.log('[ModeSelectionNew] Component rendering')
  const navigate = useNavigate()
  const [selectedMode, setSelectedMode] = useState<string | null>(null)
  const [hoveredMode, setHoveredMode] = useState<string | null>(null)

  const modes = useMemo(() => [
    {
      id: 'INVESTIGATION',
      name: 'Criminal Investigation',
      description: 'Analyze suspects and detect deception signals',
      longDescription: 'Advanced behavioral analysis for criminal investigations. Detect deception signals, identify inconsistencies in speech patterns, and uncover hidden intentions.',
      icon: ShieldAlert,
      gradient: 'from-red-600 to-pink-600',
      color: 'red',
      features: ['Deception Detection', 'Pattern Analysis', 'Voice Stress Analysis', 'Behavioral Cues'],
    },
    {
      id: 'INTERVIEW',
      name: 'Interview Analysis',
      description: 'Analyze interviews for credibility and behavioral cues',
      longDescription: 'Comprehensive interview assessment with real-time behavioral tracking, credibility scoring, and detailed linguistic analysis.',
      icon: UserCheck,
      gradient: 'from-blue-600 to-cyan-600',
      color: 'blue',
      features: ['Credibility Scoring', 'Behavioral Tracking', 'Linguistic Analysis', 'Real-time Feedback'],
    },
    {
      id: 'BUSINESS',
      name: 'Business Analysis',
      description: 'Analyze communications for credibility and intent',
      longDescription: 'Business intelligence analysis for communications, negotiations, and strategic discussions. Evaluate intent and authenticity.',
      icon: Briefcase,
      gradient: 'from-emerald-600 to-teal-600',
      color: 'emerald',
      features: ['Intent Analysis', 'Communication Patterns', 'Negotiation Insights', 'Strategic Assessment'],
    },
  ], [])

  const handleContinue = () => {
    if (selectedMode) {
      const mode = modes.find(m => m.id === selectedMode)
      if (mode) {
        sessionStorage.setItem('selectedMode', mode.name)
        sessionStorage.setItem('selectedModeValue', selectedMode)

        const routes: Record<string, string> = {
          INVESTIGATION: '/analysis/criminal',
          INTERVIEW: '/analysis/interview',
          BUSINESS: '/analysis/business',
        }

        navigate(routes[selectedMode])
      }
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 },
    },
  }

  console.log('[ModeSelectionNew] Modes:', modes)
  console.log('[ModeSelectionNew] Selected mode:', selectedMode)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-gray-100 dark:from-gray-950 dark:via-purple-950/20 dark:to-gray-950 py-12 px-4">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-purple-300/10 rounded-full blur-3xl" />
        <div className="absolute bottom-32 right-1/4 w-96 h-96 bg-indigo-300/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        className="max-w-7xl mx-auto relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="text-center mb-16">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-white mb-4">
            Choose Your Analysis <span className="bg-gradient-to-r from-purple-600 to-indigo-600 bg-clip-text text-transparent">Mode</span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Select the analysis mode that best fits your needs. Each mode is optimized for specific use cases.
          </p>
        </motion.div>

        {/* Modes Grid */}
        <div className="grid lg:grid-cols-3 gap-8 mb-12">
          {modes.map((mode) => {
            const Icon = mode.icon
            const isSelected = selectedMode === mode.id
            const isHovered = hoveredMode === mode.id

            return (
              <motion.div
                key={mode.id}
                variants={itemVariants}
                onHoverStart={() => setHoveredMode(mode.id)}
                onHoverEnd={() => setHoveredMode(null)}
              >
                <Card
                  variant={isSelected ? 'elevated' : 'default'}
                  className={`p-6 cursor-pointer transition-all duration-300 ${
                    isSelected
                      ? 'ring-2 ring-purple-500 dark:ring-purple-400'
                      : 'hover:ring-2 hover:ring-purple-300 dark:hover:ring-purple-600'
                  }`}
                  onClick={() => setSelectedMode(mode.id)}
                >
                  {/* Icon */}
                  <motion.div
                    className={`inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br ${mode.gradient} mb-4 p-3 text-white`}
                    whileHover={{ scale: 1.1, rotate: 5 }}
                    transition={{ type: 'spring', stiffness: 300 }}
                  >
                    <Icon size={28} />
                  </motion.div>

                  {/* Title & Description */}
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                    {mode.name}
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {mode.description}
                  </p>

                  {/* Expanded content on hover/select */}
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: isHovered || isSelected ? 1 : 0, height: isHovered || isSelected ? 'auto' : 0 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="overflow-hidden"
                  >
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      {mode.longDescription}
                    </p>

                    {/* Features */}
                    <div className="grid grid-cols-2 gap-2">
                      {mode.features.map((feature, idx) => (
                        <motion.div
                          key={feature}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="flex items-center gap-2 text-sm"
                        >
                          <Zap size={14} className={`text-${mode.color}-600`} />
                          <span className="text-gray-700 dark:text-gray-300">{feature}</span>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>

                  {/* Selection indicator */}
                  <motion.div
                    className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: isSelected || isHovered ? 1 : 0.3 }}
                  >
                    <motion.div
                      className={`h-1 rounded-full bg-gradient-to-r ${mode.gradient}`}
                      initial={{ width: 0 }}
                      animate={{ width: isSelected ? '100%' : isHovered ? '60%' : '0%' }}
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  </motion.div>
                </Card>
              </motion.div>
            )
          })}
        </div>

        {/* Action Footer */}
        <motion.div
          variants={itemVariants}
          className="flex justify-center gap-4"
        >
          <Button
            variant="secondary"
            size="lg"
            onClick={() => navigate('/profile')}
          >
            Back to Profile
          </Button>
          <Button
            variant="primary"
            size="lg"
            disabled={!selectedMode}
            onClick={handleContinue}
            className="gap-2"
          >
            Continue <ArrowRight size={20} />
          </Button>
        </motion.div>

        {/* Info Section */}
        <motion.div
          variants={itemVariants}
          className="mt-16 grid lg:grid-cols-3 gap-6"
        >
          {[
            {
              icon: Brain,
              title: 'AI-Powered Analysis',
              description: 'Advanced machine learning algorithms for accurate analysis',
            },
            {
              icon: Zap,
              title: 'Real-Time Processing',
              description: 'Instant results with actionable insights',
            },
            {
              icon: ShieldAlert,
              title: 'Secure & Private',
              description: 'Your data is encrypted and protected',
            },
          ].map((item, idx) => (
            <Card key={idx} variant="outlined" className="p-6 text-center">
              <item.icon className="w-8 h-8 mx-auto mb-3 text-purple-600 dark:text-purple-400" />
              <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{item.title}</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">{item.description}</p>
            </Card>
          ))}
        </motion.div>
      </motion.div>
    </div>
  )
}
