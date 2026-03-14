import React, { createContext, useContext, useState, useEffect } from 'react'

type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    // Check localStorage
    const saved = localStorage.getItem('theme') as Theme | null
    if (saved) return saved
    
    // Check system preference
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
    }
    
    return 'dark' // Default to dark
  })

  useEffect(() => {
    localStorage.setItem('theme', theme)
    console.log('[Theme] Current theme:', theme)
    
    // Apply theme to document
    const html = document.documentElement
    if (theme === 'dark') {
      html.classList.add('dark')
      console.log('[Theme] Added dark class to html')
    } else {
      html.classList.remove('dark')
      console.log('[Theme] Removed dark class from html')
    }
    
    console.log('[Theme] HTML classes:', html.className)
  }, [theme])

  const toggleTheme = () => {
    console.log('[Theme] Toggle button clicked!')
    setTheme((prev) => {
      const newTheme = prev === 'dark' ? 'light' : 'dark'
      console.log('[Theme] Toggling from', prev, 'to', newTheme)
      return newTheme
    })
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider')
  }
  return context
}
