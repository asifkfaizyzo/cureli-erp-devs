/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  safelist: [
    // ============================================
    // PLAN CARD THEME CLASSES
    // ============================================

    // Free theme (Green)
    "from-emerald-50",
    "to-teal-100",
    "hover:from-emerald-600",
    "hover:to-teal-600",
    "border-emerald-300",
    "bg-emerald-600",
    "hover:bg-emerald-700",
    "text-emerald-600",

    // Featured theme (Purple)
    "from-violet-50",
    "to-purple-100",
    "hover:from-violet-600",
    "hover:to-purple-600",
    "border-violet-300",
    "bg-violet-600",
    "hover:bg-violet-700",
    "text-violet-600",

    // Default theme (Navy Blue)
    "from-blue-50",
    "to-indigo-100",
    "hover:from-[#000060]",
    "hover:to-[#000080]",
    "border-blue-200",
    "bg-[#000060]",
    "hover:bg-[#000080]",
    "text-[#000060]",

    // Custom theme (Orange)
    "from-amber-50",
    "to-orange-100",
    "hover:from-amber-600",
    "hover:to-orange-600",
    "border-amber-300",
    "bg-amber-600",
    "hover:bg-amber-700",
    "text-amber-600",
    "border-dashed",

    // Group hover button classes
    "group-hover:bg-white",
    "group-hover:text-emerald-600",
    "group-hover:text-violet-600",
    "group-hover:text-[#000060]",
    "group-hover:text-amber-600",

    // Common utility classes
    "text-emerald-500",
    "text-emerald-300",
    "text-amber-500",
    "text-amber-300",
    "text-green-600",
    "text-green-300",
    "bg-green-100",
    "bg-green-500/30",
  ],
  theme: {
    extend: {
      screens: {
        'xs': '375px',   // iPhone SE, small phones
        'sm': '640px',   // Large phones, small tablets  
        'md': '768px',   // Tablets
        'lg': '1024px',  // Laptops
        'xl': '1280px',  // Desktops
        '2xl': '1536px', // Large screens
      },
      fontFamily: {
        poppins: ["Poppins", "sans-serif"],
        manrope: ["Manrope", "sans-serif"],
        sans: ["Manrope", "sans-serif"],
      },
      spacing: {
        'safe': 'env(safe-area-inset-bottom)',
      },
    },
  },
  plugins: [],
};