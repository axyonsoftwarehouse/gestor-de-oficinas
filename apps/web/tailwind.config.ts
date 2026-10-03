import type { Config } from 'tailwindcss';

/**
 * Tema inspirado no FinTrust UI Kit, com suporte a Light/Dark via CSS variables.
 * Os valores ficam em globals.css (`:root` e `.dark`). A escala `slate` também é
 * remapeada para os tons do kit, então as telas existentes herdam o tema inteiro.
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
        slate: {
          50: rgb('--slate-50'),
          100: rgb('--slate-100'),
          200: rgb('--slate-200'),
          300: rgb('--slate-300'),
          400: rgb('--slate-400'),
          500: rgb('--slate-500'),
          600: rgb('--slate-600'),
          700: rgb('--slate-700'),
          800: rgb('--slate-800'),
          900: rgb('--slate-900'),
          950: rgb('--slate-950'),
        },
      },
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'Segoe UI', 'sans-serif'],
      },
      borderRadius: {
        lg: '0.625rem',
        xl: '0.75rem',
        '2xl': '1rem',
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
