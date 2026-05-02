import { motion } from "framer-motion";
import LiveAnalysisDisplay from "./LiveAnalysisDisplay";
import { useNavigate } from "react-router-dom";

interface AnalysisResultsProps {
  liveResult: any;
  onReset: () => void;
}

export default function AnalysisResults({
  liveResult,
  onReset,
}: AnalysisResultsProps) {
  const navigate = useNavigate();
  
  console.log('[AnalysisResults] Rendering with liveResult:', liveResult);

  // Show loading state while data is being fetched
  if (!liveResult) {
    console.log('[AnalysisResults] No liveResult available, showing loading state');
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6 sm:space-y-8"
      >
        <div className="flex items-center justify-center py-12 sm:py-16">
          <div className="flex flex-col items-center gap-4">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-10 h-10 sm:w-12 sm:h-12 border-4 border-blue-200 border-t-blue-600 rounded-full"
            />
            <p className="text-gray-400 text-sm sm:text-base">Loading analysis results...</p>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 sm:space-y-8"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:gap-4">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onReset}
          className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm sm:text-base font-semibold rounded-md sm:rounded-lg transition-all flex items-center justify-center gap-2 min-h-10 sm:min-h-12"
        >
          <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          <span>New Analysis</span>
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate(-1)}
          className="px-4 sm:px-6 py-2.5 sm:py-3 border-2 border-gray-600 text-gray-300 rounded-md sm:rounded-lg font-semibold hover:border-gray-500 transition-all flex items-center justify-center gap-2 text-sm sm:text-base min-h-10 sm:min-h-12"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </motion.button>
      </div>

      <LiveAnalysisDisplay result={liveResult} isAnalyzing={false} />
    </motion.div>
  );
}
