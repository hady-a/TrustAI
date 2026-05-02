import { motion } from "framer-motion"
import { useEffect, useState } from "react"

export default function WelcomeBanner() {
  const [userName, setUserName] = useState<string>("")

  useEffect(() => {
    const userStr = localStorage.getItem("user")
    if (userStr) {
      const user = JSON.parse(userStr)
      setUserName(user.name)
    }
    console.log('[WelcomeBanner] User name loaded:', userName);
  }, [])

  if (!userName) {
    console.log('[WelcomeBanner] No user name, component hidden');
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 border-b border-indigo-500/30 px-6 py-4 text-center"
    >
      <p className="text-lg font-semibold text-indigo-300">
        👋 Welcome, <span className="text-indigo-100">{userName}</span>!
      </p>
      <p className="text-sm text-gray-400 mt-1">Ready to analyze and investigate</p>
    </motion.div>
  )
}
