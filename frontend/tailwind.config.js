/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Lora', 'Georgia', 'serif'],
        sans: ['DM Sans', 'system-ui', 'sans-serif'],
      },
      colors: {
        jabari: {
          bg: '#111110',
          surface: '#1c1c1a',
          surface2: '#242421',
          cream: '#F5F2ED',
          border: '#2a2a28',
          border2: '#222220',
          // Text Colors
          text: '#a0a09a',
          textBright: '#c0c0b8',
          textMuted: '#6a6a68',
          textFaint: '#4a4a48',
          // Status and Risk Colors
          green: { bg: '#1a3020', text: '#52b788' },
          amber: { bg: '#2a2010', text: '#c4902a' },
          red: { bg: '#2a1010', text: '#c45a5a' },
          blue: { bg: '#102030', text: '#5a90c0' },
        }
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
