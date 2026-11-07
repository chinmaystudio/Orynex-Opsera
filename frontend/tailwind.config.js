/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // Calm NeuroClass blue scale, anchored on primary #1a73e8 (600)
        // with hover/darker #1765cc (700) and soft tint #e8f0fe (50).
        // `brand` is kept as an alias of the same scale so existing
        // bg-brand-* classes resolve to the same calm blue.
        primary: {
          50: '#E8F0FE',
          100: '#D2E3FC',
          200: '#AECBFA',
          300: '#8AB4F8',
          400: '#669DF6',
          500: '#4285F4',
          600: '#1A73E8',
          700: '#1765CC',
          800: '#174EA6',
          900: '#0F3D82',
        },
        brand: {
          50: '#E8F0FE',
          100: '#D2E3FC',
          200: '#AECBFA',
          300: '#8AB4F8',
          400: '#669DF6',
          500: '#4285F4',
          600: '#1A73E8',
          700: '#1765CC',
          800: '#174EA6',
          900: '#0F3D82',
        },
        accent: {
          400: '#669DF6',
          500: '#4285F4',
          600: '#1A73E8',
        },
        // Application tokens (calm NeuroClass palette).
        appbg: '#F8FAFD',
        surface: '#FFFFFF',
        success: '#188038',
        warning: '#B06000',
        error: '#D93025',
        // Landing page tokens, aligned to the same palette.
        paper: '#F8FAFD',
        ink: '#202124',
        muted: '#5F6368',
        deep: '#174EA6',
        lavender: '#E8F0FE',
        line: '#DADCE0',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-system', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '16px',
        panel: '16px',
      },
      boxShadow: {
        // No elevation on cards. Shadows are reserved for overlays,
        // dropdowns and popovers only.
        card: 'none',
        popover:
          '0 4px 16px rgba(32,33,36,0.12), 0 1px 4px rgba(32,33,36,0.08)',
      },
    },
  },
  plugins: [],
}
