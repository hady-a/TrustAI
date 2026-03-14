import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useNavigate, useLocation } from "react-router-dom"
import { GoogleLogin } from "@react-oauth/google"
import { authAPI } from "../lib/api"
import api from "../lib/api"
import { AxiosError } from "axios"
import { Eye, EyeOff } from "lucide-react"

export default function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  
  // Auto-fill email from signup if available
  const signupEmail = sessionStorage.getItem('signupEmail') || ''
  const [formData, setFormData] = useState({ email: signupEmail, password: "" })
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [emailFocused, setEmailFocused] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)
  const [validationFeedback, setValidationFeedback] = useState<Record<string, string>>({})
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotEmail, setForgotEmail] = useState("")
  const [resetStep, setResetStep] = useState<'email' | 'password'>('email') // Step 1: email, Step 2: password
  const [resetPassword, setResetPassword] = useState("")
  const [resetConfirmPassword, setResetConfirmPassword] = useState("")
  const [isResettingPassword, setIsResettingPassword] = useState(false)
  const successMessage = (location.state as any)?.message
  const [logoClicks, setLogoClicks] = useState(0)
  const [showEasterEgg, setShowEasterEgg] = useState(false)
  const [floatingParticles, setFloatingParticles] = useState<Array<{ id: number; x: number; y: number; emoji: string }>>([])

  // Clear signup email from session on mount and check for remembered login
  useEffect(() => {
    if (signupEmail) {
      console.log('[Login] Auto-filled email from signup:', signupEmail)
    }

    // Check if user has "Remember Me" enabled and valid token exists
    const rememberMeFlag = localStorage.getItem('rememberMe') === 'true'
    const authToken = localStorage.getItem('authToken')
    const user = localStorage.getItem('user')

    if (rememberMeFlag && authToken && user) {
      console.log('[Login] 🔄 Found remembered session, auto-logging in...')
      setRememberMe(true)
      
      // Validate token is still fresh by trying to use it
      const validateToken = async () => {
        try {
          // Make a simple API call to verify token is valid
          const response = await api.get('/users/profile')
          if (response.data?.success) {
            console.log('[Login] ✅ Token is valid, navigating to dashboard')
            navigate('/modes', { replace: true })
            return
          }
        } catch (error) {
          console.log('[Login] ⚠️ Remembered token is invalid, clearing session')
          localStorage.removeItem('authToken')
          localStorage.removeItem('user')
          localStorage.removeItem('rememberMe')
        }
      }
      
      validateToken()
    }
  }, [])

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }

  const validateEmail = (email: string) => {
    if (!email) {
      setValidationFeedback((prev) => ({ ...prev, email: "Email is required" }))
      return false
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setValidationFeedback((prev) => ({ ...prev, email: "Invalid email format" }))
      return false
    }
    setValidationFeedback((prev) => {
      const { email: _, ...rest } = prev
      return rest
    })
    return true
  }

  const validatePassword = (password: string) => {
    if (!password) {
      setValidationFeedback((prev) => ({ ...prev, password: "Password is required" }))
      return false
    }
    if (password.length < 6) {
      setValidationFeedback((prev) => ({ ...prev, password: "Password must be at least 6 characters" }))
      return false
    }
    setValidationFeedback((prev) => {
      const { password: _, ...rest } = prev
      return rest
    })
    return true
  }

  const validateForm = () => {
    const emailValid = validateEmail(formData.email)
    const passwordValid = validatePassword(formData.password)
    return emailValid && passwordValid
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isLoading) {
      handleSubmit(e as any)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return
    setIsLoading(true)
    
    try {
      const loginData = {
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      }
      
      console.log('[Login] 🔐 Logging in:', loginData.email)
      
      // Call API
      const response = await authAPI.login(loginData)
      console.log('[Login] ✅ Login API succeeded, status:', response.status)
      
      // Validate response structure
      if (!response.data?.success) {
        throw new Error('Server returned success: false')
      }
      
      if (!response.data?.data?.token) {
        throw new Error('No token in response')
      }
      
      const { token, user } = response.data.data
      
      // Store auth
      console.log('[Login] 💾 Storing auth token and user')
      localStorage.setItem("authToken", token)
      localStorage.setItem("user", JSON.stringify(user))
      if (rememberMe) {
        localStorage.setItem("rememberMe", "true")
      }

      // Send welcome email in background (non-blocking)
      fetch('http://localhost:9999/api/auth/send-welcome-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          email: user.email,
          name: user.name,
        }),
      }).catch(() => {
        console.log('[Login] 📧 Welcome email not sent (non-critical)')
      })

      // Clear loading state and show success
      setIsLoading(false)
      showToast("success", "✅ Login successful!")
      console.log('[Login] 🚀 Navigating to /modes')
      
      // Navigate now
      navigate("/modes", { replace: true })
      
    } catch (error) {
      console.error('[Login] ❌ Login error:', error)
      const axiosError = error as AxiosError<any>
      
      // Log full response to debug
      console.log('[Login] Full error response:', {
        status: axiosError.response?.status,
        data: axiosError.response?.data,
        errorCode: axiosError.response?.data?.errorCode,
        message: axiosError.response?.data?.message,
      })
      
      const errorCode = axiosError.response?.data?.errorCode
      const message = axiosError.response?.data?.message || (error instanceof Error ? error.message : "Login failed")
      
      console.log('[Login] Extracted errorCode:', errorCode)
      console.log('[Login] Extracted message:', message)
      
      // Handle specific error codes
      if (errorCode === 'INVALID_PASSWORD') {
        // Password is wrong - keep email, clear password, show specific error
        console.log('[Login] 🔐 Invalid password - keeping email, clearing password')
        setFormData((prev) => ({ ...prev, password: "" }))
        setValidationFeedback((prev) => ({ ...prev, password: "❌ Incorrect password. Please try again." }))
        showToast("error", "❌ Incorrect password. Please try again or use forgot password.")
      } else if (errorCode === 'USER_NOT_FOUND') {
        // Email doesn't exist - clear both, show specific error
        console.log('[Login] 📧 User not found - clearing form')
        setFormData({ email: "", password: "" })
        setValidationFeedback({
          email: "❌ No account found with this email. Please check or sign up.",
        })
        showToast("error", "❌ No account found with this email. Please sign up or check your email.")
      } else {
        // Generic error
        console.log('[Login] Generic error:', errorCode, message)
        showToast("error", message)
      }
      
      setIsLoading(false)
    }
  }

  const handleForgotPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (resetStep === 'email') {
      // Step 1: Verify email exists
      if (!forgotEmail) {
        showToast("error", "Please enter your email")
        return
      }
      
      try {
        const response = await fetch('http://localhost:9999/api/auth/check-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: forgotEmail }),
        })
        
        const data = await response.json()
        
        if (!response.ok || !data.exists) {
          showToast("error", "No account found with this email")
          return
        }
        
        // Email exists, move to password reset step
        setResetStep('password')
        showToast("success", "✓ Email found! Now set your new password")
      } catch (error) {
        showToast("error", "Failed to verify email. Please try again.")
      }
    } else {
      // Step 2: Reset password
      if (!resetPassword || !resetConfirmPassword) {
        showToast("error", "Please fill in all fields")
        return
      }
      
      if (resetPassword.length < 6) {
        showToast("error", "Password must be at least 6 characters")
        return
      }
      
      if (resetPassword !== resetConfirmPassword) {
        showToast("error", "Passwords do not match")
        return
      }
      
      setIsResettingPassword(true)
      try {
        const response = await fetch('http://localhost:9999/api/auth/reset-password', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: forgotEmail,
            newPassword: resetPassword,
          }),
        })
        
        const data = await response.json()
        
        if (!response.ok) {
          showToast("error", data.message || "Failed to reset password")
          return
        }
        
        showToast("success", "✓ Password reset successfully! Signing you in...")
        setForgotEmail("")
        setResetPassword("")
        setResetConfirmPassword("")
        setTimeout(() => {
          setShowForgotPassword(false)
          setResetStep('email')
        }, 2000)
      } catch (error) {
        showToast("error", "Failed to reset password. Please try again.")
      } finally {
        setIsResettingPassword(false)
      }
    }
  }

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      setIsLoading(true)
      console.log('[Google] 🔐 Google credential received')
      
      if (!credentialResponse?.credential) {
        throw new Error('No credential in response')
      }
      
      console.log('[Google] 📤 Sending credential to backend')
      const response = await authAPI.googleLogin({
        credential: credentialResponse.credential,
      })
      
      console.log('[Google] ✅ Backend verified token, status:', response.status)
      
      // Validate response
      if (!response.data?.success) {
        throw new Error('Server returned success: false')
      }
      
      if (!response.data?.data?.token) {
        throw new Error('No token in response')
      }
      
      const { token, user } = response.data.data
      
      // Store auth
      console.log('[Google] 💾 Storing auth token and user')
      localStorage.setItem("authToken", token)
      localStorage.setItem("user", JSON.stringify(user))
      
      // Clear loading and show success
      setIsLoading(false)
      showToast("success", "✅ Google login successful!")
      console.log('[Google] 🚀 Navigating to /modes')
      
      // Navigate now
      navigate("/modes", { replace: true })
      
    } catch (error) {
      console.error('[Google] ❌ Error:', error)
      const axiosError = error as AxiosError<{ message: string }>
      
      // Detailed error logging for debugging
      if (axiosError.response) {
        console.error('[Google] ❌ Backend Response Error:')
        console.error('  Status:', axiosError.response.status)
        console.error('  Message:', axiosError.response.data?.message)
        console.error('  Full Response:', axiosError.response.data)
      } else if (axiosError.request) {
        console.error('[Google] ❌ Network Error - No response from backend')
        console.error('  Request:', axiosError.request)
      } else {
        console.error('[Google] ❌ Error Message:', axiosError.message)
      }
      
      const message = axiosError.response?.data?.message || (error instanceof Error ? error.message : 'Google login failed. Check browser console and backend logs.')
      showToast("error", message)
      setIsLoading(false)
    }
  }

  const handleGoogleError = () => {
    console.error('[Google] ❌ Google sign-in failed')
    showToast("error", "Google login failed. Make sure your Google OAuth credentials include this origin: http://localhost:5173")
  }

  // Easter egg handlers
  const handleLogoClick = () => {
    const newCount = logoClicks + 1
    setLogoClicks(newCount)
    
    if (newCount === 5) {
      setShowEasterEgg(true)
      // Generate floating particles
      const particles = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        x: Math.random() * 100 - 50,
        y: Math.random() * 100 - 50,
        emoji: ["🎉", "✨", "🚀", "💫", "🌟", "⭐", "🎊", "🎈"][Math.floor(Math.random() * 8)],
      }))
      setFloatingParticles(particles)
      
      // Reset after 3 seconds
      const timer = setTimeout(() => {
        setShowEasterEgg(false)
        setLogoClicks(0)
        setFloatingParticles([])
      }, 3000)
      
      return () => clearTimeout(timer)
    }
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center signup-bg">
      {/* Premium Animated Background with Advanced Blobs */}
      <div className="fixed inset-0 overflow-hidden">
        {/* Enhanced animated gradient orbs */}
        <motion.div
          animate={{
            x: [0, 150, -100, 50, 0],
            y: [0, -80, 120, -50, 0],
            scale: [1, 1.3, 0.95, 1.1, 1],
          }}
          transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 left-1/3 w-[500px] h-[500px] bg-gradient-to-br from-purple-600/60 via-indigo-600/40 to-transparent rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -120, 100, -60, 0],
            y: [0, 80, -120, 60, 0],
            scale: [1, 0.95, 1.2, 1, 1],
          }}
          transition={{ duration: 28, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute -bottom-40 -right-40 w-[600px] h-[600px] bg-gradient-to-tl from-pink-600/50 via-purple-600/30 to-transparent rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, 80, -80, 0],
            y: [0, -120, 100, 0],
            scale: [1, 1.15, 0.9, 1],
          }}
          transition={{ duration: 32, repeat: Infinity, ease: "easeInOut", delay: 4 }}
          className="absolute top-1/2 -left-32 w-96 h-96 bg-gradient-to-r from-cyan-600/50 via-blue-600/30 to-transparent rounded-full blur-3xl"
        />
        <motion.div
          animate={{
            x: [0, -60, 120, -40, 0],
            y: [0, 100, -80, 50, 0],
            scale: [1, 1.1, 0.95, 1.05, 1],
          }}
          transition={{ duration: 30, repeat: Infinity, ease: "easeInOut", delay: 6 }}
          className="absolute top-1/3 right-1/4 w-80 h-80 bg-gradient-to-br from-blue-500/40 to-indigo-600/25 rounded-full blur-3xl"
        />

        {/* Vignette overlay for premium feel */}
        <div className="absolute inset-0 signup-vignette" />
      </div>

      {/* Floating particles effect */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white/20 rounded-full"
            animate={{
              y: [Math.random() * 100 - 50, Math.random() * -500],
              x: [Math.random() * 100 - 50, Math.random() * 100 - 50],
              opacity: [0, 1, 0],
            }}
            transition={{
              duration: Math.random() * 10 + 10,
              repeat: Infinity,
              delay: Math.random() * 5,
            }}
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          />
        ))}
      </div>

      {/* Toast Notifications */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: 50 }}
            animate={{ opacity: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, y: -20, x: 50 }}
            className={`fixed top-8 right-8 z-50 px-6 py-4 rounded-2xl font-semibold flex items-center gap-3 backdrop-blur-xl border ${
              toast.type === "success"
                ? "bg-green-500/20 border-green-500/60 text-green-300 shadow-lg shadow-green-500/20"
                : "bg-red-500/20 border-red-500/60 text-red-300 shadow-lg shadow-red-500/20"
            }`}
          >
            <span className="text-xl">{toast.type === "success" ? "✓" : "✕"}</span>
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Easter Egg Celebration */}
      <AnimatePresence>
        {showEasterEgg && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 pointer-events-none flex items-center justify-center z-40"
          >
            {/* Celebration text */}
            <motion.div
              initial={{ scale: 0, y: -50 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0, y: 50 }}
              transition={{ duration: 0.5, type: "spring", stiffness: 100 }}
              className="text-center"
            >
              <motion.h2
                animate={{ y: [0, -20, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-5xl font-black mb-4 bg-gradient-to-r from-purple-300 via-blue-300 to-cyan-300 bg-clip-text text-transparent"
              >
                🎉 AWESOME! 🎉
              </motion.h2>
              <motion.p
                animate={{ opacity: [1, 0.7, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="text-xl text-white font-bold"
              >
                You found the secret!
              </motion.p>
            </motion.div>

            {/* Floating particles */}
            {floatingParticles.map((particle) => (
              <motion.span
                key={particle.id}
                initial={{
                  x: particle.x,
                  y: particle.y,
                  opacity: 1,
                  scale: 1,
                }}
                animate={{
                  x: particle.x * 3,
                  y: particle.y * 3,
                  opacity: 0,
                  scale: 0,
                }}
                transition={{
                  duration: 2.5,
                  ease: "easeOut",
                }}
                className="absolute text-3xl"
                style={{
                  left: "50%",
                  top: "50%",
                  marginLeft: -15,
                  marginTop: -15,
                }}
              >
                {particle.emoji}
              </motion.span>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Login Card */}
      <div className="relative z-10 w-full max-w-md mx-auto px-4">
        <AnimatePresence mode="wait">
          {!showForgotPassword ? (
            <motion.div
              key="login"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.4 }}
              className="relative"
            >
              {/* Enhanced glow effect behind card with pulsing */}
              <motion.div
                animate={{ opacity: [0.5, 0.8, 0.5] }}
                transition={{ duration: 3, repeat: Infinity }}
                className="absolute inset-0 bg-gradient-to-r from-purple-600/40 via-indigo-500/30 to-blue-600/40 rounded-3xl blur-3xl -z-10"
              />
              <motion.div
                animate={{ opacity: [0.3, 0.6, 0.3] }}
                transition={{ duration: 4, repeat: Infinity, delay: 1 }}
                className="absolute inset-0 bg-gradient-to-l from-pink-600/25 via-purple-600/20 to-indigo-600/25 rounded-3xl blur-2xl -z-10"
              />

              {/* Premium Card */}
              <div className="backdrop-blur-3xl bg-gradient-to-br from-white/10 via-white/5 to-white/5 border border-white/20 rounded-3xl p-8 shadow-2xl relative signup-card-glow">
                {/* Header */}
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-center mb-8"
                >
                  {/* Logo */}
                  <motion.div
                    className="flex items-center justify-center gap-2 mb-6"
                    whileHover={{ scale: 1.05 }}
                    onClick={handleLogoClick}
                    style={{ cursor: 'pointer' }}
                  >
                    <motion.div
                      animate={{
                        scale: logoClicks > 0 && logoClicks < 5 ? [1, 1.1, 1] : 1,
                      }}
                      transition={{ duration: 0.3 }}
                      className="relative w-12 h-12 bg-gradient-to-br from-purple-500 via-blue-500 to-cyan-500 rounded-xl flex items-center justify-center shadow-lg shadow-purple-500/50"
                    >
                      <span className="text-white font-black text-xl">T</span>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                        className="absolute inset-0 rounded-xl border border-white/30"
                      />
                    </motion.div>
                  </motion.div>

                  <h1 className="text-3xl font-black bg-gradient-to-r from-purple-300 via-blue-300 to-cyan-300 bg-clip-text text-transparent mb-2">
                    Welcome to TrustAI
                  </h1>
                  <p className="text-gray-400 text-sm">Sign in to continue</p>
                </motion.div>

                {successMessage && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-green-500/20 border border-green-500/50 rounded-xl p-3 mb-6 text-green-300 text-sm font-semibold flex items-center gap-2"
                  >
                    <span>✓</span> {successMessage}
                  </motion.div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4 mb-6">
                  {/* Email Input */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                  >
                    <label className="flex text-xs font-bold text-gray-300 mb-2 items-center gap-2 uppercase tracking-wider">
                      <span>📧</span> Email
                    </label>
                    <motion.div
                      animate={{
                        boxShadow: emailFocused 
                          ? "0 0 40px rgba(147, 51, 234, 0.6), inset 0 0 20px rgba(147, 51, 234, 0.2)"
                          : "0 0 0px rgba(147, 51, 234, 0)",
                      }}
                      transition={{ duration: 0.3 }}
                      className="relative"
                    >
                      <motion.input
                        type="email"
                        value={formData.email}
                        onChange={(e) => {
                          setFormData({ ...formData, email: e.target.value })
                          validateEmail(e.target.value)
                        }}
                        onFocus={() => setEmailFocused(true)}
                        onBlur={() => setEmailFocused(false)}
                        onKeyPress={handleKeyPress}
                        placeholder="name@example.com"
                        whileFocus={{ scale: 1.02 }}
                        className="w-full bg-white/5 backdrop-blur border-2 border-white/20 hover:border-purple-500/50 focus:border-purple-500/80 rounded-2xl px-5 py-3 text-white placeholder-gray-500 focus:outline-none transition-all text-sm font-medium"
                      />
                    </motion.div>
                    {validationFeedback.email && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-400 text-xs mt-1"
                      >
                        {validationFeedback.email}
                      </motion.p>
                    )}
                  </motion.div>

                  {/* Password Input */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <label className="flex text-xs font-bold text-gray-300 mb-2 items-center gap-2 uppercase tracking-wider">
                      <span>🔒</span> Password
                    </label>
                    <motion.div
                      animate={{
                        boxShadow: passwordFocused 
                          ? "0 0 40px rgba(59, 130, 246, 0.6), inset 0 0 20px rgba(59, 130, 246, 0.2)"
                          : "0 0 0px rgba(59, 130, 246, 0)",
                      }}
                      transition={{ duration: 0.3 }}
                      className="relative"
                    >
                      <motion.input
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => {
                          setFormData({ ...formData, password: e.target.value })
                          validatePassword(e.target.value)
                        }}
                        onFocus={() => setPasswordFocused(true)}
                        onBlur={() => setPasswordFocused(false)}
                        onKeyPress={handleKeyPress}
                        placeholder="••••••••"
                        whileFocus={{ scale: 1.02 }}
                        className="w-full bg-white/5 backdrop-blur border-2 border-white/20 hover:border-blue-500/50 focus:border-blue-500/80 rounded-2xl px-5 py-3 pr-12 text-white placeholder-gray-500 focus:outline-none transition-all text-sm font-medium"
                      />
                      <motion.button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                      >
                        {showPassword ? <Eye size={20} /> : <EyeOff size={20} />}
                      </motion.button>
                    </motion.div>
                    {validationFeedback.password && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-400 text-xs mt-1"
                      >
                        {validationFeedback.password}
                      </motion.p>
                    )}
                  </motion.div>

                  {/* Remember & Forgot */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    className="flex items-center justify-between text-xs"
                  >
                    <label className="flex items-center gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={rememberMe}
                        onChange={(e) => setRememberMe(e.target.checked)}
                        className="w-4 h-4 bg-white/10 border border-white/20 rounded cursor-pointer accent-purple-500"
                      />
                      <span className="text-gray-400 group-hover:text-gray-300">Remember me</span>
                    </label>
                    <motion.button
                      type="button"
                      onClick={() => setShowForgotPassword(true)}
                      whileHover={{ color: "#a78bfa" }}
                      className="text-gray-500 hover:text-purple-400 font-semibold transition-colors"
                    >
                      Forgot?
                    </motion.button>
                  </motion.div>

                  {/* Sign In Button - Premium */}
                  <motion.button
                    type="submit"
                    disabled={isLoading}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    whileHover={{ scale: isLoading ? 1 : 1.03 }}
                    whileTap={{ scale: isLoading ? 1 : 0.95 }}
                    className="w-full mt-6 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:via-indigo-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 shadow-lg overflow-hidden relative group"
                    style={{
                      boxShadow: "0 10px 30px rgba(147, 51, 234, 0.4), inset 0 1px 1px rgba(255, 255, 255, 0.2)"
                    }}
                  >
                    <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100" />
                    {isLoading ? (
                      <>
                        <motion.span
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                        />
                        <span>Signing in...</span>
                      </>
                    ) : (
                      <>
                        <motion.span initial={{ x: -5 }} whileHover={{ x: 5 }}>→</motion.span>
                        <span>Sign In</span>
                      </>
                    )}
                  </motion.button>
                </form>

                {/* Divider */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.35 }}
                  className="relative my-6"
                >
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="px-2 bg-black text-gray-400 text-xs">or</span>
                  </div>
                </motion.div>

                {/* Google Login */}
                {import.meta.env.VITE_GOOGLE_CLIENT_ID && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="mb-6"
                  >
                    <div className="flex justify-center">
                      <GoogleLogin
                        onSuccess={handleGoogleSuccess}
                        onError={handleGoogleError}
                        theme="outline"
                      />
                    </div>
                  </motion.div>
                )}

                {/* Sign Up */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.45 }}
                  className="text-center text-gray-400 text-sm border-t border-white/10 pt-6"
                >
                  Don't have an account?{" "}
                  <motion.button
                    type="button"
                    onClick={() => navigate("/signup")}
                    whileHover={{ color: "#a78bfa" }}
                    className="text-purple-400 font-bold hover:text-purple-300 transition-colors"
                  >
                    Sign up
                  </motion.button>
                </motion.div>
              </div>
            </motion.div>
          ) : (
            /* Forgot Password Form */
            <motion.div
              key="forgot"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.4 }}
              className="relative"
            >
              {/* Glow effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600/20 via-blue-600/20 to-pink-600/20 rounded-3xl blur-2xl -z-10" />

              {/* Card */}
              <div className="backdrop-blur-2xl bg-white/5 border border-white/10 rounded-3xl p-8 shadow-2xl">
                <motion.div
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center mb-8"
                >
                  <h2 className="text-3xl font-black bg-gradient-to-r from-purple-300 via-blue-300 to-cyan-300 bg-clip-text text-transparent mb-2">
                    {resetStep === 'email' ? 'Reset Password' : 'Create New Password'}
                  </h2>
                  <p className="text-gray-400 text-sm">
                    {resetStep === 'email' 
                      ? 'Enter your email to confirm your account' 
                      : 'Enter a new secure password'}
                  </p>
                </motion.div>

                <form onSubmit={handleForgotPasswordSubmit} className="space-y-4 mb-6">
                  {resetStep === 'email' ? (
                    // Step 1: Email verification
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                      <label className="flex text-xs font-bold text-gray-300 mb-2 uppercase tracking-wider">
                        📧 Email
                      </label>
                      <motion.input
                        type="email"
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="name@example.com"
                        whileFocus={{ scale: 1.02 }}
                        className="w-full bg-white/5 backdrop-blur border border-white/20 hover:border-white/30 focus:border-purple-500/80 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none transition-all text-sm"
                      />
                    </motion.div>
                  ) : (
                    // Step 2: Password reset
                    <>
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <label className="flex text-xs font-bold text-gray-300 mb-2 uppercase tracking-wider">
                          🔐 New Password
                        </label>
                        <motion.input
                          type="password"
                          value={resetPassword}
                          onChange={(e) => setResetPassword(e.target.value)}
                          placeholder="Enter new password"
                          whileFocus={{ scale: 1.02 }}
                          className="w-full bg-white/5 backdrop-blur border border-white/20 hover:border-white/30 focus:border-purple-500/80 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none transition-all text-sm"
                        />
                      </motion.div>
                      
                      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                        <label className="flex text-xs font-bold text-gray-300 mb-2 uppercase tracking-wider">
                          ✓ Confirm Password
                        </label>
                        <motion.input
                          type="password"
                          value={resetConfirmPassword}
                          onChange={(e) => setResetConfirmPassword(e.target.value)}
                          placeholder="Confirm new password"
                          whileFocus={{ scale: 1.02 }}
                          className="w-full bg-white/5 backdrop-blur border border-white/20 hover:border-white/30 focus:border-purple-500/80 rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none transition-all text-sm"
                        />
                      </motion.div>
                    </>
                  )}

                  <motion.button
                    type="submit"
                    disabled={isResettingPassword}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full bg-gradient-to-r from-purple-600 via-blue-600 to-cyan-600 hover:from-purple-500 hover:via-blue-500 hover:to-cyan-500 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all shadow-lg shadow-purple-500/30 hover:shadow-purple-500/60"
                  >
                    {resetStep === 'email' ? 'Verify Email' : isResettingPassword ? 'Resetting...' : 'Reset Password'}
                  </motion.button>
                </form>

                <motion.button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false)
                    setResetStep('email')
                    setForgotEmail("")
                    setResetPassword("")
                    setResetConfirmPassword("")
                  }}
                  whileHover={{ color: "#a78bfa" }}
                  className="w-full text-center text-gray-500 hover:text-purple-400 font-semibold pt-4 border-t border-white/10 transition-colors"
                >
                  ← Back to Sign In
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}
