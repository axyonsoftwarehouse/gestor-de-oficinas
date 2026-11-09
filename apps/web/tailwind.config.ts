import type { Config } from 'tailwindcss';

/**
 * Tema inspirado no FinTrust UI Kit, com suporte a Light/Dark via CSS variables.
 * Os valores ficam em globals.css (`:root` e `.dark`). Use sempre os tokens
 * (`ink`, `surface`, `brand`, `state`), nunca cores cruas do Tailwind.
 */
const rgb = (variable: string): string => `rgb(var(${variable}) / <alpha-value>)`;

const config: Config = {
  darkMode: 'class',
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: rgb('--brand'),
          dark: rgb('--brand-dark'),
          light: rgb('--brand-light'),
          soft: rgb('--brand-soft'),
        },
        accent: {
          DEFAULT: rgb('--accent'),
          lime: rgb('--accent-lime'),
          green: rgb('--accent-green'),
        },
        ink: {
          DEFAULT: rgb('--ink'),
          muted: rgb('--ink-muted'),
          soft: rgb('--ink-soft'),
          strong: rgb('--ink-strong'),
        },
        surface: {
          DEFAULT: rgb('--surface'),
          page: rgb('--surface-page'),
          soft: rgb('--surface-soft'),
          line: rgb('--surface-line'),
        },
        state: {
          success: rgb('--state-success'),
          warning: rgb('--state-warning'),
          danger: rgb('--state-danger'),
          info: rgb('--state-info'),
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      borderRadius: {
        lg: '0.625rem',
        xl: '0.75rem',
        '2xl': '1rem',
      },
      keyframes: {
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'pop-in': {
          from: { opacity: '0', transform: 'translate(-50%, 6px) scale(0.98)' },
          to: { opacity: '1', transform: 'translate(-50%, 0) scale(1)' },
        },
        'slide-in-left': { from: { transform: 'translateX(-100%)' }, to: { transform: 'translateX(0)' } },
      },
      animation: {
        'fade-in': 'fade-in 150ms ease-out',
        'pop-in': 'pop-in 150ms ease-out',
        'slide-in-left': 'slide-in-left 200ms ease-out',
      },
      boxShadow: {
        card: '0 1px 2px rgba(35, 49, 69, 0.04), 0 1px 3px rgba(35, 49, 69, 0.06)',
        pop: '0 12px 32px rgba(15, 20, 30, 0.28)',
      },
    },
  },
  plugins: [],
};

export default config;
