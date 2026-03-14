import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { userAPI, authAPI } from '../lib/api'
import { AxiosError } from 'axios'
import { Shield, Activity, Lock, User, Mail, Calendar, Star, ChevronDown, Eye, EyeOff, ArrowLeft } from 'lucide-react'

interface UserStats {
  totalAnalyses: number
  successRate: number
  trustScore: number
  lastActive: string
}

export default function UserProfile() {
  const navigate = useNavigate()
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user')
    return saved ? JSON.parse(saved) : { id: '', name: '', email: '', role: 'USER' }
  })

  const [userStats] = useState<UserStats>({
    totalAnalyses: 142,
    successRate: 94,
    trustScore: 8.7,
    lastActive: new Date().toLocaleString()
  })

  const [isEditing, setIsEditing] = useState(false)
  const [nameInput, setNameInput] = useState(user.name)
  const [showPasswordChange, setShowPasswordChange] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleSaveName = async () => {
    if (!nameInput.trim()) {
      setError('Name cannot be empty')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      await userAPI.update(user.id, { name: nameInput })
      const updatedUser = { ...user, name: nameInput }
      localStorage.setItem('user', JSON.stringify(updatedUser))
      setUser(updatedUser)
      setSuccess('Name updated successfully!')
      setIsEditing(false)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      const axiosError = err as AxiosError<{ message: string }>
      setError(axiosError.response?.data?.message || 'Failed to update name')
    } finally {
      setLoading(false)
    }
  }

  const handleChangePassword = async () => {
    if (!passwordData.newPassword || !passwordData.confirmPassword) {
      setError('New password and confirmation are required')
      return
    }

    if (passwordData.newPassword.length < 6) {
      setError('New password must be at least 6 characters')
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      await authAPI.changePassword({
        currentPassword: passwordData.currentPassword || undefined,
        newPassword: passwordData.newPassword,
      })
      setSuccess('Password changed successfully!')
      setShowPasswordChange(false)
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      const axiosError = err as AxiosError<{ message: string }>
      setError(axiosError.response?.data?.message || 'Failed to change password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen dark:from-[#0B0F19] dark:via-[#1a1f3a] dark:to-[#0B0F19] dark:bg-gradient-to-br bg-gradient-to-br from-slate-50 via-blue-50 to-slate-50">
      {/* Animated background */}
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

      <div className="max-w-6xl mx-auto px-6 py-8 relative z-10">
        {/* Header with navigation */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-between mb-12"
        >
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
              Profile Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-2">Manage and monitor your account</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05, x: -4 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate(-1)}
            className="px-6 py-3 rounded-xl border border-indigo-500/30 dark:bg-indigo-500/10 bg-indigo-50 text-indigo-600 dark:text-indigo-400 font-semibold hover:border-indigo-500/50 transition-all flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </motion.button>
        </motion.div>

        {/* Alert Messages */}
        <div className="space-y-4 mb-8">
          {error && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-red-500/10 border border-red-500/50 rounded-xl p-4 text-red-400 flex items-center gap-3"
            >
              <span className="text-xl">❌</span>
              {error}
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-green-500/10 border border-green-500/50 rounded-xl p-4 text-green-400 flex items-center gap-3"
            >
              <span className="text-xl">✓</span>
              {success}
            </motion.div>
          )}
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Trust Score', value: `${userStats.trustScore}/10`, icon: Star, color: 'from-yellow-500 to-amber-500' },
            { label: 'Analyses', value: userStats.totalAnalyses, icon: Activity, color: 'from-blue-500 to-cyan-500' },
            { label: 'Success Rate', value: `${userStats.successRate}%`, icon: Shield, color: 'from-green-500 to-emerald-500' },
            { label: 'Account Role', value: user.role, icon: User, color: 'from-indigo-500 to-purple-500' },
          ].map((stat, idx) => {
            const IconComponent = stat.icon
            return (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="bg-white/5 dark:bg-white/5 border border-indigo-500/20 dark:border-indigo-500/20 rounded-2xl p-6 backdrop-blur-sm hover:border-indigo-500/40 transition-all"
              >
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3 text-white`}>
                  <IconComponent className="w-6 h-6" />
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
              </motion.div>
            )
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Profile Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Account Information Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white/5 dark:bg-white/5 border border-indigo-500/20 rounded-2xl p-8"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                  <User className="w-6 h-6 text-indigo-500" />
                  Account Information
                </h2>
              </div>

              <div className="space-y-6">
                {/* Name Field */}
                <div className="group">
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Full Name</label>
                  {isEditing ? (
                    <div className="flex gap-3">
                      <input
                        type="text"
                        value={nameInput}
                        onChange={(e) => setNameInput(e.target.value)}
                        placeholder="Enter your full name"
                        className="flex-1 bg-white/10 dark:bg-white/5 border border-indigo-500/30 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none transition-colors"
                      />
                      <motion.button
                        onClick={handleSaveName}
                        disabled={loading}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-all"
                      >
                        {loading ? 'Saving...' : 'Save'}
                      </motion.button>
                      <motion.button
                        onClick={() => {
                          setIsEditing(false)
                          setNameInput(user.name)
                        }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="px-6 py-3 bg-gray-700/50 text-gray-300 rounded-xl font-semibold hover:bg-gray-600/50 transition-all border border-gray-600/50"
                      >
                        Cancel
                      </motion.button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 dark:bg-white/5 border border-gray-500/20">
                      <p className="text-gray-900 dark:text-gray-100 font-medium">{user.name}</p>
                      <motion.button
                        onClick={() => setIsEditing(true)}
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.95 }}
                        className="p-2 text-gray-500 hover:text-indigo-500 transition-colors"
                      >
                        ✏️
                      </motion.button>
                    </div>
                  )}
                </div>

                {/* Email Field */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Email Address</label>
                  <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 dark:bg-white/5 border border-gray-500/20">
                    <Mail className="w-5 h-5 text-indigo-500" />
                    <div>
                      <p className="text-gray-900 dark:text-gray-100 font-medium">{user.email}</p>
                      <p className="text-xs text-gray-500 mt-1">Verified</p>
                    </div>
                  </div>
                </div>

                {/* Role & Join Date */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Account Role</label>
                    <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30">
                      <p className="text-indigo-400 font-semibold flex items-center gap-2">
                        👑 {user.role}
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Member Since</label>
                    <div className="p-4 rounded-xl bg-white/5 dark:bg-white/5 border border-gray-500/20">
                      <p className="text-gray-900 dark:text-gray-100 font-medium flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-indigo-500" />
                        {user.createdAt
                          ? new Date(user.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })
                          : 'Recently'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Security Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white/5 dark:bg-white/5 border border-indigo-500/20 rounded-2xl overflow-hidden"
            >
              <button
                onClick={() => setShowPasswordChange(!showPasswordChange)}
                className="w-full flex items-center justify-between p-8 hover:bg-white/[0.03] dark:hover:bg-white/[0.03] transition-colors"
              >
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                  <Lock className="w-6 h-6 text-indigo-500" />
                  Security Settings
                </h2>
                <motion.div
                  animate={{ rotate: showPasswordChange ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                </motion.div>
              </button>

              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={
                  showPasswordChange
                    ? { opacity: 1, height: 'auto' }
                    : { opacity: 0, height: 0 }
                }
                transition={{ duration: 0.3 }}
                className="overflow-hidden border-t border-indigo-500/20"
              >
                <div className="p-8 space-y-4">
                  {user.password && (
                    <div>
                      <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Current Password</label>
                      <input
                        type="password"
                        placeholder="Enter your current password"
                        value={passwordData.currentPassword}
                        onChange={(e) =>
                          setPasswordData({ ...passwordData, currentPassword: e.target.value })
                        }
                        className="w-full bg-white/10 dark:bg-white/5 border border-indigo-500/30 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none transition-colors"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">New Password</label>
                    <div className="relative">
                      <input
                        type={showPassword ? 'text' : 'password'}
                        placeholder="Enter new password (min. 6 characters)"
                        value={passwordData.newPassword}
                        onChange={(e) =>
                          setPasswordData({ ...passwordData, newPassword: e.target.value })
                        }
                        className="w-full bg-white/10 dark:bg-white/5 border border-indigo-500/30 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none transition-colors pr-12"
                      />
                      <button
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-indigo-400 transition-colors"
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Confirm Password</label>
                    <input
                      type="password"
                      placeholder="Confirm your new password"
                      value={passwordData.confirmPassword}
                      onChange={(e) =>
                        setPasswordData({ ...passwordData, confirmPassword: e.target.value })
                      }
                      className="w-full bg-white/10 dark:bg-white/5 border border-indigo-500/30 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:border-indigo-500 focus:outline-none transition-colors"
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <motion.button
                      onClick={handleChangePassword}
                      disabled={loading}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex-1 px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 disabled:opacity-50 transition-all"
                    >
                      {loading ? 'Updating...' : 'Update Password'}
                    </motion.button>
                    <motion.button
                      onClick={() => {
                        setShowPasswordChange(false)
                        setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' })
                      }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex-1 px-6 py-3 bg-gray-700/50 text-gray-300 rounded-xl font-semibold hover:bg-gray-600/50 transition-all border border-gray-600/50"
                    >
                      Cancel
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>

          {/* Right Column - Quick Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 rounded-2xl p-8 backdrop-blur-sm"
          >
            <h3 className="text-xl font-bold text-white mb-6">Activity Snapshot</h3>
            <div className="space-y-6">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-300">Trust Score</span>
                  <span className="text-2xl font-bold text-yellow-400">{userStats.trustScore}</span>
                </div>
                <div className="h-2 rounded-full bg-white/10">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(userStats.trustScore / 10) * 100}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                    className="h-full rounded-full bg-gradient-to-r from-yellow-400 to-amber-400"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-gray-300">Success Rate</span>
                  <span className="text-2xl font-bold text-green-400">{userStats.successRate}%</span>
                </div>
                <div className="h-2 rounded-full bg-white/10">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${userStats.successRate}%` }}
                    transition={{ duration: 1, delay: 0.6 }}
                    className="h-full rounded-full bg-gradient-to-r from-green-400 to-emerald-400"
                  />
                </div>
              </div>

              <div className="pt-4 border-t border-indigo-500/30">
                <p className="text-xs text-gray-400 mb-2">Last Activity</p>
                <p className="text-sm font-semibold text-gray-200">{userStats.lastActive}</p>
              </div>

              <motion.div
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="mt-6 p-4 rounded-xl bg-white/10 border border-white/20 cursor-pointer hover:bg-white/15 transition-all text-center"
              >
                <p className="text-xs text-gray-400 mb-1">Account Status</p>
                <p className="text-sm font-bold text-green-400">🟢 Active & Secure</p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
