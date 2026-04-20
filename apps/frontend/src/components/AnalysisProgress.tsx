import { motion } from "framer-motion";
import ProgressBar from "./ProgressBar";

interface AnalysisProgressProps {
  progress: number;
  isAnalyzing: boolean;
}

export default function AnalysisProgress({
  progress,
  isAnalyzing,
}: AnalysisProgressProps) {
  console.log('[AnalysisProgress] Rendering with progress:', progress, 'isAnalyzing:', isAnalyzing);
  
  // Show skeleton state while not analyzing and no progress
  if (!isAnalyzing && progress === 0) {
    console.log('[AnalysisProgress] Not analyzing and no progress, showing skeleton');
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="mb-6 sm:mb-8"
    >
      <div className="p-4 sm:p-6 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg sm:rounded-xl">
        <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
          {isAnalyzing && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0"
            >
              <svg
                className="w-full h-full text-blue-600 dark:text-blue-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
            </motion.div>
          )}
          <div className="min-w-0">
            <p className="text-blue-900 dark:text-blue-200 font-semibold text-sm sm:text-base">
              {isAnalyzing ? "Analyzing..." : "Analysis Complete"}
            </p>
            <p className="text-blue-800 dark:text-blue-300 text-xs sm:text-sm leading-relaxed">
              {Math.round(progress)}% complete
            </p>
          </div>
        </div>
        <ProgressBar progress={progress} />
      </div>
    </motion.div>
  );
}
