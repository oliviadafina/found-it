/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        "found-bg": "#f6f6f6",
        "found-dark": "#2e2e2e",
        "found-gray": "#4a4a4a",
        "found-blue": "#5b8fd9",
        "found-blue-light": "#8BB4E0",
        "found-yellow": "#FFD966",
        "found-orange": "#FFB84D",
      }
    },
  },
  plugins: [],
}
