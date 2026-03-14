import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { motion, AnimatePresence } from "framer-motion"

interface Backup {
    id: string
    name: string
    createdAt: string
    size?: string
    status: string
    type: string
    retentionDays?: number
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'

export default function AdminBackups() {
    const navigate = useNavigate()
    const [backups, setBackups] = useState<Backup[]>([])
    const [loading, setLoading] = useState(true)
    const [selectedBackup, setSelectedBackup] = useState<string | null>(null)
    const [actionStatus, setActionStatus] = useState<{ type: string; message: string } | null>(null)
    const [restoreProgress, setRestoreProgress] = useState(0)
    const [filterType, setFilterType] = useState("")

    // Fetch backups on component mount
    useEffect(() => {
        fetchBackups()
    }, [])

    const fetchBackups = async () => {
        try {
            setLoading(true)
            const response = await fetch(`${API_BASE_URL}/admin/backups`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
            })

            if (!response.ok) throw new Error('Failed to fetch backups')

            const data = await response.json()
            const backupsList = data.data?.backups || []
            
            // Map API response to component format
            const formattedBackups = backupsList.map((backup: any) => ({
                id: backup.id,
                name: backup.name,
                createdAt: new Date(backup.createdAt).toLocaleString('en-US', {
                    year: 'numeric',
                    month: '2-digit',
                    day: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                }),
                size: backup.size || 'Unknown',
                status: backup.status,
                type: backup.type,
                retentionDays: backup.retentionDays || 30,
            }))
            
            setBackups(formattedBackups)
        } catch (error) {
            console.error('Failed to fetch backups:', error)
            setActionStatus({ type: 'error', message: 'Failed to load backups' })
            setTimeout(() => setActionStatus(null), 3000)
        } finally {
            setLoading(false)
        }
    }

    const handleBack = () => {
        navigate("/admin")
    }

    const handleRestore = async (backupId: string) => {
        const backup = backups.find(b => b.id === backupId)
        if (!backup) return

        if (!confirm(`Are you sure you want to restore from: ${backup.name}?\n\nThis will overwrite your current database.`)) return

        setActionStatus({ type: "restoring", message: "Starting restore process..." })

        try {
            const response = await fetch(`${API_BASE_URL}/admin/backups/${backupId}/restore`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json',
                },
            })

            if (!response.ok) throw new Error('Restore failed')

            setRestoreProgress(100)
            setActionStatus({ type: "success", message: `✓ Successfully restored ${backup.name}` })
            setTimeout(() => {
                setActionStatus(null)
                setRestoreProgress(0)
                fetchBackups()
            }, 3000)
        } catch (error) {
            setActionStatus({ type: "error", message: `Restore failed: ${error instanceof Error ? error.message : 'Unknown error'}` })
            setTimeout(() => setActionStatus(null), 3000)
        }
    }

    const handleDownload = async (backupId: string) => {
        const backup = backups.find(b => b.id === backupId)
        if (!backup) return

        setActionStatus({ type: "downloading", message: `Downloading ${backup.name}...` })

        try {
            const response = await fetch(`${API_BASE_URL}/admin/backups/${backupId}/download`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
            })

            if (!response.ok) throw new Error('Download failed')

            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const element = document.createElement("a")
            element.setAttribute("href", url)
            element.setAttribute("download", `${backupId}.sql`)
            element.style.display = "none"
            document.body.appendChild(element)
            element.click()
            document.body.removeChild(element)
            window.URL.revokeObjectURL(url)

            setActionStatus({ type: "success", message: `✓ Downloaded ${backup.name}` })
            setTimeout(() => setActionStatus(null), 3000)
        } catch (error) {
            setActionStatus({ type: "error", message: `Download failed: ${error instanceof Error ? error.message : 'Unknown error'}` })
            setTimeout(() => setActionStatus(null), 3000)
        }
    }

    const handleDelete = async (backupId: string) => {
        if (!confirm("Are you sure you want to delete this backup? This action cannot be undone.")) return

        try {
            const response = await fetch(`${API_BASE_URL}/admin/backups/${backupId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
            })

            if (!response.ok) throw new Error('Delete failed')

            setBackups(backups.filter(b => b.id !== backupId))
            setActionStatus({ type: "success", message: "✓ Backup deleted successfully" })
            setTimeout(() => setActionStatus(null), 3000)
        } catch (error) {
            setActionStatus({ type: "error", message: `Delete failed: ${error instanceof Error ? error.message : 'Unknown error'}` })
            setTimeout(() => setActionStatus(null), 3000)
        }
    }

    const handleCreateBackup = async () => {
        setActionStatus({ type: "creating", message: "Creating backup..." })

        try {
            const response = await fetch(`${API_BASE_URL}/admin/backups`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ type: 'full' }),
            })

            if (!response.ok) throw new Error('Backup creation failed')

            setActionStatus({ type: "success", message: "✓ Backup created successfully" })
            setTimeout(() => {
                setActionStatus(null)
                fetchBackups()
            }, 3000)
        } catch (error) {
            setActionStatus({ type: "error", message: `Backup creation failed: ${error instanceof Error ? error.message : 'Unknown error'}` })
            setTimeout(() => setActionStatus(null), 3000)
        }
    }

    const filteredBackups = filterType ? backups.filter(b => b.type === filterType) : backups
    const totalSize = (
        backups.reduce((sum, b) => {
            const sizeStr = b.size?.replace(/\s+GB|\s+MB|\s+KB/, '') || '0';
            return sum + parseFloat(sizeStr);
        }, 0).toFixed(2)
    )

    if (loading) {
        return (
            <div className="min-h-screen bg-stone-50 dark:from-slate-950 dark:via-purple-950 dark:to-slate-950 dark:bg-gradient-to-br relative overflow-hidden flex items-center justify-center">
                <motion.div animate={{ scale: [0.8, 1, 0.8] }} transition={{ duration: 1.5, repeat: Infinity }} className="text-4xl">💾</motion.div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-stone-50 dark:from-slate-950 dark:via-purple-950 dark:to-slate-950 dark:bg-gradient-to-br relative overflow-hidden">
            {/* Premium animated background */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full"
                >
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-gradient-to-br from-emerald-600/20 to-teal-600/10 rounded-full blur-3xl" />
                </motion.div>
                <motion.div
                    animate={{ scale: [1, 1.15, 1], opacity: [0.3, 0.6, 0.3] }}
                    transition={{ duration: 8, repeat: Infinity }}
                    className="absolute bottom-20 right-20 w-96 h-96 bg-gradient-to-tl from-green-600/25 to-emerald-600/15 rounded-full blur-3xl"
                />
                <motion.div
                    animate={{ opacity: [0.2, 0.4, 0.2] }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="absolute inset-0 bg-[linear-gradient(90deg,rgba(99,102,241,0.05)_1px,transparent_1px),linear-gradient(0deg,rgba(99,102,241,0.05)_1px,transparent_1px)] bg-[size:3rem_3rem]"
                />
            </div>

            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: -30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="fixed top-0 left-0 right-0 z-50 backdrop-blur-2xl bg-white dark:bg-gradient-to-b dark:from-slate-900/80 dark:via-slate-900/40 dark:to-transparent border-b border-stone-200 dark:border-emerald-500/20"
            >
                <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
                    <motion.button
                        whileHover={{ scale: 1.1, x: -5 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleBack}
                        className="group flex items-center gap-2 px-4 py-2 rounded-xl bg-stone-200 dark:bg-gradient-to-r dark:from-emerald-600/30 dark:to-teal-600/30 border border-stone-300 dark:border-emerald-500/40 hover:dark:border-emerald-500/80 text-stone-700 dark:text-emerald-200 hover:dark:text-emerald-100 transition-all font-semibold dark:backdrop-blur-xl"
                    >
                        <motion.span animate={{ x: [0, -3, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>←</motion.span> Back
                    </motion.button>
                    <h1 className="text-2xl font-black bg-gradient-to-r from-emerald-400 via-green-400 to-teal-400 bg-clip-text text-transparent">💾 Database Backups</h1>
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={handleCreateBackup}
                        className="px-4 py-2 rounded-xl bg-stone-200 dark:bg-gradient-to-r dark:from-emerald-600 dark:to-green-600 text-stone-700 dark:text-white font-semibold hover:shadow-lg dark:hover:shadow-emerald-600/50 transition-all"
                    >
                        ➕ Create Backup
                    </motion.button>
                </div>
            </motion.div>

            <div className="relative z-10 pt-28 pb-16 px-6">
                <div className="max-w-7xl mx-auto">
                    {/* Stats Cards */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                        className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10"
                    >
                        <motion.div
                            whileHover={{ y: -5 }}
                            className="backdrop-blur-xl bg-stone-100 dark:bg-gradient-to-br dark:from-emerald-900/40 dark:to-teal-900/20 border border-stone-200 dark:border-emerald-500/30 rounded-xl p-6"
                        >
                            <p className="text-stone-600 dark:text-emerald-300 text-sm font-semibold mb-2">Total Backups</p>
                            <h3 className="text-4xl font-bold text-stone-900 dark:text-white">{backups.length}</h3>
                            <p className="text-xs text-stone-500 dark:text-emerald-300/70 mt-2">Stored backups</p>
                        </motion.div>

                        <motion.div
                            whileHover={{ y: -5 }}
                            className="backdrop-blur-xl bg-stone-100 dark:bg-gradient-to-br dark:from-green-900/40 dark:to-emerald-900/20 border border-stone-200 dark:border-green-500/30 rounded-xl p-6"
                        >
                            <p className="text-stone-600 dark:text-green-300 text-sm font-semibold mb-2">Total Size</p>
                            <h3 className="text-4xl font-bold text-stone-900 dark:text-white">{totalSize} GB</h3>
                            <p className="text-xs text-stone-500 dark:text-green-300/70 mt-2">Combined size</p>
                        </motion.div>

                        <motion.div
                            whileHover={{ y: -5 }}
                            className="backdrop-blur-xl bg-stone-100 dark:bg-gradient-to-br dark:from-teal-900/40 dark:to-cyan-900/20 border border-stone-200 dark:border-teal-500/30 rounded-xl p-6"
                        >
                            <p className="text-stone-600 dark:text-teal-300 text-sm font-semibold mb-2">Latest Backup</p>
                            <h3 className="text-lg font-bold text-stone-900 dark:text-white truncate">{backups[0]?.createdAt}</h3>
                            <p className="text-xs text-stone-500 dark:text-teal-300/70 mt-2">Auto-backup enabled</p>
                        </motion.div>
                    </motion.div>

                    {/* Filter */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="mb-8 flex gap-4"
                    >
                        <div className="flex gap-2">
                            <motion.button
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => setFilterType("")}
                                className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                                    filterType === ""
                                        ? "bg-emerald-600 dark:bg-emerald-600 text-white shadow-lg shadow-emerald-600/50"
                                        : "bg-stone-200 text-stone-700 border border-stone-300 dark:bg-emerald-600/20 dark:text-emerald-300 dark:border-emerald-500/30"
                                }`}
                            >
                                All Backups
                            </motion.button>
                            {["full", "incremental", "manual"].map((type) => (
                                <motion.button
                                    key={type}
                                    whileHover={{ scale: 1.05 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => setFilterType(type)}
                                    className={`px-4 py-2 rounded-lg font-semibold transition-all capitalize ${
                                        filterType === type
                                            ? "bg-emerald-600 dark:bg-emerald-600 text-white shadow-lg shadow-emerald-600/50"
                                            : "bg-stone-200 text-stone-700 border border-stone-300 dark:bg-emerald-600/20 dark:text-emerald-300 dark:border-emerald-500/30"
                                    }`}
                                >
                                    {type}
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>

                    {/* Backup List */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3 }}
                        className="space-y-4"
                    >
                        <AnimatePresence>
                            {filteredBackups.length > 0 ? (
                                filteredBackups.map((backup, index) => (
                                    <motion.div
                                        key={backup.id}
                                        layout
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: -20 }}
                                        transition={{ delay: index * 0.05 }}
                                        onClick={() => setSelectedBackup(selectedBackup === backup.id ? null : backup.id)}
                                        className="backdrop-blur-xl bg-stone-100 dark:bg-gradient-to-r dark:from-slate-900/60 dark:to-slate-800/40 border border-stone-300 dark:border-emerald-500/20 hover:border-stone-400 dark:hover:border-emerald-500/50 rounded-xl p-6 cursor-pointer transition-all hover:shadow-lg dark:hover:shadow-emerald-500/10"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-4 flex-1">
                                                <motion.div
                                                    animate={{ scale: selectedBackup === backup.id ? 1.2 : 1 }}
                                                    className="text-3xl"
                                                >
                                                    💾
                                                </motion.div>
                                                <div className="flex-1">
                                                    <h3 className="text-stone-900 dark:text-white font-bold text-lg">{backup.name}</h3>
                                                    <div className="flex gap-4 text-sm text-stone-600 dark:text-gray-400 mt-1">
                                                        <span>📅 {backup.createdAt}</span>
                                                        <span>💽 {backup.size}</span>
                                                        <span className="capitalize bg-stone-300 dark:bg-emerald-600/20 px-2 py-1 rounded-full text-stone-700 dark:text-emerald-300 border border-stone-400 dark:border-emerald-500/30">
                                                            {backup.type}
                                                        </span>
                                                        <span>📌 Keep for {backup.retentionDays} days</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <motion.span animate={{ rotate: selectedBackup === backup.id ? 180 : 0 }} className="text-xl">
                                                ▼
                                            </motion.span>
                                        </div>

                                        <AnimatePresence>
                                            {selectedBackup === backup.id && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: "auto" }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    className="mt-6 pt-6 border-t border-stone-300 dark:border-emerald-500/20"
                                                >
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <motion.button
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleRestore(backup.id)
                                                            }}
                                                            className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold py-2 px-4 rounded-lg transition-all"
                                                        >
                                                            🔄 Restore
                                                        </motion.button>
                                                        <motion.button
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleDownload(backup.id)
                                                            }}
                                                            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold py-2 px-4 rounded-lg transition-all"
                                                        >
                                                            📥 Download
                                                        </motion.button>
                                                        <motion.button
                                                            whileHover={{ scale: 1.05 }}
                                                            whileTap={{ scale: 0.95 }}
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleDelete(backup.id)
                                                            }}
                                                            className="col-span-2 bg-gradient-to-r from-red-600 to-pink-600 hover:from-red-500 hover:to-pink-500 text-white font-semibold py-2 px-4 rounded-lg transition-all"
                                                        >
                                                            🗑️ Delete
                                                        </motion.button>
                                                    </div>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </motion.div>
                                ))
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="backdrop-blur-xl bg-stone-200 dark:bg-emerald-900/20 border border-stone-300 dark:border-emerald-500/30 rounded-xl p-12 text-center"
                                >
                                    <p className="text-stone-600 dark:text-gray-400 text-lg">No backups found with selected filter</p>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                </div>
            </div>

            {/* Status Toast */}
            <AnimatePresence>
                {actionStatus && (
                    <motion.div
                        initial={{ opacity: 0, y: 100 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 100 }}
                        className="fixed bottom-8 right-8 backdrop-blur-xl bg-white dark:bg-gradient-to-r dark:from-slate-900/80 dark:to-slate-800/60 border border-stone-300 dark:border-emerald-500/30 rounded-xl px-8 py-4 max-w-md z-50"
                    >
                        <p className="text-stone-900 dark:text-white font-semibold">{actionStatus.message}</p>
                        {actionStatus.type === "restoring" && restoreProgress > 0 && (
                            <div className="mt-3">
                                <div className="w-full bg-stone-300 dark:bg-emerald-900/30 rounded-full h-2 border border-stone-400 dark:border-emerald-500/30">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${restoreProgress}%` }}
                                        className="h-full bg-gradient-to-r from-emerald-500 to-green-500 rounded-full"
                                    />
                                </div>
                                <p className="text-xs text-stone-600 dark:text-emerald-300 mt-2">{restoreProgress}% complete</p>
                            </div>
                        )}
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    )
}
