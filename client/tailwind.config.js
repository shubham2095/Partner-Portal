/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#4f46e5',
          hover: '#4338ca',
          50: '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
        },
        secondary: {
          DEFAULT: '#0f172a',
          50: '#f8fafc',
          100: '#f1f5f9',
        },
        accent: {
          DEFAULT: '#f59e0b',
          hover: '#d97706',
          bg: '#fffbeb',
        },
        success: {
          DEFAULT: '#16a34a',
          bg: '#f0fdf4',
        },
        warning: {
          DEFAULT: '#d97706',
          bg: '#fffbeb',
        },
        danger: {
          DEFAULT: '#dc2626',
          bg: '#fef2f2',
        },
        info: {
          DEFAULT: '#0284c7',
          bg: '#f0f9ff',
        },
        background: '#f8fafc',
        surface: '#ffffff',
        'surface-muted': '#f1f5f9',
        'surface-elevated': '#ffffff',
        border: '#e2e8f0',
        'border-strong': '#cbd5e1',
        'text-primary': '#0f172a',
        'text-secondary': '#475569',
        'text-muted': '#94a3b8',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      borderRadius: {
        DEFAULT: '8px',
        lg: '12px',
        xl: '16px',
      },
      boxShadow: {
        card: '0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)',
        elevated: '0 12px 24px -8px rgba(15, 23, 42, 0.16), 0 4px 8px -2px rgba(15, 23, 42, 0.06)',
        dropdown: '0 8px 16px -4px rgba(15, 23, 42, 0.12), 0 2px 6px -1px rgba(15, 23, 42, 0.06)',
      },
      screens: {
        xs: '480px',
      },
    },
  },
  plugins: [],
}
