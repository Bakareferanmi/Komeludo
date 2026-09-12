/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        tomato: "#FF6347",
        tomatoDark: "#D9432D",
        tomatoLight: "#FFE8E3",
        ink: "#1F1B1A",
        // player colors — punchier, distinct
        rosePlayer: "#FF6347",
        blushPlayer: "#3B82F6",
        goldPlayer: "#FACC15",
        ivoryPlayer: "#22C55E",
      },
      fontFamily: {
        display: ["Poppins", "sans-serif"],
        body: ["Poppins", "sans-serif"],
      },
    },
  },
  plugins: [],
};
