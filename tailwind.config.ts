export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      fontFamily: {
        sans: ["Roboto", "system-ui", "sans-serif"],
        display: ["Outfit", "system-ui", "sans-serif"],
      },
      colors: {
        padding: {
          DEFAULT: "#ef4444",
          light: "#fecaca",
        },
        vtable: {
          DEFAULT: "#6b7280",
          light: "#d1d5db",
        },
      },
    },
  },
  plugins: [],
};
