// frontend/src/pages/settings/plans/comps/PlanCard.jsx

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Building2,
  Check,
  Gift,
  Sparkles,
  ArrowRight,
  Loader2,
  Clock,
  Tag,
  Crown,
} from "lucide-react";
import {
  formatPrice,
  getCardTheme,
  generateFeatures,
  getPlanBadge,
  calculateDiscountPercent,
  BILLING,
  CARD_THEMES,
} from "../../../../config/planConfig";
import { analyzePlanChange } from "../../../../utils/planChangeUtils";

/**
 * PlanCard for Upgrade Page
 * Displays a single plan with upgrade/downgrade/renew/current state
 * 
 * ⚠️ FIXES APPLIED:
 * - Smooth gradient transitions using overlay approach
 * - FREE text visibility on hover (green cards)
 * - Lighter featured plan hover colors
 * - Current plan standout theme with golden accent
 */
const PlanCard = ({ plan, currentPlan, usage, onSelect, disabled }) => {
  const theme = getCardTheme(plan);
  const features = generateFeatures(plan);
  const badge = getPlanBadge(plan);

  // Pricing states
  const isEffectivelyFree = plan.price === 0 || plan.is_promo_active;
  const hasPromoWithPrice = plan.is_promo_active && plan.price > 0;

  // Discount calculations (only for non-promo discounts)
  const discountPercent = calculateDiscountPercent(
    plan.compare_at_price,
    plan.price
  );
  const showComparePrice =
    discountPercent && !plan.is_promo_active && plan.price > 0;

  // Determine relationship to current plan
  const analysis = useMemo(() => {
    if (!currentPlan) {
      return { direction: "select", isCurrent: false };
    }

    const result = analyzePlanChange(currentPlan, plan, usage);

    return {
      ...result,
      isCurrent: currentPlan.plan_id === plan.plan_id,
    };
  }, [currentPlan, plan, usage]);

  const isCurrent = analysis.isCurrent;
  const direction = analysis.direction;

  // Should this card have hover effects?
  const canHover = !isCurrent || direction === "renew";

  // Button config
  const getButtonConfig = () => {
    if (isCurrent && direction !== "renew") {
      return {
        text: "Current Plan",
        className: "bg-gray-200 text-gray-500 cursor-not-allowed",
        disabled: true,
      };
    }

    if (direction === "renew") {
      return {
        text: "Renew Plan",
        className: "bg-emerald-600 hover:bg-emerald-700 text-white",
        disabled: false,
      };
    }

    if (direction === "upgrade") {
      return {
        text: "Upgrade Plan",
        className: "bg-emerald-600 hover:bg-emerald-700 text-white",
        disabled: false,
      };
    }

    if (direction === "downgrade") {
      return {
        text: "Choose Plan",
        className: "bg-orange-500 hover:bg-orange-600 text-white",
        disabled: false,
      };
    }

    return {
      text: "Select Plan",
      className: theme.buttonBg,
      disabled: false,
    };
  };

  const buttonConfig = getButtonConfig();

  const handleClick = () => {
    if (buttonConfig.disabled || disabled) return;
    onSelect(plan);
  };

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
    <motion.div
      whileHover={canHover ? { y: -4 } : {}}
      className={`
        group relative flex flex-col rounded-2xl
        w-[260px] h-[380px]
        flex-shrink-0
        ${disabled ? "opacity-60 pointer-events-none" : ""}
      `}
    >
      {/* ============================================ */}
      {/* BACKGROUND LAYERS - For smooth transitions */}
      {/* ============================================ */}
      
      {/* Base gradient layer - always visible */}
      <div
        className={`
          absolute inset-0 rounded-2xl
          bg-gradient-to-b ${isCurrent ? CARD_THEMES.current.gradient : theme.gradient}
          border-2 shadow-md
          transition-shadow duration-300
          ${canHover ? "group-hover:shadow-xl" : ""}
          ${
            isCurrent
              ? `${CARD_THEMES.current.borderAccent} ring-2 ${CARD_THEMES.current.glowColor}`
              : theme.borderAccent
          }
        `}
      />

      {/* Hover gradient overlay - fades in smoothly */}
      {canHover && !isCurrent && (
        <div
          className={`
            absolute inset-0 rounded-2xl
            bg-gradient-to-b ${theme.hoverGradient}
            opacity-0 group-hover:opacity-100
            transition-opacity duration-300 ease-out
            pointer-events-none
          `}
        />
      )}

      

      {/* ============================================ */}
      {/* HEADER BADGE */}
      {/* ============================================ */}
      
      {isCurrent ? (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <div className={`
            whitespace-nowrap flex items-center gap-1.5 px-3 py-1 
            ${CARD_THEMES.current.badgeBg}
            text-white text-[10px] font-bold rounded-full shadow-lg uppercase tracking-wide
          `}>
            <Crown size={10} />
            CURRENT PLAN
          </div>
        </div>
      ) : badge ? (
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
      ) : null}

      {/* ============================================ */}
      {/* CARD CONTENT */}
      {/* ============================================ */}
      
      <div className="relative z-10 flex-1 flex flex-col p-5 pt-7">
        {/* Plan Name */}
        <h2
          className={`
            text-lg font-bold text-center leading-tight
            transition-colors duration-300
            ${
              isCurrent
                ? CARD_THEMES.current.accentColor
                : "text-gray-800 group-hover:text-white"
            }
          `}
        >
          {plan.name}
        </h2>

        {/* Description */}
        <p
          className={`
            text-xs text-center mt-1 line-clamp-2 min-h-[32px]
            transition-colors duration-300
            ${
              isCurrent
                ? "text-amber-700"
                : "text-gray-600 group-hover:text-white/80"
            }
          `}
        >
          {plan.description || "Perfect for getting started"}
        </p>

        {/* Price Section */}
        <div className="flex flex-col items-center mt-3 mb-2 min-h-[70px]">
          {/* Strike-through Price (Compare At) */}
          {showComparePrice && (
            <div className="flex items-center gap-2 mb-1">
              <span className={`
                text-xs line-through transition-colors duration-300
                ${isCurrent ? "text-amber-600/60" : "text-gray-400 group-hover:text-white/50"}
              `}>
                {formatPrice(plan.compare_at_price)}
              </span>
              <span className="text-[10px] font-bold text-green-600  bg-green-100  px-1.5 py-0.5 rounded transition-colors duration-300">
                {discountPercent}% OFF
              </span>
            </div>
          )}

          {/* Main Price - ⚠️ FIXED: Added group-hover:text-white for FREE text */}
          <div className="flex items-baseline gap-1">
            <span
              className={`
                text-3xl font-bold transition-colors duration-300
                ${
                  isEffectivelyFree
                    ? isCurrent
                      ? "text-amber-600"
                      : "text-emerald-600 group-hover:text-white" // ⚠️ FIX: White on hover
                    : isCurrent
                    ? CARD_THEMES.current.accentColor
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
                  ${
                    isCurrent
                      ? "text-amber-600"
                      : "text-gray-500 group-hover:text-white/70"
                  }
                `}
              >
                {BILLING.displayText}
              </span>
            )}
          </div>

          {/* Promo Context */}
          {hasPromoWithPrice && (
            <p
              className={`
                text-xs mt-1 text-center transition-colors duration-300
                ${
                  isCurrent
                    ? "text-amber-600"
                    : "text-gray-500 group-hover:text-white/70"
                }
              `}
            >
              Then{" "}
              <span
                className={`
                  font-bold transition-colors duration-300
                  ${
                    isCurrent
                      ? "text-amber-700"
                      : "text-gray-700 group-hover:text-white"
                  }
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
              ${
                isCurrent
                  ? "text-amber-700"
                  : "text-gray-600 group-hover:text-white/80"
              }
            `}
          >
            <Users size={14} />
            <span>{plan.max_users === -1 ? "∞" : plan.max_users}</span>
          </div>
          <div
            className={`
              flex items-center gap-1.5 text-xs transition-colors duration-300
              ${
                isCurrent
                  ? "text-amber-700"
                  : "text-gray-600 group-hover:text-white/80"
              }
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
            ${
              isCurrent
                ? "bg-amber-200"
                : "bg-gray-300/60 group-hover:bg-white/30"
            }
          `}
        />

        {/* Features List */}
        <div className="flex-1 flex flex-col">
          <ul className="space-y-1.5 flex-1">
            {features.map((feature, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <span
                  className={`
                    flex-shrink-0 transition-colors duration-300
                    ${
                      feature.highlight
                        ? isCurrent
                          ? "text-orange-500"
                          : "text-amber-500 group-hover:text-amber-300"
                        : isCurrent
                        ? "text-amber-500"
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
                        ? isCurrent
                          ? "font-semibold text-amber-800"
                          : "font-semibold text-gray-800 group-hover:text-white"
                        : isCurrent
                        ? "text-amber-700"
                        : "text-gray-700 group-hover:text-white/90"
                    }
                  `}
                >
                  {feature.text}
                </span>
              </li>
            ))}
          </ul>

          {/* Action Button */}
          <button
            onClick={handleClick}
            disabled={buttonConfig.disabled || disabled}
            className={`
              mt-3 w-full py-2.5 rounded-xl text-sm font-semibold
              transition-all duration-300
              disabled:cursor-not-allowed
              shadow-md hover:shadow-lg
              flex items-center justify-center gap-2
              ${buttonConfig.className}
            `}
          >
            {disabled ? (
              <Loader2 size={16} className="animate-spin" />
            ) : buttonConfig.disabled ? (
              buttonConfig.text
            ) : (
              <>
                {buttonConfig.text}
                <ArrowRight size={16} />
              </>
            )}
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default PlanCard;