import React from 'react'
import { motion } from 'framer-motion'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
  success?: boolean
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, icon, success, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
              {icon}
            </div>
          )}
          <motion.input
            ref={ref}
            className={`
              w-full px-4 py-2.5 rounded-lg
              ${icon ? 'pl-10' : ''}
              bg-white dark:bg-gray-950
              border-2 border-gray-200 dark:border-gray-700
              text-gray-900 dark:text-gray-100
              placeholder-gray-500 dark:placeholder-gray-400
              transition-all duration-200
              focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20
              disabled:bg-gray-100 disabled:cursor-not-allowed
              ${error ? 'border-red-500 focus:border-red-500 focus:ring-red-500/20' : ''}
              ${success ? 'border-emerald-500 focus:border-emerald-500 focus:ring-emerald-500/20' : ''}
              ${className}
            `}
            whileFocus={{ scale: 1.01 }}
            {...props}
          />
          {success && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-emerald-500">
              ✓
            </div>
          )}
        </div>
        {error && (
          <motion.p
            className="text-sm text-red-500 mt-1"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {error}
          </motion.p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'

export { Input }
