import { motion } from "framer-motion";
import InterviewLiveForm from "./InterviewLiveForm";

interface AnalysisLiveProps {
  onLiveAnalysis: (videoBlob: Blob, audioBlob: Blob, answers: any[]) => void;
  isAnalyzing: boolean;
  title: string;
  description: string;
  mode: string;
}

export default function AnalysisLive({
  onLiveAnalysis,
  isAnalyzing,
  title,
  description,
  mode,
}: AnalysisLiveProps) {
  return (
    <div className="space-y-6 sm:space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -30 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 sm:mb-8"
      >
        <h2 className="text-3xl sm:text-4xl font-bold text-white leading-tight">{title}</h2>
        <p className="text-gray-400 mt-2 sm:mt-3 text-sm sm:text-base leading-relaxed">{description}</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <InterviewLiveForm
          onAnalysisStart={onLiveAnalysis}
          isAnalyzing={isAnalyzing}
          mode={mode}
        />
      </motion.div>
    </div>
  );
}
