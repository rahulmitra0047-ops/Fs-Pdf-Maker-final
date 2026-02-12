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
        sans: ['"Inter"', '"Plus Jakarta Sans"', '"Noto Sans Bengali"', 'sans-serif'],
      },
      colors: {
        primary: { 
          DEFAULT: '#6366F1', /* Indigo 500 */
          50: '#EEF2FF', 
          600: '#4F46E5', 
          700: '#4338CA' 
        },
        surface: '#FFFFFF',
        background: '#FAFAFA', /* Very Light Gray */
        border: '#E2E8F0',
        text: {
          primary: '#111827', /* Gray 900 */
          secondary: '#6B7280', /* Gray 500 */
          muted: '#9CA3AF'
        },
        success: 'var(--color-success)',
        error: 'var(--color-error)',
        warning: 'var(--color-warning)'
      },
      borderRadius: {
        'xl': '20px',
        '2xl': '24px',
      },
      boxShadow: {
        'soft': '0 1px 3px rgba(0,0,0,0.05)',
        'lifted': '0 10px 15px -3px rgba(0, 0, 0, 0.05), 0 4px 6px -2px rgba(0, 0, 0, 0.025)',
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