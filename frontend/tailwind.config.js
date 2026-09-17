/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        forest: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#22c55e',
          600: '#16a34a',
          700: '#15803d',
          800: '#166534',
          900: '#14532d',
          950: '#052e16',
        },
        earth: {
          50: '#fbfaf8',
          100: '#f6f3ee',
          200: '#ebe4da',
          300: '#dbcfbf',
          400: '#c5b29c',
          500: '#a89279',
          600: '#8c755f',
          700: '#705c4c',
          800: '#5c4b3e',
          900: '#4c3e34',
        }
      }
    },
  },
  plugins: [],
}
