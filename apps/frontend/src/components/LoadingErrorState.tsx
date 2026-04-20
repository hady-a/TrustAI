import { motion } from 'framer-motion';
import { AlertTriangle, Loader } from 'lucide-react';

export interface LoadingErrorStateProps {
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  loadingMessage?: string;
  errorTitle?: string;
  isNonBlocking?: boolean; // If true, shows overlays instead of replacing content
}

export default function LoadingErrorState({
  isLoading = false,
  error = null,
  onRetry,
  loadingMessage = 'Processing your request...',
  errorTitle = 'Something went wrong',
  isNonBlocking = false,
}: LoadingErrorStateProps) {
  // Non-blocking modes show as overlays (for sidebars, modals, etc)
  if (isNonBlocking) {
    return (
      <>
        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="inset-0 fixed bg-black/20 backdrop-blur-sm z-40 flex items-center justify-center"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="bg-white dark:bg-gray-800 rounded-xl p-8 shadow-2xl"
            >
              <div className="flex flex-col items-center gap-4">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                >
                  <Loader className="w-8 h-8 text-indigo-600 dark:text-indigo-400" />
                </motion.div>
                <p className="text-gray-900 dark:text-gray-100 font-medium">{loadingMessage}</p>
              </div>
            </motion.div>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-50 max-w-sm"
          >
            <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 rounded-lg p-4 shadow-lg backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-red-800 dark:text-red-200 font-semibold text-sm">{errorTitle}</p>
                  <p className="text-red-700 dark:text-red-300 text-sm mt-1">{error}</p>
                  {onRetry && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={onRetry}
                      className="mt-3 px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white text-xs font-semibold rounded transition-colors"
                    >
                      Try Again
                    </motion.button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </>
    );
  }

  // Blocking modes show full-screen or full-container
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="flex flex-col items-center justify-center py-16 px-4"
      >
        <motion.div
          animate={{ scale: [1, 1.15, 1] }}
          transition={{ duration: 2.5, repeat: Infinity }}
        >
          <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-indigo-500/30 to-purple-500/30 border-2 border-indigo-500/50 flex items-center justify-center">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="w-12 h-12"
            >
              <Loader className="w-12 h-12 text-indigo-500 dark:text-indigo-400" />
            </motion.div>
          </div>
        </motion.div>

        <motion.h3
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mt-8 text-2xl font-bold text-gray-900 dark:text-gray-100"
        >
          {loadingMessage}
        </motion.h3>

        {/* Loading indicator dots */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6 flex gap-2"
        >
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
              transition={{ duration: 1.4, delay: i * 0.2, repeat: Infinity }}
              className="w-3 h-3 bg-indigo-500 dark:bg-indigo-400 rounded-full"
            />
          ))}
        </motion.div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="flex flex-col items-center justify-center py-16 px-4"
      >
        <div className="w-20 h-20 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
          <AlertTriangle className="w-10 h-10 text-red-600 dark:text-red-400" />
        </div>

        <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">{errorTitle}</h3>

        <p className="text-gray-600 dark:text-gray-400 text-center max-w-md mb-6">{error}</p>

        {onRetry && (
          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={onRetry}
            className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Try Again
          </motion.button>
        )}
      </motion.div>
    );
  }

  console.log('[LoadingErrorState] No state matched, showing empty state');
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col items-center justify-center py-12 px-4"
    >
      <p className="text-gray-500 dark:text-gray-400 text-sm">Ready for analysis</p>
    </motion.div>
  );
}
