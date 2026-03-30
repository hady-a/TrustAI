import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, useLocation } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { Eye, EyeOff, Mail, Lock, ArrowRight } from 'lucide-react'
import { Button } from '../components/UI/Button'
import { Card } from '../components/UI/Card'
import { Input } from '../components/UI/Input'
import api from '../lib/api'

export default function LoginNew() {
  const navigate = useNavigate()
  const location = useLocation()
  
  const [formData, setFormData] = useState({ email: '', password: '' })
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [rememberMe, setRememberMe] = useState(false)
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [isResettingPassword, setIsResettingPassword] = useState(false)

  const successMessage = (location.state as any)?.message

  useEffect(() => {
    // Check for remembered login
    const rememberMeFlag = localStorage.getItem('rememberMe') === 'true'
    const authToken = localStorage.getItem('authToken')
    
    if (rememberMeFlag && authToken) {
      setRememberMe(true)
      validateAndAutoLogin()
    }
  }, [])

  const validateAndAutoLogin = async () => {
    try {
      const response = await api.get('/users/profile')
      if (response.data?.success) {
        navigate('/modes', { replace: true })
      }
    } catch (error) {
      localStorage.removeItem('authToken')
      localStorage.removeItem('user')
      localStorage.removeItem('rememberMe')
    }
  }

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format'
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validateForm()) return

    setIsLoading(true)
    try {
      const response = await api.post('/auth/login', {
        email: formData.email,
        password: formData.password,
      })

      if (response.data.success && response.data.data?.token) {
        const { token, user } = response.data.data
        localStorage.setItem('authToken', token)
        localStorage.setItem('user', JSON.stringify(user))

        if (rememberMe) {
          localStorage.setItem('rememberMe', 'true')
        }

        showToast('success', 'Login successful!')
        setTimeout(() => navigate('/modes', { replace: true }), 1000)
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed. Please try again.'
      showToast('error', message)
      setErrors({ submit: message })
    } finally {
      setIsLoading(false)
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
      const response = await api.post('/auth/google-login', {
        credential: credentialResponse.credential,
      })

      console.log('[Google] ✅ Backend verified token, status:', response.status)

      if (response.data?.success && response.data?.data?.token) {
        const { token, user } = response.data.data

        console.log('[Google] 💾 Storing auth token and user')
        localStorage.setItem('authToken', token)
        localStorage.setItem('user', JSON.stringify(user))

        setIsLoading(false)
        showToast('success', '✅ Google login successful!')
        console.log('[Google] 🚀 Navigating to /modes')
        navigate('/modes', { replace: true })
      } else {
        throw new Error('Invalid response from server')
      }
    } catch (error: any) {
      console.error('[Google] ❌ Error:', error)
      const message = error.response?.data?.message || error.message || 'Google login failed'
      showToast('error', message)
      setIsLoading(false)
    }
  }

  const handleGoogleError = () => {
    console.error('[Google] ❌ Google sign-in failed')
    showToast('error', 'Google login failed. Please try again.')
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!forgotEmail) {
      showToast('error', 'Please enter your email')
      return
    }

    setIsResettingPassword(true)
    try {
      const response = await api.post('/auth/reset-password-request', {
        email: forgotEmail,
      })

      if (response.data.success) {
        showToast('success', 'Password reset link sent to your email')
        setShowForgotPassword(false)
        setForgotEmail('')
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to process request'
      showToast('error', message)
    } finally {
      setIsResettingPassword(false)
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4 },
    },
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-purple-50 to-gray-100 dark:from-gray-950 dark:via-purple-950/20 dark:to-gray-950 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute top-0 left-0 w-96 h-96 bg-purple-300/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-indigo-300/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      
      <motion.div
        className="w-full max-w-md z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Success Message */}
        <AnimatePresence>
          {successMessage && (
            <motion.div
              className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {successMessage}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Toast */}
        <AnimatePresence>
          {toast && (
            <motion.div
              className={`mb-4 p-3 rounded-lg text-sm ${
                toast.type === 'success'
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-700'
                  : 'bg-red-50 border border-red-200 text-red-700'
              }`}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {toast.message}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Card */}
        <Card variant="elevated" className="p-8">
          <motion.div variants={itemVariants} className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-600 to-indigo-600 mb-4">
              <span className="text-2xl font-bold text-white">🔐</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Welcome Back</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Sign in to your TrustAI account</p>
          </motion.div>

          <AnimatePresence mode="wait">
            {!showForgotPassword ? (
              <motion.form
                key="login"
                onSubmit={handleLogin}
                className="space-y-5"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                <motion.div variants={itemVariants}>
                  <Input
                    label="Email Address"
                    type="email"
                    placeholder="you@example.com"
                    icon={<Mail size={18} />}
                    value={formData.email}
                    onChange={(e) => {
                      setFormData({ ...formData, email: e.target.value })
                      setErrors({ ...errors, email: '' })
                    }}
                    error={errors.email}
                    disabled={isLoading}
                  />
                </motion.div>

                <motion.div variants={itemVariants}>
                  <div className="relative">
                    <Input
                      label="Password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      icon={<Lock size={18} />}
                      value={formData.password}
                      onChange={(e) => {
                        setFormData({ ...formData, password: e.target.value })
                        setErrors({ ...errors, password: '' })
                      }}
                      error={errors.password}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-11 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                      disabled={isLoading}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="flex items-center justify-between">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                      disabled={isLoading}
                      className="w-4 h-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowForgotPassword(true)}
                    disabled={isLoading}
                    className="text-sm text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-medium transition-colors"
                  >
                    Forgot password?
                  </button>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    fullWidth
                    isLoading={isLoading}
                    loadingText="Signing in..."
                    className="gap-2"
                  >
                    Sign In <ArrowRight size={18} />
                  </Button>
                </motion.div>

                <motion.div variants={itemVariants} className="relative py-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200 dark:border-gray-700" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white dark:bg-slate-900 text-gray-500">Or continue with</span>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={handleGoogleError}
                    text="signin_with"
                    theme="outline"
                  />
                </motion.div>

                <motion.p variants={itemVariants} className="text-center text-sm text-gray-600 dark:text-gray-400">
                  Don't have an account?{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/signup')}
                    disabled={isLoading}
                    className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-semibold transition-colors"
                  >
                    Sign up
                  </button>
                </motion.p>
              </motion.form>
            ) : (
              <motion.form
                key="forgot"
                onSubmit={handleForgotPassword}
                className="space-y-5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                  Enter your email address and we'll send you a link to reset your password.
                </p>

                <Input
                  label="Email Address"
                  type="email"
                  placeholder="you@example.com"
                  icon={<Mail size={18} />}
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  disabled={isResettingPassword}
                />

                <div className="flex gap-3">
                  <Button
                    type="button"
                    variant="secondary"
                    size="lg"
                    fullWidth
                    onClick={() => {
                      setShowForgotPassword(false)
                      setForgotEmail('')
                    }}
                    disabled={isResettingPassword}
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    fullWidth
                    isLoading={isResettingPassword}
                    loadingText="Sending..."
                  >
                    Send Reset Link
                  </Button>
                </div>
              </motion.form>
            )}
          </AnimatePresence>
        </Card>

        {/* Footer */}
        <motion.p variants={itemVariants} className="text-center text-xs text-gray-500 dark:text-gray-400 mt-6">
          By signing in, you agree to our Terms of Service and Privacy Policy
        </motion.p>
      </motion.div>
    </div>
  )
}
