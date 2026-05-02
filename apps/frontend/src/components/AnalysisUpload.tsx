import { motion } from "framer-motion";
import FileUploader from "./FileUploader";

interface AnalysisUploadProps {
  onFileSelect: (file: File) => void;
  selectedFile: File | null;
  isAnalyzing: boolean;
  onAnalyze: () => void;
  title: string;
  description: string;
}

export default function AnalysisUpload({
  onFileSelect,
  selectedFile,
  isAnalyzing,
  onAnalyze,
  title,
  description,
}: AnalysisUploadProps) {
  return (
    <div className="space-y-6 sm:space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 sm:mb-12"
      >
        <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight">{title}</h2>
        <p className="text-gray-400 mt-2 sm:mt-3 text-sm sm:text-base leading-relaxed">{description}</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <FileUploader onFileSelect={onFileSelect} />
      </motion.div>

      {selectedFile && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col gap-3 sm:gap-4 pt-2"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onAnalyze}
            disabled={isAnalyzing}
            className="px-6 sm:px-8 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:opacity-50 text-white text-sm sm:text-base font-semibold rounded-md sm:rounded-lg transition-all flex items-center justify-center gap-2 min-h-10 sm:min-h-12"
          >
            {isAnalyzing ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                  className="w-4 h-4 sm:w-5 sm:h-5"
                >
                  <svg
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
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                <span>Start Analysis</span>
              </>
            )}
          </motion.button>
        </motion.div>
      )}
    </div>
  );
}
