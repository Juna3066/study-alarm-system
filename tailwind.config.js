/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    // 1. 扫描根目录下的文件 (App.tsx, index.tsx, main.js 等)，但不深入子目录
    "./*.{js,ts,jsx,tsx}",
    // 2. 扫描 components 文件夹下的所有文件
    "./components/**/*.{js,ts,jsx,tsx}",
    // 3. 扫描 services 文件夹下的所有文件
    "./services/**/*.{js,ts,jsx,tsx}",
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