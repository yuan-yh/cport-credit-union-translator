/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
        // =================================================================
        // CPORT CREDIT UNION - OFFICIAL BRAND COLORS
        // Based on cportcu.org branding
        // Augusta, Portland, Maine - Routing#: 211288239
        // =================================================================
        
        // Primary Brand Colors - Official cPort Blue
        'cport-blue': '#00AEEF',          // Official cPort blue (logo color)
        'cport-blue-dark': '#0090C9',     // Darker blue for depth
        'cport-blue-light': '#4DC5F5',    // Lighter blue for accents
        
        // Legacy teal (for gradients/accents)
        'cport-teal': '#00A6A6',          // Teal accent
        'cport-teal-dark': '#007A7A',     // Darker teal
        'cport-teal-light': '#33C3C3',    // Light teal
        
        // Dark backgrounds
        'cport-navy': '#0D2137',           // Deep navy - primary dark background
        'cport-navy-light': '#1B4965',     // Medium navy
        'cport-slate': '#1E3A4C',          // Dark slate for cards
        
        // Accent Colors
        'cport-green': '#4CAF50',          // Success/growth green
        'cport-green-light': '#81C784',    // Light green accent
        'cport-gold': '#D4A84B',            // Gold accent (financial trust)
        
        // Neutral Palette
        'cport-gray': '#8FA3B0',           // Text secondary
        'cport-gray-light': '#C4D1D9',     // Borders, dividers
        'cport-white': '#F5F8FA',          // Off-white for text
        
        // Semantic Colors
        success: {
          50: '#ECFDF5',
          100: '#D1FAE5',
          400: '#34D399',
          500: '#22C55E',
          600: '#16A34A',
        },
        warning: {
          50: '#FFFBEB',
          100: '#FEF3C7',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
        },
        danger: {
          50: '#FFF1F2',
          100: '#FFE4E6',
          400: '#FB7185',
          500: '#EF4444',
          600: '#DC2626',
        },
        info: {
          50: '#ECFEFF',
          100: '#CFFAFE',
          400: '#22D3EE',
          500: '#06B6D4',
          600: '#0891B2',
        },
        
        // Language Identity Colors (for translation feature)
        lang: {
          portuguese: '#22C55E',    // Green
          french: '#3B82F6',        // Blue
          somali: '#F59E0B',        // Amber
          arabic: '#8B5CF6',        // Purple
          spanish: '#EF4444',       // Red
          english: '#64748B',       // Slate
          lingala: '#06B6D4',       // Cyan (Congo)
        },
      },
      fontFamily: {
        sans: ['Inter', 'SF Pro Display', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'Consolas', 'monospace'],
      },
      fontSize: {
        'display': ['3rem', { lineHeight: '1.1', letterSpacing: '-0.02em', fontWeight: '700' }],
        'h1': ['2rem', { lineHeight: '1.2', letterSpacing: '-0.01em', fontWeight: '600' }],
        'h2': ['1.5rem', { lineHeight: '1.3', letterSpacing: '-0.005em', fontWeight: '600' }],
        'h3': ['1.25rem', { lineHeight: '1.4', fontWeight: '600' }],
        'body-lg': ['1.125rem', { lineHeight: '1.6' }],
        'body': ['1rem', { lineHeight: '1.6' }],
        'body-sm': ['0.875rem', { lineHeight: '1.5' }],
        'caption': ['0.75rem', { lineHeight: '1.4', letterSpacing: '0.01em' }],
        'overline': ['0.6875rem', { lineHeight: '1.3', letterSpacing: '0.08em', fontWeight: '600' }],
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
        'sm': '0 1px 2px rgba(0, 0, 0, 0.3)',
        'md': '0 2px 8px rgba(0, 0, 0, 0.25)',
        'lg': '0 4px 16px rgba(0, 0, 0, 0.3)',
        'xl': '0 8px 32px rgba(0, 0, 0, 0.35)',
        '2xl': '0 16px 48px rgba(0, 0, 0, 0.4)',
        'glow-teal': '0 0 24px rgba(0, 166, 166, 0.4)',
        'glow-blue': '0 0 24px rgba(0, 174, 239, 0.4)',
        'glow-green': '0 0 24px rgba(34, 197, 94, 0.4)',
        'glow-danger': '0 0 24px rgba(239, 68, 68, 0.4)',
        'card': '0 2px 8px rgba(0, 0, 0, 0.2), 0 0 1px rgba(0, 0, 0, 0.1)',
      },
      animation: {
        'pulse-ring': 'pulse-ring 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fade-in 0.3s ease-out forwards',
        'slide-up': 'slide-up 0.4s ease-out forwards',
        'slide-down': 'slide-down 0.3s ease-out forwards',
        'scale-in': 'scale-in 0.2s ease-out forwards',
        'breathe': 'breathe 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
      },
      keyframes: {
        'pulse-ring': {
          '0%': { transform: 'scale(1)', opacity: '0.8' },
          '50%': { transform: 'scale(1.15)', opacity: '0.4' },
          '100%': { transform: 'scale(1)', opacity: '0.8' },
        },
        'fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'slide-up': {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'slide-down': {
          '0%': { opacity: '0', transform: 'translateY(-16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'scale-in': {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        'breathe': {
          '0%, 100%': { opacity: '0.4' },
          '50%': { opacity: '0.8' },
        },
        'shimmer': {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
      backgroundImage: {
        'cport-gradient': 'linear-gradient(135deg, #00AEEF 0%, #0090C9 100%)',
        'cport-gradient-teal': 'linear-gradient(135deg, #00A6A6 0%, #007A7A 100%)',
        'cport-gradient-dark': 'linear-gradient(135deg, #1B4965 0%, #0D2137 100%)',
      },
        },
    },
    plugins: [],
}
