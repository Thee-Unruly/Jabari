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
          bg: '#000000',
          surface: '#111110',
          surface2: '#1a1a18',
          cream: '#F5F2ED',
          border: '#222220',
          // Monochromatic Spectrum
          white: '#FFFFFF',
          nearWhite: '#E5E5E0',
          gray: '#888884',
          dim: '#4a4a48',
          ink: '#111110',
        }
      }
    },
  },
  plugins: [],
}
