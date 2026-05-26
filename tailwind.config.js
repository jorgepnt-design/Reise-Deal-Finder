/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: "#081633",
        night: "#061024",
        gold: "#d6a84f",
        ember: "#c9413d",
        pitch: "#31d37f",
        ice: "#f6f8fb",
      },
      boxShadow: {
        glow: "0 18px 60px rgba(214, 168, 79, 0.18)",
      },
    },
  },
  plugins: [],
};
