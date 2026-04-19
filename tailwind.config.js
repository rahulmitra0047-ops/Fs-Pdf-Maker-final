/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./**/*.{js,ts,jsx,tsx}"
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Albert Sans"', 'sans-serif'],
        serif: ['"Newsreader"', 'serif'],
      },
      colors: {
        primary: { 
          DEFAULT: '#8A4F3A',
          50: '#F5EBE7', 
          600: '#7A4532', 
          700: '#643727' 
        },
        surface: '#F0EDE5',
        background: '#F9F6F0',
        border: '#D5D2C9',
        text: {
          primary: '#2C2C2B',
          secondary: '#8A8881',
          muted: '#A5A39B'
        },
        success: 'var(--color-success)',
        error: 'var(--color-error)',
        warning: 'var(--color-warning)'
      },
      borderRadius: {
        'none': '0px',
        'sm': '0px',
        DEFAULT: '0px',
        'md': '0px',
        'lg': '0px',
        'xl': '0px',
        '2xl': '0px',
        '3xl': '0px',
      },
      boxShadow: {
        'sm': 'none',
        DEFAULT: 'none',
        'md': 'none',
        'lg': 'none',
        'xl': 'none',
        '2xl': 'none',
        'inner': 'none',
        'soft': 'none',
        'lifted': 'none',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'fade-out': 'fadeOut 0.3s ease-in forwards',
        'slide-up': 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
        'zoom-in-95': 'zoomIn95 0.2s ease-out forwards',
        'slide-in-from-top-1': 'slideInFromTop1 0.3s ease-out forwards',
        'slide-in-from-top-2': 'slideInFromTop2 0.3s ease-out forwards',
        'slide-in-from-bottom-2': 'slideInFromBottom2 0.3s ease-out forwards',
        'slide-in-from-right-4': 'slideInFromRight4 0.3s ease-out forwards',
      },
      keyframes: {
        fadeIn: { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        fadeOut: { '0%': { opacity: '1' }, '100%': { opacity: '0' } },
        slideUp: { '0%': { transform: 'translateY(10px)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        zoomIn95: { '0%': { transform: 'scale(0.95)', opacity: '0' }, '100%': { transform: 'scale(1)', opacity: '1' } },
        slideInFromTop1: { '0%': { transform: 'translateY(-0.25rem)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        slideInFromTop2: { '0%': { transform: 'translateY(-0.5rem)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        slideInFromBottom2: { '0%': { transform: 'translateY(0.5rem)', opacity: '0' }, '100%': { transform: 'translateY(0)', opacity: '1' } },
        slideInFromRight4: { '0%': { transform: 'translateX(1rem)', opacity: '0' }, '100%': { transform: 'translateX(0)', opacity: '1' } },
      }
    }
  },
  plugins: [],
}