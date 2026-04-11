/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#3CC2B1',
          light: '#5dd0c1',
          dark: '#2fa898',
        },
        accent: {
          DEFAULT: '#FBB829',
          light: '#fcc953',
          dark: '#e0a020',
        },
        elm: {
          DEFAULT: '#1B6862',
          light: '#237870',
          dark: '#134e4a',
          deeper: '#0f3d3a',
        },
      },
      borderRadius: {
        'xl': '12px',
        '2xl': '16px',
      },
      boxShadow: {
        'card': '0 2px 16px 0 rgba(27,104,98,0.08)',
        'card-hover': '0 8px 32px 0 rgba(27,104,98,0.16)',
        'glow-primary': '0 0 20px rgba(60,194,177,0.3)',
        'glow-accent': '0 0 20px rgba(251,184,41,0.4)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 3s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        }
      }
    },
  },
  plugins: [],
}
