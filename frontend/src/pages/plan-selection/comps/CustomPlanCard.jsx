// frontend/src/pages/plans/comps/CustomPlanCard.jsx

import React from "react";
import { Users, Building2, Check, Sparkles, Mail } from "lucide-react";
import { CARD_THEMES } from "../../../config/planConfig";

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
    <div
      className={`
        group relative flex flex-col rounded-2xl p-5
        shadow-md border-2 transition-all duration-300
        bg-gradient-to-b ${theme.gradient} ${theme.hoverGradient}
        ${theme.borderAccent}
        hover:shadow-xl hover:-translate-y-1
        w-[260px] h-[380px]
        flex-shrink-0
      `}
    >
      {/* Header Badge */}
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

      <div className="flex-1 flex flex-col pt-2">
        {/* Plan Name */}
        <h2 className="text-lg font-bold text-gray-800 group-hover:text-white text-center leading-tight">
          Custom Plan
        </h2>

        {/* Description */}
        <p className="text-xs text-gray-600 group-hover:text-white/80 text-center mt-1 line-clamp-2 min-h-[32px]">
          Need something specific? We'll tailor a plan for your business.
        </p>

        {/* Price Section */}
        <div className="flex flex-col items-center mt-3 mb-2 min-h-[70px] justify-center">
          <span className="text-2xl font-bold text-amber-600 group-hover:text-white">
            Custom Pricing
          </span>
          <p className="text-xs text-gray-500 group-hover:text-white/70 mt-1">
            Based on your requirements
          </p>
        </div>

        {/* Quick Stats */}
        <div className="flex justify-center gap-6 mb-2">
          <div className="flex items-center gap-1.5 text-xs text-gray-600 group-hover:text-white/80">
            <Users size={14} />
            <span>Flexible</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-600 group-hover:text-white/80">
            <Building2 size={14} />
            <span>Flexible</span>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px w-full bg-gray-300/60 group-hover:bg-white/30 my-2" />

        {/* Features List - Exactly 4 items */}
        <div className="flex-1 flex flex-col">
          <ul className="space-y-1.5 flex-1">
            {features.map((feature, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <span className="text-emerald-500 group-hover:text-emerald-300 flex-shrink-0">
                  <Check size={14} />
                </span>
                <span className="text-xs text-gray-700 group-hover:text-white/90 leading-tight">
                  {feature}
                </span>
              </li>
            ))}
          </ul>

          {/* Contact Button */}
          <a
            href="mailto:sales@cureli.com?subject=Custom%20Plan%20Inquiry"
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
    </div>
  );
}
