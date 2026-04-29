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
  TrendingDown,
} from "lucide-react";
import {
  formatPrice,
  getCardTheme,
  generateFeatures,
  getPlanBadge,
  calculateDiscountPercent,
  isIntroPriceActive,
  getChargeablePrice,
  BILLING,
  CARD_THEMES,
  INTRO_TRIGGER_TYPE,
} from "../../../../config/planConfig";
import { analyzePlanChange } from "../../../../utils/planChangeUtils";

const PlanCard = ({ plan, currentPlan, usage, onSelect, disabled }) => {
  const theme = getCardTheme(plan);
  const features = generateFeatures(plan);
  const badge = getPlanBadge(plan);

  // ── Pricing state ───────────────────────────────────────────────────────
  const introActive = isIntroPriceActive(plan);
  const chargeablePrice = getChargeablePrice(plan);
  const isEffectivelyFree = chargeablePrice === 0;
  const hasPromoWithPrice = plan.is_promo_active && plan.price > 0;

  const discountPercent = calculateDiscountPercent(
    plan.compare_at_price,
    plan.price
  );
  const showComparePrice =
    discountPercent && !plan.is_promo_active && !introActive && plan.price > 0;

  // ── Plan relationship ───────────────────────────────────────────────────
  const analysis = useMemo(() => {
    if (!currentPlan) {
      return { direction: "select", isCurrent: false };
    }
    const result = analyzePlanChange(currentPlan, plan, usage);
    return { ...result, isCurrent: currentPlan.plan_id === plan.plan_id };
  }, [currentPlan, plan, usage]);

  const isCurrent = analysis.isCurrent;
  const direction = analysis.direction;
  const canHover = !isCurrent || direction === "renew";

  // ── Button config ────────────────────────────────────────────────────────
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
        text: introActive ? "Upgrade (Intro Rate)" : "Upgrade Plan",
        className: introActive
          ? "bg-sky-600 hover:bg-sky-700 text-white"
          : "bg-emerald-600 hover:bg-emerald-700 text-white",
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
      text: introActive ? "Start Intro" : "Select Plan",
      className: introActive
        ? "bg-sky-600 hover:bg-sky-700 text-white"
        : theme.buttonBg,
      disabled: false,
    };
  };

  const buttonConfig = getButtonConfig();

  const handleClick = () => {
    if (buttonConfig.disabled || disabled) return;
    onSelect(plan);
  };

  const getBadgeIcon = (type) => {
    switch (type) {
      case "intro":
        return <TrendingDown size={10} />;
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

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <motion.div
      whileHover={canHover ? { y: -4 } : {}}
      className={`
        group relative flex flex-col rounded-2xl
        w-[260px] h-[380px] flex-shrink-0
        ${disabled ? "opacity-60 pointer-events-none" : ""}
      `}
    >
      {/* Base gradient */}
      <div
        className={`
          absolute inset-0 rounded-2xl
          bg-gradient-to-b ${CARD_THEMES.current.gradient}
          border-2 shadow-md transition-shadow duration-300
          ${canHover ? "group-hover:shadow-xl" : ""}
          ${isCurrent
            ? `${CARD_THEMES.current.borderAccent} ring-2 ${CARD_THEMES.current.glowColor}`
            : theme.borderAccent
          }
        `}
      />

      {/* Hover overlay */}
      {canHover && !isCurrent && (
        <div
          className={`
            absolute inset-0 rounded-2xl
            bg-gradient-to-b ${theme.hoverGradient}
            opacity-0 group-hover:opacity-100
            transition-opacity duration-300 ease-out pointer-events-none
          `}
        />
      )}

      {/* Badge */}
      {isCurrent ? (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <div className={`
            whitespace-nowrap flex items-center gap-1.5 px-3 py-1
            ${CARD_THEMES.current.badgeBg}
            text-white text-[10px] font-bold rounded-full shadow-lg
            uppercase tracking-wide
          `}>
            <Crown size={10} />
            CURRENT PLAN
          </div>
        </div>
      ) : badge ? (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <div className={`
            whitespace-nowrap flex items-center gap-1
            px-3 py-1 text-white text-[10px] font-bold
            rounded-full shadow-lg uppercase tracking-wide
            ${badge.bgColor}
          `}>
            {getBadgeIcon(badge.type)}
            {badge.text}
          </div>
        </div>
      ) : null}

      {/* Content */}
      <div className="relative z-10 flex-1 flex flex-col p-5 pt-7">

        {/* Plan name */}
        <h2 className={`
          text-lg font-bold text-center leading-tight
          transition-colors duration-300
          ${isCurrent
            ? CARD_THEMES.current.accentColor
            : "text-gray-800 group-hover:text-white"
          }
        `}>
          {plan.name}
        </h2>

        {/* Description */}
        <p className={`
          text-xs text-center mt-1 line-clamp-2 min-h-[32px]
          transition-colors duration-300
          ${isCurrent ? "text-amber-700" : "text-gray-600 group-hover:text-white/80"}
        `}>
          {plan.description || "Perfect for getting started"}
        </p>

        {/* ── Price section ──────────────────────────────────────────────── */}
        <div className="flex flex-col items-center mt-3 mb-2 min-h-[70px]">

          {/* Strike-through (non-promo, non-intro) */}
          {showComparePrice && (
            <div className="flex items-center gap-2 mb-1">
              <span className={`
                text-xs line-through transition-colors duration-300
                ${isCurrent
                  ? "text-amber-600/60"
                  : "text-gray-400 group-hover:text-white/50"
                }
              `}>
                {formatPrice(plan.compare_at_price)}
              </span>
              <span className="text-[10px] font-bold text-green-600
                               bg-green-100 px-1.5 py-0.5 rounded">
                {discountPercent}% OFF
              </span>
            </div>
          )}

          {/* Main price */}
          <div className="flex items-baseline gap-1">
            <span className={`
              text-3xl font-bold transition-colors duration-300
              ${isCurrent
                  ? "text-amber-600/60 group-hover:text-amber-600/90"
                  : "text-gray-400 group-hover:text-white"
                }
              ${isEffectivelyFree
                ? isCurrent
                  ? "text-amber-600"
                  : "text-emerald-600"
                : introActive && !isCurrent
                ? "text-sky-600"
                : isCurrent
                ? CARD_THEMES.current.accentColor
                : theme.accentColor
              }
            `}>
              {isEffectivelyFree
                ? "FREE"
                : introActive
                ? formatPrice(plan.intro_price)
                : formatPrice(plan.price)}
            </span>
            {!isEffectivelyFree && (
              <span className={`
                text-xs transition-colors duration-300
                ${isCurrent
                  ? "text-amber-600"
                  : "text-gray-500 group-hover:text-white/70"
                }
              `}>
                {BILLING.displayText}
              </span>
            )}
          </div>

          {/* Intro: "then ₹X/year" */}
          {introActive && !isEffectivelyFree && !isCurrent && (
            <p className="text-[10px] mt-0.5 text-center transition-colors duration-300
                          text-gray-500 group-hover:text-white/70">
              then{" "}
              <span className="font-semibold transition-colors duration-300
                               text-gray-700 group-hover:text-white">
                {formatPrice(plan.price)}
              </span>
              {BILLING.displayText}
            </p>
          )}

          {/* Promo context */}
          {hasPromoWithPrice && !introActive && (
            <p className={`
              text-xs mt-1 text-center transition-colors duration-300
              ${isCurrent
                ? "text-amber-600"
                : "text-gray-500 group-hover:text-white/70"
              }
            `}>
              Then{" "}
              <span className={`
                font-bold transition-colors duration-300
                ${isCurrent ? "text-amber-700" : "text-gray-700 group-hover:text-white"}
              `}>
                {formatPrice(plan.price)}
              </span>
              /year after promo
            </p>
          )}
        </div>

        {/* Quick stats */}
        <div className="flex justify-center gap-6 mb-2">
          <div className={`
            flex items-center gap-1.5 text-xs transition-colors duration-300
            ${isCurrent ? "text-amber-700" : "text-gray-600 group-hover:text-white/80"}
          `}>
            <Users size={14} />
            <span>{plan.max_users === -1 ? "∞" : plan.max_users}</span>
          </div>
          <div className={`
            flex items-center gap-1.5 text-xs transition-colors duration-300
            ${isCurrent ? "text-amber-700" : "text-gray-600 group-hover:text-white/80"}
          `}>
            <Building2 size={14} />
            <span>{plan.max_branches === -1 ? "∞" : plan.max_branches}</span>
          </div>
        </div>

        {/* Divider */}
        <div className={`
          h-px w-full my-2 transition-colors duration-300
          ${isCurrent ? "bg-amber-200" : "bg-gray-300/60 group-hover:bg-white/30"}
        `} />

        {/* Features */}
        <div className="flex-1 flex flex-col">
          <ul className="space-y-1.5 flex-1">
            {features.map((feature, idx) => (
              <li key={idx} className="flex items-center gap-2">
                <span className={`
                  flex-shrink-0 transition-colors duration-300
                  ${feature.type === "intro"
                    ? isCurrent
                      ? "text-sky-500"
                      : "text-sky-500 group-hover:text-sky-300"
                    : feature.highlight
                    ? isCurrent
                      ? "text-orange-500"
                      : "text-amber-500 group-hover:text-amber-300"
                    : isCurrent
                    ? "text-amber-500"
                    : "text-emerald-500 group-hover:text-emerald-300"
                  }
                `}>
                  {feature.type === "intro" ? (
                    <TrendingDown size={14} />
                  ) : feature.highlight ? (
                    <Gift size={14} />
                  ) : (
                    <Check size={14} />
                  )}
                </span>
                <span className={`
                  text-xs leading-tight transition-colors duration-300
                  ${feature.highlight || feature.type === "intro"
                    ? isCurrent
                      ? "font-semibold text-amber-800"
                      : "font-semibold text-gray-800 group-hover:text-white"
                    : isCurrent
                    ? "text-amber-700"
                    : "text-gray-700 group-hover:text-white/90"
                  }
                `}>
                  {feature.text}
                </span>
              </li>
            ))}
          </ul>

          {/* Button */}
          <button
            onClick={handleClick}
            disabled={buttonConfig.disabled || disabled}
            className={`
              mt-3 w-full py-2.5 rounded-xl text-sm font-semibold
              transition-all duration-300
              disabled:cursor-not-allowed shadow-md hover:shadow-lg
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