import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { SESSION_WARNING_EVENT } from '../hooks/useSessionTimeout'

export default function SessionWarning() {
  const [isVisible, setIsVisible] = useState(false)
  const [countdown, setCountdown] = useState(60)

  useEffect(() => {
    const handleWarning = () => {
      setIsVisible(true)
      setCountdown(60)
    }

    window.addEventListener(SESSION_WARNING_EVENT, handleWarning)

    return () => {
      window.removeEventListener(SESSION_WARNING_EVENT, handleWarning)
    }
  }, [])

  useEffect(() => {
    if (!isVisible) return

    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          setIsVisible(false)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(interval)
  }, [isVisible])

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-6 right-6 z-50 max-w-md"
        >
          <div className="bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/50 rounded-xl p-4 shadow-lg backdrop-blur-sm">
            <div className="flex items-start gap-4">
              <div className="text-2xl mt-1">⚠️</div>
              <div className="flex-1">
                <h3 className="text-white font-semibold mb-1">Session Expiring Soon</h3>
                <p className="text-yellow-100 text-sm mb-3">
                  Your session will expire in <span className="font-bold text-yellow-300">{countdown}</span> seconds due to inactivity.
                </p>
                <div className="w-full bg-yellow-500/20 rounded-full h-2 overflow-hidden border border-yellow-500/30">
                  <motion.div
                    initial={{ width: '100%' }}
                    animate={{ width: `${(countdown / 60) * 100}%` }}
                    className="h-full bg-gradient-to-r from-yellow-400 to-orange-400"
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
