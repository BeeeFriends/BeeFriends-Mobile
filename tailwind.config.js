/** @type {import('tailwindcss').Config} */
module.exports = {
  // Pastikan path ini mencakup semua file komponen/layar Anda
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        "primary-yellow": "#FFEA00",
        inactive: "#777873",
        "primary-black": "#171819",
      },
      fontFamily: {
        // Nama "jakarta" ini yang akan dipanggil di className
        jakarta: ["Jakarta-Regular", "sans-serif"],
        "jakarta-bold": ["Jakarta-Bold", "sans-serif"],
        "jakarta-semibold": ["Jakarta-Semibold", "sans-serif"],
      },
    },
  },
  plugins: [],
};
