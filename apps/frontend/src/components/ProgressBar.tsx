import { motion } from "framer-motion"

interface ProgressBarProps {
  progress: number
  showLabel?: boolean
}

export default function ProgressBar({
  progress,
  showLabel = true,
}: ProgressBarProps) {
  const isComplete = progress >= 100

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full"
    >
      {/* Progress Track */}
      <div className="mb-6">
        {/* Label */}
        {showLabel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-between mb-2 sm:mb-3"
          >
            <p className="text-white font-semibold text-sm sm:text-base">Analysis Progress</p>
            <motion.p
              key={progress}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className={`text-xs sm:text-sm font-bold ${
                isComplete
                  ? "text-green-400"
                  : "text-indigo-400"
              }`}
            >
              {isComplete ? "✓ Complete" : `${Math.round(progress)}%`}
            </motion.p>
          </motion.div>
        )}

        {/* Main Progress Bar */}
        <div className="relative h-2 sm:h-3 bg-[#111827]/50 rounded-full overflow-hidden border border-indigo-500/20 backdrop-blur-sm">
          {/* Animated gradient background */}
          <motion.div
            animate={{ x: isComplete ? [0, 10, 0] : 0 }}
            transition={{ duration: 0.6, repeat: isComplete ? Infinity : 0 }}
            className="absolute inset-0"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </motion.div>

          {/* Progress fill */}
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className={`h-full rounded-full transition-all duration-300 ${
              isComplete
                ? "bg-gradient-to-r from-green-500 to-emerald-400 shadow-lg shadow-green-500/50"
                : "bg-gradient-to-r from-indigo-600 via-indigo-500 to-indigo-400 shadow-lg shadow-indigo-500/50"
            }`}
          >
            {/* Animated shine effect */}
            <motion.div
              animate={{ x: [-100, 500] }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatType: "loop",
              }}
              className="absolute inset-y-0 w-36 bg-gradient-to-r from-transparent via-white/20 to-transparent"
            />
          </motion.div>

          {/* Shimmer particles on completion */}
          {isComplete && (
            <>
              <motion.div
                animate={{ scale: [1, 1.5, 0], opacity: [1, 0.5, 0] }}
                transition={{ duration: 0.6, repeat: Infinity }}
                className="absolute top-1/2 right-1/4 w-2 h-2 bg-green-400 rounded-full"
              />
              <motion.div
                animate={{ scale: [1, 1.5, 0], opacity: [1, 0.5, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                className="absolute top-1/2 right-1/3 w-1.5 h-1.5 bg-emerald-400 rounded-full"
              />
              <motion.div
                animate={{ scale: [1, 1.5, 0], opacity: [1, 0.5, 0] }}
                transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                className="absolute top-1/2 right-2/3 w-1 h-1 bg-green-300 rounded-full"
              />
            </>
          )}
        </div>
      </div>

      {/* Status Message */}
      {showLabel && (
        <motion.div
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex items-center justify-center gap-3"
        >
          {!isComplete && (
            <>
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                className="w-4 h-4 border-2 border-indigo-500/40 border-t-indigo-500 rounded-full"
              />
              <p className="text-indigo-300/70 text-sm">
                {progress < 30
                  ? "Initializing analysis..."
                  : progress < 60
                  ? "Processing file..."
                  : progress < 90
                  ? "Running detection models..."
                  : "Finalizing results..."}
              </p>
            </>
          )}
          {isComplete && (
            <>
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="w-5 h-5 text-green-400"
              >
                <svg fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
              </motion.div>
              <p className="text-green-400 text-sm font-semibold">
                Analysis complete!
              </p>
            </>
          )}
        </motion.div>
      )}
    </motion.div>
  )
}
