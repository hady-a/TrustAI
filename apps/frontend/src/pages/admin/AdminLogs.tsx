import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"

const MOCK_LOGS = [
    { id: "1", timestamp: "2026-03-02 14:35:22", user: "Alice Johnson", action: "Login", status: "Success", ipAddress: "192.168.1.100" },
    { id: "2", timestamp: "2026-03-02 14:28:15", user: "Bob Smith", action: "File Upload", status: "Success", ipAddress: "192.168.1.102" },
    { id: "3", timestamp: "2026-03-02 14:22:08", user: "Charlie Davis", action: "Analysis Run", status: "Failed", ipAddress: "192.168.1.103" },
    { id: "4", timestamp: "2026-03-02 14:15:43", user: "Diana Prince", action: "User Created", status: "Success", ipAddress: "192.168.1.101" },
    { id: "5", timestamp: "2026-03-02 14:08:31", user: "Evan Wright", action: "Settings Changed", status: "Success", ipAddress: "192.168.1.104" },
    { id: "6", timestamp: "2026-03-02 13:58:22", user: "Alice Johnson", action: "Logout", status: "Success", ipAddress: "192.168.1.100" },
    { id: "7", timestamp: "2026-03-01 23:45:12", user: "Frank Miller", action: "Admin Access", status: "Success", ipAddress: "192.168.1.105" },
    { id: "8", timestamp: "2026-03-01 22:30:55", user: "Grace Lee", action: "Export Data", status: "Failed", ipAddress: "192.168.1.106" },
]

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

const STATUS_COLORS: Record<string, string> = {
    Success: "from-green-600 to-emerald-600",
    Failed: "from-red-600 to-pink-600",
    Pending: "from-amber-600 to-orange-600",
}

export default function AdminLogs() {
    const [filterAction, setFilterAction] = useState("")
    const [filterStatus, setFilterStatus] = useState("")
    const [searchTerm, setSearchTerm] = useState("")

    const filteredLogs = MOCK_LOGS.filter(log => {
        const actionMatch = !filterAction || log.action === filterAction
        const statusMatch = !filterStatus || log.status === filterStatus
        const searchMatch = !searchTerm || 
            log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.ipAddress.includes(searchTerm)
        return actionMatch && statusMatch && searchMatch
    })

    const uniqueActions = Array.from(new Set(MOCK_LOGS.map(log => log.action)))
    const uniqueStatuses = Array.from(new Set(MOCK_LOGS.map(log => log.status)))
    const successCount = MOCK_LOGS.filter(l => l.status === "Success").length
    const failedCount = MOCK_LOGS.filter(l => l.status === "Failed").length

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
                                    <p className="text-4xl font-black text-white">{MOCK_LOGS.length}</p>
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
                                    <p className="text-gray-400 text-sm font-semibold mb-1">Successful</p>
                                    <p className="text-4xl font-black text-white">{successCount}</p>
                                </div>
                                <span className="text-5xl">✓</span>
                            </div>
                        </motion.div>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.3 }}
                            className="backdrop-blur-xl bg-gradient-to-br from-red-900/40 to-pink-900/20 border border-red-500/30 rounded-2xl p-6"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-gray-400 text-sm font-semibold mb-1">Failed</p>
                                    <p className="text-4xl font-black text-white">{failedCount}</p>
                                </div>
                                <span className="text-5xl">✕</span>
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
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {/* Search */}
                            <div className="relative">
                                <motion.span animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }} className="absolute left-4 top-1/2 -translate-y-1/2 text-xl">🔍</motion.span>
                                <input
                                    type="text"
                                    placeholder="Search by user or IP..."
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

                            {/* Status Filter */}
                            <select
                                value={filterStatus}
                                onChange={(e) => setFilterStatus(e.target.value)}
                                className="px-4 py-3 bg-white/5 border border-purple-500/30 rounded-xl text-white focus:outline-none focus:border-purple-500/60 focus:bg-white/10 transition-all backdrop-blur-xl"
                                title="Filter logs by status"
                            >
                                <option value="">All Statuses</option>
                                {uniqueStatuses.map(status => (
                                    <option key={status} value={status}>{status}</option>
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
                                                <th className="py-4 px-6 font-semibold">User</th>
                                                <th className="py-4 px-6 font-semibold">Action</th>
                                                <th className="py-4 px-6 font-semibold">Status</th>
                                                <th className="py-4 px-6 font-semibold">IP Address</th>
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
                                                        <td className="py-4 px-6 font-medium text-white">{log.user}</td>
                                                        <td className="py-4 px-6">
                                                            <motion.span
                                                                animate={{ scale: [1, 1.05, 1] }}
                                                                transition={{ duration: 2, repeat: Infinity, delay: index * 0.1 }}
                                                                className={`inline-block px-4 py-2 rounded-full text-xs font-bold bg-gradient-to-r ${ACTION_COLORS[log.action] || "from-gray-600 to-gray-700"} text-white shadow-lg`}
                                                            >
                                                                {log.action}
                                                            </motion.span>
                                                        </td>
                                                        <td className="py-4 px-6">
                                                            <motion.span
                                                                animate={{ scale: [1, 1.05, 1] }}
                                                                transition={{ duration: 2, repeat: Infinity, delay: index * 0.1 }}
                                                                className={`inline-block px-4 py-2 rounded-full text-xs font-bold bg-gradient-to-r ${STATUS_COLORS[log.status]} text-white shadow-lg`}
                                                            >
                                                                {log.status === "Success" ? "✓" : "✕"} {log.status}
                                                            </motion.span>
                                                        </td>
                                                        <td className="py-4 px-6 text-sm font-mono text-gray-400">{log.ipAddress}</td>
                                                    </motion.tr>
                                                ))}
                                            </AnimatePresence>
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            </div>
    )
}
