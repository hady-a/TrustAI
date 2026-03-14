import { motion } from "framer-motion"
import React from "react"

interface PaginationProps {
  currentPage: number
  totalPages: number
  onPageChange: (page: number) => void
  isLoading?: boolean
  itemsPerPage?: number
  totalItems?: number
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
  isLoading = false,
  itemsPerPage = 10,
  totalItems = 0,
}: PaginationProps) {
  const getPageNumbers = () => {
    const delta = 2
    const left = currentPage - delta
    const right = currentPage + delta + 1
    const rangeWithDots: (number | null)[] = []
    let l: number | null = null

    for (let i = 1; i <= totalPages; i++) {
      if ((i == 1 || i == totalPages || (i >= left && i < right)) && i > 0) {
        if (l !== null && i - l === 2) {
          rangeWithDots.push(l + 1)
        } else if (l !== null && i - l !== 1) {
          rangeWithDots.push(null)
        }
        rangeWithDots.push(i)
        l = i
      }
    }

    return rangeWithDots
  }

  const pageNumbers = getPageNumbers()
  const startItem = (currentPage - 1) * itemsPerPage + 1
  const endItem = Math.min(currentPage * itemsPerPage, totalItems)

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col items-center gap-6 py-8 px-6"
    >
      {/* Items Info */}
      {totalItems > 0 && (
        <p className="text-sm text-gray-400">
          Showing <span className="text-indigo-400 font-semibold">{startItem}</span> to{" "}
          <span className="text-indigo-400 font-semibold">{endItem}</span> of{" "}
          <span className="text-indigo-400 font-semibold">{totalItems}</span> items
        </p>
      )}

      {/* Pagination Controls */}
      <div className="flex items-center gap-2 flex-wrap justify-center">
        {/* Previous Button */}
        <motion.button
          whileHover={{ scale: currentPage === 1 ? 1 : 1.05 }}
          whileTap={{ scale: currentPage === 1 ? 1 : 0.95 }}
          onClick={() => currentPage > 1 && onPageChange(currentPage - 1)}
          disabled={currentPage === 1 || isLoading}
          className={`px-3 py-2 rounded-lg font-semibold transition-all ${
            currentPage === 1
              ? "bg-gray-800 text-gray-600 cursor-not-allowed"
              : "bg-indigo-600/20 border border-indigo-500/50 text-indigo-300 hover:bg-indigo-600/30"
          }`}
        >
          ← Previous
        </motion.button>

        {/* Page Numbers */}
        {pageNumbers.map((page, index) => (
          <React.Fragment key={index}>
            {page === null ? (
              <span className="px-2 py-2 text-gray-500">...</span>
            ) : (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onPageChange(page)}
                disabled={isLoading}
                className={`min-w-[40px] h-10 rounded-lg font-semibold transition-all ${
                  page === currentPage
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/50"
                    : "bg-gray-800/50 text-gray-300 hover:bg-gray-700/50 border border-gray-700/50"
                }`}
              >
                {page}
              </motion.button>
            )}
          </React.Fragment>
        ))}

        {/* Next Button */}
        <motion.button
          whileHover={{ scale: currentPage === totalPages ? 1 : 1.05 }}
          whileTap={{ scale: currentPage === totalPages ? 1 : 0.95 }}
          onClick={() => currentPage < totalPages && onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || isLoading}
          className={`px-3 py-2 rounded-lg font-semibold transition-all ${
            currentPage === totalPages
              ? "bg-gray-800 text-gray-600 cursor-not-allowed"
              : "bg-indigo-600/20 border border-indigo-500/50 text-indigo-300 hover:bg-indigo-600/30"
          }`}
        >
          Next →
        </motion.button>
      </div>

      {/* Page Jump Input */}
      <div className="flex gap-2 items-center">
        <label className="text-sm text-gray-400">Go to page:</label>
        <input
          type="number"
          min="1"
          max={totalPages}
          defaultValue={currentPage}
          placeholder="Page"
          title="Enter page number to jump to"
          onKeyPress={(e) => {
            if (e.key === "Enter") {
              const page = Math.min(Math.max(1, parseInt((e.target as HTMLInputElement).value)), totalPages)
              onPageChange(page)
            }
          }}
          className="w-16 px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white text-center focus:border-indigo-500 focus:outline-none"
          disabled={isLoading}
        />
        <span className="text-sm text-gray-400">of {totalPages}</span>
      </div>
    </motion.div>
  )
}
