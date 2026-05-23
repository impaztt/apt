/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: '#131b2b',
        canvas: '#f6f8fc',
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          500: '#3182f6',
          600: '#1b64da',
          700: '#1554bd',
        },
      },
      boxShadow: {
        card: '0 1px 2px rgba(16, 24, 40, 0.04), 0 8px 26px rgba(15, 23, 42, 0.05)',
      },
    },
  },
  plugins: [],
};
