/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4ff',
          100: '#dfe9ff',
          200: '#c5d7fe',
          300: '#a4bcfa',
          400: '#8198f8',
          500: '#6172f3',
          600: '#4a4ee8',
          700: '#3b3fd1',
          800: '#3135aa',
          900: '#2b3089',
        },
        accent: {
          500: '#8b5cf6',
          600: '#7c3aed',
        },
        // Landing page palette (scoped to the public marketing page only;
        // the dashboard keeps using the brand/slate tokens above).
        paper: '#F8F8F6',
        ink: '#171717',
        muted: '#656565',
        deep: '#243C74',
        lavender: '#EAEAFF',
        line: '#E8E7E3',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-system', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 2px rgba(16,24,40,0.05), 0 1px 3px rgba(16,24,40,0.06)',
      },
    },
  },
  plugins: [],
}
