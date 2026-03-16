import { useState, useEffect } from "react"
import { motion } from "framer-motion"

interface SystemSettings {
  sessionTimeout: number
  maxUploadSize: number
  analysisTimeout: number
  notificationsEnabled: boolean
  emailAlertsEnabled: boolean
  maintenanceMode: boolean
}

export default function AdminSettings() {
  const [settings, setSettings] = useState<SystemSettings>({
    sessionTimeout: 15,
    maxUploadSize: 100,
    analysisTimeout: 300,
    notificationsEnabled: true,
    emailAlertsEnabled: true,
    maintenanceMode: false,
  })

  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle")

  // Load settings from backend on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const response = await fetch("http://localhost:9999/api/settings")
        if (response.ok) {
          const data = await response.json()
          if (data.data) {
            setSettings(data.data)
          }
        }
      } catch (error) {
        console.error("Failed to load settings:", error)
        // Keep default settings if load fails
      }
    }
    loadSettings()
  }, [])

  const handleInputChange = (key: keyof SystemSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    setSaveStatus("saving")
    try {
      const token = localStorage.getItem("authToken")
      if (!token) {
        console.error("No auth token found")
        setSaveStatus("idle")
        return
      }

      const response = await fetch("http://localhost:9999/api/settings/update", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify(settings),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("Failed to save settings:", errorData)
        setSaveStatus("idle")
        return
      }

      setSaveStatus("saved")
      setTimeout(() => setSaveStatus("idle"), 3000)
    } catch (error) {
      console.error("Error saving settings:", error)
      setSaveStatus("idle")
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

      <div className="relative z-10 max-w-4xl mx-auto">
        {/* Header Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mb-12"
          >
            <h2 className="text-5xl font-black bg-gradient-to-r from-white via-purple-200 to-cyan-200 bg-clip-text text-transparent mb-2">Configuration</h2>
            <p className="text-gray-400">Manage system parameters and application behavior</p>
          </motion.div>

          {/* Session Configuration */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="backdrop-blur-xl bg-gradient-to-br from-blue-900/40 to-cyan-900/20 border border-cyan-500/30 rounded-2xl p-8 mb-8 hover:border-cyan-500/60 transition-all"
          >
            <div className="flex items-center gap-4 mb-8">
              <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }} className="text-5xl">⏱️</motion.div>
              <div>
                <h3 className="text-2xl font-black text-white">Session Configuration</h3>
                <p className="text-gray-400 text-sm mt-1">Control user session behavior</p>
              </div>
            </div>

            <div className="space-y-8">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <label className="text-sm font-semibold text-white block mb-1">Session Timeout</label>
                    <p className="text-gray-400 text-xs">Time before automatic logout in minutes</p>
                  </div>
                  <motion.span
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="text-3xl font-black bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent"
                  >
                    {settings.sessionTimeout}m
                  </motion.span>
                </div>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="5"
                    max="120"
                    value={settings.sessionTimeout}
                    onChange={(e) => handleInputChange("sessionTimeout", parseInt(e.target.value))}
                    className="flex-1 h-3 bg-gradient-to-r from-cyan-600/30 to-blue-600/30 rounded-lg appearance-none cursor-pointer accent-cyan-500"
                    title="Session timeout in minutes"
                  />
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500 mt-3">
                  <span>5m</span>
                  <div className="flex-1 h-px bg-gray-600/30"></div>
                  <span>120m</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Upload Configuration */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="backdrop-blur-xl bg-gradient-to-br from-purple-900/40 to-pink-900/20 border border-purple-500/30 rounded-2xl p-8 mb-8 hover:border-purple-500/60 transition-all"
          >
            <div className="flex items-center gap-4 mb-8">
              <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity, delay: 0.1 }} className="text-5xl">📤</motion.div>
              <div>
                <h3 className="text-2xl font-black text-white">Upload Configuration</h3>
                <p className="text-gray-400 text-sm mt-1">Control file upload and analysis timing</p>
              </div>
            </div>

            <div className="space-y-8">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <label className="text-sm font-semibold text-white block mb-1">Maximum Upload Size</label>
                    <p className="text-gray-400 text-xs">Largest file size accepted in megabytes</p>
                  </div>
                  <motion.span
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.1 }}
                    className="text-3xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"
                  >
                    {settings.maxUploadSize}MB
                  </motion.span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="500"
                  value={settings.maxUploadSize}
                  onChange={(e) => handleInputChange("maxUploadSize", parseInt(e.target.value))}
                  className="w-full h-3 bg-gradient-to-r from-purple-600/30 to-pink-600/30 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  title="Maximum upload size in MB"
                />
                <div className="flex items-center gap-2 text-xs text-gray-500 mt-3">
                  <span>10MB</span>
                  <div className="flex-1 h-px bg-gray-600/30"></div>
                  <span>500MB</span>
                </div>
              </div>

              <div className="h-px bg-gradient-to-r from-purple-500/0 via-purple-500/20 to-purple-500/0"></div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <label className="text-sm font-semibold text-white block mb-1">Analysis Timeout</label>
                    <p className="text-gray-400 text-xs">Maximum time for analysis processing in seconds</p>
                  </div>
                  <motion.span
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: 0.2 }}
                    className="text-3xl font-black bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent"
                  >
                    {settings.analysisTimeout}s
                  </motion.span>
                </div>
                <input
                  type="range"
                  min="60"
                  max="900"
                  value={settings.analysisTimeout}
                  onChange={(e) => handleInputChange("analysisTimeout", parseInt(e.target.value))}
                  className="w-full h-3 bg-gradient-to-r from-purple-600/30 to-pink-600/30 rounded-lg appearance-none cursor-pointer accent-purple-500"
                  title="Analysis timeout in seconds"
                />
                <div className="flex items-center gap-2 text-xs text-gray-500 mt-3">
                  <span>60s</span>
                  <div className="flex-1 h-px bg-gray-600/30"></div>
                  <span>900s</span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Notification Settings */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="backdrop-blur-xl bg-gradient-to-br from-emerald-900/40 to-teal-900/20 border border-emerald-500/30 rounded-2xl p-8 mb-8 hover:border-emerald-500/60 transition-all"
          >
            <div className="flex items-center gap-4 mb-8">
              <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity, delay: 0.2 }} className="text-5xl">🔔</motion.div>
              <div>
                <h3 className="text-2xl font-black text-white">Notification Settings</h3>
                <p className="text-gray-400 text-sm mt-1">Configure system alerts and messages</p>
              </div>
            </div>

            <div className="space-y-4">
              {[
                { key: "notificationsEnabled", label: "Enable In-App Notifications", desc: "Show real-time alerts in the application" },
                { key: "emailAlertsEnabled", label: "Enable Email Alerts", desc: "Send critical alerts via email" }
              ].map((item, index) => (
                <motion.label
                  key={item.key}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.27 + index * 0.05 }}
                  className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-emerald-500/20 hover:bg-white/10 hover:border-emerald-500/40 transition-all cursor-pointer group"
                >
                  <motion.div
                    whileHover={{ scale: 1.1 }}
                    className="relative"
                  >
                    <input
                      type="checkbox"
                      checked={settings[item.key as keyof SystemSettings] as boolean}
                      onChange={(e) => handleInputChange(item.key as keyof SystemSettings, e.target.checked)}
                      className="w-6 h-6 rounded accent-emerald-500 cursor-pointer"
                      title={item.label}
                    />
                  </motion.div>
                  <div className="flex-1">
                    <p className="text-white font-semibold group-hover:text-emerald-300 transition-colors">{item.label}</p>
                    <p className="text-xs text-gray-500">{item.desc}</p>
                  </div>
                  <motion.span
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity, delay: index * 0.1 }}
                    className="text-2xl"
                  >
                    {settings[item.key as keyof SystemSettings] ? "✓" : "○"}
                  </motion.span>
                </motion.label>
              ))}
            </div>
          </motion.div>

          {/* System Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className={`backdrop-blur-xl bg-gradient-to-br rounded-2xl p-8 mb-8 border transition-all ${
              settings.maintenanceMode
                ? "from-red-900/40 to-pink-900/20 border-red-500/30 hover:border-red-500/60"
                : "from-amber-900/40 to-orange-900/20 border-amber-500/30 hover:border-amber-500/60"
            }`}
          >
            <div className="flex items-center gap-4 mb-8">
              <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity, delay: 0.3 }} className="text-5xl">⚙️</motion.div>
              <div>
                <h3 className="text-2xl font-black text-white">System Status</h3>
                <p className="text-gray-400 text-sm mt-1">Critical system operations</p>
              </div>
            </div>

            <motion.label
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.35 }}
              className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-red-500/20 hover:bg-white/10 hover:border-red-500/40 transition-all cursor-pointer group"
            >
              <motion.div whileHover={{ scale: 1.1 }} className="relative">
                <input
                  type="checkbox"
                  checked={settings.maintenanceMode}
                  onChange={(e) => handleInputChange("maintenanceMode", e.target.checked)}
                  className="w-6 h-6 rounded accent-red-500 cursor-pointer"
                  title="Maintenance mode toggle"
                />
              </motion.div>
              <div className="flex-1">
                <p className="text-white font-semibold group-hover:text-red-300 transition-colors">Maintenance Mode</p>
                <p className="text-xs text-gray-500">Only administrators can access the system</p>
              </div>
              <motion.div
                animate={{ scale: [1, 1.2, 1], rotate: settings.maintenanceMode ? 360 : 0 }}
                transition={{ duration: 2, repeat: Infinity, delay: 0.3 }}
                className="text-2xl"
              >
                {settings.maintenanceMode ? "🔴" : "🟢"}
              </motion.div>
            </motion.label>
          </motion.div>

          {/* Save Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="flex justify-end gap-4"
          >
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSave}
              disabled={saveStatus !== "idle"}
              className={`px-8 py-3 rounded-xl font-bold transition-all ${
                saveStatus === "saved"
                  ? "bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-lg shadow-green-600/50"
                  : saveStatus === "saving"
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white opacity-75"
                    : "bg-gradient-to-r from-cyan-600 to-blue-600 text-white shadow-lg hover:shadow-xl transition-all"
              }`}
            >
              <motion.span
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="inline-block mr-2"
              >
                {saveStatus === "saving" ? "⏳" : saveStatus === "saved" ? "✓" : "💾"}
              </motion.span>
              {saveStatus === "saving" ? "Saving..." : saveStatus === "saved" ? "Saved!" : "Save Settings"}
            </motion.button>
          </motion.div>
        </div>
      </div>
  )
}
