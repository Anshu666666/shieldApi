/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        background: '#0B0F14',
        card: '#111820',
        cardHover: '#16202C',
        surface: '#151D26',
        border: '#1E2936',
        borderLight: '#2A3B4E',
        textPrimary: '#F8FAFC',
        textSecondary: '#94A3B8',
        textMuted: '#64748B',
        shieldCyan: '#06B6D4',
        shieldBlue: '#38BDF8',
        shieldSuccess: '#10B981',
        shieldWarning: '#F59E0B',
        shieldDanger: '#EF4444',
        shieldPurple: '#A855F7',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'radar': 'radar 2s linear infinite',
      },
      keyframes: {
        radar: {
          '0%': { transform: 'scale(0.95)', opacity: '0.8' },
          '100%': { transform: 'scale(1.8)', opacity: '0' },
        }
      }
    },
  },
  plugins: [],
}
