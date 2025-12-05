/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./floating.html",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Microsoft YaHei"', '"Segoe UI"', 'sans-serif'],
      }
    },
  },
  plugins: [],
}