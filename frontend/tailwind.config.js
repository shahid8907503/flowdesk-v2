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
        darkBg: '#09090B',
        darkBgSecondary: '#111827',
        darkCard: '#18181B',
        darkBorder: 'rgba(255, 255, 255, 0.08)',
        accentColor: '#6366F1',
        accentViolet: '#8b5cf6',
        textMuted: '#94a3b8',
        successColor: '#22C55E',
        warningColor: '#F59E0B',
        dangerColor: '#EF4444',
        infoColor: '#3B82F6'
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
