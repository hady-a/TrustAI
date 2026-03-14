import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import Pagination from "../components/Pagination"
import SkeletonLoader from "../components/SkeletonLoader"
import { useServiceWorker } from "../hooks/useServiceWorker"
import { useOffline } from "../contexts/OfflineContext"
import { useFileUploadRetry } from "../hooks/useRetry"
import { Icon } from "../components/UI/IconRenderer"

export default function AdvancedFeaturesDemo() {
  const [activeTab, setActiveTab] = useState<"pagination" | "skeleton" | "retry" | "offline" | "pwa">("pagination")
  const [currentPage, setCurrentPage] = useState(1)
  const [isLoadingData, setIsLoadingData] = useState(false)
  const [demoData, setDemoData] = useState<any[]>([])

  const { isSupported, isRegistered, clearCache } = useServiceWorker()
  const { isOnline, queue } = useOffline()
  const { uploadWithRetry, isRetrying, retryCount, lastError, reset: resetRetry } = useFileUploadRetry()

  const ITEMS_PER_PAGE = 6
  const TOTAL_ITEMS = 25
  const TOTAL_PAGES = Math.ceil(TOTAL_ITEMS / ITEMS_PER_PAGE)

  // Simulate data loading
  useEffect(() => {
    if (activeTab === "pagination") {
      setIsLoadingData(true)
      setTimeout(() => {
        const startIdx = (currentPage - 1) * ITEMS_PER_PAGE
        setDemoData(
          Array.from({ length: ITEMS_PER_PAGE }, (_, i) => ({
            id: startIdx + i + 1,
            title: `Item ${startIdx + i + 1}`,
            description: `This is demo item number ${startIdx + i + 1}`,
          }))
        )
        setIsLoadingData(false)
      }, 600)
    }
  }, [currentPage, activeTab])

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B0F19] via-[#1a1f3a] to-[#0B0F19] relative overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/4 -left-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-1/4 -right-32 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
        />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-20">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h1 className="text-6xl font-bold text-white mb-4">Advanced Features</h1>
          <p className="text-gray-400 text-lg">
            Explore pagination, loading states, error recovery, offline support, and PWA capabilities
          </p>
        </motion.div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-3 mb-12 justify-center">
          {(["pagination", "skeleton", "retry", "offline", "pwa"] as const).map((tab) => (
            <motion.button
              key={tab}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                activeTab === tab
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/50"
                  : "bg-gray-800/50 text-gray-300 border border-gray-700 hover:border-gray-600"
              }`}
            >
              {tab === "pagination" && <><Icon emoji="📄" /> Pagination</>}
              {tab === "skeleton" && <><Icon emoji="🦴" /> Skeleton</>}
              {tab === "retry" && <><Icon emoji="🔄" /> Error Recovery</>}
              {tab === "offline" && <><Icon emoji="📵" /> Offline</>}
              {tab === "pwa" && <><Icon emoji="🚀" /> PWA</>}
            </motion.button>
          ))}
        </div>

        {/* Content Sections */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gray-900/50 border border-gray-700/50 rounded-2xl p-8 backdrop-blur"
        >
          {/* Pagination Tab */}
          {activeTab === "pagination" && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-white mb-6"><Icon emoji="📄" /> Pagination Demo</h2>
                <p className="text-gray-400 mb-8">
                  Efficiently handle large datasets with smart pagination controls and page jumping.
                </p>
              </div>

              {/* Data Grid */}
              {isLoadingData ? (
                <SkeletonLoader variant="card" count={3} />
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                  {demoData.map((item) => (
                    <motion.div
                      key={item.id}
                      whileHover={{ scale: 1.05, y: -5 }}
                      className="bg-indigo-600/20 border border-indigo-500/50 rounded-xl p-6 backdrop-blur"
                    >
                      <h3 className="text-lg font-bold text-white mb-2">{item.title}</h3>
                      <p className="text-gray-400 text-sm">{item.description}</p>
                      <div className="mt-4 pt-4 border-t border-indigo-500/20">
                        <span className="text-xs text-indigo-400 font-semibold">ID: {item.id}</span>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* Pagination Component */}
              <Pagination
                currentPage={currentPage}
                totalPages={TOTAL_PAGES}
                onPageChange={setCurrentPage}
                isLoading={isLoadingData}
                itemsPerPage={ITEMS_PER_PAGE}
                totalItems={TOTAL_ITEMS}
              />
            </div>
          )}

          {/* Skeleton Tab */}
          {activeTab === "skeleton" && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-white mb-6"><Icon emoji="🦴" /> Skeleton Loaders Demo</h2>
                <p className="text-gray-400 mb-8">
                  Skeleton loaders provide visual feedback while content is loading, improving perceived performance.
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-bold text-white mb-4">Analysis Card Skeletons</h3>
                  <SkeletonLoader variant="analysis-card" count={2} className="gap-4" />
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white mb-4">Card Skeletons</h3>
                  <SkeletonLoader variant="card" count={3} className="grid grid-cols-3 gap-4" />
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white mb-4">List Item Skeletons</h3>
                  <SkeletonLoader variant="list-item" count={4} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <h3 className="text-lg font-bold text-white mb-4">Text Skeletons</h3>
                    <SkeletonLoader variant="text" count={3} className="space-y-2" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-white mb-4">Circular Skeletons</h3>
                    <div className="flex gap-4">
                      <SkeletonLoader variant="circular" />
                      <SkeletonLoader variant="circular" />
                      <SkeletonLoader variant="circular" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Retry Tab */}
          {activeTab === "retry" && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-white mb-6"><Icon emoji="🔄" /> Error Recovery Demo</h2>
                <p className="text-gray-400 mb-8">
                  Automatic retry with exponential backoff for handling transient failures gracefully.
                </p>
              </div>

              <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">File Upload with Retry</h3>

                <div className="space-y-4">
                  {isRetrying ? (
                    <motion.div
                      animate={{ scale: [1, 1.1, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                      className="p-4 bg-yellow-500/20 border border-yellow-500/50 rounded-lg text-yellow-300"
                    >
                      ⏳ Retry in progress (Attempt {retryCount})...
                    </motion.div>
                  ) : lastError ? (
                    <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300">
                      ✕ Error: {lastError.message}
                    </div>
                  ) : (
                    <p className="text-gray-400">Ready to upload files</p>
                  )}

                  <input
                    type="file"
                    title="Upload a file to test retry mechanism"
                    placeholder="Choose file"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        uploadWithRetry(
                          async () => {
                            // Simulate upload
                            return new Promise((resolve, reject) => {
                              setTimeout(() => {
                                // Randomly fail sometimes to demonstrate retry
                                if (Math.random() < 0.4) {
                                  reject(new Error("Network error"))
                                } else {
                                  resolve({ success: true })
                                }
                              }, 1000)
                            })
                          },
                          () => alert("✓ Upload successful!"),
                          (error) => console.error("Upload error:", error)
                        )
                      }
                    }}
                    className="block w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white cursor-pointer"
                  />

                  {isRetrying && (
                    <div className="flex gap-2">
                      <button
                        onClick={resetRetry}
                        className="px-4 py-2 bg-red-600/20 border border-red-500 text-red-300 rounded-lg"
                      >
                        Cancel Retry
                      </button>
                    </div>
                  )}

                  <div className="text-xs text-gray-500">
                    Try uploading to test the retry mechanism. Files may fail randomly to demonstrate the recovery system.
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Offline Tab */}
          {activeTab === "offline" && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-white mb-6"><Icon emoji="📵" /> Offline Support Demo</h2>
                <p className="text-gray-400 mb-8">
                  Actions are queued when offline and automatically synced when connection returns.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {/* Status */}
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className={`p-6 rounded-xl border ${
                    isOnline
                      ? "bg-emerald-600/20 border-emerald-500/50"
                      : "bg-orange-600/20 border-orange-500/50"
                  }`}
                >
                  <h3 className="text-lg font-bold mb-2 text-white">Connection Status</h3>
                  <p className={`text-3xl font-bold ${isOnline ? "text-emerald-400" : "text-orange-400"} flex items-center gap-2`}>
                    <Icon emoji={isOnline ? "📱" : "❌"} inline={false} />
                    {isOnline ? "Online" : "Offline"}
                  </p>
                  <p className={`text-sm mt-2 ${isOnline ? "text-emerald-300" : "text-orange-300"}`}>
                    {isOnline ? "Connected to network" : "Using offline queue"}
                  </p>
                </motion.div>

                {/* Queue Info */}
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="p-6 rounded-xl border bg-indigo-600/20 border-indigo-500/50"
                >
                  <h3 className="text-lg font-bold mb-4 text-white">Action Queue</h3>
                  <div className="space-y-2 text-sm">
                    <p className="text-gray-300">
                      Pending: <span className="text-yellow-400 font-bold">{queue.filter((a) => a.status === "pending").length}</span>
                    </p>
                    <p className="text-gray-300">
                      Synced: <span className="text-emerald-400 font-bold">{queue.filter((a) => a.status === "synced").length}</span>
                    </p>
                    <p className="text-gray-300">
                      Failed: <span className="text-red-400 font-bold">{queue.filter((a) => a.status === "failed").length}</span>
                    </p>
                  </div>
                </motion.div>
              </div>

              {/* Offline Indicator Info */}
              <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">How It Works</h3>
                <ul className="space-y-3 text-gray-400">
                  <li className="flex gap-3">
                    <span className="text-indigo-400">→</span>
                    <span>Actions are automatically queued when you go offline</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-indigo-400">→</span>
                    <span>An indicator appears showing your offline status and queue count</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-indigo-400">→</span>
                    <span>When you reconnect, actions automatically sync to the server</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="text-indigo-400">→</span>
                    <span>LocalStorage persists the queue across page reloads</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* PWA Tab */}
          {activeTab === "pwa" && (
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl font-bold text-white mb-6">🚀 Progressive Web App Demo</h2>
                <p className="text-gray-400 mb-8">
                  Full PWA support with caching, offline functionality, and app installation capabilities.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-6">
                {/* Service Worker Status */}
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="bg-indigo-600/20 border border-indigo-500/50 rounded-xl p-6"
                >
                  <h3 className="text-lg font-bold text-white mb-4">Service Worker</h3>
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-400">Status</p>
                      <p className={`text-lg font-bold ${isRegistered ? "text-emerald-400" : "text-gray-400"}`}>
                        {isRegistered ? "✓ Active" : "✗ Inactive"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-400">Supported</p>
                      <p className={`text-lg font-bold ${isSupported ? "text-emerald-400" : "text-red-400"}`}>
                        {isSupported ? "Yes" : "No"}
                      </p>
                    </div>
                  </div>
                </motion.div>

                {/* Cache Management */}
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  className="bg-purple-600/20 border border-purple-500/50 rounded-xl p-6"
                >
                  <h3 className="text-lg font-bold text-white mb-4">Cache Management</h3>
                  <button
                    onClick={clearCache}
                    disabled={!isRegistered}
                    className="w-full px-4 py-2 bg-purple-600/50 border border-purple-500 rounded-lg text-purple-300 font-semibold hover:bg-purple-600/70 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Icon emoji="🗑️" inline={true} /> Clear All Cache
                  </button>
                  <p className="text-xs text-gray-400 mt-3">
                    Removes all cached assets to free up storage space
                  </p>
                </motion.div>
              </div>

              {/* PWA Features */}
              <div className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
                <h3 className="text-lg font-bold text-white mb-4">PWA Features</h3>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { icon: "📱", title: "Installable", desc: "Add to home screen" },
                    { icon: "⚡", title: "Fast Loading", desc: "Cached assets" },
                    { icon: "📴", title: "Offline Ready", desc: "Works without internet" },
                    { icon: "🔔", title: "Push Alerts", desc: "Get notifications" },
                    { icon: "🔄", title: "Auto Updates", desc: "Background sync" },
                    { icon: "🔒", title: "Secure", desc: "HTTPS required" },
                  ].map((feature, i) => (
                    <motion.div
                      key={i}
                      whileHover={{ scale: 1.05 }}
                      className="p-4 bg-gray-700/50 border border-gray-600 rounded-lg"
                    >
                      <Icon emoji={feature.icon} size="lg" className="text-2xl mb-2 block" inline={false} />
                      <p className="font-bold text-white">{feature.title}</p>
                      <p className="text-xs text-gray-400">{feature.desc}</p>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Installation Instructions */}
              <div className="bg-blue-900/30 border border-blue-700/50 rounded-xl p-6">
                <h3 className="text-lg font-bold text-blue-300 mb-4"><Icon emoji="📲" /> How to Install</h3>
                <div className="space-y-3 text-sm text-blue-200">
                  <p>
                    <strong>iOS:</strong> Open in Safari → Share → Add to Home Screen
                  </p>
                  <p>
                    <strong>Android:</strong> Open in Chrome → Menu → Install app
                  </p>
                  <p>
                    <strong>Desktop:</strong> Click the install icon in the address bar (if shown)
                  </p>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  )
}
