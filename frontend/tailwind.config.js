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
        // Primary Brand Identity: Hawaiian Shack
        hawaiian: {
          50: '#FAF8F5',
          100: '#F5F2EB',
          200: '#E8E2D8',
          300: '#D1C6B7',
          400: '#AFA190',
          500: '#8B7A66', // Primary Brand Color
          600: '#766654',
          700: '#5E5142',
          800: '#4D4236',
          900: '#3D342B',
          950: '#231E19',
        },
        // Secondary Identity: Mocassin
        mocassin: {
          50: '#FFFDF8',
          100: '#FFF9ED',
          200: '#FFF0D5',
          300: '#FFE5B8', // Primary Secondary Accent
          400: '#FED898',
          500: '#F5C474',
          600: '#E2A74F',
          700: '#BF8232',
          800: '#996324',
          900: '#7B4D1B',
          950: '#422709',
        },
        // Warm Agritech Canvas & Surfaces
        warm: {
          canvas: '#FAF8F5',
          surface: '#FFFFFF',
          card: '#FFFFFF',
          cream: '#FFF9ED',
          muted: '#F5F2EB',
          border: '#E8E2D8',
          borderDark: '#D1C6B7',
          charcoal: '#231E19',
          body: '#4D4236',
        },
        // Retained Semantic Accents for Agriculture & States
        agri: {
          green: '#2E7D32',
          lightGreen: '#E8F5E9',
          amber: '#D97706',
          lightAmber: '#FEF3C7',
          blue: '#2563EB',
          lightBlue: '#EFF6FF',
          red: '#DC2626',
          lightRed: '#FEE2E2',
        }
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(77, 66, 54, 0.04), 0 1px 2px 0 rgba(77, 66, 54, 0.02)',
        'card': '0 4px 20px -2px rgba(61, 52, 43, 0.06), 0 2px 6px -1px rgba(61, 52, 43, 0.03)',
        'card-hover': '0 14px 30px -4px rgba(61, 52, 43, 0.10), 0 6px 14px -2px rgba(61, 52, 43, 0.05)',
        'elevated': '0 20px 40px -6px rgba(61, 52, 43, 0.12), 0 10px 20px -4px rgba(61, 52, 43, 0.06)',
        'btn-primary': '0 4px 14px 0 rgba(139, 122, 102, 0.35)',
        'btn-hover': '0 6px 20px 0 rgba(139, 122, 102, 0.45)',
        'glow-mocassin': '0 0 25px -2px rgba(255, 229, 184, 0.45)',
      },
      borderRadius: {
        '3xl': '1.5rem',
        '4xl': '2rem',
      }
    },
  },
  plugins: [],
}
