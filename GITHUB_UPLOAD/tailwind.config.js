/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        midnight: {
          50: '#f0f3f9',
          100: '#dbe2f0',
          200: '#b8c5e0',
          300: '#8fa0cc',
          400: '#6b7eb8',
          500: '#4d62a0',
          600: '#3a4d82',
          700: '#2d3c68',
          800: '#1e2a4a',
          900: '#131d36',
          950: '#0a1124',
        },
        violet: {
          accent: {
            50: '#f3f0ff',
            100: '#e9e2ff',
            200: '#d5c8ff',
            300: '#b8a0ff',
            400: '#9b72ff',
            500: '#7e4df5',
            600: '#6b37e0',
            700: '#5828bf',
            800: '#45209a',
            900: '#321870',
          },
        },
        teal: {
          accent: {
            50: '#effefb',
            100: '#c8fdf3',
            200: '#92f9e8',
            300: '#52eedb',
            400: '#22d9c6',
            500: '#0bb8a8',
            600: '#089489',
            700: '#0a756e',
            800: '#0d5d58',
            900: '#0d4d49',
          },
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        display: ['Space Grotesk', 'Inter', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      animation: {
        'fade-in': 'fadeIn 0.4s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'shimmer': 'shimmer 2s linear infinite',
        'spin-slow': 'spin 3s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-10px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
      },
    },
  },
  plugins: [],
};
