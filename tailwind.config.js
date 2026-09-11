/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        blush: "#FFE4EC",
        rose: "#E85D75",
        roseDark: "#C13A56",
        goldrose: "#D4A574",
        ivory: "#FFF8F0",
        plum: "#4A2B3C",
        rosePlayer: "#E85D75",
        blushPlayer: "#F7B2C4",
        goldPlayer: "#D4A574",
        ivoryPlayer: "#F5F0E8",
      },
      fontFamily: {
        display: ["Playfair Display", "serif"],
        body: ["Poppins", "sans-serif"],
      },
      backgroundImage: {
        "romance-gradient": "linear-gradient(135deg, #FFE4EC 0%, #FFF8F0 50%, #F7DCE8 100%)",
      },
    },
  },
  plugins: [],
};
