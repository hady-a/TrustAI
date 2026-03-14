/** @type {import('tailwindcss').Config} */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Light mode colors
        light: {
          bg: '#FAFBFC',
          bg2: '#F5F7FA',
          bg3: '#EFF2F7',
          surface: '#FFFFFF',
          border: '#E2E8F0',
          text: '#1A202C',
          text2: '#4A5568',
          text3: '#718096',
        },
        // Dark mode colors (existing)
        dark: {
          bg: '#0B0F19',
          bg2: '#1a1f3a',
          surface: '#1a1f3a',
          border: '#4F46E5',
          text: '#FFFFFF',
          text2: '#D1D5DB',
          text3: '#9CA3AF',
        },
      },
    },
  },
  plugins: [],
}
