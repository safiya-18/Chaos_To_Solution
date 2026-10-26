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
        canvas: '#F7F3EA',
        outer: '#9EAFD0',
        ink: '#111820',
        blueAccent: '#304DB4',
        yellowAccent: '#FFE56A',
        pastel: {
          yellow: '#FEF3C7',
          lavender: '#F3E8FF',
          mint: '#DCFCE7',
          palegreen: '#ECFCCB',
          skyblue: '#E0F2FE',
          coral: '#FFEDD5',
          pink: '#FCE7F3',
          gray: '#F5F5F4'
        }
      },
      fontFamily: {
        display: ['Anton', 'Bebas Neue', 'Impact', 'sans-serif'],
        bebas: ['"Bebas Neue"', 'Anton', 'Impact', 'sans-serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      }
    },
  },
  plugins: [],
}


