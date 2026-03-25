// frontend/src/pages/plans/comps/CustomPlanCard.jsx

import { motion } from "framer-motion";
import { Users, Building2, Check, Sparkles, Mail } from "lucide-react";
import { CARD_THEMES } from "../../../config/planConfig";

/**
 * CustomPlanCard for Plan Selection Page
 * Static card with smooth gradient hover transitions
 */
export default function CustomPlanCard() {
  const theme = CARD_THEMES.custom;

  // Exactly 4 features to match other cards
  const features = [
    "Unlimited Users & Branches",
    "Priority 24/7 Support",
    "Custom Integrations",
    "Dedicated Account Manager",
  ];

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className={`
        group relative flex flex-col rounded-2xl
        w-[260px] h-[380px]
        flex-shrink-0
      `}
    >
      {/* ============================================ */}
      {/* BACKGROUND LAYERS - For smooth transitions */}
      {/* ============================================ */}

      {/* Base gradient layer - always visible */}
      <div
        className={`
          absolute inset-0 rounded-2xl
          bg-gradient-to-b ${theme.gradient}
          border-2 shadow-md
          transition-shadow duration-300
          group-hover:shadow-xl
          ${theme.borderAccent}
        `}
      />

      {/* Hover gradient overlay - fades in smoothly */}
      <div
        className={`
          absolute inset-0 rounded-2xl
          bg-gradient-to-b ${theme.hoverGradient}
          opacity-0 group-hover:opacity-100
          transition-opacity duration-300 ease-out
          pointer-events-none
        `}
      />

      {/* ============================================ */}
      {/* HEADER BADGE */}
      {/* ============================================ */}

      <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
        <div
          className={`
            whitespace-nowrap flex items-center gap-1
            px-3 py-1 text-white text-[10px] font-bold 
            rounded-full shadow-lg uppercase tracking-wide
            ${theme.badgeBg}
          `}
        >
          <Sparkles size={10} />
          TAILORED FOR YOU
        </div>
      </div>

      {/* ============================================ */}
      {/* CARD CONTENT */}
      {/* ============================================ */}

      <div className="relative z-10 flex-1 flex flex-col p-5 pt-7">
        {/* Plan Name */}
        <h2
          className={`
            text-lg font-bold text-center leading-tight
            transition-colors duration-300
            text-gray-800 group-hover:text-white
          `}
        >
          Custom Plan
        </h2>

        {/* Description */}
        <p
          className={`
            text-xs text-center mt-1 line-clamp-2 min-h-[32px]
            transition-colors duration-300
            text-gray-600 group-hover:text-white/80
          `}
        >
          Need something specific? We'll tailor a plan for your business.
        </p>

        {/* Price Section */}
        <div className="flex flex-col items-center mt-3 mb-2 min-h-[70px] justify-center">
          <span
            className={`
              text-2xl font-bold transition-colors duration-300
              text-amber-600 group-hover:text-white
            `}
          >
            Custom Pricing
          </span>
          <p
            className={`
              text-xs mt-1 transition-colors duration-300
              text-gray-500 group-hover:text-white/70
            `}
          >
            Based on your requirements
          </p>
        </div>

        {/* Quick Stats */}
        <div className="flex justify-center gap-6 mb-2">
          <div
            className={`
              flex items-center gap-1.5 text-xs transition-colors duration-300
              text-gray-600 group-hover:text-white/80
            `}
          >
            <Users size={14} />
            <span>Flexible</span>
          </div>
          <div
            className={`
              flex items-center gap-1.5 text-xs transition-colors duration-300
              text-gray-600 group-hover:text-white/80
            `}
          >
            <Building2 size={14} />
            <span>Flexible</span>
          </div>
        </div>

        {/* Divider */}
        <div
          className={`
            h-px w-full my-2 transition-colors duration-300
            bg-gray-300/60 group-hover:bg-white/30
          `}
        />

        {/* Features List - Exactly 4 items */}
        <div className="flex-1 flex flex-col">
          <ul className="space-y-1.5 flex-1">
            {features.map((feature, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <span
                  className={`
                    flex-shrink-0 transition-colors duration-300
                    text-emerald-500 group-hover:text-emerald-300
                  `}
                >
                  <Check size={14} />
                </span>
                <span
                  className={`
                    text-xs leading-tight transition-colors duration-300
                    text-gray-700 group-hover:text-white/90
                  `}
                >
                  {feature}
                </span>
              </li>
            ))}
          </ul>

          {/* Contact Button */}
          <a
            href="mailto:info@cureliofficial.com?subject=Custom%20Plan%20Inquiry"
            className={`
              mt-3 w-full py-2.5 rounded-xl text-sm font-semibold
              text-white transition-all duration-300
              shadow-md hover:shadow-lg
              flex items-center justify-center gap-2
              ${theme.buttonBg}
            `}
          >
            <Mail size={16} />
            Contact Sales
          </a>
        </div>
      </div>
    </motion.div>
  );
}