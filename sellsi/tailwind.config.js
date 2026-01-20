/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2E52B2',
        secondary: '#F59E0B',
      },
      // Custom screens aligned with src/styles/theme.js
      screens: {
        xs: '0px',//mobile pequeño
        sm: '412px',  //mobile grande
        mini: '576px', //tablet
        md: '768px',// Notebook pequeño
        mac: '1280px', //mac
        lg: '1700px', //1080p
        xl: '2160px',// 2k
      },
    },
  },
  plugins: [],
} 
