import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"
import { ShieldAlert, UserCheck, Briefcase, ChevronRight } from "lucide-react"

export default function ModeSelection() {
  const navigate = useNavigate()
  const [selectedMode, setSelectedMode] = useState<{ name: string; value: string } | null>(null)
  const [hoveredMode, setHoveredMode] = useState<string | null>(null)

  const modes = [
    {
      name: "Criminal Investigation",
      value: "CRIMINAL",
      description: "Analyze suspects, detect deception signals, and identify inconsistencies in speech patterns.",
      icon: <ShieldAlert className="w-12 h-12" />,
      gradient: "from-red-600 to-pink-600",
      gradientDark: "from-red-500 to-pink-500",
    },
    {
      name: "Interview Analysis",
      value: "INTERVIEW",
      description: "Analyze interviews for credibility, behavioral cues, and linguistic signals.",
      icon: <UserCheck className="w-12 h-12" />,
      gradient: "from-blue-600 to-cyan-600",
      gradientDark: "from-blue-500 to-cyan-500",
    },
    {
      name: "Business Analysis",
      value: "BUSINESS",
      description: "Analyze business communications for credibility, strategic intent, and negotiation patterns.",
      icon: <Briefcase className="w-12 h-12" />,
      gradient: "from-emerald-600 to-teal-600",
      gradientDark: "from-emerald-500 to-teal-500",
    },
  ]

  const handleContinue = () => {
    if (selectedMode) {
      sessionStorage.setItem("selectedMode", selectedMode.name)
      sessionStorage.setItem("selectedModeValue", selectedMode.value)

      const modeRoutes: Record<string, string> = {
        CRIMINAL: "/analysis/criminal",
        INTERVIEW: "/analysis/interview",
        BUSINESS: "/analysis/business",
      }

      navigate(modeRoutes[selectedMode.value])
    }
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:from-[#0B0F19] dark:via-[#1a1f3a] dark:to-[#0B0F19] dark:bg-gradient-to-br overflow-hidden relative flex flex-col">
      {/* Animated background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <motion.div
          className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl"
          animate={{
            x: [0, 30, 0],
            y: [0, 50, 0],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl"
          animate={{
            x: [0, -30, 0],
            y: [0, -50, 0],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>



      {/* Main Content */}
      <div className="flex-1 flex flex-col items-center justify-center py-20 px-6 relative z-10">
        <div className="max-w-5xl w-full">
          {/* Section Header */}
          <motion.div
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-center mb-16"
          >
            <motion.h1
              animate={{ y: [0, -5, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="text-5xl md:text-6xl font-bold text-gray-900 dark:text-white mb-4"
            >
              <span className="bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400 text-transparent">
                Select Analysis Mode
              </span>
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto"
            >
              Choose an investigation mode to begin AI-powered analysis and credibility assessment.
            </motion.p>
          </motion.div>

          {/* Mode Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
            {modes.map((mode: any, index: number) => {
              const isSelected = selectedMode?.value === mode.value
              const isHovered = hoveredMode === mode.value

              return (
                <motion.button
                  key={mode.value}
                  initial={{ opacity: 0, y: 30, scale: 0.8 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ duration: 0.6, delay: index * 0.1, ease: "easeOut" }}
                  onClick={() => setSelectedMode(mode)}
                  onMouseEnter={() => setHoveredMode(mode.value)}
                  onMouseLeave={() => setHoveredMode(null)}
                  className="relative h-full group"
                >
                  {/* Glow background effect */}
                  <AnimatePresence>
                    {(isHovered || isSelected) && (
                      <motion.div
                        layoutId={`glow-${mode.value}`}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: isSelected ? 1 : 0.6, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        transition={{ duration: 0.3 }}
                        className={`absolute inset-0 bg-gradient-to-br ${mode.gradientDark}/30 rounded-2xl blur-xl -z-10`}
                      />
                    )}
                  </AnimatePresence>

                  {/* Card Container */}
                  <motion.div
                    animate={{
                      y: isHovered ? -8 : 0,
                      boxShadow: isSelected
                        ? "0 25px 50px -12px rgba(99, 102, 241, 0.3)"
                        : isHovered
                          ? "0 20px 40px -10px rgba(0, 0, 0, 0.1)"
                          : "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
                    }}
                    transition={{ duration: 0.3 }}
                    className={`relative overflow-hidden rounded-2xl border-2 p-8 text-left h-full flex flex-col backdrop-blur-sm transition-all duration-300 ${
                      isSelected
                        ? "border-indigo-600 dark:border-indigo-500/50 bg-indigo-50/50 dark:bg-indigo-500/15"
                        : "border-gray-200 dark:border-gray-700/50 bg-white/50 dark:bg-gray-900/30"
                    } hover:dark:border-indigo-500/30 dark:hover:bg-gray-900/40`}
                  >
                    {/* Top accent bar */}
                    <motion.div
                      className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${mode.gradient}`}
                      animate={{
                        scaleX: isSelected ? 1 : isHovered ? 1 : 0,
                        opacity: isSelected ? 1 : isHovered ? 0.7 : 0,
                      }}
                      transition={{ duration: 0.3 }}
                      style={{ originX: 0 }}
                    />

                    {/* Icon Container */}
                    <motion.div
                      animate={{
                        y: isSelected || isHovered ? [0, -8, 0] : 0,
                        scale: isSelected ? 1.15 : isHovered ? 1.05 : 1,
                      }}
                      transition={{
                        y: { duration: 2, repeat: Infinity, ease: "easeInOut" },
                        scale: { duration: 0.3 },
                      }}
                      className={`w-14 h-14 rounded-xl flex items-center justify-center mb-6 transition-all duration-300 ${
                        isSelected
                          ? `bg-gradient-to-br ${mode.gradient} text-white shadow-lg shadow-indigo-500/50`
                          : isHovered
                            ? `bg-gradient-to-br ${mode.gradient} text-white shadow-md`
                            : "bg-gray-100 dark:bg-gray-800/50 text-gray-600 dark:text-gray-400"
                      }`}
                    >
                      {mode.icon}
                    </motion.div>

                    {/* Title */}
                    <h3
                      className={`text-xl font-bold mb-3 transition-colors duration-300 ${
                        isSelected
                          ? "text-indigo-600 dark:text-indigo-300"
                          : isHovered
                            ? "text-indigo-600 dark:text-indigo-300"
                            : "text-gray-900 dark:text-white"
                      }`}
                    >
                      {mode.name}
                    </h3>

                    {/* Description */}
                    <p className="text-gray-600 dark:text-gray-400 text-sm flex-grow">
                      {mode.description}
                    </p>

                    {/* Footer indicator */}
                    <motion.div
                      animate={{
                        opacity: isSelected || isHovered ? 1 : 0,
                        y: isSelected || isHovered ? 0 : 4,
                      }}
                      transition={{ duration: 0.3 }}
                      className="mt-6 flex items-center gap-2 text-indigo-600 dark:text-indigo-400 font-semibold text-sm"
                    >
                      {isSelected ? (
                        <>
                          <motion.span
                            animate={{ scale: [1, 1.2, 1] }}
                            transition={{ duration: 2, repeat: Infinity }}
                            className="w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400"
                          />
                          Selected
                        </>
                      ) : (
                        <>
                          Select
                          <ChevronRight className="w-4 h-4" />
                        </>
                      )}
                    </motion.div>
                  </motion.div>
                </motion.button>
              )
            })}
          </div>

          {/* Info text */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-center mb-12"
          >
            <p className="text-sm text-gray-500 dark:text-gray-500">
              {selectedMode
                ? `Ready to analyze ${selectedMode.name.toLowerCase()}`
                : "Select a mode to continue with analysis"}
            </p>
          </motion.div>

          {/* Action Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex items-center justify-center gap-4 flex-wrap"
          >
            <motion.button
              whileHover={selectedMode ? { scale: 1.05, x: 4 } : {}}
              whileTap={selectedMode ? { scale: 0.95 } : {}}
              onClick={handleContinue}
              disabled={!selectedMode}
              className={`px-8 py-3 rounded-lg font-semibold transition-all flex items-center gap-2 ${
                selectedMode
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-2xl hover:shadow-indigo-500/50 cursor-pointer"
                  : "bg-gray-200 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed opacity-60"
              }`}
            >
              <span>Start Analysis</span>
              <motion.span
                animate={selectedMode ? { x: [0, 4, 0] } : {}}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                →
              </motion.span>
            </motion.button>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
