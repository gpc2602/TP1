/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      colors: {
        base: {
          bg: "#0F1620",
          surface: "#182231",
          line: "#2A3647",
          text: "#E8EDF3",
          muted: "#8A9AAE",
        },
        risk: {
          high: "#E8543A",
          mid: "#D9A441",
          low: "#3D9970",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        display: ["'Instrument Serif'", "serif"],
      },
    },
  },
  plugins: [],
}
