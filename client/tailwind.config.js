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
        surface: {
          DEFAULT: '#11161D',
          50: '#171D25',
          100: '#141A22',
          200: '#11161D',
          300: '#0B0F14',
          border: '#212833',
          borderHover: '#2F3A4C',
          card: '#11161D',
          hover: '#171D25'
        },
        slate: {
          50: '#F8FAFC',
          100: '#F0F3F6',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#8B949E',
          500: '#6E7681',
          600: '#484F58',
          700: '#30363D',
          800: '#212833',
          900: '#11161D',
          950: '#0B0F14'
        },
        brand: {
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          accent: '#10b981',
          cyan: '#06b6d4'
        }
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'SFMono-Regular', 'Consolas', 'monospace']
      }
    },
  },
  plugins: [],
}
