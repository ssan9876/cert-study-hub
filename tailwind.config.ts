import type { Config } from 'tailwindcss';

// Microsoft Fluent-inspired palette: deep navy / slate surfaces with azure accents.
// Dark mode is toggled via the `class` strategy (the <html> element gets `.dark`).
const config: Config = {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#0a0f1f',
          900: '#0d1426',
          800: '#131c33',
          700: '#1b2742',
          600: '#243352',
        },
        azure: {
          50: '#eef6ff',
          100: '#d9ebff',
          200: '#b3d6ff',
          300: '#80b8ff',
          400: '#4d99ff',
          500: '#1a7aff',
          600: '#0061e0',
          700: '#004bb0',
          800: '#003680',
          900: '#002452',
        },
      },
      fontFamily: {
        sans: ['Segoe UI', 'system-ui', 'Avenir', 'Helvetica', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        fluent: '0 2px 8px rgba(0,0,0,0.18), 0 0.5px 2px rgba(0,0,0,0.12)',
        'fluent-lg': '0 8px 28px rgba(0,0,0,0.28)',
      },
      keyframes: {
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(6px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.25s ease-out',
      },
    },
  },
  plugins: [],
};

export default config;
