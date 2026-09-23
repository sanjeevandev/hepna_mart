/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1B3A5C',
          light: '#2A5A8C',
          dark: '#0F2440',
          50: '#E8EDF3',
          100: '#D1DBE7',
          200: '#A3B7CF',
          300: '#7593B7',
          400: '#476F9F',
          500: '#1B3A5C',
          600: '#162E4A',
          700: '#102337',
          800: '#0B1725',
          900: '#050C12',
        },
        accent: {
          DEFAULT: '#E87A2D',
          light: '#F5A623',
          dark: '#C5621B',
          50: '#FEF3E8',
          100: '#FDE7D1',
          200: '#FBCFA3',
          300: '#F9B775',
          400: '#F79F47',
          500: '#E87A2D',
          600: '#BA6224',
          700: '#8B491B',
          800: '#5D3112',
          900: '#2E1809',
        },
        surface: {
          DEFAULT: '#F8F9FA',
          dark: '#E9ECEF',
          light: '#FFFFFF',
        },
        success: '#22C55E',
        danger: '#EF4444',
        warning: '#F59E0B',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        heading: ['Poppins', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 2px 8px rgba(0, 0, 0, 0.08)',
        'card-hover': '0 8px 24px rgba(0, 0, 0, 0.12)',
        'nav': '0 2px 12px rgba(0, 0, 0, 0.06)',
      },
    },
  },
  plugins: [],
};
