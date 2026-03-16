import React from 'react'

interface IconProps {
  emoji: string
  size?: 'sm' | 'md' | 'lg'
  className?: string
  inline?: boolean
}

export const Icon: React.FC<IconProps> = ({ 
  emoji, 
  size = 'md', 
  className = '', 
  inline = true 
}) => {
  const sizeMap = {
    sm: 'text-2xl',
    md: 'text-4xl',
    lg: 'text-6xl'
  }
  
  const baseClassName = `${sizeMap[size]} ${inline ? 'inline mr-1' : ''} ${className}`
  
  return <span className={baseClassName}>{emoji}</span>
}

// Utility component for rendering emoji text with icon
export const withIcon = (emoji: string, text: string) => {
  return (
    <>
      <Icon emoji={emoji} size="sm" className="inline mr-2" />
      {text}
    </>
  )
}
