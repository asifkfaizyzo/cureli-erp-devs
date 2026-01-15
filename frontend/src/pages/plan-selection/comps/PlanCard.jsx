// frontend/src/pages/plans/comps/PlanCard.jsx

import { motion } from "framer-motion";
import {
  Users,
  Building2,
  Check,
  Sparkles,
  Gift,
  Loader2,
  Clock,
  Tag,
  ArrowRight,
} from "lucide-react";
import {
  formatPrice,
  getCardTheme,
  generateFeatures,
  getPlanBadge,
  calculateDiscountPercent,
  BILLING,
} from "../../../config/planConfig";

/**
 * PlanCard for Plan Selection Page (Onboarding)
 * Displays a single plan with smooth gradient hover transitions
 */
export default function PlanCard({ plan, onSelect, isSelecting }) {
  const theme = getCardTheme(plan);
  const features = generateFeatures(plan);
  const badge = getPlanBadge(plan);

  // Determine pricing states
  const isEffectivelyFree = plan.price === 0 || plan.is_promo_active;
  const hasPromoWithPrice = plan.is_promo_active && plan.price > 0;

  // Discount calculations (only for non-promo discounts)
  const discountPercent = calculateDiscountPercent(
    plan.compare_at_price,
    plan.price
  );
  const showComparePrice =
    discountPercent && !plan.is_promo_active && plan.price > 0;

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

  const handleClick = () => {
    if (isSelecting) return;
    onSelect(plan);
  };

  return (
    <motion.div
      whileHover={{ y: -4 }}
      className={`
        group relative flex flex-col rounded-2xl
        w-[260px] h-[380px]
        flex-shrink-0
        ${isSelecting ? "opacity-60 pointer-events-none" : ""}
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
          {plan.name}
        </h2>

        {/* Description */}
        <p
          className={`
            text-xs text-center mt-1 line-clamp-2 min-h-[32px]
            transition-colors duration-300
            text-gray-600 group-hover:text-white/80
          `}
        >
          {plan.description || "Perfect for getting started"}
        </p>

        {/* Price Section */}
        <div className="flex flex-col items-center mt-3 mb-2 min-h-[70px]">
          {/* Strike-through Price (Compare At) - for non-promo discounts only */}
          {showComparePrice && (
            <div className="flex items-center gap-2 mb-1">
              <span
                className={`
                  text-xs line-through transition-colors duration-300
                  text-gray-400 group-hover:text-white/50
                `}
              >
                {formatPrice(plan.compare_at_price)}
              </span>
              <span className="text-[10px] font-bold text-green-600 bg-green-100 px-1.5 py-0.5 rounded transition-colors duration-300">
                {discountPercent}% OFF
              </span>
            </div>
          )}

          {/* Main Price */}
          <div className="flex items-baseline gap-1">
            <span
              className={`
                text-3xl font-bold transition-colors duration-300
                ${
                  isEffectivelyFree
                    ? "text-emerald-600 group-hover:text-white"
                    : `${theme.accentColor} group-hover:text-white`
                }
              `}
            >
              {isEffectivelyFree ? "FREE" : formatPrice(plan.price)}
            </span>
            {!isEffectivelyFree && (
              <span
                className={`
                  text-xs transition-colors duration-300
                  text-gray-500 group-hover:text-white/70
                `}
              >
                {BILLING.displayText}
              </span>
            )}
          </div>

          {/* Promo Context - "Then ₹X/year after promo" */}
          {hasPromoWithPrice && (
            <p
              className={`
                text-xs mt-1 text-center transition-colors duration-300
                text-gray-500 group-hover:text-white/70
              `}
            >
              Then{" "}
              <span
                className={`
                  font-bold transition-colors duration-300
                  text-gray-700 group-hover:text-white
                `}
              >
                {formatPrice(plan.price)}
              </span>
              /year after promo
            </p>
          )}
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
            <span>{plan.max_users === -1 ? "∞" : plan.max_users}</span>
          </div>
          <div
            className={`
              flex items-center gap-1.5 text-xs transition-colors duration-300
              text-gray-600 group-hover:text-white/80
            `}
          >
            <Building2 size={14} />
            <span>{plan.max_branches === -1 ? "∞" : plan.max_branches}</span>
          </div>
        </div>

        {/* Divider */}
        <div
          className={`
            h-px w-full my-2 transition-colors duration-300
            bg-gray-300/60 group-hover:bg-white/30
          `}
        />

        {/* Features List - Always exactly 4 items */}
        <div className="flex-1 flex flex-col">
          <ul className="space-y-1.5 flex-1">
            {features.map((feature, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <span
                  className={`
                    flex-shrink-0 transition-colors duration-300
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
                    text-xs leading-tight transition-colors duration-300
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
            onClick={handleClick}
            disabled={isSelecting}
            className={`
              mt-3 w-full py-2.5 rounded-xl text-sm font-semibold
              text-white transition-all duration-300
              shadow-md hover:shadow-lg
              disabled:opacity-50 disabled:cursor-not-allowed
              flex items-center justify-center gap-2
              ${theme.buttonBg}
            `}
          >
            {isSelecting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Processing...
              </>
            ) : isEffectivelyFree ? (
              <>
                Start Free
                <ArrowRight size={16} />
              </>
            ) : (
              <>
                Select Plan
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
}