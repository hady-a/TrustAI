import React from 'react'
import { motion, type Transition } from 'framer-motion'

interface CardProps {
  variant?: 'default' | 'outlined' | 'elevated' | 'gradient'
  hoverEffect?: boolean
  children: React.ReactNode
  className?: string
  style?: React.CSSProperties
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className = '', variant = 'default', hoverEffect = false, children, style }, ref) => {
    const baseClasses = 'rounded-xl backdrop-blur-sm transition-all duration-300'
    
    const variantClasses = {
      default: 'bg-white/95 dark:bg-slate-900/50 shadow-sm',
      outlined: 'bg-transparent border border-gray-200 dark:border-gray-700 shadow-sm',
      elevated: 'bg-white/98 dark:bg-slate-900/80 shadow-lg hover:shadow-xl',
      gradient: 'bg-gradient-to-br from-white/95 to-gray-50/95 dark:from-slate-900/50 dark:to-slate-800/30 shadow-md',
    }

    const transitionConfig: Transition = { type: 'spring', stiffness: 300, damping: 30 }
    const motionProps = hoverEffect ? {
      whileHover: { y: -2, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)' },
      transition: transitionConfig,
    } : {}

    return (
      <motion.div
        ref={ref}
        style={style}
        className={`${baseClasses} ${variantClasses[variant]} ${className}`}
        {...motionProps}
      >
        {children}
      </motion.div>
    )
  }
)

Card.displayName = 'Card'

export { Card }
