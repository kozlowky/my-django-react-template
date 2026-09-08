/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        sand:      "#F5F0EB",
        cream:     "#FFFFFF",
        charcoal:  { DEFAULT: "#1A1A1A", muted: "#8A8278" },
        terracotta:{ DEFAULT: "#C4956A", dark: "#B08058" },
        border:    "#E8E0D8",
        nav:       "#2A2A2A",
      },
    },
  },
  plugins: [],
};
