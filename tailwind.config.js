/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        "primary-yellow": "#FFEA00",
        inactive: "#777873",
        "primary-black": "#171819",
      },
      fontFamily: {
        jakarta: ["Jakarta-Regular", "sans-serif"],
        "jakarta-bold": ["Jakarta-Bold", "sans-serif"],
        "jakarta-semibold": ["Jakarta-SemiBold", "sans-serif"],
      },
    },
  },
  plugins: [],
};
