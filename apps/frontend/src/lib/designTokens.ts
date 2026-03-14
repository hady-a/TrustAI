// Design Tokens for TrustAI
// These tokens define all colors and styles used in both light and dark modes

export const designTokens = {
  // Typography
  typography: {
    headingXL: 'text-6xl md:text-7xl font-bold',
    headingLG: 'text-5xl font-bold',
    headingMD: 'text-4xl font-bold',
    headingSM: 'text-2xl font-bold',
    headingXS: 'text-lg font-bold',
    bodyLarge: 'text-lg',
    bodyBase: 'text-base',
    bodySmall: 'text-sm',
    caption: 'text-xs',
  },

  // Colors - Light Mode (Modern SaaS Palette)
  light: {
    // Backgrounds - Professional soft light
    bg: {
      primary: '#F5F7FB',
      secondary: '#E5E7EB',
      tertiary: '#D1D5DB',
      surface: '#FFFFFF',
      hover: '#F9FAFB',
      active: '#F3F4F6',
    },
    // Text - High contrast professional
    text: {
      primary: '#111827',
      secondary: '#6B7280',
      tertiary: '#9CA3AF',
      disabled: '#D1D5DB',
      inverse: '#FFFFFF',
    },
    // Borders - Clean and subtle
    border: {
      default: '#E5E7EB',
      light: '#F3F4F6',
      focus: '#6366F1',
    },
    // Accents - Indigo primary with purple secondary
    accent: {
      primary: '#6366F1',
      secondary: '#8B5CF6',
      light: '#818CF8',
      lighter: '#E0E7FF',
    },
    // Risk Indicators
    success: '#10B981',
    warning: '#F59E0B',
    error: '#EF4444',
    info: '#0EA5E9',
  },

  // Colors - Dark Mode
  dark: {
    // Backgrounds
    bg: {
      primary: '#0B0F19',
      secondary: '#1a1f3a',
      tertiary: '#2D3748',
      surface: '#1a1f3a',
      hover: '#2D3748',
      active: '#374151',
    },
    // Text
    text: {
      primary: '#FFFFFF',
      secondary: '#D1D5DB',
      tertiary: '#9CA3AF',
      disabled: '#6B7280',
      inverse: '#1A202C',
    },
    // Borders
    border: {
      default: '#4F46E5',
      light: '#312E81',
      focus: '#6366F1',
    },
    // Accents
    accent: {
      primary: '#6366F1',
      secondary: '#A855F7',
      light: '#818CF8',
      lighter: '#C7D2FE',
    },
    // Status Colors
    success: '#10B981',
    warning: '#FBBF24',
    error: '#F97316',
    info: '#3B82F6',
  },

  // Component Classes
  components: {
    // Buttons
    button: {
      primary: {
        light:
          'bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-lg hover:shadow-indigo-600/30 transition-all duration-200',
        dark:
          'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:shadow-2xl hover:shadow-indigo-500/50',
      },
      secondary: {
        light:
          'bg-gray-100 text-gray-900 border border-gray-200 hover:bg-gray-200 hover:border-gray-300 transition-all duration-200',
        dark:
          'bg-gray-700/50 text-gray-300 border border-gray-600 hover:bg-gray-600',
      },
      outline: {
        light:
          'border border-gray-300 text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-all duration-200',
        dark:
          'border border-indigo-500/50 text-indigo-300 hover:bg-indigo-500/10',
      },
      danger: {
        light:
          'bg-red-600 text-white border border-red-700 hover:bg-red-700 transition-all duration-200',
        dark:
          'bg-red-900/30 text-red-300 border border-red-500/30 hover:bg-red-900/50',
      },
    },

    // Cards
    card: {
      light:
        'bg-white border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-200 rounded-xl',
      dark:
        'bg-[#1a1f3a] border border-indigo-500/20 shadow-lg shadow-black/50 hover:shadow-xl',
    },

    // Inputs
    input: {
      light:
        'bg-white text-gray-900 border border-gray-300 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 placeholder-gray-400 transition-all duration-200',
      dark:
        'bg-slate-800/50 text-white border border-slate-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 placeholder-slate-500',
    },

    // Alerts
    alert: {
      success: {
        light:
          'bg-green-50 text-green-900 border border-green-300',
        dark:
          'bg-emerald-900/30 text-emerald-300 border border-emerald-500/30',
      },
      error: {
        light:
          'bg-red-50 text-red-900 border border-red-300',
        dark:
          'bg-red-900/30 text-red-300 border border-red-500/30',
      },
      warning: {
        light:
          'bg-amber-50 text-amber-900 border border-amber-300',
        dark:
          'bg-amber-900/30 text-amber-300 border border-amber-500/30',
      },
      info: {
        light:
          'bg-blue-50 text-blue-900 border border-blue-300',
        dark:
          'bg-blue-900/30 text-blue-300 border border-blue-500/30',
      },
    },

    // Badges
    badge: {
      primary: {
        light:
          'bg-blue-100 text-blue-900',
        dark:
          'bg-indigo-900/30 text-indigo-300',
      },
      secondary: {
        light:
          'bg-slate-300 text-slate-900',
        dark:
          'bg-slate-700/30 text-slate-300',
      },
      success: {
        light:
          'bg-green-100 text-green-900',
        dark:
          'bg-emerald-900/30 text-emerald-300',
      },
      warning: {
        light:
          'bg-amber-100 text-amber-900',
        dark:
          'bg-amber-900/30 text-amber-300',
      },
      error: {
        light:
          'bg-red-100 text-red-900',
        dark:
          'bg-red-900/30 text-red-300',
      },
    },

    // Gradients
    gradient: {
      pageBackground: {
        light:
          'bg-stone-50',
        dark:
          'bg-gradient-to-br from-[#0B0F19] via-[#1a1f3a] to-[#0B0F19]',
      },
      accent: 'bg-gradient-to-r from-indigo-600 to-purple-600',
      accentDark: 'bg-gradient-to-r from-indigo-500 to-purple-500',
    },
  },

  // Spacing (Tailwind scale)
  spacing: {
    xs: 'px-2 py-1',
    sm: 'px-3 py-2',
    md: 'px-4 py-2.5',
    lg: 'px-6 py-3',
    xl: 'px-8 py-4',
  },

  // Border Radius
  borderRadius: {
    sm: 'rounded-md',
    md: 'rounded-lg',
    lg: 'rounded-xl',
    xl: 'rounded-2xl',
  },

  // Shadows - Clean SaaS shadows
  shadows: {
    light: {
      sm: 'shadow-sm',
      md: 'shadow-md',
      lg: 'shadow-lg',
      xl: 'shadow-xl',
    },
    dark: {
      sm: 'shadow-sm shadow-black/20',
      md: 'shadow-md shadow-black/30',
      lg: 'shadow-lg shadow-black/50',
      xl: 'shadow-xl shadow-black/60',
    },
  },

  // Transitions
  transitions: {
    fast: 'transition-all duration-150',
    base: 'transition-all duration-300',
    slow: 'transition-all duration-500',
  },

  // Breakpoints (for responsive design)
  breakpoints: {
    xs: '0px',
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
  },
}

// Utility function to get theme-specific classes
export const getThemeClasses = (isDark: boolean) => {
  // This is a helper for dynamic theme selection
  // Returns the appropriate theme mode
  return isDark ? 'dark' : 'light'
}

// CSS Variables for theme
export const cssVariables = {
  light: {
    '--bg-primary': '#F5F7FB',
    '--bg-secondary': '#E5E7EB',
    '--bg-tertiary': '#D1D5DB',
    '--surface': '#FFFFFF',
    '--border': '#E5E7EB',
    '--text-primary': '#111827',
    '--text-secondary': '#6B7280',
    '--text-tertiary': '#9CA3AF',
    '--accent-primary': '#6366F1',
    '--accent-secondary': '#8B5CF6',
    '--accent-light': '#818CF8',
    '--accent-lighter': '#E0E7FF',
  },
  dark: {
    '--bg-primary': '#0B0F19',
    '--bg-secondary': '#1a1f3a',
    '--bg-tertiary': '#2D3748',
    '--surface': '#1a1f3a',
    '--border': '#4F46E5',
    '--text-primary': '#FFFFFF',
    '--text-secondary': '#D1D5DB',
    '--text-tertiary': '#9CA3AF',
    '--accent-primary': '#6366F1',
    '--accent-secondary': '#A855F7',
    '--accent-light': '#818CF8',
    '--accent-lighter': '#C7D2FE',
  },
}
