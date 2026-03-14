import { useState } from "react"
import { motion } from "framer-motion"
import { useNavigate } from "react-router-dom"
import { authAPI } from "../lib/api"
import { AxiosError } from "axios"

interface AuthFormProps {
  isLogin: boolean
  onToggleMode?: () => void
}

export default function AuthForm({ isLogin, onToggleMode }: AuthFormProps) {
  const navigate = useNavigate()
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isLoading, setIsLoading] = useState(false)

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.email) {
      newErrors.email = "Email address is required to proceed"
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address (e.g., user@example.com)"
    }

    if (!formData.password) {
      newErrors.password = "Password is required to continue"
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters long for security"
    }

    if (!isLogin) {
      if (!formData.name) {
        newErrors.name = "Please enter your full name"
      }
      if (!formData.confirmPassword) {
        newErrors.confirmPassword = "Please confirm your password to ensure it's correct"
      } else if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match. Please verify and try again."
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsLoading(true)
    try {
      if (isLogin) {
        const response = await authAPI.login({
          email: formData.email,
          password: formData.password,
        })
        localStorage.setItem("authToken", response.data.data.token)
        localStorage.setItem("user", JSON.stringify(response.data.data.user))
        navigate("/modes")
      } else {
        await authAPI.signup({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        })
        // After successful signup, redirect to login form
        setErrors({})
        setFormData({ name: "", email: "", password: "", confirmPassword: "" })
        navigate("/login", { state: { message: "Account created successfully! Please sign in." } })
      }
    } catch (error) {
      const axiosError = error as AxiosError<{ message: string }>
      let message = axiosError.response?.data?.message || "Authentication failed. Please try again."
      
      // Make error messages more specific
      if (message.includes("Invalid credentials")) {
        if (isLogin) {
          message = "Email or password is incorrect. Please check your credentials and try again."
        }
      } else if (message.includes("User already exists")) {
        message = "This email is already registered. Please use a different email or try logging in."
      } else if (message.includes("Validation Error")) {
        message = "Please check all fields are filled correctly before submitting."
      }
      
      setErrors({ submit: message })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0B0F19] via-[#1a1f3a] to-[#0B0F19] flex items-center justify-center p-4 overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/3 -left-40 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 50, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-1/3 -right-40 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"
        />
        <motion.div
          animate={{ y: [0, 50, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute top-1/4 left-1/3 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl"
        />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.7, type: "spring" }}
        className="relative z-10 w-full max-w-md"
      >
        {/* Glassmorphism Card */}
        <div className="backdrop-blur-xl bg-white/10 rounded-3xl shadow-2xl p-8 border border-white/20">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-center mb-8"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="inline-block mb-4"
            >
              <div className="w-14 h-14 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                <span className="text-white font-bold text-2xl">T</span>
              </div>
            </motion.div>
            <h1 className="text-4xl font-bold text-white mb-2">
              {isLogin ? "Welcome Back" : "Join TrustAI"}
            </h1>
            <p className="text-gray-300">
              {isLogin
                ? "Sign in to continue your analysis"
                : "Start your investigation journey"}
            </p>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Error Alert */}
            {errors.submit && (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="bg-red-500/20 border border-red-500/50 rounded-xl p-4 text-red-300 text-sm backdrop-blur-sm flex items-start gap-3"
              >
                <svg className="w-5 h-5 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>{errors.submit}</span>
              </motion.div>
            )}

            {/* Full Name Field */}
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <label className="block text-sm font-semibold text-gray-200 mb-3">
                  Full Name
                </label>
                <motion.div
                  whileFocus="focus"
                  className="relative"
                >
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="John Doe"
                    disabled={isLoading}
                    className="w-full bg-white/10 border border-white/20 rounded-xl px-5 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-indigo-400 focus:bg-white/20 transition-all duration-300 disabled:opacity-50 backdrop-blur-sm"
                  />
                  {errors.name && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-red-400 text-xs mt-2 flex items-center gap-1"
                    >
                      <span>✕</span> {errors.name}
                    </motion.p>
                  )}
                </motion.div>
              </motion.div>
            )}

            {/* Email Field */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.35 }}
            >
              <label className="block text-sm font-semibold text-gray-200 mb-3">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                disabled={isLoading}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-5 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-indigo-400 focus:bg-white/20 transition-all duration-300 disabled:opacity-50 backdrop-blur-sm"
              />
              {errors.email && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-red-400 text-xs mt-2 flex items-center gap-1"
                >
                  <span>✕</span> {errors.email}
                </motion.p>
              )}
            </motion.div>

            {/* Password Field */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <label className="block text-sm font-semibold text-gray-200 mb-3">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                disabled={isLoading}
                className="w-full bg-white/10 border border-white/20 rounded-xl px-5 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-indigo-400 focus:bg-white/20 transition-all duration-300 disabled:opacity-50 backdrop-blur-sm"
              />
              {errors.password && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-red-400 text-xs mt-2 flex items-center gap-1"
                >
                  <span>✕</span> {errors.password}
                </motion.p>
              )}
            </motion.div>

            {/* Confirm Password Field */}
            {!isLogin && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.45 }}
              >
                <label className="block text-sm font-semibold text-gray-200 mb-3">
                  Confirm Password
                </label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  placeholder="Confirm your password"
                  disabled={isLoading}
                  className="w-full bg-white/10 border border-white/20 rounded-xl px-5 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-indigo-400 focus:bg-white/20 transition-all duration-300 disabled:opacity-50 backdrop-blur-sm"
                />
                {errors.confirmPassword && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-red-400 text-xs mt-2 flex items-center gap-1"
                  >
                    <span>✕</span> {errors.confirmPassword}
                  </motion.p>
                )}
              </motion.div>
            )}

            {/* Submit Button */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              className="w-full mt-8 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-3 rounded-xl hover:shadow-2xl hover:shadow-indigo-500/40 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                  />
                  Loading...
                </>
              ) : (
                <>
                  {isLogin ? "Sign In" : "Create Account"}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </>
              )}
            </motion.button>
          </form>

          {/* Footer */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="text-center text-gray-400 mt-8 text-sm"
          >
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <motion.button
              whileHover={{ textDecoration: "underline" }}
              onClick={() => onToggleMode ? onToggleMode() : navigate(isLogin ? "/signup" : "/login")}
              disabled={isLoading}
              className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors disabled:opacity-50"
            >
              {isLogin ? "Sign Up" : "Sign In"}
            </motion.button>
          </motion.p>
        </div>

        {/* Floating Decorative Elements */}
        <motion.div
          animate={{ y: [0, 20, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="absolute top-10 right-10 w-20 h-20 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 rounded-full blur-2xl pointer-events-none"
        />
        <motion.div
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 5, repeat: Infinity, delay: 1 }}
          className="absolute bottom-10 left-10 w-32 h-32 bg-gradient-to-tr from-blue-500/10 to-indigo-500/10 rounded-full blur-3xl pointer-events-none"
        />
      </motion.div>
    </div>
  )
}
