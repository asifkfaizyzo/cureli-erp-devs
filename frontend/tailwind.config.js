/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        poppins: ["Poppins", "sans-serif"],
        manrope: ["Manrope", "sans-serif"],
        sans: ["Manrope", "sans-serif"], // Makes Manrope the default font
      },
    },
  },
  plugins: [],
};
