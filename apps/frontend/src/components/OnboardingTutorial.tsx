import { motion, AnimatePresence } from 'framer-motion'
import { useOnboarding } from '../contexts/OnboardingContext'

const ONBOARDING_STEPS = [
  {
    id: 'welcome',
    emoji: '👋',
    title: 'Welcome to TrustAI!',
    description: 'Your AI-powered analysis companion. Let\'s get you started with a quick tour.',
    target: 'body',
    position: 'center' as const,
  },
  {
    id: 'modes',
    emoji: '🎯',
    title: 'Choose an Analysis Mode',
    description: 'Select from Criminal, Interview, or Business analysis modes to get started.',
    target: '[data-tour="modes"]',
    position: 'bottom' as const,
  },
  {
    id: 'upload',
    emoji: '📁',
    title: 'Upload Your Files',
    description: 'Upload video, audio, or text files for analysis.',
    target: '[data-tour="upload"]',
    position: 'bottom' as const,
  },
  {
    id: 'profile',
    emoji: '👤',
    title: 'Access Your Profile',
    description: 'Manage your account settings and view your analysis history.',
    target: '[data-tour="profile"]',
    position: 'bottom' as const,
  },
  {
    id: 'complete',
    emoji: '🎉',
    title: 'All Set!',
    description: 'Start analyzing! Press ? anytime to see keyboard shortcuts.',
    target: 'body',
    position: 'center' as const,
  },
]

export default function OnboardingTutorial() {
  const { showOnboarding, completedSteps, completeStep, dismissOnboarding } = useOnboarding()
  const currentStepIndex = completedSteps.length
  const currentStep = ONBOARDING_STEPS[currentStepIndex]

  const handleNext = () => {
    if (currentStep) {
      completeStep(currentStep.id)
    }
  }

  const handleSkip = () => {
    dismissOnboarding()
  }

  return (
    <AnimatePresence>
      {showOnboarding && currentStep && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-40"
            onClick={handleSkip}
          />

          {/* Tooltip */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: -20 }}
            className={`fixed z-50 bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-6 max-w-sm shadow-2xl ${
              currentStep.position === 'center'
                ? 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2'
                : 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2'
            }`}
          >
            {/* Header */}
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{currentStep.emoji}</span>
                <h3 className="text-2xl font-bold text-white">{currentStep.title}</h3>
              </div>
              <button
                onClick={handleSkip}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ✕
              </button>
            </div>

            {/* Description */}
            <p className="text-gray-300 mb-6">{currentStep.description}</p>

            {/* Progress */}
            <div className="flex items-center gap-2 mb-6">
              <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  layoutId="progress"
                  initial={{ width: 0 }}
                  animate={{
                    width: `${((currentStepIndex + 1) / ONBOARDING_STEPS.length) * 100}%`,
                  }}
                  className="h-full bg-gradient-to-r from-purple-500 to-blue-500"
                />
              </div>
              <span className="text-gray-400 text-sm">
                {currentStepIndex + 1} / {ONBOARDING_STEPS.length}
              </span>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <motion.button
                onClick={handleSkip}
                whileHover={{ scale: 1.02 }}
                className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/20 rounded-lg text-white font-semibold transition-all"
              >
                Skip Tour
              </motion.button>
              <motion.button
                onClick={handleNext}
                whileHover={{ scale: 1.02 }}
                className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 rounded-lg text-white font-semibold transition-all"
              >
                {currentStepIndex === ONBOARDING_STEPS.length - 1 ? 'Done' : 'Next'}
              </motion.button>
            </div>

            {/* Tips */}
            {currentStepIndex < ONBOARDING_STEPS.length - 1 && (
              <p className="text-gray-500 text-xs mt-4 text-center">
                <span>💡</span>Press ? anytime to view keyboard shortcuts
              </p>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
