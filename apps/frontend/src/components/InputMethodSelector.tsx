import { useState } from "react";
import { motion } from "framer-motion";
import { Camera, Upload, ChevronRight } from "lucide-react";

interface InputMethodSelectorProps {
  onSelect: (method: "live" | "upload") => void;
  isLoading?: boolean;
}

export default function InputMethodSelector({ onSelect, isLoading = false }: InputMethodSelectorProps) {
  const [hoveredMethod, setHoveredMethod] = useState<string | null>(null);

  const methods = [
    {
      id: "live",
      name: "Live Capture",
      description: "Real-time camera and microphone capture for instant analysis",
      icon: <Camera className="w-12 h-12" />,
      gradient: "from-cyan-600 to-blue-600",
      gradientDark: "from-cyan-500 to-blue-500",
    },
    {
      id: "upload",
      name: "Upload File",
      description: "Upload a video, audio, or image file for detailed analysis",
      icon: <Upload className="w-12 h-12" />,
      gradient: "from-purple-600 to-pink-600",
      gradientDark: "from-purple-500 to-pink-500",
    },
  ];

  return (
    <div className="w-full">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12"
      >
        <h2 className="text-4xl md:text-5xl font-bold text-gray-900 dark:text-white mb-3">
          Choose Your Input Method
        </h2>
        <p className="text-gray-600 dark:text-gray-400 text-lg">
          Select how you'd like to provide your content for analysis
        </p>
      </motion.div>

      <div className="grid md:grid-cols-2 gap-8">
        {methods.map((method, index) => (
          <motion.button
            key={method.id}
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: index * 0.1 }}
            onClick={() => !isLoading && onSelect(method.id as "live" | "upload")}
            onMouseEnter={() => setHoveredMethod(method.id)}
            onMouseLeave={() => setHoveredMethod(null)}
            disabled={isLoading}
            className="relative group focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-2xl"
          >
            <motion.div
              animate={{
                scale: hoveredMethod === method.id && !isLoading ? 1.02 : 1,
              }}
              transition={{ duration: 0.3 }}
              className="relative h-full p-8 md:p-10 rounded-2xl border-2 border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 hover:border-indigo-500 dark:hover:border-indigo-400 transition-all duration-300"
            >
              {/* Background gradient accent */}
              <motion.div
                animate={{
                  opacity: hoveredMethod === method.id && !isLoading ? 0.1 : 0,
                }}
                transition={{ duration: 0.3 }}
                className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${
                  method.id === "live" ? "from-cyan-600 to-blue-600" : "from-purple-600 to-pink-600"
                } -z-10`}
              />

              {/* Icon */}
              <motion.div
                animate={{
                  scale: hoveredMethod === method.id && !isLoading ? 1.1 : 1,
                  y: hoveredMethod === method.id && !isLoading ? -5 : 0,
                }}
                transition={{ duration: 0.3 }}
                className={`inline-flex p-4 rounded-2xl mb-6 bg-gradient-to-br ${
                  method.id === "live"
                    ? "from-cyan-100 dark:from-cyan-900/30 to-blue-100 dark:to-blue-900/30 text-cyan-600 dark:text-cyan-400"
                    : "from-purple-100 dark:from-purple-900/30 to-pink-100 dark:to-pink-900/30 text-purple-600 dark:text-purple-400"
                }`}
              >
                {method.icon}
              </motion.div>

              {/* Content */}
              <div className="text-left">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3 flex items-center justify-between">
                  {method.name}
                  <motion.div
                    animate={{
                      x: hoveredMethod === method.id && !isLoading ? 5 : 0,
                      opacity: hoveredMethod === method.id && !isLoading ? 1 : 0.5,
                    }}
                    transition={{ duration: 0.3 }}
                  >
                    <ChevronRight className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                  </motion.div>
                </h3>

                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                  {method.description}
                </p>
              </div>

              {/* Badge for new/recommended */}
              {method.id === "live" && (
                <div className="absolute top-4 right-4 px-3 py-1 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 text-xs font-semibold rounded-full">
                  Real-time
                </div>
              )}
            </motion.div>
          </motion.button>
        ))}
      </div>

      {/* Feature comparison */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="mt-16 p-8 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl border border-indigo-200 dark:border-indigo-800/50"
      >
        <h3 className="text-white font-semibold mb-6 text-lg">Feature Comparison</h3>
        <div className="grid md:grid-cols-2 gap-8">
          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Camera className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
              Live Capture
            </h4>
            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-cyan-600 rounded-full"></span>
                Instant real-time analysis
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-cyan-600 rounded-full"></span>
                Simultaneous video & audio capture
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-cyan-600 rounded-full"></span>
                Live emotion and deception detection
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-cyan-600 rounded-full"></span>
                Interactive real-time feedback
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Upload className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              Upload File
            </h4>
            <ul className="space-y-2 text-sm text-gray-700 dark:text-gray-300">
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-purple-600 rounded-full"></span>
                Comprehensive file analysis
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-purple-600 rounded-full"></span>
                Support for video, audio, images
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-purple-600 rounded-full"></span>
                Detailed multi-frame analysis
              </li>
              <li className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-purple-600 rounded-full"></span>
                Batch processing capable
              </li>
            </ul>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
