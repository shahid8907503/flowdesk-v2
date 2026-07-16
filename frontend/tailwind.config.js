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
        darkBg: '#07080B',
        darkBgSecondary: '#0E1015',
        darkCard: '#13151D',
        darkBorder: 'rgba(255, 255, 255, 0.05)',
        accentColor: '#D97706',
        accentViolet: '#3B82F6',
        textMuted: '#8F9CAE',
        successColor: '#10B981',
        warningColor: '#F59E0B',
        dangerColor: '#EF4444',
        infoColor: '#3B82F6'
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
