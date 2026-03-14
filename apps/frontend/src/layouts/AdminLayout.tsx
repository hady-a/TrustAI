import type { ReactNode } from "react"
import { Link, useLocation, useNavigate } from "react-router-dom"
import { motion } from "framer-motion"
import { Icon } from "../components/UI/IconRenderer"
import { authAPI } from "../lib/api"
import Navbar from "../components/Navbar"

interface AdminLayoutProps {
    children: ReactNode
}

const NAV_ITEMS = [
    { name: "Dashboard", path: "/admin", icon: "📊" },
    { name: "Users", path: "/admin/users", icon: "👥" },
    { name: "Analysis Logs", path: "/admin/logs", icon: "🔍" },
    { name: "Backups", path: "/admin/backups", icon: "💾" },
    { name: "Settings", path: "/admin/settings", icon: "⚙️" },
]

export default function AdminLayout({ children }: AdminLayoutProps) {
    const location = useLocation()
    const navigate = useNavigate()

    const handleLogout = () => {
        authAPI.logout()
        navigate("/login")
    }

    return (
        <div className="min-h-screen bg-stone-50 dark:from-[#0B0F19] dark:via-[#1a1f3a] dark:to-[#0B0F19] dark:bg-gradient-to-br flex flex-col overflow-hidden">
            {/* Animated background elements */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
                <motion.div
                    className="absolute -top-40 -right-40 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl"
                    animate={{
                        x: [0, 30, 0],
                        y: [0, 50, 0],
                    }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                    className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-500/20 rounded-full blur-3xl"
                    animate={{
                        x: [0, -30, 0],
                        y: [0, -50, 0],
                    }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                />
            </div>

            {/* Fixed Navbar */}
            <Navbar />
            
            {/* Main Content with Sidebar */}
            <div className="flex flex-1 pt-20 pl-64 relative z-10">
                {/* Sidebar */}
                <motion.aside
                    initial={{ x: -280 }}
                    animate={{ x: 0 }}
                    className="fixed left-0 top-20 w-64 h-[calc(100vh-80px)] dark:bg-gradient-to-b dark:from-[#111827] dark:to-[#0B0F19] bg-white/40 dark:border-indigo-500/20 border-gray-200 border-r flex flex-col pt-6 z-30 overflow-y-auto backdrop-blur-sm"
                >
                    <div className="px-6 mb-10">
                        <Link to="/admin" className="flex items-center gap-3 group">
                            <motion.div 
                                className="w-10 h-10 dark:bg-gradient-to-br dark:from-indigo-600 dark:to-purple-600 bg-indigo-500 rounded-xl flex items-center justify-center transform transition-all shadow-lg dark:shadow-indigo-500/30 shadow-indigo-400/20"
                                whileHover={{ rotate: 12, scale: 1.05 }}
                            >
                                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                                </svg>
                            </motion.div>
                            <span className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 dark:from-indigo-400 dark:to-purple-400">
                                Admin
                            </span>
                        </Link>
                    </div>

                    {/* Back Button */}
                    <div className="px-4 mb-6">
                        <motion.button
                            whileHover={{ scale: 1.02, x: -4 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => navigate("/modes")}
                            className="w-full flex items-center gap-3 px-4 py-3 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800/50 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-xl transition-all font-semibold border-2 border-transparent dark:hover:border-indigo-500/30 hover:border-indigo-200"
                        >
                            <span>←</span>
                            <span className="text-sm">Back</span>
                        </motion.button>
                    </div>

                    <nav className="flex-1 px-4 space-y-2">
                        {NAV_ITEMS.map((item, index) => {
                            const isActive = location.pathname === item.path
                            return (
                                <motion.div
                                    key={item.name}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <Link
                                        to={item.path}
                                        className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${isActive
                                            ? "dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/30 dark:shadow-lg dark:shadow-indigo-500/20 bg-indigo-100 text-indigo-700 border-2 border-indigo-300 shadow-sm"
                                            : "dark:text-gray-400 dark:hover:text-white dark:hover:bg-gray-800/50 text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-2 border-transparent hover:border-indigo-200"
                                        }`}
                                    >
                                        <Icon emoji={item.icon} inline={true} />
                                        <span className="font-semibold text-sm">{item.name}</span>
                                        {isActive && (
                                            <motion.div
                                                layoutId="active-nav"
                                                className="ml-auto w-2 h-2 rounded-full bg-indigo-600 dark:bg-indigo-400"
                                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                            />
                                        )}
                                    </Link>
                                </motion.div>
                            )
                        })}
                    </nav>

                    <div className="p-4 dark:border-indigo-500/20 border-slate-200 border-t">
                        <motion.button
                            whileHover={{ scale: 1.02, x: -4 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-3 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-400/10 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all font-semibold border-2 border-transparent hover:border-red-200 dark:hover:border-red-500/30"
                        >
                            <Icon emoji="🚪" inline={true} />
                            <span>Logout</span>
                        </motion.button>
                    </div>
                </motion.aside>

                {/* Main Content Area */}
                <main className="flex-1 overflow-x-hidden overflow-y-auto dark:bg-transparent bg-stone-50">
                    {children}
                </main>
            </div>
        </div>
    )
}
