import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { jsPDF } from "jspdf"
import "jspdf-autotable"
import { Document, Packer, Paragraph } from "docx"
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts"

const QUICK_ACTIONS = [
    { label: "Export Users", icon: "📥", color: "from-blue-500 via-cyan-500 to-teal-500", action: "export_users" },
    { label: "Generate Report", icon: "📊", color: "from-violet-500 via-purple-500 to-indigo-500", action: "report" },
    { label: "View Backups", icon: "💾", color: "from-emerald-500 via-green-500 to-teal-500", action: "backups" },
    { label: "Advanced Features", icon: "⚡", color: "from-orange-500 via-red-500 to-pink-500", action: "features" },
    { label: "Diagnostics", icon: "🔧", color: "from-cyan-500 via-blue-500 to-purple-500", action: "diagnostic" },
    { label: "View Logs", icon: "📋", color: "from-amber-500 via-orange-500 to-red-500", action: "logs" },
    { label: "Vibe Mode", icon: "🎵", color: "from-pink-500 via-purple-500 to-indigo-500", action: "music" },
]

export default function AdminDashboard() {
    const navigate = useNavigate()
    const [maintenanceMode, setMaintenanceMode] = useState(false)
    const [actionStatus, setActionStatus] = useState<string | null>(null)
    const [metrics, setMetrics] = useState<any>(null)
    const [analyticsData, setAnalyticsData] = useState<any[]>([])
    const [systemHealth, setSystemHealth] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [logs, setLogs] = useState<any>(null)
    const [backups, setBackups] = useState<any>(null)

    useEffect(() => {
        fetchDashboardData()
    }, [])

    const handlePlayMusic = () => {
        setActionStatus("🎵 Opening Anghami Playlist...")
        window.open("https://play.anghami.com/playlist/280511903", "_blank")
        setTimeout(() => setActionStatus(null), 2000)
    }

    const handleMaintenanceModeToggle = async () => {
        try {
            const token = localStorage.getItem("authToken")
            if (!token) {
                console.error("No auth token found")
                return
            }

            const response = await fetch("http://localhost:9999/api/settings/update", {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                },
                body: JSON.stringify({
                    maintenanceMode: !maintenanceMode,
                }),
            })

            if (response.ok) {
                setMaintenanceMode(!maintenanceMode)
                setActionStatus("Maintenance mode updated")
                setTimeout(() => setActionStatus(null), 3000)
            } else {
                console.error("Failed to update maintenance mode")
            }
        } catch (error) {
            console.error("Error toggling maintenance mode:", error)
        }
    }

    const fetchDashboardData = async () => {
        try {
            setLoading(true)
            const token = localStorage.getItem("authToken")
            
            const [metricsRes, analyticsRes, settingsRes, healthRes] = await Promise.all([
                fetch("http://localhost:9999/api/admin/metrics", {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                fetch("http://localhost:9999/api/admin/analytics", {
                    headers: { Authorization: `Bearer ${token}` },
                }),
                fetch("http://localhost:9999/api/settings"),
                fetch("http://localhost:9999/api/admin/health", {
                    headers: { Authorization: `Bearer ${token}` },
                }),
            ])

            if (metricsRes.ok) {
                const metricsData = await metricsRes.json()
                setMetrics(metricsData.data)
            }

            if (analyticsRes.ok) {
                const analyticsDataRes = await analyticsRes.json()
                setAnalyticsData(analyticsDataRes.data)
            }

            if (settingsRes.ok) {
                const settingsData = await settingsRes.json()
                setMaintenanceMode(settingsData.data?.maintenanceMode || false)
            }

            if (healthRes.ok) {
                const healthData = await healthRes.json()
                setSystemHealth(healthData.data)
            }
        } catch (error) {
            console.error("Failed to fetch dashboard data:", error)
        } finally {
            setLoading(false)
        }
    }
    const generatePDFReport = (metrics: any) => {
        const pdf = new jsPDF()
        const pageWidth = pdf.internal.pageSize.getWidth()
        let yPosition = 20

        // Header
        pdf.setFontSize(24)
        pdf.text("TrustAI System Report", pageWidth / 2, yPosition, { align: "center" })
        yPosition += 15

        // Date
        pdf.setFontSize(11)
        pdf.setTextColor(100, 100, 100)
        pdf.text(`Generated: ${new Date().toLocaleString()}`, pageWidth / 2, yPosition, { align: "center" })
        yPosition += 20

        // System Metrics Section
        pdf.setTextColor(0, 0, 0)
        pdf.setFontSize(14)
        pdf.text("System Metrics", 20, yPosition)
        yPosition += 12

        pdf.setFontSize(11)
        const metricsText = [
            `Total Users: ${metrics?.totalUsers?.toLocaleString() || "0"}`,
            `Total Analyses: ${metrics?.totalAnalyses?.toLocaleString() || "0"}`,
            `API Uptime: ${metrics?.apiUptime || "99.8%"}`,
            `Database Status: ${metrics?.dbStatus || "Healthy"}`,
            `Current Load: ${metrics?.currentLoad || "34%"}`,
            `Cache Hit Rate: ${metrics?.cacheHitRate || "87.5%"}`,
            `Average Response Time: ${metrics?.avgResponseTime || "145ms"}`,
        ]

        metricsText.forEach(text => {
            pdf.text(text, 25, yPosition)
            yPosition += 8
        })

        yPosition += 10

        // Health Status Section
        pdf.setFontSize(14)
        pdf.text("System Health Status", 20, yPosition)
        yPosition += 12

        pdf.setFontSize(11)
        const healthText = [
            "Database: Healthy (99.9% uptime)",
            "API Server: Operational (99.8% uptime)",
            "Queue Processing: Active (100% uptime)",
            "Storage: Operational (99.95% uptime)",
        ]

        healthText.forEach(text => {
            pdf.text(text, 25, yPosition)
            yPosition += 8
        })

        // Footer
        pdf.setFontSize(9)
        pdf.setTextColor(150, 150, 150)
        pdf.text(
            "TrustAI Admin Report - Confidential",
            pageWidth / 2,
            pdf.internal.pageSize.getHeight() - 10,
            { align: "center" }
        )

        pdf.save(`TrustAI_System_Report_${new Date().toISOString().split("T")[0]}.pdf`)
    }

    const generateWordReport = (metrics: any) => {
        const doc = new Document({
            sections: [
                {
                    children: [
                        new Paragraph("TrustAI System Report"),
                        new Paragraph(`Generated: ${new Date().toLocaleString()}`),
                        new Paragraph(""),
                        new Paragraph("System Metrics"),
                        new Paragraph(`Total Users: ${metrics?.totalUsers?.toLocaleString() || "0"}`),
                        new Paragraph(`Total Analyses: ${metrics?.totalAnalyses?.toLocaleString() || "0"}`),
                        new Paragraph(`API Uptime: ${metrics?.apiUptime || "99.8%"}`),
                        new Paragraph(`Database Status: ${metrics?.dbStatus || "Healthy"}`),
                        new Paragraph(`Current Load: ${metrics?.currentLoad || "34%"}`),
                        new Paragraph(`Cache Hit Rate: ${metrics?.cacheHitRate || "87.5%"}`),
                        new Paragraph(`Average Response Time: ${metrics?.avgResponseTime || "145ms"}`),
                        new Paragraph(""),
                        new Paragraph("System Health Status"),
                        new Paragraph("Database: Healthy (99.9% uptime)"),
                        new Paragraph("API Server: Operational (99.8% uptime)"),
                        new Paragraph("Queue Processing: Active (100% uptime)"),
                        new Paragraph("Storage: Operational (99.95% uptime)"),
                    ],
                },
            ],
        })

        Packer.toBlob(doc).then((blob) => {
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement("a")
            a.href = url
            a.download = `TrustAI_System_Report_${new Date().toISOString().split("T")[0]}.docx`
            a.click()
            window.URL.revokeObjectURL(url)
        })
    }

    const handleQuickAction = async (action: string, label: string) => {
        const token = localStorage.getItem("authToken")
        
        try {
            if (action === "export_users") {
                const response = await fetch("http://localhost:9999/api/admin/export/users", {
                    headers: { Authorization: `Bearer ${token}` },
                })
                const blob = await response.blob()
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement("a")
                a.href = url
                a.download = "users_export.csv"
                a.click()
                setActionStatus(`✓ ${label} downloaded`)
            } else if (action === "export_analyses") {
                const response = await fetch("http://localhost:9999/api/admin/export/analyses", {
                    headers: { Authorization: `Bearer ${token}` },
                })
                const blob = await response.blob()
                const url = window.URL.createObjectURL(blob)
                const a = document.createElement("a")
                a.href = url
                a.download = "analyses_export.csv"
                a.click()
                setActionStatus(`✓ ${label} downloaded`)
            } else if (action === "report") {
                // Show format selection dialog
                const format = prompt("Choose report format:\n1. PDF (type: pdf)\n2. Word Document (type: word)", "pdf")
                if (format && (format.toLowerCase() === "pdf" || format.toLowerCase() === "word")) {
                    if (format.toLowerCase() === "pdf") {
                        generatePDFReport(metrics)
                        setActionStatus(`✓ PDF Report generated and downloaded`)
                    } else {
                        generateWordReport(metrics)
                        setActionStatus(`✓ Word Report generated and downloaded`)
                    }
                } else if (format !== null) {
                    setActionStatus(`✕ Invalid format. Please type 'pdf' or 'word'`)
                }
            } else if (action === "diagnostic") {
                // Open diagnostic tool served from public folder
                window.open("/diagnostic-tool.html", "TrustAI_Diagnostic", "width=1200,height=800")
                setActionStatus(`✓ ${label} opened in new window`)
            } else if (action === "features") {
                navigate("/features")
                setActionStatus(`✓ Opening advanced features...`)
            } else if (action === "music") {
                handlePlayMusic()
            } else if (action === "logs") {
                navigate("/admin/logs")
                setActionStatus(`✓ Opening logs page...`)
            } else if (action === "backups") {
                navigate("/admin/backups")
            }
            setTimeout(() => setActionStatus(null), 3000)
        } catch (error) {
            console.error(`Failed to perform action ${action}:`, error)
            setActionStatus(`✕ Failed to ${action}`)
        }
    }
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
                    {/* Main header with controls */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.1 }}
                        className="mb-16 flex items-center justify-between"
                    >
                        <div>
                            <h2 className="text-5xl font-black bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent mb-2 tracking-tight">Dashboard</h2>
                            <div className="flex gap-4 text-sm">
                                <span className="flex items-center gap-2 text-gray-400">
                                    <motion.span animate={{ opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }} className="w-2 h-2 rounded-full bg-green-400 shadow-lg shadow-green-400/50" />
                                    All Systems Online
                                </span>
                                <span className="text-gray-500">•</span>
                                <span className="text-gray-400">Real-time monitoring</span>
                            </div>
                        </div>
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleMaintenanceModeToggle}
                            className={`relative px-8 py-3 rounded-xl font-black transition-all ${
                                maintenanceMode
                                    ? "bg-gradient-to-r from-red-600 to-pink-600 text-white shadow-lg shadow-red-600/50"
                                    : "bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-lg shadow-emerald-600/50"
                            }`}
                            title="Toggle maintenance mode"
                        >
                            <motion.span animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 1.5, repeat: Infinity }} className="inline-block mr-2">
                                {maintenanceMode ? "🔴" : "🟢"}
                            </motion.span>
                            {maintenanceMode ? "MAINTENANCE" : "OPERATIONAL"}
                        </motion.button>
                    </motion.div>

                    {/* Premium KPI Cards */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12"
                    >
                        {loading ? (
                            <div className="col-span-4 flex items-center justify-center py-16">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                    className="w-12 h-12 border-4 border-purple-500/30 border-t-purple-500 rounded-full"
                                />
                                <span className="ml-4 text-lg font-semibold text-gray-400">Loading metrics...</span>
                            </div>
                        ) : metrics ? (
                            <>
                                {/* Users Card */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6, delay: 0.3 }}
                                    whileHover={{ y: -10 }}
                                    className="group relative backdrop-blur-xl bg-gradient-to-br from-blue-900/40 to-cyan-900/20 border border-cyan-500/30 rounded-2xl p-8 hover:border-cyan-400/60 transition-all overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/0 via-transparent to-cyan-600/0 group-hover:from-blue-600/10 group-hover:to-cyan-600/5 transition-all" />
                                    <div className="relative">
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <p className="text-gray-300 text-sm font-semibold mb-1">Total Users</p>
                                                <h3 className="text-5xl font-black text-white">{metrics.totalUsers?.toLocaleString() || 0}</h3>
                                            </div>
                                            <motion.div
                                                animate={{ scale: [1, 1.2, 1] }}
                                                transition={{ duration: 2, repeat: Infinity }}
                                                className="text-5xl"
                                            >
                                                👥
                                            </motion.div>
                                        </div>
                                        <div className="flex gap-3 text-xs">
                                            <motion.span animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 2, repeat: Infinity }} className="px-3 py-1 rounded-full bg-green-500/20 text-green-300 border border-green-500/30 font-bold">
                                                +12.5%
                                            </motion.span>
                                            <span className="px-3 py-1 rounded-full bg-gray-500/20 text-gray-300 border border-gray-500/30">This month</span>
                                        </div>
                                    </div>
                                    <div className="absolute bottom-0 right-0 text-6xl opacity-20">👥</div>
                                </motion.div>

                                {/* Analyses Card */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6, delay: 0.35 }}
                                    whileHover={{ y: -10 }}
                                    className="group relative backdrop-blur-xl bg-gradient-to-br from-purple-900/40 to-pink-900/20 border border-purple-500/30 rounded-2xl p-8 hover:border-purple-400/60 transition-all overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-purple-600/0 via-transparent to-pink-600/0 group-hover:from-purple-600/10 group-hover:to-pink-600/5 transition-all" />
                                    <div className="relative">
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <p className="text-gray-300 text-sm font-semibold mb-1">Total Analyses</p>
                                                <h3 className="text-5xl font-black text-white">{metrics.totalAnalyses?.toLocaleString() || 0}</h3>
                                            </div>
                                            <motion.div
                                                animate={{ scale: [1, 1.2, 1] }}
                                                transition={{ duration: 2, repeat: Infinity, delay: 0.1 }}
                                                className="text-5xl"
                                            >
                                                🔍
                                            </motion.div>
                                        </div>
                                        <div className="flex gap-3 text-xs">
                                            <motion.span animate={{ scale: [1, 1.15, 1] }} transition={{ duration: 2, repeat: Infinity, delay: 0.1 }} className="px-3 py-1 rounded-full bg-green-500/20 text-green-300 border border-green-500/30 font-bold">
                                                +18.2%
                                            </motion.span>
                                            <span className="px-3 py-1 rounded-full bg-gray-500/20 text-gray-300 border border-gray-500/30">This month</span>
                                        </div>
                                    </div>
                                    <div className="absolute bottom-0 right-0 text-6xl opacity-20">🔍</div>
                                </motion.div>

                                {/* Accuracy Card */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6, delay: 0.4 }}
                                    whileHover={{ y: -10 }}
                                    className="group relative backdrop-blur-xl bg-gradient-to-br from-amber-900/40 to-orange-900/20 border border-amber-500/30 rounded-2xl p-8 hover:border-amber-400/60 transition-all overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-amber-600/0 via-transparent to-orange-600/0 group-hover:from-amber-600/10 group-hover:to-orange-600/5 transition-all" />
                                    <div className="relative">
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <p className="text-gray-300 text-sm font-semibold mb-1">Avg Accuracy</p>
                                                <h3 className="text-5xl font-black bg-gradient-to-r from-amber-300 to-orange-300 bg-clip-text text-transparent">{metrics.avgAccuracy || 0}%</h3>
                                            </div>
                                            <motion.div
                                                animate={{ scale: [1, 1.2, 1] }}
                                                transition={{ duration: 2, repeat: Infinity, delay: 0.2 }}
                                                className="text-5xl"
                                            >
                                                🎯
                                            </motion.div>
                                        </div>
                                        <div className="w-full bg-gray-700/50 rounded-full h-2 mt-4">
                                            <motion.div
                                                initial={{ width: 0 }}
                                                animate={{ width: `${metrics.avgAccuracy || 0}%` }}
                                                transition={{ duration: 1, delay: 0.5 }}
                                                className="bg-gradient-to-r from-amber-400 to-orange-400 h-full rounded-full"
                                            ></motion.div>
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Sessions Card */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.6, delay: 0.45 }}
                                    whileHover={{ y: -10 }}
                                    className="group relative backdrop-blur-xl bg-gradient-to-br from-emerald-900/40 to-teal-900/20 border border-emerald-500/30 rounded-2xl p-8 hover:border-emerald-400/60 transition-all overflow-hidden"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/0 via-transparent to-teal-600/0 group-hover:from-emerald-600/10 group-hover:to-teal-600/5 transition-all" />
                                    <div className="relative">
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <p className="text-gray-300 text-sm font-semibold mb-1">Active Sessions</p>
                                                <h3 className="text-5xl font-black text-white">{metrics.activeSessions || 0}</h3>
                                            </div>
                                            <motion.div
                                                animate={{ scale: [1, 1.2, 1] }}
                                                transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                                                className="text-5xl"
                                            >
                                                ⚡
                                            </motion.div>
                                        </div>
                                        <div className="flex gap-3 text-xs">
                                            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 font-bold">Peak activity</span>
                                        </div>
                                    </div>
                                </motion.div>
                            </>
                        ) : null}
                    </motion.div>

                    {/* Quick Actions Grid */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.5 }}
                        className="mb-12"
                    >
                        <h3 className="text-2xl font-black text-white mb-6">Quick Actions</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {QUICK_ACTIONS.map((action, index) => (
                                <motion.button
                                    key={action.label}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.55 + index * 0.08 }}
                                    whileHover={{ scale: 1.05, y: -5 }}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleQuickAction(action.action, action.label)}
                                    className={`relative group overflow-hidden bg-gradient-to-br ${action.color} text-white font-bold py-6 px-4 rounded-2xl border border-white/20 backdrop-blur-xl hover:border-white/40 transition-all flex items-center justify-center gap-3 shadow-lg hover:shadow-2xl`}
                                >
                                    <motion.span
                                        animate={{ scale: [1, 1.1, 1] }}
                                        transition={{ duration: 2, repeat: Infinity, delay: index * 0.1 }}
                                        className="text-3xl"
                                    >
                                        {action.icon}
                                    </motion.span>
                                    <span className="hidden sm:inline text-sm">{action.label}</span>
                                    <div className="absolute inset-0 bg-white/0 group-hover:bg-white/10 transition-all" />
                                </motion.button>
                            ))}
                        </div>
                        {actionStatus && (
                            <motion.div
                                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                className="mt-6 p-4 rounded-xl bg-emerald-500/20 border border-emerald-500/50 text-emerald-300 font-semibold flex items-center gap-3"
                            >
                                <span className="text-lg">✓</span>
                                {actionStatus}
                            </motion.div>
                        )}
                    </motion.div>

                    {/* System Health Monitoring */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        className="mb-12"
                    >
                        <h3 className="text-2xl font-black text-stone-900 dark:text-white mb-6">System Health</h3>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                            {systemHealth ? (
                                <>
                                    {/* Database */}
                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.65 }}
                                        whileHover={{ x: 5 }}
                                        className={`relative group backdrop-blur-xl border rounded-2xl p-6 transition-all hover:shadow-lg overflow-hidden ${
                                            systemHealth.database?.status === "healthy"
                                                ? "bg-stone-100 dark:bg-gradient-to-br dark:from-emerald-950/50 dark:via-emerald-900/40 dark:to-cyan-900/30 border-stone-300 dark:border-emerald-500/40 hover:border-stone-400 dark:hover:border-emerald-400/70 dark:hover:shadow-emerald-500/20"
                                                : "bg-stone-100 dark:bg-gradient-to-br dark:from-red-950/50 dark:via-red-900/40 dark:to-orange-900/30 border-stone-300 dark:border-red-500/40 hover:border-stone-400 dark:hover:border-red-400/70 dark:hover:shadow-red-500/20"
                                        }`}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/0 via-transparent to-cyan-500/0 group-hover:from-emerald-500/10 group-hover:to-cyan-500/10 transition-all" />
                                        <div className="relative">
                                            <div className="flex items-center justify-between mb-4">
                                                <h4 className="text-lg font-bold text-stone-900 dark:text-white">Database</h4>
                                                <motion.span
                                                    animate={{ scale: [1, 1.4, 1] }}
                                                    transition={{ duration: 2, repeat: Infinity }}
                                                    className={`w-3 h-3 rounded-full shadow-lg ${
                                                        systemHealth.database?.status === "healthy"
                                                            ? "bg-emerald-400 shadow-emerald-400/75"
                                                            : "bg-amber-400 shadow-amber-400/75"
                                                    }`}
                                                />
                                            </div>
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs text-stone-600 dark:text-gray-400">Status</span>
                                                    <span className="text-sm font-bold text-stone-900 dark:text-emerald-300 capitalize">{systemHealth.database?.status || "unknown"}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs text-stone-600 dark:text-gray-400">Response Time</span>
                                                    <span className="text-sm font-bold text-stone-900 dark:text-cyan-300">{systemHealth.database?.responseTime || "N/A"}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs text-stone-600 dark:text-gray-400">Uptime</span>
                                                    <span className="text-sm font-bold text-stone-900 dark:text-emerald-300">{systemHealth.database?.uptime || "N/A"}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs text-stone-600 dark:text-gray-400">Connections</span>
                                                    <span className="text-sm font-bold text-stone-900 dark:text-teal-300">{systemHealth.database?.connections || "0"}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>

                                    {/* API Server */}
                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.7 }}
                                        whileHover={{ x: 5 }}
                                        className={`relative group backdrop-blur-xl border rounded-2xl p-6 transition-all hover:shadow-lg overflow-hidden ${
                                            systemHealth.apiServer?.status === "healthy"
                                                ? "bg-stone-100 dark:bg-gradient-to-br dark:from-blue-950/50 dark:via-blue-900/40 dark:to-indigo-900/30 border-stone-300 dark:border-blue-500/40 hover:border-stone-400 dark:hover:border-blue-400/70 dark:hover:shadow-blue-500/20"
                                                : "bg-stone-100 dark:bg-gradient-to-br dark:from-red-950/50 dark:via-red-900/40 dark:to-orange-900/30 border-stone-300 dark:border-red-500/40 hover:border-stone-400 dark:hover:border-red-400/70 dark:hover:shadow-red-500/20"
                                        }`}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-blue-500/0 via-transparent to-indigo-500/0 group-hover:from-blue-500/10 group-hover:to-indigo-500/10 transition-all" />
                                        <div className="relative">
                                            <div className="flex items-center justify-between mb-4">
                                                <h4 className="text-lg font-bold text-stone-900 dark:text-white">API Server</h4>
                                                <motion.span
                                                    animate={{ scale: [1, 1.4, 1] }}
                                                    transition={{ duration: 2, repeat: Infinity }}
                                                    className={`w-3 h-3 rounded-full shadow-lg ${
                                                        systemHealth.apiServer?.status === "healthy"
                                                            ? "bg-emerald-400 shadow-emerald-400/75"
                                                            : "bg-amber-400 shadow-amber-400/75"
                                                    }`}
                                                />
                                            </div>
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs text-stone-600 dark:text-gray-400">Status</span>
                                                    <span className="text-sm font-bold text-stone-900 dark:text-blue-300 capitalize">{systemHealth.apiServer?.status || "unknown"}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs text-stone-600 dark:text-gray-400">Response Time</span>
                                                    <span className="text-sm font-bold text-stone-900 dark:text-sky-300">{systemHealth.apiServer?.responseTime || "N/A"}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs text-stone-600 dark:text-gray-400">Uptime</span>
                                                    <span className="text-sm font-bold text-stone-900 dark:text-blue-300">{systemHealth.apiServer?.uptime || "N/A"}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs text-stone-600 dark:text-gray-400">Requests/min</span>
                                                    <span className="text-sm font-bold text-stone-900 dark:text-indigo-300">{systemHealth.apiServer?.requestsPerMinute || "0"}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>

                                    {/* Queue Processing */}
                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.75 }}
                                        whileHover={{ x: 5 }}
                                        className={`relative group backdrop-blur-xl border rounded-2xl p-6 transition-all hover:shadow-lg overflow-hidden ${
                                            systemHealth.queueProcessing?.status === "healthy"
                                                ? "bg-stone-100 dark:bg-gradient-to-br dark:from-violet-950/50 dark:via-purple-900/40 dark:to-purple-900/30 border-stone-300 dark:border-purple-500/40 hover:border-stone-400 dark:hover:border-purple-400/70 dark:hover:shadow-purple-500/20"
                                                : "bg-stone-100 dark:bg-gradient-to-br dark:from-red-950/50 dark:via-red-900/40 dark:to-orange-900/30 border-stone-300 dark:border-red-500/40 hover:border-stone-400 dark:hover:border-red-400/70 dark:hover:shadow-red-500/20"
                                        }`}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-violet-500/0 via-transparent to-purple-500/0 group-hover:from-violet-500/10 group-hover:to-purple-500/10 transition-all" />
                                        <div className="relative">
                                            <div className="flex items-center justify-between mb-4">
                                                <h4 className="text-lg font-bold text-stone-900 dark:text-white">Queue Processing</h4>
                                                <motion.span
                                                    animate={{ scale: [1, 1.4, 1] }}
                                                    transition={{ duration: 2, repeat: Infinity }}
                                                    className={`w-3 h-3 rounded-full shadow-lg ${
                                                        systemHealth.queueProcessing?.status === "healthy"
                                                            ? "bg-emerald-400 shadow-emerald-400/75"
                                                            : "bg-amber-400 shadow-amber-400/75"
                                                    }`}
                                                />
                                            </div>
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs text-stone-600 dark:text-gray-400">Status</span>
                                                    <span className="text-sm font-bold text-stone-900 dark:text-purple-300 capitalize">{systemHealth.queueProcessing?.status || "unknown"}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs text-stone-600 dark:text-gray-400">Pending Jobs</span>
                                                    <span className="text-sm font-bold text-stone-900 dark:text-violet-300">{systemHealth.queueProcessing?.pendingJobs || "0"}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs text-stone-600 dark:text-gray-400">Completed</span>
                                                    <span className="text-sm font-bold text-stone-900 dark:text-fuchsia-300">{systemHealth.queueProcessing?.completedJobs || "0"}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs text-stone-600 dark:text-gray-400">Uptime</span>
                                                    <span className="text-sm font-bold text-stone-900 dark:text-purple-300">{systemHealth.queueProcessing?.uptime || "N/A"}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>

                                    {/* Storage */}
                                    <motion.div
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: 0.8 }}
                                        whileHover={{ x: 5 }}
                                        className={`relative group backdrop-blur-xl border rounded-2xl p-6 transition-all hover:shadow-lg overflow-hidden ${
                                            systemHealth.storage?.status === "healthy"
                                                ? "bg-stone-100 dark:bg-gradient-to-br dark:from-amber-950/50 dark:via-orange-900/40 dark:to-yellow-900/30 border-stone-300 dark:border-amber-500/40 hover:border-stone-400 dark:hover:border-amber-400/70 dark:hover:shadow-amber-500/20"
                                                : "bg-stone-100 dark:bg-gradient-to-br dark:from-red-950/50 dark:via-red-900/40 dark:to-orange-900/30 border-stone-300 dark:border-red-500/40 hover:border-stone-400 dark:hover:border-red-400/70 dark:hover:shadow-red-500/20"
                                        }`}
                                    >
                                        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/0 via-transparent to-yellow-500/0 group-hover:from-amber-500/10 group-hover:to-yellow-500/10 transition-all" />
                                        <div className="relative">
                                            <div className="flex items-center justify-between mb-4">
                                                <h4 className="text-lg font-bold text-stone-900 dark:text-white">Storage</h4>
                                                <motion.span
                                                    animate={{ scale: [1, 1.4, 1] }}
                                                    transition={{ duration: 2, repeat: Infinity }}
                                                    className={`w-3 h-3 rounded-full shadow-lg ${
                                                        systemHealth.storage?.status === "healthy"
                                                            ? "bg-emerald-400 shadow-emerald-400/75"
                                                            : "bg-amber-400 shadow-amber-400/75"
                                                    }`}
                                                />
                                            </div>
                                            <div className="space-y-3">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs text-stone-600 dark:text-gray-400">Status</span>
                                                    <span className="text-sm font-bold text-stone-900 dark:text-amber-300 capitalize">{systemHealth.storage?.status || "unknown"}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs text-stone-600 dark:text-gray-400">Used Space</span>
                                                    <span className="text-sm font-bold text-stone-900 dark:text-orange-300">{systemHealth.storage?.usedSpace || "N/A"}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs text-stone-600 dark:text-gray-400">Total Space</span>
                                                    <span className="text-sm font-bold text-stone-900 dark:text-yellow-300">{systemHealth.storage?.totalSpace || "N/A"}</span>
                                                </div>
                                                <div className="flex justify-between items-center">
                                                    <span className="text-xs text-stone-600 dark:text-gray-400">Free Space</span>
                                                    <span className="text-sm font-bold text-stone-900 dark:text-amber-300">{systemHealth.storage?.freeSpace || "N/A"}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                </>
                            ) : (
                                [
                                    { label: "Database" },
                                    { label: "API Server" },
                                    { label: "Queue Processing" },
                                    { label: "Storage" },
                                ].map((service) => (
                                    <div key={service.label} className="bg-stone-200 dark:bg-slate-800/30 rounded-2xl p-6 border border-stone-300 dark:border-slate-700 animate-pulse">
                                        <div className="h-6 bg-stone-300 dark:bg-slate-700 rounded w-1/3 mb-4"></div>
                                        <div className="space-y-3">
                                            <div className="h-4 bg-stone-300 dark:bg-slate-700 rounded"></div>
                                            <div className="h-4 bg-stone-300 dark:bg-slate-700 rounded w-2/3"></div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </motion.div>

                    {/* Advanced Analytics Chart */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                        className="backdrop-blur-xl bg-gradient-to-br from-indigo-900/30 to-blue-900/20 border border-indigo-500/30 rounded-2xl p-8 hover:border-indigo-400/60 transition-all hover:shadow-lg hover:shadow-indigo-500/10"
                    >
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h3 className="text-2xl font-black text-white">Activity Analytics</h3>
                                <p className="text-gray-400 text-sm mt-1">Real-time system activity tracking</p>
                            </div>
                            <div className="flex gap-4 text-sm">
                                <span className="flex items-center gap-2 text-gray-400">
                                    <div className="w-3 h-3 rounded-full bg-cyan-400 shadow-lg shadow-cyan-400/50" />
                                    <span className="font-semibold">Users</span>
                                </span>
                                <span className="flex items-center gap-2 text-gray-400">
                                    <div className="w-3 h-3 rounded-full bg-purple-400 shadow-lg shadow-purple-400/50" />
                                    <span className="font-semibold">Analyses</span>
                                </span>
                            </div>
                        </div>
                        <div className="h-96 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={analyticsData.length > 0 ? analyticsData : []} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                    <defs>
                                        <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.5} />
                                            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
                                        </linearGradient>
                                        <linearGradient id="colorAnalyses" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="#a855f7" stopOpacity={0.5} />
                                            <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" vertical={false} />
                                    <XAxis dataKey="day" stroke="#9ca3af" axisLine={false} tickLine={false} />
                                    <YAxis stroke="#9ca3af" axisLine={false} tickLine={false} />
                                    <Tooltip
                                        contentStyle={{
                                            backgroundColor: "#0f172a",
                                            border: "1px solid rgba(99, 102, 241, 0.5)",
                                            borderRadius: "12px",
                                            color: "#fff",
                                            boxShadow: "0 20px 40px rgba(99, 102, 241, 0.3)",
                                            backdropFilter: "blur(10px)",
                                        }}
                                        labelStyle={{ color: "#cffafe" }}
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="users"
                                        stroke="#06b6d4"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorUsers)"
                                    />
                                    <Area
                                        type="monotone"
                                        dataKey="analyses"
                                        stroke="#a855f7"
                                        strokeWidth={3}
                                        fillOpacity={1}
                                        fill="url(#colorAnalyses)"
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </motion.div>

                    {/* Logs Modal */}
                    {logs && (
                        <motion.div
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            className="mt-12 backdrop-blur-xl bg-gradient-to-br from-indigo-900/40 to-purple-900/20 border border-indigo-500/40 rounded-2xl p-8 shadow-2xl"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-2xl font-black text-white">System Audit Logs</h3>
                                <motion.button
                                    whileHover={{ scale: 1.15, rotate: 90 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setLogs(null)}
                                    className="text-gray-400 hover:text-indigo-400 transition-all text-3xl font-bold"
                                >
                                    ✕
                                </motion.button>
                            </div>
                            <div className="max-h-96 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                                {logs.logs?.map((log: any, idx: number) => (
                                    <motion.div
                                        key={log.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="backdrop-blur-lg bg-white/5 border border-indigo-500/30 rounded-xl p-4 hover:bg-white/10 hover:border-indigo-500/60 transition-all"
                                    >
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <p className="text-gray-300 font-semibold">
                                                    <span className="text-indigo-400 font-bold">{log.action}</span>
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">by <span className="text-purple-400">{log.userId}</span></p>
                                            </div>
                                            <span className="text-xs text-gray-500 whitespace-nowrap ml-2">{new Date(log.createdAt).toLocaleTimeString()}</span>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Backups Modal */}
                    {backups && (
                        <motion.div
                            initial={{ opacity: 0, y: 20, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            className="mt-12 backdrop-blur-xl bg-gradient-to-br from-emerald-900/40 to-green-900/20 border border-emerald-500/40 rounded-2xl p-8 shadow-2xl"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="text-2xl font-black text-white">System Backups</h3>
                                <motion.button
                                    whileHover={{ scale: 1.15, rotate: 90 }}
                                    whileTap={{ scale: 0.9 }}
                                    onClick={() => setBackups(null)}
                                    className="text-gray-400 hover:text-emerald-400 transition-all text-3xl font-bold"
                                >
                                    ✕
                                </motion.button>
                            </div>
                            <div className="max-h-96 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
                                {backups.backups?.map((backup: any, idx: number) => (
                                    <motion.div
                                        key={backup.id}
                                        initial={{ opacity: 0, x: -20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="backdrop-blur-lg bg-white/5 border border-emerald-500/30 rounded-xl p-4 hover:bg-white/10 hover:border-emerald-500/60 transition-all"
                                    >
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <p className="font-bold text-white">{backup.name}</p>
                                                <p className="text-xs text-gray-400 mt-1">{backup.type} • {backup.size}</p>
                                            </div>
                                            <motion.span
                                                animate={{ scale: [1, 1.1, 1] }}
                                                transition={{ duration: 2, repeat: Infinity }}
                                                className="text-xs bg-emerald-500/30 text-emerald-300 px-3 py-1 rounded-lg font-bold border border-emerald-500/50"
                                            >
                                                ✓ {backup.status}
                                            </motion.span>
                                        </div>
                                        <p className="text-xs text-gray-500">{new Date(backup.timestamp).toLocaleString()}</p>
                                    </motion.div>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
    )
}
