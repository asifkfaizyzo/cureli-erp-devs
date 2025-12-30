// frontend/src/pages/settings/plans/comps/PlanCard.jsx

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Users,
  Building2,
  Check,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Loader2,
} from "lucide-react";
import { formatPrice, getCardTheme, generateFeatures, BILLING } from "../../../../config/planConfig";
import { analyzePlanChange, getPlanActionText } from "../../../../utils/planChangeUtils";

/**
 * PlanCard
 * Displays a single plan with upgrade/downgrade/current state
 */
const PlanCard = ({ plan, currentPlan, usage, onSelect, disabled }) => {
  const theme = getCardTheme(plan);
  const features = generateFeatures(plan);
  const isFree = plan.price === 0;
  
  // Determine relationship to current plan
  const analysis = useMemo(() => {
    if (!currentPlan) {
      return { direction: "select", isCurrent: false };
    }
    
    if (currentPlan.plan_id === plan.plan_id) {
      return { direction: "current", isCurrent: true };
    }
    
    return {
      ...analyzePlanChange(currentPlan, plan, usage),
      isCurrent: false,
    };
  }, [currentPlan, plan, usage]);
  
  const isCurrent = analysis.isCurrent;
  const direction = analysis.direction;
  
  // Button text and style
  const getButtonConfig = () => {
    if (isCurrent) {
      return {
        text: "Current Plan",
        className: "bg-gray-200 text-gray-500 cursor-not-allowed",
        disabled: true,
      };
    }
    
    if (direction === "upgrade") {
      return {
        text: "Upgrade",
        className: "bg-emerald-600 hover:bg-emerald-700 text-white",
        icon: TrendingUp,
        disabled: false,
      };
    }
    
    if (direction === "downgrade") {
      return {
        text: "Downgrade",
        className: "bg-orange-500 hover:bg-orange-600 text-white",
        icon: TrendingDown,
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
  const ButtonIcon = buttonConfig.icon;
  
  const handleClick = () => {
    if (buttonConfig.disabled || disabled) return;
    onSelect(plan);
  };

  return (
    <motion.div
      whileHover={!isCurrent ? { y: -4 } : {}}
      className={`
        group relative flex flex-col rounded-2xl p-6
        shadow-md border-2 transition-all duration-300
        bg-gradient-to-b ${theme.gradient}
        ${!isCurrent ? theme.hoverGradient : ""}
        ${isCurrent ? "border-[#000060] ring-2 ring-[#000060]/20" : theme.borderAccent}
        ${!isCurrent ? "hover:shadow-xl" : ""}
        w-[265px] h-[390px]
        ${disabled ? "opacity-60 pointer-events-none" : ""}
      `}
    >
      {/* Badges */}
      {plan.is_highlighted && !isCurrent && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <div className="whitespace-nowrap flex items-center gap-1.5 px-4 py-1.5 bg-violet-600 text-white text-xs font-bold rounded-full shadow-lg">
            <Sparkles size={12} />
            POPULAR
          </div>
        </div>
      )}
      
      {isCurrent && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <div className="whitespace-nowrap flex items-center gap-1.5 px-4 py-1.5 bg-[#000060] text-white text-xs font-bold rounded-full shadow-lg">
            <Check size={12} />
            CURRENT PLAN
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col">
        {/* Plan Info Section */}
        <div className="h-[160px] flex flex-col">
          <h2 className={`text-xl font-bold text-center ${isCurrent ? "text-[#000060]" : "text-gray-800 group-hover:text-white"}`}>
            {plan.name}
          </h2>

          <p className={`text-sm text-center mt-1 line-clamp-2 min-h-[40px] ${isCurrent ? "text-gray-600" : "text-gray-600 group-hover:text-white/80"}`}>
            {plan.description || "Perfect for getting started"}
          </p>

          <div className="flex items-baseline justify-center gap-1 mt-3">
            <span
              className={`text-3xl font-bold ${
                isFree 
                  ? "text-emerald-600" 
                  : isCurrent 
                    ? "text-[#000060]" 
                    : `${theme.accentColor} group-hover:text-white`
              }`}
            >
              {formatPrice(plan.price)}
            </span>
            {!isFree && (
              <span className={`text-sm ${isCurrent ? "text-gray-500" : "text-gray-500 group-hover:text-white/70"}`}>
                {BILLING.displayText}
              </span>
            )}
          </div>

          <div className="flex justify-center gap-4 mt-3">
            <div className={`flex items-center gap-1.5 text-xs ${isCurrent ? "text-gray-600" : "text-gray-600 group-hover:text-white/80"}`}>
              <Users size={14} />
              <span>
                {plan.max_users === -1 ? "Unlimited" : plan.max_users} Users
              </span>
            </div>
            <div className={`flex items-center gap-1.5 text-xs ${isCurrent ? "text-gray-600" : "text-gray-600 group-hover:text-white/80"}`}>
              <Building2 size={14} />
              <span>
                {plan.max_branches === -1 ? "Unlimited" : plan.max_branches}{" "}
                Branch{plan.max_branches !== 1 ? "es" : ""}
              </span>
            </div>
          </div>
        </div>

        <div className={`h-px w-full my-3 ${isCurrent ? "bg-gray-200" : "bg-gray-300 group-hover:bg-white/30"}`} />

        {/* Features Section */}
        <div className="flex-1 flex flex-col">
          <ul className="space-y-1.5 flex-1">
            {features.map((feature, idx) => (
              <li key={idx} className="flex items-center gap-2 text-sm">
                <span className={`flex-shrink-0 ${isCurrent ? "text-emerald-500" : "text-emerald-500 group-hover:text-emerald-300"}`}>
                  <Check size={14} />
                </span>
                <span className={`text-xs ${isCurrent ? "text-gray-700" : "text-gray-700 group-hover:text-white"}`}>
                  {feature}
                </span>
              </li>
            ))}
          </ul>

          {/* Action Button */}
          <button
            onClick={handleClick}
            disabled={buttonConfig.disabled || disabled}
            className={`
              mt-auto w-full py-2.5 rounded-xl text-sm font-semibold
              transition-all duration-300
              disabled:cursor-not-allowed
              shadow-lg hover:shadow-xl
              flex items-center justify-center gap-2
              ${buttonConfig.className}
            `}
          >
            {disabled ? (
              <Loader2 size={16} className="animate-spin" />
            ) : ButtonIcon ? (
              <>
                <ButtonIcon size={16} />
                {buttonConfig.text}
              </>
            ) : (
              buttonConfig.text
            )}
          </button>
        </div>
      </div>
      
      {/* Direction indicator for non-current plans */}
      {!isCurrent && direction !== "no_change" && (
        <div className={`absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center ${
          direction === "upgrade" 
            ? "bg-emerald-100 text-emerald-600" 
            : "bg-orange-100 text-orange-600"
        }`}>
          {direction === "upgrade" ? (
            <TrendingUp size={16} />
          ) : (
            <TrendingDown size={16} />
          )}
        </div>
      )}
    </motion.div>
  );
};

export default PlanCard;