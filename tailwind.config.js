/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Brand colors - "Maine Coast at Dusk"
        brand: {
          midnight: '#0A0F1C',
          'deep-ocean': '#0D1B2A',
          'steel-blue': '#1B263B',
          harbor: '#415A77',
          fog: '#778DA9',
          'sea-foam': '#E0E8F0',
        },
        // Semantic colors
        success: {
          50: '#ECFDF5',
          400: '#34D399',
          600: '#059669',
        },
        warning: {
          50: '#FFFBEB',
          400: '#FBBF24',
          600: '#D97706',
        },
        danger: {
          50: '#FFF1F2',
          400: '#FB7185',
          600: '#E11D48',
        },
        info: {
          50: '#F0F9FF',
          400: '#38BDF8',
          600: '#0284C7',
        },
        // Language identity colors
        lang: {
          portuguese: '#22C55E',
          french: '#3B82F6',
          somali: '#F59E0B',
          arabic: '#8B5CF6',
          spanish: '#EF4444',
          english: '#6B7280',
        },
      },
      fontFamily: {
        sans: ['Inter', 'SF Pro Display', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'monospace'],
      },
      fontSize: {
        'display': ['3rem', { lineHeight: '1.08', letterSpacing: '-0.02em' }],
        'h1': ['2rem', { lineHeight: '1.19', letterSpacing: '-0.01em' }],
        'h2': ['1.5rem', { lineHeight: '1.25', letterSpacing: '-0.005em' }],
        'h3': ['1.25rem', { lineHeight: '1.3' }],
        'body-lg': ['1.125rem', { lineHeight: '1.6' }],
        'body': ['1rem', { lineHeight: '1.6' }],
        'body-sm': ['0.875rem', { lineHeight: '1.5' }],
        'caption': ['0.75rem', { lineHeight: '1.4', letterSpacing: '0.01em' }],
        'overline': ['0.6875rem', { lineHeight: '1.3', letterSpacing: '0.08em' }],
      },
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
        '3xl': '1.5rem',
      },
      boxShadow: {
        'sm': '0 1px 2px rgba(0, 0, 0, 0.4)',
        'md': '0 2px 4px rgba(0, 0, 0, 0.3), 0 1px 2px rgba(0, 0, 0, 0.2)',
        'lg': '0 4px 12px rgba(0, 0, 0, 0.4), 0 2px 4px rgba(0, 0, 0, 0.2)',
        'xl': '0 8px 24px rgba(0, 0, 0, 0.5), 0 4px 8px rgba(0, 0, 0, 0.25)',
        '2xl': '0 16px 48px rgba(0, 0, 0, 0.6), 0 8px 16px rgba(0, 0, 0, 0.3)',
        'glow-blue': '0 0 20px rgba(59, 130, 246, 0.4)',
        'glow-green': '0 0 20px rgba(34, 211, 153, 0.4)',
        'glow-red': '0 0 20px rgba(225, 29, 72, 0.4)',
      },
      animation: {
        'pulse-ring': 'pulse-ring 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fade-in 0.3s ease-out',
        'slide-up': 'slide-up 0.3s ease-out',
        'breathe': 'breathe 2s ease-in-out infinite',
      },
      keyframes: {
        'pulse-ring': {
          '0%': { transform: 'scale(1)', opacity: '0.8' },
          '50%': { transform: 'scale(1.15)', opacity: '0.4' },
          '100%': { transform: 'scale(1)', opacity: '0.8' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'breathe': {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.8' },
        },
      },
      transitionTimingFunction: {
        'spring': 'cubic-bezier(0.34, 1.56, 0.64, 1)',
        'smooth': 'cubic-bezier(0.22, 1, 0.36, 1)',
      },
    },
  },
  plugins: [],
}
