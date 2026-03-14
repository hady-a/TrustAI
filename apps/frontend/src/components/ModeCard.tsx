import { motion } from "framer-motion"

interface ModeCardProps {
  name: string
  icon: string
  description?: string
  isSelected: boolean
  onClick: () => void
}

export default function ModeCard({
  name,
  icon,
  description,
  isSelected,
  onClick,
}: ModeCardProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.08, translateY: -8 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`relative overflow-hidden group rounded-2xl transition-all duration-300 ${
        isSelected
          ? "bg-gradient-to-br from-indigo-500/30 to-purple-500/20 border-2 border-indigo-500 shadow-2xl shadow-indigo-500/40"
          : "bg-gradient-to-br from-indigo-500/5 to-purple-500/5 border-2 border-indigo-500/20 hover:border-indigo-500/60"
      }`}
    >
      {/* Animated gradient background on hover */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-indigo-600/20 via-purple-600/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
        initial={{ opacity: 0 }}
        whileHover={{ opacity: 1 }}
      />

      {/* Top accent line */}
      <div className={`absolute top-0 left-0 right-0 h-1 transition-all duration-300 ${
        isSelected ? "bg-gradient-to-r from-indigo-500 to-purple-500" : "bg-gradient-to-r from-indigo-500/30 to-purple-500/30"
      }`} />

      <div className="relative z-10 p-8 h-full flex flex-col items-center justify-center text-center py-12">
        {/* Icon with animated background */}
        <motion.div
          className={`relative mb-6 p-5 rounded-2xl transition-all duration-300 ${
            isSelected
              ? "bg-indigo-500/30"
              : "bg-indigo-500/10 group-hover:bg-indigo-500/20"
          }`}
          whileHover={{ rotate: 10, scale: 1.1 }}
        >
          <div className={`drop-shadow-lg text-5xl`}>{icon}</div>
          {isSelected && (
            <motion.div
              className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-400/20 to-purple-400/20"
              animate={{ rotate: 360 }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            />
          )}
        </motion.div>

        {/* Title */}
        <h3
          className={`text-2xl font-bold transition-all duration-300 ${
            isSelected ? "text-indigo-200" : "text-white group-hover:text-indigo-200"
          }`}
        >
          {name}
        </h3>

        {/* Description */}
        {description && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`mt-3 text-sm leading-relaxed transition-all duration-300 ${
              isSelected ? "text-indigo-200/80" : "text-gray-400 group-hover:text-indigo-200/70"
            }`}
          >
            {description}
          </motion.p>
        )}

        {/* Selection checkbox with animation */}
        {isSelected && (
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="absolute top-4 right-4 w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center shadow-lg"
          >
            <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          </motion.div>
        )}

        {/* Bottom accent */}
        <motion.div
          className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500/0 via-indigo-500/50 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
          animate={isSelected ? { opacity: 1 } : {}}
        />
      </div>

      {/* Glow effect on selection */}
      {isSelected && (
        <motion.div
          className="absolute inset-0 rounded-2xl bg-gradient-to-br from-indigo-500/10 to-transparent"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
      )}
    </motion.button>
  )
}
