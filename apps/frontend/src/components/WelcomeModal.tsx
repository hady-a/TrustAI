import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"

interface WelcomeModalProps {
  userName: string
  email: string
  onClose: () => void
}

export default function WelcomeModal({ userName, email, onClose }: WelcomeModalProps) {
  const [isOpen, setIsOpen] = useState(true)

  useEffect(() => {
    // Auto-close after 8 seconds
    const timer = setTimeout(() => {
      setIsOpen(false)
      onClose()
    }, 8000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => {
            setIsOpen(false)
            onClose()
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            transition={{ duration: 0.4, type: "spring" }}
            onClick={(e) => e.stopPropagation()}
            className="bg-gradient-to-br from-[#111827] to-[#1a1f3a] border border-indigo-500/30 rounded-3xl p-10 max-w-md shadow-2xl relative overflow-hidden"
          >
            {/* Animated background elements */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute -top-20 -right-20 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"
            />

            <div className="relative z-10">
              {/* Icon */}
              <motion.div
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="flex justify-center mb-6"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-3xl flex items-center justify-center text-3xl shadow-xl shadow-indigo-500/30">
                  ✨
                </div>
              </motion.div>

              {/* Text */}
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-white mb-3">
                  Welcome to TrustAI! 👋
                </h2>
                <p className="text-lg text-indigo-300 font-semibold mb-2">
                  Hi {userName}!
                </p>
                <p className="text-gray-300 leading-relaxed">
                  We're excited to have you on board. Your account is all set up and ready to use. Start analyzing with confidence.
                </p>
              </div>

              {/* Email confirmation */}
              <div className="bg-white/5 border border-indigo-500/20 rounded-2xl p-4 mb-6">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-1">Account Email</p>
                <p className="text-sm text-white font-medium">{email}</p>
              </div>

              {/* Features highlight */}
              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-3">
                  <span className="text-lg">🔍</span>
                  <span className="text-sm text-gray-300">Advanced analysis tools at your fingertips</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg">🛡️</span>
                  <span className="text-sm text-gray-300">Enterprise-grade security for your data</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-lg">⚡</span>
                  <span className="text-sm text-gray-300">Real-time processing and results</span>
                </div>
              </div>

              {/* Close button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setIsOpen(false)
                  onClose()
                }}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold py-3 rounded-xl hover:shadow-xl hover:shadow-indigo-500/40 transition-all"
              >
                Get Started
              </motion.button>

              {/* Auto-close timer */}
              <div className="mt-4 flex justify-center">
                <motion.div
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{ duration: 8, ease: "linear" }}
                  className="h-1 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full"
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
