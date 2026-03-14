import { motion, AnimatePresence } from "framer-motion"
import { useOffline } from "../contexts/OfflineContext"

export default function OfflineIndicator() {
  const { isOnline, queue } = useOffline()

  const pendingCount = queue.filter((item) => item.status === "pending").length
  const failedCount = queue.filter((item) => item.status === "failed").length
  const syncedCount = queue.filter((item) => item.status === "synced").length

  return (
    <AnimatePresence>
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-6 right-6 z-50 max-w-sm"
        >
          <div className="bg-gradient-to-r from-orange-600 to-red-600 rounded-xl shadow-lg shadow-red-500/50 overflow-hidden border border-red-500/50 backdrop-blur p-4">
            {/* Header */}
            <div className="flex items-start gap-3 mb-3">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="flex-shrink-0 text-2xl"
              >
                📵
              </motion.div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-bold">You're Offline</h3>
                <p className="text-orange-100 text-xs mt-1">
                  Actions will sync when you're back online
                </p>
              </div>
            </div>

            {/* Queue Stats */}
            {queue.length > 0 && (
              <div className="grid grid-cols-3 gap-2 mb-3 text-center">
                {pendingCount > 0 && (
                  <div className="bg-black/30 rounded-lg py-2 px-2">
                    <p className="text-orange-300 font-bold text-xs">{pendingCount}</p>
                    <p className="text-orange-100 text-xs">Pending</p>
                  </div>
                )}
                {syncedCount > 0 && (
                  <div className="bg-black/30 rounded-lg py-2 px-2">
                    <p className="text-emerald-300 font-bold text-xs">{syncedCount}</p>
                    <p className="text-emerald-100 text-xs">Synced</p>
                  </div>
                )}
                {failedCount > 0 && (
                  <div className="bg-black/30 rounded-lg py-2 px-2">
                    <p className="text-red-300 font-bold text-xs">{failedCount}</p>
                    <p className="text-red-100 text-xs">Failed</p>
                  </div>
                )}
              </div>
            )}

            {/* Recent Actions List */}
            {queue.length > 0 && (
              <div className="bg-black/30 rounded-lg p-2 mb-3 max-h-32 overflow-y-auto">
                <div className="space-y-2">
                  {queue.slice(-3).map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center gap-2 text-xs p-2 bg-black/50 rounded"
                    >
                      {item.status === "pending" && (
                        <motion.span
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity }}
                          className="text-yellow-400"
                        >
                          ⏳
                        </motion.span>
                      )}
                      {item.status === "synced" && <span className="text-emerald-400">✓</span>}
                      {item.status === "failed" && <span className="text-red-400">✕</span>}
                      <span className="text-orange-100 flex-1 truncate">
                        {item.type.replace("-", " ").toUpperCase()}
                      </span>
                      {item.status === "pending" && item.retryCount > 0 && (
                        <span className="text-orange-300 text-xs">Retry {item.retryCount}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Message */}
            <p className="text-orange-100 text-xs">
              📡 Keep this window open to sync when connection returns
            </p>
          </div>
        </motion.div>
      )}

      {/* Online Notification */}
      {isOnline && queue.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-6 right-6 z-50 max-w-sm"
        >
          <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl shadow-lg shadow-emerald-500/50 overflow-hidden border border-emerald-500/50 backdrop-blur p-4">
            <div className="flex items-start gap-3">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
                className="flex-shrink-0 text-2xl"
              >
                ✓
              </motion.div>
              <div className="flex-1 min-w-0">
                <h3 className="text-white font-bold">Back Online</h3>
                <p className="text-emerald-100 text-xs mt-1">
                  {syncedCount > 0 && `${syncedCount} action(s) synced. `}
                  {pendingCount > 0 && `Syncing ${pendingCount} more...`}
                </p>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
