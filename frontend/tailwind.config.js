/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        jabari: {
          dark: '#0a0a0a',
          slate: '#1a1a1a',
          accent: '#3b82f6',
          danger: '#ef4444',
          success: '#10b981',
          gold: '#f59e0b'
        }
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
