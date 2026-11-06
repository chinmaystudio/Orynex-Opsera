/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        // OPRAQ primary purple scale, anchored on #6D3CEB (600) with the
        // accent #8B5CF6 in the 400 slot. `brand` is kept as an alias of the
        // same scale (existing app + landing classes use bg-brand-*), and
        // brand.600 is now #6D3CEB so the whole product shares one primary.
        primary: {
          50: '#F5F1FE',
          100: '#EDE7FD',
          200: '#DCCFFB',
          300: '#C0A5F7',
          400: '#8B5CF6',
          500: '#7A4CF0',
          600: '#6D3CEB',
          700: '#5B2FD1',
          800: '#4A26AB',
          900: '#3C2089',
        },
        brand: {
          50: '#F5F1FE',
          100: '#EDE7FD',
          200: '#DCCFFB',
          300: '#C0A5F7',
          400: '#8B5CF6',
          500: '#7A4CF0',
          600: '#6D3CEB',
          700: '#5B2FD1',
          800: '#4A26AB',
          900: '#3C2089',
        },
        accent: {
          400: '#A78BFA',
          500: '#8B5CF6',
          600: '#7C3AED',
        },
        // Application tokens (OPRAQ enterprise UI spec §3).
        appbg: '#F5F6FA',
        surface: '#FFFFFF',
        warning: '#D97706',
        // Landing page palette (public marketing page). `ink`, `muted` and
        // `line` were aligned to the application tokens in Stage 1 of the
        // enterprise redesign — the values are near-identical in practice
        // (#151827 ink, #64748B muted, #E5E7EB line) so the landing page
        // composition is unchanged.
        paper: '#F8F8F6',
        ink: '#151827',
        muted: '#64748B',
        deep: '#243C74',
        lavender: '#EAEAFF',
        line: '#E5E7EB',
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-system', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        card: '12px',
        panel: '14px',
      },
      boxShadow: {
        // Subtle card shadow only — no decorative elevation in the app UI.
        card: '0 1px 2px rgba(21,24,39,0.04), 0 1px 3px rgba(21,24,39,0.05)',
        popover:
          '0 8px 24px rgba(21,24,39,0.10), 0 2px 6px rgba(21,24,39,0.06)',
      },
    },
  },
  plugins: [],
}
