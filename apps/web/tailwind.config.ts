import type { Config } from 'tailwindcss';

/**
 * Tema inspirado no FinTrust UI Kit:
 * - Primário azul #2F80ED, secundário verde #4CE364 / lime #ABE85F
 * - Texto navy #233145, mutado #8E98A7
 * - Fundo de página #F6F7FB, borda #DFE5F1
 * A escala `slate` é remapeada para os tons do kit, então as telas existentes
 * que usam `slate-*` já herdam a nova paleta.
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: '#2F80ED',
          dark: '#2975E8',
          light: '#EAF0F8',
          soft: '#F5F9FF',
        },
        accent: {
          DEFAULT: '#4CE364',
          lime: '#ABE85F',
          green: '#12B76A',
        },
        ink: {
          DEFAULT: '#233145',
          muted: '#8E98A7',
          soft: '#B1B5C3',
          strong: '#141736',
        },
        surface: {
          DEFAULT: '#FFFFFF',
          page: '#F6F7FB',
          soft: '#F8F9FC',
          line: '#DFE5F1',
        },
        state: {
          success: '#12B76A',
          warning: '#F2C94C',
          danger: '#EB5757',
          info: '#2F80ED',
        },
        slate: {
          50: '#F6F7FB',
          100: '#EEF1F7',
          200: '#DFE5F1',
          300: '#C9D2E0',
          400: '#A9B4C4',
          500: '#8E98A7',
          600: '#5D6B80',
          700: '#3A4A61',
          800: '#233145',
          900: '#1A2536',
          950: '#141736',
        },
      },
      fontFamily: {
        sans: [
          'Inter',
          'ui-sans-serif',
          'system-ui',
          '-apple-system',
          'Segoe UI',
          'sans-serif',
        ],
      },
      borderRadius: {
        lg: '0.625rem',
        xl: '0.75rem',
        '2xl': '1rem',
      },
      boxShadow: {
        card: '0 1px 2px rgba(35, 49, 69, 0.04), 0 1px 3px rgba(35, 49, 69, 0.06)',
        pop: '0 12px 32px rgba(35, 49, 69, 0.12)',
      },
    },
  },
  plugins: [],
};

export default config;
