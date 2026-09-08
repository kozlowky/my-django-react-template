/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{ts,tsx}",
    "../../packages/shared-ui/src/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sand: "#F5F5F5",
        cream: "#FFFFFF",
        charcoal: { DEFAULT: "#1A1A1A", muted: "#8A8278" },
        terracotta: { DEFAULT: "#E46D41", dark: "#C95930" },
        border: "#E8E0D8",
        nav: "#2A2A2A",
      },
      borderRadius: { lg: "16px", md: "12px" },
      fontFamily: {
        heading: ['"Space Grotesk"', "sans-serif"],
        sans: ['"DM Sans"', 'sans-serif'],
        logo: ['"Hachi Maru Pop"', "cursive"],
      },
    },
  },
  plugins: [],
};
