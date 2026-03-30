import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { GoogleLogin } from '@react-oauth/google'
import { Eye, EyeOff, Mail, Lock, User, CheckCircle2, ArrowRight } from 'lucide-react'
import { Button } from '../components/UI/Button'
import { Card } from '../components/UI/Card'
import { Input } from '../components/UI/Input'
import api from '../lib/api'

export default function SignupNew() {
  const navigate = useNavigate()
  
  const [step, setStep] = useState<'info' | 'verify' | 'complete'>(('info'))
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null)

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message })
    setTimeout(() => setToast(null), 3000)
  }

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required'
    }
    
    if (!formData.email) {
      newErrors.email = 'Email is required'
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format'
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required'
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters'
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      newErrors.password = 'Password must contain uppercase, lowercase, and numbers'
    }
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password'
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return
    
    setIsLoading(true)
    try {
      const response = await api.post('/auth/signup', {
        fullName: formData.fullName,
        email: formData.email,
        password: formData.password,
      })
      
      if (response.data.success) {
        sessionStorage.setItem('signupEmail', formData.email)
        setStep('verify')
        showToast('success', 'Account created! Redirecting to login...')
        setTimeout(() => {
          navigate('/login', { state: { message: 'Account created successfully! Please log in.' } })
        }, 2000)
      }
    } catch (error: any) {
      const message = error.response?.data?.message || 'Signup failed. Please try again.'
      showToast('error', message)
      setErrors({ submit: message })
    } finally {
      setIsLoading(false)
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

  const passwordStrength = (() => {
    let strength = 0
    if (formData.password.length >= 8) strength++
    if (/[a-z]/.test(formData.password)) strength++
    if (/[A-Z]/.test(formData.password)) strength++
    if (/\d/.test(formData.password)) strength++
    if (/[!@#$%^&*]/.test(formData.password)) strength++
    return strength
  })()

  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong', 'Very Strong']
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-emerald-500', 'bg-emerald-600']

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
              <span className="text-2xl font-bold text-white">⚡</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Get Started</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2">Create your TrustAI account</p>
          </motion.div>

          <AnimatePresence mode="wait">
            {step === 'info' && (
              <motion.form
                key="signup"
                onSubmit={handleSignup}
                className="space-y-5"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
              >
                <motion.div variants={itemVariants}>
                  <Input
                    label="Full Name"
                    type="text"
                    placeholder="John Doe"
                    icon={<User size={18} />}
                    value={formData.fullName}
                    onChange={(e) => {
                      setFormData({ ...formData, fullName: e.target.value })
                      setErrors({ ...errors, fullName: '' })
                    }}
                    error={errors.fullName}
                    disabled={isLoading}
                  />
                </motion.div>

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

                  {formData.password && (
                    <motion.div
                      className="mt-2"
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <div className="h-1 flex-1 bg-gray-200 rounded-full overflow-hidden">
                          <motion.div
                            className={`h-full ${strengthColors[Math.min(passwordStrength - 1, 4)]}`}
                            initial={{ width: 0 }}
                            animate={{ width: `${(passwordStrength / 5) * 100}%` }}
                            transition={{ duration: 0.3 }}
                          />
                        </div>
                        <span className="text-xs font-medium text-gray-600 dark:text-gray-400">
                          {strengthLabels[Math.min(passwordStrength - 1, 4)]}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">Must contain uppercase, lowercase, and numbers</p>
                    </motion.div>
                  )}
                </motion.div>

                <motion.div variants={itemVariants}>
                  <div className="relative">
                    <Input
                      label="Confirm Password"
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      icon={<Lock size={18} />}
                      value={formData.confirmPassword}
                      onChange={(e) => {
                        setFormData({ ...formData, confirmPassword: e.target.value })
                        setErrors({ ...errors, confirmPassword: '' })
                      }}
                      error={errors.confirmPassword}
                      success={Boolean(formData.confirmPassword && formData.password === formData.confirmPassword)}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-4 top-11 text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                      disabled={isLoading}
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      className="w-4 h-4 mt-0.5 rounded border-gray-300 text-purple-600 focus:ring-purple-500 cursor-pointer"
                      disabled={Boolean(isLoading)}
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      I agree to the{' '}
                      <a href="#" className="text-purple-600 hover:text-purple-700 dark:text-purple-400 font-medium">
                        Terms of Service
                      </a>
                      {' '}and{' '}
                      <a href="#" className="text-purple-600 hover:text-purple-700 dark:text-purple-400 font-medium">
                        Privacy Policy
                      </a>
                    </span>
                  </label>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    fullWidth
                    isLoading={isLoading}
                    loadingText="Creating account..."
                    className="gap-2"
                  >
                    Create Account <ArrowRight size={18} />
                  </Button>
                </motion.div>

                <motion.div variants={itemVariants} className="relative py-4">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200 dark:border-gray-700" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-2 bg-white dark:bg-slate-900 text-gray-500">Or sign up with</span>
                  </div>
                </motion.div>

                <motion.div variants={itemVariants}>
                  <GoogleLogin
                    onSuccess={(credentialResponse) => {
                      console.log('Google signup:', credentialResponse)
                    }}
                    onError={() => console.log('Signup Failed')}
                    text="signup_with"
                    width="100%"
                  />
                </motion.div>

                <motion.p variants={itemVariants} className="text-center text-sm text-gray-600 dark:text-gray-400">
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => navigate('/login')}
                    disabled={isLoading}
                    className="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 font-semibold transition-colors"
                  >
                    Sign in
                  </button>
                </motion.p>
              </motion.form>
            )}

            {step === 'verify' && (
              <motion.div
                key="verify"
                className="text-center space-y-4"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
              >
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-emerald-100 dark:bg-emerald-900/30 mb-4">
                  <CheckCircle2 className="w-10 h-10 text-emerald-600" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Email Verification</h2>
                <p className="text-gray-600 dark:text-gray-400">
                  Please check your email to verify your account
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>

        {/* Footer */}
        <motion.p variants={itemVariants} className="text-center text-xs text-gray-500 dark:text-gray-400 mt-6">
          By signing up, you agree to our Terms of Service and Privacy Policy
        </motion.p>
      </motion.div>
    </div>
  )
}
