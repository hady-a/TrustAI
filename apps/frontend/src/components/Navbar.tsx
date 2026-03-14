import { motion } from "framer-motion"
import { useNavigate } from "react-router-dom"
import { useState, useEffect } from "react"
import { Sun, Moon } from "lucide-react"
import WelcomeBanner from "./WelcomeBanner"
import NotificationsBell from "./NotificationsBell"
import { useTheme } from "../contexts/ThemeContext"
import { useOnboarding } from "../contexts/OnboardingContext"

export default function Navbar() {
  const navigate = useNavigate()
  const { theme, toggleTheme } = useTheme()
  const { resetOnboarding } = useOnboarding()
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    const userStr = localStorage.getItem("user")
    if (userStr) {
      const user = JSON.parse(userStr)
      setIsAdmin(user.role === "ADMIN")
    }
  }, [])

  const navIconClass = "w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors"

  return (
    <>
      <motion.nav
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="fixed top-0 left-0 right-0 w-full z-50 h-20"
      >
        {/* Background */}
        <div className="absolute inset-0 bg-white dark:bg-gradient-to-r dark:from-[#0B0F19]/95 dark:via-[#1a1f3a]/95 dark:to-[#0B0F19]/95 backdrop-blur-sm dark:border-indigo-500/20 border-b border-gray-200" />

        {/* Content */}
        <div className="relative h-full max-w-7xl mx-auto px-8 flex items-center justify-between">
          {/* Left: Logo */}
          <motion.button
            onClick={() => navigate("/modes")}
            className="flex items-center gap-3 group"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-lg shadow-md text-white font-bold text-lg">
              T
            </div>
            <div className="flex flex-col">
              <span className="text-gray-900 dark:text-white font-bold text-lg leading-none">TrustAI</span>
              <div className="h-1 w-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full mt-1" />
            </div>
          </motion.button>

          {/* Right: Icons */}
          <div className="flex items-center gap-1">
            {/* Notifications */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="group p-2 hover:bg-gray-100 dark:hover:bg-gray-800/50 rounded-lg cursor-pointer transition-colors"
            >
              <NotificationsBell />
            </motion.div>

            {/* Theme Toggle */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={toggleTheme}
              className="group p-2.5 hover:bg-gray-100 dark:hover:bg-gray-800/50 rounded-lg transition-colors relative"
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
            >
              <motion.div
                initial={false}
                animate={{ rotate: theme === 'dark' ? 0 : 180 }}
                transition={{ duration: 0.3 }}
              >
                {theme === 'dark' ? (
                  <Sun className={navIconClass} strokeWidth={1.5} />
                ) : (
                  <Moon className={navIconClass} strokeWidth={1.5} />
                )}
              </motion.div>
            </motion.button>

            {/* Profile */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/profile")}
              className="group p-2.5 hover:bg-gray-100 dark:hover:bg-gray-800/50 rounded-lg transition-colors"
              title="Profile"
            >
              <svg className={navIconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="8" r="4" />
                <path d="M6 20c0-3.313 2.686-6 6-6s6 2.687 6 6" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
            </motion.button>

            {/* Help */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate("/help")}
              className="group p-2.5 hover:bg-gray-100 dark:hover:bg-gray-800/50 rounded-lg transition-colors"
              title="Help"
            >
              <svg className={navIconClass} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" />
                <path d="M12 16v-4m0-4h.01" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
            </motion.button>

            {/* Admin Badge */}
            {isAdmin && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => navigate("/admin")}
                className="ml-2 px-3 py-1.5 text-xs font-semibold text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-lg hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors"
              >
                Admin
              </motion.button>
            )}

            {/* Logout */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                localStorage.removeItem("authToken")
                localStorage.removeItem("user")
                resetOnboarding()
                navigate("/login")
              }}
              className="ml-2 px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-sm"
            >
              Logout
            </motion.button>
          </div>
        </div>
      </motion.nav>
      <WelcomeBanner />
    </>
  )
}
