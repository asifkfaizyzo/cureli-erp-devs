// frontend/src/pages/plans/comps/PlanCard.jsx

import React from "react";
import {
  Users,
  Building2,
  Check,
  Sparkles,
  Gift,
  Loader2,
  Clock,
  Tag,
} from "lucide-react";
import {
  formatPrice,
  getCardTheme,
  generateFeatures,
  getPlanBadge,
  calculateDiscountPercent,
  BILLING,
} from "../../../config/planConfig";

export default function PlanCard({ plan, onSelect, isSelecting }) {
  const theme = getCardTheme(plan);
  const features = generateFeatures(plan);
  const badge = getPlanBadge(plan);

  // Determine pricing states
  const isEffectivelyFree = plan.price === 0 || plan.is_promo_active;
  const hasPromoWithPrice = plan.is_promo_active && plan.price > 0;
  
  // Discount calculations (only for non-promo discounts)
  const discountPercent = calculateDiscountPercent(plan.compare_at_price, plan.price);
  const showComparePrice = discountPercent && !plan.is_promo_active && plan.price > 0;

  // Badge icon based on type
  const getBadgeIcon = (type) => {
    switch (type) {
      case "bonus":
        return <Gift size={10} />;
      case "promo":
        return <Clock size={10} />;
      case "discount":
        return <Tag size={10} />;
      default:
        return <Sparkles size={10} />;
    }
  };

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
      {badge && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <div
            className={`
              whitespace-nowrap flex items-center gap-1
              px-3 py-1 text-white text-[10px] font-bold 
              rounded-full shadow-lg uppercase tracking-wide
              ${badge.bgColor}
            `}
          >
            {getBadgeIcon(badge.type)}
            {badge.text}
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col pt-2">
        {/* Plan Name */}
        <h2 className="text-lg font-bold text-gray-800 group-hover:text-white text-center leading-tight">
          {plan.name}
        </h2>

        {/* Description */}
        <p className="text-xs text-gray-600 group-hover:text-white/80 text-center mt-1 line-clamp-2 min-h-[32px]">
          {plan.description || "Perfect for getting started"}
        </p>

        {/* Price Section */}
        <div className="flex flex-col items-center mt-3 mb-2 min-h-[70px]">
          {/* Strike-through Price (Compare At) - for non-promo discounts only */}
          {showComparePrice && (
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs text-gray-400 line-through group-hover:text-white/50">
                {formatPrice(plan.compare_at_price)}
              </span>
              <span className="text-[10px] font-bold text-green-600 group-hover:text-green-300 bg-green-100 group-hover:bg-green-500/30 px-1.5 py-0.5 rounded">
                {discountPercent}% OFF
              </span>
            </div>
          )}

          {/* Main Price */}
          <div className="flex items-baseline gap-1">
            <span
              className={`
                text-3xl font-bold
                ${isEffectivelyFree ? "text-emerald-600" : theme.accentColor}
                group-hover:text-white
              `}
            >
              {isEffectivelyFree ? "FREE" : formatPrice(plan.price)}
            </span>
            {!isEffectivelyFree && (
              <span className="text-xs text-gray-500 group-hover:text-white/70">
                {BILLING.displayText}
              </span>
            )}
          </div>

          {/* Promo Context - "Then ₹X/year after promo" with bold price */}
          {hasPromoWithPrice && (
            <p className="text-xs text-gray-500 group-hover:text-white/70 mt-1 text-center">
              Then{" "}
              <span className="font-bold text-gray-700 group-hover:text-white">
                {formatPrice(plan.price)}
              </span>
              /year after promo
            </p>
          )}
        </div>

        {/* Quick Stats */}
        <div className="flex justify-center gap-6 mb-2">
          <div className="flex items-center gap-1.5 text-xs text-gray-600 group-hover:text-white/80">
            <Users size={14} />
            <span>{plan.max_users === -1 ? "∞" : plan.max_users}</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-gray-600 group-hover:text-white/80">
            <Building2 size={14} />
            <span>{plan.max_branches === -1 ? "∞" : plan.max_branches}</span>
          </div>
        </div>

        {/* Divider */}
        <div className="h-px w-full bg-gray-300/60 group-hover:bg-white/30 my-2" />

        {/* Features List - Always exactly 4 items */}
        <div className="flex-1 flex flex-col">
          <ul className="space-y-1.5 flex-1">
            {features.map((feature, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <span
                  className={`
                    flex-shrink-0
                    ${
                      feature.highlight
                        ? "text-amber-500 group-hover:text-amber-300"
                        : "text-emerald-500 group-hover:text-emerald-300"
                    }
                  `}
                >
                  {feature.highlight ? <Gift size={14} /> : <Check size={14} />}
                </span>
                <span
                  className={`
                    text-xs leading-tight
                    ${
                      feature.highlight
                        ? "font-semibold text-gray-800 group-hover:text-white"
                        : "text-gray-700 group-hover:text-white/90"
                    }
                  `}
                >
                  {feature.text}
                </span>
              </li>
            ))}
          </ul>

          {/* Select Button */}
          <button
            onClick={() => onSelect(plan)}
            disabled={isSelecting}
            className={`
              mt-3 w-full py-2.5 rounded-xl text-sm font-semibold
              text-white transition-all duration-300
              shadow-md hover:shadow-lg
              disabled:opacity-50 disabled:cursor-not-allowed 
              ${theme.buttonBg}
            `}
          >
            {isSelecting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                Processing...
              </span>
            ) : isEffectivelyFree ? (
              "Start Free"
            ) : (
              "Select Plan"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}