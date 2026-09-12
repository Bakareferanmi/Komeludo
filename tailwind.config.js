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
        rosePlayer: "#FF6347",
        blushPlayer: "#3B82F6",
        goldPlayer: "#FACC15",
        ivoryPlayer: "#22C55E",
      },
      fontFamily: {
        display: ["Poppins", "sans-serif"],
        body: ["Poppins", "sans-serif"],
      },
      backgroundImage: {
        "tomato-gradient": "linear-gradient(135deg, #FF6347 0%, #D9432D 100%)",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-8px)" },
        },
        fadeInUp: {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        popIn: {
          "0%": { opacity: "0", transform: "scale(0.92)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        blobMove: {
          "0%, 100%": { transform: "translate(0,0) scale(1)" },
          "50%": { transform: "translate(12px,-12px) scale(1.06)" },
        },
      },
      animation: {
        float: "float 3s ease-in-out infinite",
        fadeInUp: "fadeInUp 0.55s ease-out both",
        popIn: "popIn 0.45s cubic-bezier(0.34,1.56,0.64,1) both",
        blobMove: "blobMove 9s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
