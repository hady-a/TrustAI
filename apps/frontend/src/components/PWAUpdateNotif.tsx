import { useEffect, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

export default function PWAUpdateNotif() {
  const [showUpdate, setShowUpdate] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    const handleSWUpdate = () => {
      setShowUpdate(true)
      console.log("🔔 PWA update available")
    }

    window.addEventListener("sw-update-available", handleSWUpdate)

    // Check for updates on page visibility change
    const handleVisibilityChange = () => {
      if (!document.hidden && "serviceWorker" in navigator) {
        navigator.serviceWorker.getRegistrations().then((registrations) => {
          registrations.forEach((reg) => reg.update())
        })
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange)

    return () => {
      window.removeEventListener("sw-update-available", handleSWUpdate)
      document.removeEventListener("visibilitychange", handleVisibilityChange)
    }
  }, [])

  const handleUpdate = async () => {
    setIsUpdating(true)

    try {
      const registration = await navigator.serviceWorker.getRegistrations()
      if (registration.length > 0) {
        const reg = registration[0]
        
        // Tell service worker to skip waiting
        if (reg.waiting) {
          reg.waiting.postMessage({ type: "SKIP_WAITING" })
        }

        // Wait for controller change
        let refreshing = false
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          if (!refreshing) {
            refreshing = true
            window.location.reload()
          }
        })
      }
    } catch (error) {
      console.error("Update failed:", error)
      setIsUpdating(false)
      setShowUpdate(false)
    }
  }

  const handleDismiss = () => {
    setShowUpdate(false)
  }

  return (
    <AnimatePresence>
      {showUpdate && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="fixed top-20 right-6 z-50 max-w-sm"
        >
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg shadow-blue-500/50 overflow-hidden border border-blue-500/50 backdrop-blur">
            <div className="p-4">
              <div className="flex items-start gap-3">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="flex-shrink-0 text-2xl"
                >
                  ⚡
                </motion.div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-bold text-sm">Update Available</h3>
                  <p className="text-blue-100 text-xs mt-1">
                    A new version of TrustAI is ready to use
                  </p>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleUpdate}
                  disabled={isUpdating}
                  className="flex-1 px-3 py-2 bg-white text-blue-700 rounded-lg font-semibold text-xs hover:bg-blue-50 transition-colors disabled:opacity-50"
                >
                  {isUpdating ? "Updating..." : "Update Now"}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={handleDismiss}
                  disabled={isUpdating}
                  className="flex-1 px-3 py-2 bg-blue-500/30 text-white rounded-lg font-semibold text-xs hover:bg-blue-500/50 transition-colors disabled:opacity-50"
                >
                  Later
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
