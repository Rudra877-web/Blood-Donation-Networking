/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#FDF2F3',
          100: '#FCE7E9',
          200: '#F9D1D5',
          300: '#F3A7AF',
          400: '#EA7380',
          500: '#DE4556',
          600: '#C62838', // Primary brand crimson
          700: '#A61D2B',
          800: '#8A1B27',
          900: '#731B24',
          950: '#40090F',
        },
        dark: {
          50: '#F8FAFC',
          100: '#F1F5F9',
          200: '#E2E8F0',
          300: '#CBD5E1',
          400: '#94A3B8',
          500: '#64748B',
          600: '#333D52',
          700: '#222736', // Border
          800: '#151822', // Card background
          850: '#0F121A', // Elevated subtle
          900: '#0B0D13', // Main background
          950: '#07080C',
        },
        surface: {
          subtle: '#0E111A',
          card: '#151822',
          border: '#222736',
        },
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'subtle': '0 1px 3px 0 rgba(0, 0, 0, 0.04), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
        'card': '0 2px 6px -1px rgba(23, 25, 35, 0.05), 0 1px 3px -1px rgba(23, 25, 35, 0.03)',
        'card-hover': '0 10px 25px -5px rgba(23, 25, 35, 0.08), 0 8px 10px -6px rgba(23, 25, 35, 0.04)',
        'dropdown': '0 10px 30px -5px rgba(23, 25, 35, 0.12), 0 4px 6px -2px rgba(23, 25, 35, 0.05)',
      },
      borderRadius: {
        'xl': '0.75rem',
        '2xl': '1rem',
      },
    },
  },
  plugins: [],
};
