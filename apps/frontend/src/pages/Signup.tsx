import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useNavigate } from "react-router-dom"
import { authAPI } from "../lib/api"
import { useOnboarding } from "../contexts/OnboardingContext"
import { Icon } from "../components/UI/IconRenderer"
import { AxiosError } from "axios"

export default function Signup() {
  const navigate = useNavigate()
  const { initializeOnboardingForNewUser } = useOnboarding()
  const [step, setStep] = useState<1 | 2>(1)
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [passwordFocused, setPasswordFocused] = useState(false)
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false)
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [agreeToTerms, setAgreeToTerms] = useState(false)
  const [validationFeedback, setValidationFeedback] = useState<Record<string, string>>({})
  const [logoClicks, setLogoClicks] = useState(0)
  const [showEasterEgg, setShowEasterEgg] = useState(false)
  const [floatingParticles, setFloatingParticles] = useState<Array<{ id: number; x: number; y: number; emoji: string }>>([])

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }

  // Password strength calculator
  const calculatePasswordStrength = (password: string) => {
    if (!password) return { strength: 0, label: "None", color: "bg-gray-600" }

    let strength = 0
    if (password.length >= 8) strength += 1
    if (password.length >= 12) strength += 1
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength += 1
    if (/\d/.test(password)) strength += 1
    if (/[^a-zA-Z\d]/.test(password)) strength += 1

    const total = (strength / 5) * 100
    let label = "Weak"
    let color = "bg-red-500"

    if (total >= 80) {
      label = "Very Strong"
      color = "bg-green-500"
    } else if (total >= 60) {
      label = "Strong"
      color = "bg-emerald-500"
    } else if (total >= 40) {
      label = "Fair"
      color = "bg-yellow-500"
    } else if (total > 0) {
      label = "Weak"
      color = "bg-red-500"
    }

    return { strength: total, label, color }
  }

  const validateStep1 = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.name.trim()) newErrors.name = "Full name is required"
    if (!formData.email) newErrors.email = "Email is required"
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = "Invalid email"
    
    setErrors(newErrors)
    
    if (Object.keys(newErrors).length === 0) {
      showToast("success", "✓ Information validated successfully")
      return true
    }
    return false
  }

  const validateStep2 = () => {
    const newErrors: Record<string, string> = {}
    if (!formData.password) newErrors.password = "Password is required"
    else if (formData.password.length < 6) newErrors.password = "Minimum 6 characters"
    if (!formData.confirmPassword) newErrors.confirmPassword = "Confirm password"
    else if (formData.password !== formData.confirmPassword) newErrors.confirmPassword = "Passwords don't match"
    if (!agreeToTerms) newErrors.terms = "You must agree to terms and conditions"

    setErrors(newErrors)
    
    if (Object.keys(newErrors).length === 0) {
      showToast("success", "✓ Password set successfully")
      return true
    }
    return false
  }

  const handleNextStep = () => {
    if (validateStep1()) setStep(2)
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !isLoading) {
      if (step === 1) handleNextStep()
      else if (step === 2) handleSubmit(e as any)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateStep2()) return

    setIsLoading(true)
    try {
      // Trim all fields to remove whitespace
      const signupData = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
      }
      
      console.log('[Signup] Submitting user data:', {
        name: signupData.name,
        email: signupData.email,
        password: '***'
      })
      
      const response = await authAPI.signup(signupData)
      
      // Send welcome email in background (non-blocking)
      if (response.data?.data?.token) {
        fetch('http://localhost:9999/api/auth/send-welcome-email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${response.data.data.token}`,
          },
          body: JSON.stringify({
            email: signupData.email,
            name: signupData.name,
          }),
        }).catch(() => {
          console.log('[Signup] 📧 Welcome email not sent (non-critical)')
        })
      }
      
      showToast("success", "✅ Account created! Redirecting to login...")
      
      // Initialize onboarding for new user
      initializeOnboardingForNewUser()
      
      // Store the email for auto-fill on login page
      sessionStorage.setItem('signupEmail', signupData.email)
      
      setTimeout(() => {
        navigate("/login", { state: { message: "Account created successfully! Please sign in." } })
      }, 1500)
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>
      const message = axiosError.response?.data?.message || "Signup failed"
      showToast("error", message)
      setErrors({ submit: message })
    } finally {
      setIsLoading(false)
    }
  }

  const passwordStrength = calculatePasswordStrength(formData.password)

  // Easter egg handler
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
      {/* Premium Animated Background */}
      <div className="fixed inset-0 overflow-hidden">
        {/* Enhanced gradient orbs */}
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

        {/* Vignette overlay */}
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

      {/* Main Signup Card */}
      <div className="relative z-10 w-full max-w-md mx-auto px-4">
        <AnimatePresence mode="wait">
          {step === 1 ? (
            <motion.div
              key="step-1"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.4 }}
              className="relative"
            >
              {/* Premium glow effect */}
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
                    Join TrustAI
                  </h1>
                  <p className="text-gray-400 text-sm">Create your account</p>
                </motion.div>

                {errors.submit && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 mb-6 text-red-300 text-sm font-semibold flex items-center gap-2"
                  >
                    <span>✕</span> {errors.submit}
                  </motion.div>
                )}

                {/* Form */}
                <form className="space-y-4 mb-6">
                  {/* Full Name */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                  >
                    <label className="flex text-xs font-bold text-gray-300 mb-2 items-center gap-2 uppercase tracking-wider">
                      <Icon emoji="👤" inline={true} /> Full Name
                    </label>
                    <motion.input
                      type="text"
                      value={formData.name}
                      onChange={(e) => {
                        setFormData({ ...formData, name: e.target.value })
                        if (validationFeedback.name) {
                          setValidationFeedback((prev) => {
                            const { name, ...rest } = prev
                            return rest
                          })
                        }
                      }}
                      onKeyPress={handleKeyPress}
                      placeholder="John Doe"
                      whileFocus={{ scale: 1.02 }}
                      className="w-full bg-white/5 backdrop-blur border-2 border-white/20 hover:border-purple-500/50 focus:border-purple-500/80 rounded-2xl px-5 py-3 text-white placeholder-gray-500 focus:outline-none transition-all text-sm font-medium shadow-lg shadow-purple-500/0 focus:shadow-lg focus:shadow-purple-500/20"
                    />
                    {errors.name && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-400 text-xs mt-1"
                      >
                        {errors.name}
                      </motion.p>
                    )}
                  </motion.div>

                  {/* Email */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <label className="flex text-xs font-bold text-gray-300 mb-2 items-center gap-2 uppercase tracking-wider">
                      <Icon emoji="📧" inline={true} /> Email
                    </label>
                    <motion.input
                      type="email"
                      value={formData.email}
                      onChange={(e) => {
                        setFormData({ ...formData, email: e.target.value })
                        if (validationFeedback.email) {
                          setValidationFeedback((prev) => {
                            const { email, ...rest } = prev
                            return rest
                          })
                        }
                      }}
                      onKeyPress={handleKeyPress}
                      placeholder="name@example.com"
                      whileFocus={{ scale: 1.02 }}
                      className="w-full bg-white/5 backdrop-blur border-2 border-white/20 hover:border-blue-500/50 focus:border-blue-500/80 rounded-2xl px-5 py-3 text-white placeholder-gray-500 focus:outline-none transition-all text-sm font-medium shadow-lg shadow-blue-500/0 focus:shadow-lg focus:shadow-blue-500/20"
                    />
                    {errors.email && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-400 text-xs mt-1"
                      >
                        {errors.email}
                      </motion.p>
                    )}
                  </motion.div>

                  {/* Continue Button - Premium */}
                  <motion.button
                    type="button"
                    onClick={handleNextStep}
                    disabled={isLoading}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                    whileHover={{ scale: isLoading ? 1 : 1.03 }}
                    whileTap={{ scale: isLoading ? 1 : 0.95 }}
                    className="w-full mt-6 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:via-indigo-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 overflow-hidden relative group signup-btn-glow"
                  >
                    <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100" />
                    {isLoading ? (
                      <>
                        <motion.span
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                          className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                        />
                        <span>Continuing...</span>
                      </>
                    ) : (
                      <>
                        <motion.span initial={{ x: -5 }} whileHover={{ x: 5 }}>→</motion.span>
                        <span>Continue</span>
                      </>
                    )}
                  </motion.button>
                </form>

                {/* Sign In Link */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="text-center text-gray-400 text-sm border-t border-white/10 pt-6"
                >
                  Already have an account?{" "}
                  <motion.button
                    type="button"
                    onClick={() => navigate("/login")}
                    whileHover={{ color: "#a78bfa" }}
                    className="text-purple-400 font-bold hover:text-purple-300 transition-colors"
                  >
                    Sign in
                  </motion.button>
                </motion.div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="step-2"
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.4 }}
              className="relative"
            >
              {/* Premium glow effect */}
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
                  <h1 className="text-3xl font-black bg-gradient-to-r from-purple-300 via-blue-300 to-cyan-300 bg-clip-text text-transparent mb-2">
                    Secure Your Password
                  </h1>
                  <p className="text-gray-400 text-sm">Set your security credentials</p>
                </motion.div>

                {errors.submit && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-red-500/20 border border-red-500/50 rounded-xl p-3 mb-6 text-red-300 text-sm font-semibold flex items-center gap-2"
                  >
                    <span>✕</span> {errors.submit}
                  </motion.div>
                )}

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4 mb-6">
                  {/* Password */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                  >
                    <label className="flex text-xs font-bold text-gray-300 mb-2 items-center gap-2 uppercase tracking-wider">
                      <Icon emoji="🔒" inline={true} /> Password
                    </label>
                    <motion.div
                      animate={{
                        boxShadow: passwordFocused
                          ? "0 0 40px rgba(147, 51, 234, 0.6), inset 0 0 20px rgba(147, 51, 234, 0.2)"
                          : "0 0 0px rgba(147, 51, 234, 0)",
                      }}
                      transition={{ duration: 0.3 }}
                      className="relative"
                    >
                      <motion.input
                        type={showPassword ? "text" : "password"}
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        onKeyPress={handleKeyPress}
                        onFocus={() => setPasswordFocused(true)}
                        onBlur={() => setPasswordFocused(false)}
                        placeholder="••••••••"
                        whileFocus={{ scale: 1.02 }}
                        className="w-full bg-white/5 backdrop-blur border-2 border-white/20 hover:border-purple-500/50 focus:border-purple-500/80 rounded-2xl px-5 py-3 pr-12 text-white placeholder-gray-500 focus:outline-none transition-all text-sm font-medium"
                      />
                      <motion.button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                      >
                        <Icon emoji={showPassword ? "👁️" : "🔒"} inline={true} />
                      </motion.button>
                    </motion.div>

                    {/* Password Strength Meter */}
                    {formData.password && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-2"
                      >
                        <div className="flex gap-2 mb-1">
                          {[...Array(5)].map((_, i) => (
                            <motion.div
                              key={i}
                              className={`flex-1 h-1.5 rounded-full ${
                                i < (passwordStrength.strength / 100) * 5
                                  ? passwordStrength.color
                                  : "bg-gray-700"
                              }`}
                            />
                          ))}
                        </div>
                        <p className={`text-xs ${passwordStrength.color.replace("bg-", "text-")} font-semibold`}>
                          {passwordStrength.label}
                        </p>
                      </motion.div>
                    )}

                    {errors.password && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-400 text-xs mt-1"
                      >
                        {errors.password}
                      </motion.p>
                    )}
                  </motion.div>

                  {/* Confirm Password */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <label className="flex text-xs font-bold text-gray-300 mb-2 items-center gap-2 uppercase tracking-wider">
                      <Icon emoji="✓" inline={true} /> Confirm Password
                    </label>
                    <motion.div
                      animate={{
                        boxShadow: confirmPasswordFocused
                          ? "0 0 40px rgba(59, 130, 246, 0.6), inset 0 0 20px rgba(59, 130, 246, 0.2)"
                          : "0 0 0px rgba(59, 130, 246, 0)",
                      }}
                      transition={{ duration: 0.3 }}
                      className="relative"
                    >
                      <motion.input
                        type={showConfirmPassword ? "text" : "password"}
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        onKeyPress={handleKeyPress}
                        onFocus={() => setConfirmPasswordFocused(true)}
                        onBlur={() => setConfirmPasswordFocused(false)}
                        placeholder="••••••••"
                        whileFocus={{ scale: 1.02 }}
                        className="w-full bg-white/5 backdrop-blur border-2 border-white/20 hover:border-blue-500/50 focus:border-blue-500/80 rounded-2xl px-5 py-3 pr-12 text-white placeholder-gray-500 focus:outline-none transition-all text-sm font-medium"
                      />
                      <motion.button
                        type="button"
                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300"
                      >
                        <Icon emoji={showConfirmPassword ? "👁️" : "🔒"} inline={true} />
                      </motion.button>
                    </motion.div>
                    {formData.confirmPassword && formData.password === formData.confirmPassword && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-green-400 text-xs mt-1"
                      >
                        ✓ Passwords match
                      </motion.p>
                    )}
                    {errors.confirmPassword && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-400 text-xs mt-1"
                      >
                        {errors.confirmPassword}
                      </motion.p>
                    )}
                  </motion.div>

                  {/* Terms & Conditions */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.25 }}
                  >
                    <label className="flex items-center gap-2 cursor-pointer text-xs text-gray-400">
                      <input
                        type="checkbox"
                        checked={agreeToTerms}
                        onChange={(e) => setAgreeToTerms(e.target.checked)}
                        className="w-4 h-4 bg-white/10 border border-white/20 rounded cursor-pointer accent-purple-500"
                      />
                      <span>
                        I agree to the{" "}
                        <motion.a
                          whileHover={{ color: "#a78bfa" }}
                          href="#"
                          className="text-purple-400 font-semibold hover:text-purple-300 transition-colors"
                        >
                          Terms & Conditions
                        </motion.a>
                      </span>
                    </label>
                    {errors.terms && (
                      <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-red-400 text-xs mt-1"
                      >
                        {errors.terms}
                      </motion.p>
                    )}
                  </motion.div>

                  {/* Navigation Buttons - Premium */}
                  <div className="flex gap-3 mt-6">
                    <motion.button
                      type="button"
                      onClick={() => setStep(1)}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex-1 border-2 border-white/20 hover:border-white/50 text-gray-300 font-bold py-3 rounded-2xl transition-all duration-200 backdrop-blur-sm hover:bg-white/5"
                    >
                      ← Back
                    </motion.button>
                    <motion.button
                      type="submit"
                      disabled={isLoading}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      whileHover={{ scale: isLoading ? 1 : 1.03 }}
                      whileTap={{ scale: isLoading ? 1 : 0.95 }}
                      className="flex-1 bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-500 hover:via-indigo-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-2xl transition-all duration-200 flex items-center justify-center gap-2 overflow-hidden relative group signup-btn-glow"
                    >
                      <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100" />
                      {isLoading ? (
                        <>
                          <motion.span
                            animate={{ rotate: 360 }}
                            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                            className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                          />
                          <span>Creating...</span>
                        </>
                      ) : (
                        <>
                          <motion.span initial={{ x: -5 }} whileHover={{ x: 5 }}>✓</motion.span>
                          <span>Create Account</span>
                        </>
                      )}
                    </motion.button>
                  </div>
                </form>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

