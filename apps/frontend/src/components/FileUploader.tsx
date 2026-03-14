import { useState, useRef } from "react"
import { motion } from "framer-motion"

interface FileUploaderProps {
  onFileSelect: (file: File) => void
}

export default function FileUploader({ onFileSelect }: FileUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const files = e.dataTransfer.files
    if (files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleFileSelect = (file: File) => {
    setSelectedFile(file)
    onFileSelect(file)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files
    if (files && files.length > 0) {
      handleFileSelect(files[0])
    }
  }

  const handleClick = () => {
    fileInputRef.current?.click()
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6 }}
      className="w-full"
    >
      <motion.div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
        whileHover={{ scale: 1.02 }}
        className={`relative overflow-hidden rounded-3xl p-12 text-center cursor-pointer transition-all duration-300 border-2 group ${
          isDragging
            ? "border-indigo-500 bg-gradient-to-br from-indigo-500/20 to-purple-500/20"
            : "border-dashed border-indigo-500/40 hover:border-indigo-500/70 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 hover:from-indigo-500/10 hover:to-purple-500/10"
        }`}
      >
        {/* Animated background gradient */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          className="absolute inset-0 opacity-0 group-hover:opacity-50 transition-opacity"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-indigo-500/10" />
        </motion.div>

        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileInputChange}
          accept=".mp4,.wav,.mp3,.pdf,.txt,.doc,.docx"
          className="hidden"
        />

        <div className="relative z-10">
          {/* Icon */}
          <motion.div
            animate={{ y: isDragging ? -15 : 0, rotate: isDragging ? 10 : 0 }}
            transition={{ type: "spring", stiffness: 300 }}
            className="mb-6"
          >
            <motion.div
              animate={{ scale: isDragging ? 1.2 : 1 }}
              className="inline-block p-4 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-3xl"
            >
              <svg
                className={`w-20 h-20 ${
                  isDragging ? "text-indigo-400" : "text-indigo-400/70 group-hover:text-indigo-400"
                } transition-colors`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </motion.div>
          </motion.div>

          {/* Text */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <h3 className="text-2xl font-bold text-white mb-3">
              {selectedFile ? (
                <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                  {selectedFile.name}
                </span>
              ) : (
                <>
                  <span className="text-white">Drag & drop your file or </span>
                  <span className="text-indigo-400">click to browse</span>
                </>
              )}
            </h3>
            <p className="text-gray-400 mb-3">
              {selectedFile
                ? "Ready for analysis"
                : "Supports MP4, WAV, MP3, PDF, TXT, DOC, DOCX"}
            </p>
          </motion.div>

          {/* File size indicator */}
          {selectedFile && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-block mt-4 px-4 py-2 bg-indigo-500/20 rounded-full text-indigo-300 text-sm font-medium"
            >
              {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
            </motion.div>
          )}

          {/* Drag indicator */}
          {isDragging && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-4 text-indigo-300 font-semibold flex items-center justify-center gap-2"
            >
              <motion.span animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity }}>
                ↓
              </motion.span>
              Drop your file here
              <motion.span animate={{ rotate: -360 }} transition={{ duration: 2, repeat: Infinity }}>
                ↓
              </motion.span>
            </motion.p>
          )}
        </div>
      </motion.div>

      {/* File Info Card */}
      {selectedFile && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="mt-8 p-6 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/30 rounded-2xl backdrop-blur-sm"
        >
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4">
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0"
              >
                <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M8 16.5a.5.5 0 01-.5-.5v-5.19l-1.841-1.841A.5.5 0 108.341 7.659L10 9.318l1.659-1.659a.5.5 0 01.707.707L10.707 10h.586a.5.5 0 01.5.5V16a.5.5 0 01-1 0v-5H8.5V16a.5.5 0 01-.5.5z"
                    clipRule="evenodd"
                  />
                </svg>
              </motion.div>
              <div className="flex-1 min-w-0">
                <p className="text-white font-semibold truncate">{selectedFile.name}</p>
                <p className="text-indigo-300/70 text-sm mt-1">
                  Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB • Type: {selectedFile.type || "Unknown"}
                </p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.15, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={(e) => {
                e.stopPropagation()
                setSelectedFile(null)
              }}
              className="text-gray-400 hover:text-red-400 transition-colors flex-shrink-0 text-2xl"
            >
              ✕
            </motion.button>
          </div>
        </motion.div>
      )}
    </motion.div>
  )
}
