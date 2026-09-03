/** @type {import('tailwindcss').Config} */

// Neutral / surface / semantic-tint tokens are driven by CSS variables (see
// src/index.css) so the whole portal flips to dark mode by toggling one
// `dark` class on <html>. Brand hues (primary violet, accent orange) and the
// solid semantic colours stay fixed — they read well on both themes.
const withVar = (name) => `rgb(var(${name}) / <alpha-value>)`

export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#7c3aed',
          hover: '#6d28d9',
          50: withVar('--c-primary-50'),
          100: '#ede9fe',
          200: '#ddd6fe',
          300: '#c4b5fd',
          400: '#a78bfa',
          500: '#8b5cf6',
          600: '#7c3aed',
          700: '#6d28d9',
          800: '#5b21b6',
          900: '#4c1d95',
        },
        secondary: {
          DEFAULT: '#1e1b2e',
          50: '#f8f8fc',
          100: '#f1f0f7',
        },
        accent: {
          DEFAULT: '#f97316',
          hover: '#ea580c',
          bg: withVar('--c-accent-bg'),
          50: '#fff7ed',
          100: '#ffedd5',
          400: '#fb923c',
          500: '#f97316',
          600: '#ea580c',
          700: '#c2410c',
        },
        success: { DEFAULT: '#059669', hover: '#047857', bg: withVar('--c-success-bg') },
        warning: { DEFAULT: '#d97706', hover: '#b45309', bg: withVar('--c-warning-bg') },
        danger: { DEFAULT: '#e11d48', hover: '#be123c', bg: withVar('--c-danger-bg') },
        info: { DEFAULT: '#0ea5e9', hover: '#0284c7', bg: withVar('--c-info-bg') },
        background: withVar('--c-background'),
        surface: withVar('--c-surface'),
        'surface-muted': withVar('--c-surface-muted'),
        'surface-elevated': withVar('--c-surface-elevated'),
        border: withVar('--c-border'),
        'border-strong': withVar('--c-border-strong'),
        'text-primary': withVar('--c-text-primary'),
        'text-secondary': withVar('--c-text-secondary'),
        'text-muted': withVar('--c-text-muted'),
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'],
        display: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'Segoe UI', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '8px',
        md: '10px',
        lg: '12px',
        xl: '16px',
        '2xl': '20px',
      },
      boxShadow: {
        xs: '0 1px 2px rgba(15, 14, 23, 0.04)',
        card: '0 1px 2px rgba(15, 14, 23, 0.04), 0 1px 3px rgba(15, 14, 23, 0.06)',
        'card-hover': '0 2px 4px -1px rgba(15, 14, 23, 0.06), 0 12px 24px -8px rgba(76, 29, 149, 0.14)',
        elevated: '0 12px 24px -8px rgba(15, 14, 23, 0.20), 0 4px 8px -2px rgba(15, 14, 23, 0.08)',
        dropdown: '0 8px 16px -4px rgba(15, 14, 23, 0.16), 0 2px 6px -1px rgba(15, 14, 23, 0.08)',
        focus: '0 0 0 3px rgba(124, 58, 237, 0.18)',
      },
      backgroundImage: {
        'gradient-brand': 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
        'gradient-brand-vivid': 'linear-gradient(135deg, #7c3aed 0%, #db2777 100%)',
        'gradient-accent': 'linear-gradient(135deg, #fb923c 0%, #f97316 100%)',
      },
      screens: {
        xs: '480px',
      },
      transitionTimingFunction: {
        smooth: 'cubic-bezier(0.4, 0, 0.2, 1)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'fade-in-up': {
          from: { opacity: '0', transform: 'translateY(6px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.2s ease-out both',
        'fade-in-up': 'fade-in-up 0.25s cubic-bezier(0.4, 0, 0.2, 1) both',
      },
    },
  },
  plugins: [],
}
