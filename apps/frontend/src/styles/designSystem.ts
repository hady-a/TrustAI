/**
 * TrustAI Design System
 * Centralized styling, colors, spacing, and animation constants
 */

export const colors = {
  // Primary brand colors (Indigo/Purple)
  primary: {
    50: '#F5F3FF',
    100: '#ECE9FE',
    200: '#DDD6FE',
    300: '#CAC0FD',
    400: '#A9A4FF',
    500: '#8B5CF6', // Primary brand
    600: '#7C3AED',
    700: '#6D28D9',
    800: '#5B21B6',
    900: '#3F0F5C',
  },
  
  // Secondary accent (Indigo)
  secondary: {
    50: '#F0F4FF',
    100: '#E0E7FF',
    200: '#C7D2FE',
    300: '#A5B4FC',
    400: '#818CF8',
    500: '#6366F1',
    600: '#4F46E5',
    700: '#4338CA',
    800: '#3730A3',
    900: '#312E81',
  },

  // Semantic colors
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#3B82F6',
  
  // Neutral
  neutral: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },

  // Dark mode backgrounds
  dark: {
    1: '#0B0F19',
    2: '#1a1f3a',
    3: '#2D3748',
    4: '#3F4660',
  },
};

export const spacing = {
  xs: '0.25rem',
  sm: '0.5rem',
  md: '1rem',
  lg: '1.5rem',
  xl: '2rem',
  '2xl': '2.5rem',
  '3xl': '3rem',
  '4xl': '4rem',
};

export const borderRadius = {
  none: '0',
  xs: '0.25rem',
  sm: '0.375rem',
  md: '0.5rem',
  lg: '0.75rem',
  xl: '1rem',
  '2xl': '1.5rem',
  '3xl': '2rem',
  full: '9999px',
};

export const shadows = {
  xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
  '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
  inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
  glow: '0 0 20px rgba(139, 92, 246, 0.3)',
  'glow-lg': '0 0 40px rgba(139, 92, 246, 0.4)',
};

export const gradients = {
  // Brand gradients
  primary: 'linear-gradient(135deg, #8B5CF6 0%, #6366F1 100%)',
  primaryAlt: 'linear-gradient(135deg, #A855F7 0%, #8B5CF6 100%)',
  
  // Mode-specific gradients
  criminal: 'linear-gradient(135deg, #EF4444 0%, #EC4899 100%)',
  interview: 'linear-gradient(135deg, #3B82F6 0%, #06B6D4 100%)',
  business: 'linear-gradient(135deg, #10B981 0%, #14B8A6 100%)',
  
  // Neutral gradients
  subtle: 'linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%)',
  dark: 'linear-gradient(135deg, #1a1f3a 0%, #0B0F19 100%)',
};

export const animations = {
  // Transition speeds
  fast: '150ms',
  base: '250ms',
  slow: '350ms',
  slower: '500ms',
  
  // Easing functions
  easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
  easingIn: 'cubic-bezier(0.4, 0, 1, 1)',
  easingOut: 'cubic-bezier(0, 0, 0.2, 1)',
};

export const typography = {
  fontFamily: {
    sans: `'Inter', 'system-ui', '-apple-system', 'sans-serif'`,
  },
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem',
  },
  fontWeight: {
    light: 300,
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  },
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
    loose: 2,
  },
};

export const breakpoints = {
  xs: '0px',
  sm: '640px',
  md: '768px',
  lg: '1024px',
  xl: '1280px',
  '2xl': '1536px',
};

export const zIndex = {
  hide: -1,
  auto: 'auto',
  base: 0,
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modalBackdrop: 1040,
  modal: 1050,
  popover: 1060,
  tooltip: 1070,
  notification: 1080,
};
