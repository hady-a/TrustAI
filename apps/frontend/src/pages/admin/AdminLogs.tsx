import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import api from "../../lib/api"

interface AuditLog {
    id: string
    timestamp: string
    userId: string
    action: string
}

const ACTION_COLORS: Record<string, string> = {
    Login: "from-blue-600 to-cyan-600",
    Logout: "from-purple-600 to-pink-600",
    "File Upload": "from-indigo-600 to-purple-600",
    "Analysis Run": "from-cyan-600 to-blue-600",
    "User Created": "from-green-600 to-emerald-600",
    "Settings Changed": "from-amber-600 to-orange-600",
    "Admin Access": "from-red-600 to-pink-600",
    "Export Data": "from-violet-600 to-purple-600",
}

export default function AdminLogs() {
    const [logs, setLogs] = useState<AuditLog[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [filterAction, setFilterAction] = useState("")
    const [searchTerm, setSearchTerm] = useState("")

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                setLoading(true)
                setError(null)
                const response = await api.get('/admin/logs?limit=1000')
                const fetchedLogs = response.data.data.logs.map((log: any) => ({
                    id: log.id,
                    timestamp: new Date(log.createdAt).toLocaleString(),
                    userId: log.userId,
                    action: log.action,
                }))
                setLogs(fetchedLogs)
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to fetch logs')
                console.error('Error fetching logs:', err)
            } finally {
                setLoading(false)
            }
        }

        fetchLogs()
        // Refresh logs every 30 seconds
        const interval = setInterval(fetchLogs, 30000)
        return () => clearInterval(interval)
    }, [])

    const filteredLogs = logs.filter(log => {
        const actionMatch = !filterAction || log.action === filterAction
        const searchMatch = !searchTerm || 
            log.userId.toLowerCase().includes(searchTerm.toLowerCase())
        return actionMatch && searchMatch
    })

    const uniqueActions = Array.from(new Set(logs.map(log => log.action)))
    const totalLogs = logs.length

    return (
        <div className="min-h-screen bg-stone-50 dark:from-[#0B0F19] dark:via-[#1a1f3a] dark:to-[#0B0F19] dark:bg-gradient-to-br relative overflow-hidden pt-8 pb-12 px-6">
            {/* Animated background elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <motion.div
                    className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl"
                    animate={{
                        x: [0, 30, 0],
                        y: [0, 50, 0],
                    }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                ></motion.div>
                <motion.div
                    className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl"
                    animate={{
                        x: [0, -30, 0],
                        y: [0, -50, 0],
                    }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                ></motion.div>
            </div>

            <div className="relative z-10 max-w-7xl mx-auto">
                    {/* Header Section */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="mb-12"
                    >
                        <div>
                            <h2 className="text-5xl font-black bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent mb-2">System Activity</h2>
                            <p className="text-gray-400">Monitor all system events and user actions in real-time</p>
                        </div>
                    </motion.div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="backdrop-blur-xl bg-gradient-to-br from-blue-900/40 to-cyan-900/20 border border-cyan-500/30 rounded-2xl p-6"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-400 text-sm font-semibold mb-1">Total Logs</p>
                                    <p className="text-4xl font-black text-white">{totalLogs}</p>
                                </div>
                                <span className="text-5xl">📊</span>
                            </div>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.25 }}
                            className="backdrop-blur-xl bg-gradient-to-br from-emerald-900/40 to-teal-900/20 border border-emerald-500/30 rounded-2xl p-6"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-400 text-sm font-semibold mb-1">Filtered Results</p>
                                    <p className="text-4xl font-black text-white">{filteredLogs.length}</p>
                                </div>
                                <span className="text-5xl">🔍</span>
                            </div>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.3 }}
                            className="backdrop-blur-xl bg-gradient-to-br from-purple-900/40 to-pink-900/20 border border-purple-500/30 rounded-2xl p-6"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-400 text-sm font-semibold mb-1">Unique Actions</p>
                                    <p className="text-4xl font-black text-white">{uniqueActions.length}</p>
                                </div>
                                <span className="text-5xl">⚡</span>
                            </div>
                        </motion.div>
                    </div>

                    {/* Filters & Search */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.35 }}
                        className="backdrop-blur-xl bg-gradient-to-br from-purple-900/30 to-indigo-900/20 border border-purple-500/30 rounded-2xl p-6 mb-8"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Search */}
                            <div className="relative">
                                <motion.span animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }} className="absolute left-4 top-1/2 -translate-y-1/2 text-xl">🔍</motion.span>
                                <input
                                    type="text"
                                    placeholder="Search by user ID..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-12 pr-4 py-3 bg-white/5 border border-purple-500/30 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/60 focus:bg-white/10 transition-all backdrop-blur-xl"
                                />
                            </div>

                            {/* Action Filter */}
                            <select
                                value={filterAction}
                                onChange={(e) => setFilterAction(e.target.value)}
                                className="px-4 py-3 bg-white/5 border border-purple-500/30 rounded-xl text-white focus:outline-none focus:border-purple-500/60 focus:bg-white/10 transition-all backdrop-blur-xl"
                                title="Filter logs by action"
                            >
                                <option value="">All Actions</option>
                                {uniqueActions.map(action => (
                                    <option key={action} value={action}>{action}</option>
                                ))}
                            </select>
                        </div>
                    </motion.div>

                    {/* Logs List */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.4 }}
                        className="backdrop-blur-xl bg-gradient-to-br from-indigo-900/30 to-blue-900/20 border border-indigo-500/30 rounded-2xl overflow-hidden shadow-2xl"
                    >
                        {loading ? (
                            <div className="p-8 text-center">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 2, repeat: Infinity }}
                                    className="inline-block text-4xl mb-4"
                                >
                                    ⚙️
                                </motion.div>
                                <p className="text-xl font-semibold text-gray-300">Loading logs...</p>
                            </div>
                        ) : error ? (
                            <div className="p-8 text-center">
                                <div className="text-6xl mb-4">⚠️</div>
                                <p className="text-xl font-semibold text-red-300">{error}</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                {filteredLogs.length === 0 ? (
                                    <div className="p-8 text-center">
                                        <div className="text-6xl mb-4">📭</div>
                                        <p className="text-xl font-semibold text-gray-400">No logs found</p>
                                        <p className="text-gray-500 mt-2">Try adjusting your filters</p>
                                    </div>
                                ) : (
                                    <div className="max-h-96 overflow-y-auto custom-scrollbar">
                                        <table className="w-full text-left">
                                            <thead className="sticky top-0 bg-indigo-500/10 border-b border-indigo-500/20 text-indigo-300">
                                                <tr>
                                                    <th className="py-4 px-6 font-semibold">Timestamp</th>
                                                    <th className="py-4 px-6 font-semibold">User ID</th>
                                                    <th className="py-4 px-6 font-semibold">Action</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-indigo-500/10 text-gray-300">
                                                <AnimatePresence>
                                                    {filteredLogs.map((log, index) => (
                                                        <motion.tr
                                                            key={log.id}
                                                            initial={{ opacity: 0, x: -20 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            exit={{ opacity: 0, x: -20 }}
                                                            transition={{ delay: index * 0.05 }}
                                                            className="hover:bg-white/5 transition-colors"
                                                        >
                                                            <td className="py-4 px-6 text-sm font-mono text-gray-400">{log.timestamp}</td>
                                                            <td className="py-4 px-6 font-medium text-white">{log.userId.slice(0, 8)}...</td>
                                                            <td className="py-4 px-6">
                                                                <motion.span
                                                                    animate={{ scale: [1, 1.05, 1] }}
                                                                    transition={{ duration: 2, repeat: Infinity, delay: index * 0.1 }}
                                                                    className={`inline-block px-4 py-2 rounded-full text-xs font-bold bg-gradient-to-r ${ACTION_COLORS[log.action] || "from-gray-600 to-gray-700"} text-white shadow-lg`}
                                                                >
                                                                    {log.action}
                                                                </motion.span>
                                                            </td>
                                                        </motion.tr>
                                                    ))}
                                                </AnimatePresence>
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}
                    </motion.div>
                </div>
            </div>
    )
}
