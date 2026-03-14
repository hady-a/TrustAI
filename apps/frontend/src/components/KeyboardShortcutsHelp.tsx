import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { KEYBOARD_SHORTCUTS } from '../hooks/useKeyboardShortcuts'

export default function KeyboardShortcutsHelp() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleOpen = () => setIsOpen(true)
    window.addEventListener('open-shortcuts-help', handleOpen)
    return () => window.removeEventListener('open-shortcuts-help', handleOpen)
  }, [])

  const isMac = typeof navigator !== 'undefined' && navigator.platform.toUpperCase().indexOf('MAC') >= 0

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/50 backdrop-blur z-50 flex items-center justify-center p-4"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-white/10 backdrop-blur border border-white/20 rounded-2xl p-8 max-w-2xl max-h-96 overflow-y-auto"
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-3xl font-black bg-gradient-to-r from-purple-300 via-blue-300 to-cyan-300 bg-clip-text text-transparent">
                Keyboard Shortcuts
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-white text-2xl"
              >
                ✕
              </button>
            </div>

            {/* Shortcuts Grid */}
            <div className="grid grid-cols-2 gap-6">
              {KEYBOARD_SHORTCUTS.map((shortcut, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`${
                    shortcut.os !== 'all' && 
                    ((isMac && shortcut.os === 'win') || (!isMac && shortcut.os === 'mac'))
                      ? 'hidden'
                      : ''
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex gap-1">
                      {shortcut.keys.map((key, i) => (
                        <div key={i}>
                          {i > 0 && <span className="text-gray-400 mx-1">+</span>}
                          <kbd className="px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm font-semibold">
                            {key}
                          </kbd>
                        </div>
                      ))}
                    </div>
                    <p className="text-gray-300 flex-1">{shortcut.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-white/10 text-center text-gray-400 text-sm">
              Press <kbd className="px-2 py-1 bg-white/10 rounded text-white">Esc</kbd> to close
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
