import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNotifications } from '../contexts/NotificationsContext'

export default function NotificationsBell() {
  const { notifications, markAsRead, clearNotifications, unreadCount } = useNotifications()
  const [isOpen, setIsOpen] = useState(false)

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return '✓'
      case 'error':
        return '✕'
      case 'warning':
        return '⚠'
      default:
        return 'ℹ'
    }
  }

  const getColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-500/20 border-green-500/50 text-green-300'
      case 'error':
        return 'bg-red-500/20 border-red-500/50 text-red-300'
      case 'warning':
        return 'bg-yellow-500/20 border-yellow-500/50 text-yellow-300'
      default:
        return 'bg-blue-500/20 border-blue-500/50 text-blue-300'
    }
  }

  return (
    <div className="relative">
      {/* Bell Icon */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="relative p-2 text-gray-300 hover:text-white transition-colors"
      >
        🔔
        
        {/* Unread Badge */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute top-0 right-0 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs text-white font-bold"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Dropdown Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 mt-2 w-96 bg-white/10 backdrop-blur border border-white/20 rounded-2xl shadow-2xl z-50 max-h-96 overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 flex justify-between items-center p-4 border-b border-white/10 bg-white/5">
              <h3 className="text-white font-bold">Notifications</h3>
              {unreadCount > 0 && (
                <motion.button
                  onClick={clearNotifications}
                  whileHover={{ scale: 1.05 }}
                  className="text-xs text-purple-400 hover:text-purple-300"
                >
                  Clear All
                </motion.button>
              )}
            </div>

            {/* Notifications List */}
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-gray-400">
                <p>No notifications yet</p>
              </div>
            ) : (
              <div className="divide-y divide-white/10">
                {notifications.map((notif) => (
                  <motion.div
                    key={notif.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    onClick={() => markAsRead(notif.id)}
                    className={`p-4 cursor-pointer hover:bg-white/5 transition-colors ${
                      notif.read ? 'opacity-60' : ''
                    }`}
                  >
                    <div className="flex gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${getColor(notif.type)}`}>
                        {getIcon(notif.type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-white font-semibold text-sm truncate">
                          {notif.title}
                        </h4>
                        <p className="text-gray-400 text-sm mt-1">{notif.message}</p>
                        <p className="text-gray-500 text-xs mt-2">
                          {new Date(notif.timestamp).toLocaleTimeString()}
                        </p>
                      </div>
                      {!notif.read && (
                        <div className="w-2 h-2 bg-purple-500 rounded-full flex-shrink-0 mt-2" />
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
