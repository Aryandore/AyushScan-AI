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
          DEFAULT: '#16a34a',
          dark: '#15803d',
          light: '#22c55e'
        },
        aws: {
          orange: '#FF9900',
          dark: '#232F3E'
        },
        emergency: {
          red: '#dc2626',
          dark: '#b91c1c'
        },
        warning: {
          amber: '#d97706',
          light: '#f59e0b'
        }
      }
    },
  },
  plugins: [],
}
