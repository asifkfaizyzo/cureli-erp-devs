/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        'xs': '475px',
        // sm, md, lg, xl, 2xl are already available by default
      },
      fontFamily: {
        poppins: ["Poppins", "sans-serif"],
        manrope: ["Manrope", "sans-serif"],
        sans: ["Manrope", "sans-serif"],
      },
    },
  },
  plugins: [],
};
