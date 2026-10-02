/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      colors: {
        brand: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#4ade80',
          500: '#10b981',
          600: '#059669',
          700: '#047857',
          800: '#065f46',
          900: '#064e3b',
          950: '#022c22',
        },
        forest: {
          50: '#f0fdf6',
          100: '#dcfce9',
          200: '#bbf7d3',
          300: '#86efb0',
          400: '#4ade86',
          500: '#16a34a',
          600: '#15803d',
          700: '#166534',
          800: '#14532d',
          900: '#0f3f23',
          950: '#082515',
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
          950: '#2b231d',
        },
        surface: {
          canvas: '#F8FAF8',
          card: '#FFFFFF',
          elevated: '#FFFFFF',
          muted: '#F1F5F2',
          border: 'rgba(226, 232, 240, 0.8)',
        }
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px 0 rgba(0, 0, 0, 0.02)',
        'card': '0 4px 20px -2px rgba(15, 23, 42, 0.05), 0 2px 6px -1px rgba(15, 23, 42, 0.02)',
        'card-hover': '0 12px 28px -4px rgba(15, 23, 42, 0.08), 0 4px 12px -2px rgba(15, 23, 42, 0.04)',
        'elevated': '0 20px 35px -5px rgba(15, 23, 42, 0.08), 0 8px 16px -4px rgba(15, 23, 42, 0.04)',
        'glow-emerald': '0 0 25px -3px rgba(16, 185, 129, 0.25)',
        'glow-blue': '0 0 25px -3px rgba(59, 130, 246, 0.25)',
      },
      borderRadius: {
        '3xl': '1.5rem',
        '4xl': '2rem',
      }
    },
  },
  plugins: [],
}
