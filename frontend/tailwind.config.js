/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          primary: '#0a0d13',
          secondary: '#10141d',
          tertiary: '#161c28',
        },
        border: {
          color: '#222b3c',
          focus: '#3b82f6',
        },
        text: {
          main: '#e2e8f0',
          muted: '#64748b',
          dark: '#334155',
        },
        accent: {
          violet: '#8b5cf6',
          cyan: '#06b6d4',
          green: '#10b981',
          red: '#ef4444',
          yellow: '#f59e0b',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['Fira Code', 'Courier New', 'Courier', 'monospace'],
      },
      animation: {
        'pulse-glow': 'pulseGlow 2.5s infinite alternate',
      },
      keyframes: {
        pulseGlow: {
          '0%': { textShadow: '0 0 8px rgba(6, 182, 212, 0.3)' },
          '100%': { textShadow: '0 0 16px rgba(6, 182, 212, 0.7)' },
        }
      }
    },
  },
  plugins: [],
}
