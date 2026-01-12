import {
  Pencil,
  Eye,
  Copy,
  Power,
  PlayCircle,
  PauseCircle,
  Sparkles,
  Users,
  Trash2,
  Store,
  Gift,
  Calendar,
  Percent,
  Clock,
} from "lucide-react";
import {
  PLAN_STATUS,
  STATUS_CONFIG,
  ALLOWED_ACTIONS,
  getCardTheme,
  generateFeatures,
  formatPrice,
  formatPriceComparison,
  isPromoActive,
  getBonusMonthsBadge,
  getFreeUntilBadge,
  getDiscountPercentage,
  getTotalDurationMonths,
  BILLING,
} from "../../../../config/modules/subscriptionConfig";

export default function PlanCard({ plan, onAction }) {
  const statusConfig = STATUS_CONFIG[plan.status];
  const cardTheme = getCardTheme(plan);
  const features = generateFeatures(plan);
  const actions = ALLOWED_ACTIONS[plan.status];
  
  // Price and promo info
  const isFree = plan.price === 0;
  const isCustom = plan.type === "CUSTOM";
  const promoActive = isPromoActive(plan);
  const priceComparison = formatPriceComparison(plan);
  const bonusMonthsBadge = getBonusMonthsBadge(plan);
  const freeUntilBadge = getFreeUntilBadge(plan);
  const discountPercent = getDiscountPercentage(plan);
  const totalDuration = getTotalDurationMonths(plan);

  const handleAction = (actionType) => {
    onAction(actionType, plan);
  };

  const isFeatured = plan.is_featured;
  
  // Determine theme key
  const getThemeKey = () => {
    if (promoActive) return "promo";
    if (isFree) return "free";
    if (isFeatured) return "featured";
    return "default";
  };
  
  const themeKey = getThemeKey();

  // Theme-specific classes (explicit for Tailwind JIT)
  const themeClasses = {
    free: {
      container: "from-emerald-50 to-teal-100 hover:from-emerald-600 hover:to-teal-600 border-emerald-200",
      accent: "text-emerald-600",
    },
    featured: {
      container: "from-violet-100 to-purple-100 hover:from-violet-600 hover:to-purple-600 border-violet-300",
      accent: "text-violet-600",
    },
    promo: {
      container: "from-amber-50 to-orange-100 hover:from-amber-500 hover:to-orange-500 border-amber-300",
      accent: "text-amber-600",
    },
    default: {
      container: "from-[#afccf4] to-[#e7e9ec] hover:from-[#05015A] hover:to-[#05015A] border-blue-200",
      accent: "text-[#05015A]",
    },
  };

  const theme = themeClasses[themeKey];
  return (
    <div
      className={`
       group relative h-full flex flex-col rounded-xl p-5 
        shadow-md border transition-all duration-300
        bg-gradient-to-b ${theme.container}
        ${isCustom ? "ring-2 ring-violet-200" : ""}
        hover:shadow-xl hover:-translate-y-1
      
      `}
    >
      {/* Top Row - Badges on Left, Actions on Right */}
      <div className="absolute top-3 left-3 right-3 flex items-start justify-between">
        {/* Left Side - Status & Feature Badges */}
        <div className="flex flex-wrap items-center gap-1.5 max-w-[60%]">
          {/* Status Badge */}
          <div
            className={`
              px-2 py-0.5 rounded-full text-[10px] 
              font-semibold border flex items-center gap-1
              ${statusConfig.badgeColor}
            `}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotColor}`}
            />
            {statusConfig.label}
          </div>

          {/* Custom Badge */}
          {isCustom && (
            <div
              className="
                px-2 py-0.5 rounded-full 
                bg-violet-500 text-white text-[10px] font-semibold
                flex items-center gap-1
              "
            >
              <Sparkles size={10} />
              Custom
            </div>
          )}

          {/* Featured Badge */}
          {!isCustom && plan.is_featured && !promoActive && (
            <div
              className="
                px-2 py-0.5 rounded-full 
                bg-amber-500 text-white text-[10px] font-semibold
                flex items-center gap-1
              "
            >
              <Sparkles size={10} />
              Featured
            </div>
          )}

          {/* Promo Active Badge */}
          {promoActive && (
            <div
              className="
                px-2 py-0.5 rounded-full 
                bg-blue-500 text-white text-[10px] font-semibold
                flex items-center gap-1 animate-pulse
              "
            >
              <Calendar size={10} />
              Promo
            </div>
          )}
        </div>

        {/* Right Side - Action Buttons */}
        <div className="flex gap-1">
          {actions.includes("edit") && (
            <ActionButton
              icon={Pencil}
              tooltip="Edit Plan"
              onClick={() => handleAction("edit")}
            />
          )}
          {actions.includes("view") && (
            <ActionButton
              icon={Eye}
              tooltip="View Details"
              onClick={() => handleAction("view")}
            />
          )}
          {actions.includes("delete") && (
            <ActionButton
              icon={Trash2}
              tooltip="Delete Draft"
              onClick={() => handleAction("delete")}
              className="hover:bg-red-500 hover:text-white"
            />
          )}
        </div>
      </div>

      {/* Content */}
      <div className="mt-12">
        {/* Plan Name */}
        <h2 className="text-lg font-bold text-gray-800 group-hover:text-white mb-1 line-clamp-1">
          {plan.name}
        </h2>

        {/* Linked Shop (for CUSTOM plans) */}
        {isCustom && plan.created_for_shop && (
          <div
            className="
              flex items-center gap-1.5 text-xs text-violet-600 
              group-hover:text-violet-200 mb-2 font-medium
            "
          >
            <Store size={12} />
            <span className="truncate">{plan.created_for_shop.business_name}</span>
          </div>
        )}

        {/* Promo: Free Until Banner */}
        {freeUntilBadge && (
          <div className="mb-2 p-2 rounded-lg bg-blue-100 group-hover:bg-blue-900/30 border border-blue-200 group-hover:border-blue-400">
            <div className="flex items-center gap-1.5">
              <Calendar size={14} className="text-blue-600 group-hover:text-blue-300" />
              <span className="text-xs font-semibold text-blue-700 group-hover:text-blue-200">
                {freeUntilBadge}
              </span>
            </div>
          </div>
        )}

        {/* Price Section */}
        <div className="mb-3">
          {/* Strike-through price (if compare_at_price exists) */}
          {priceComparison && (
            <div className="flex items-center gap-2 mb-1">
              <span className="text-sm text-gray-400 line-through group-hover:text-white/50">
                {priceComparison.original}
              </span>
              {discountPercent && (
                <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-[10px] font-bold rounded group-hover:bg-green-500 group-hover:text-white">
                  -{discountPercent}%
                </span>
              )}
            </div>
          )}
          
          {/* Actual Price */}
          <div className="flex items-baseline gap-1">
            <span
              className={`
                text-2xl font-bold 
                ${promoActive ? "text-blue-600" : isFree ? "text-emerald-600" : "text-[#05015A]"}
                group-hover:text-white
              `}
            >
              {promoActive ? "FREE" : formatPrice(plan.price)}
            </span>
            {!isFree && !promoActive && (
              <span className="text-sm text-gray-500 group-hover:text-white/70">
                {BILLING.displayText}
              </span>
            )}
          </div>

          {/* Original price note when promo active */}
          {promoActive && plan.price > 0 && (
            <p className="text-xs text-gray-500 group-hover:text-white/60 mt-1">
              Then {formatPrice(plan.price)}{BILLING.displayText}
            </p>
          )}
        </div>

        {/* Promo Badges Row */}
        {(bonusMonthsBadge || (priceComparison && !promoActive)) && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {/* Bonus Months Badge */}
            {bonusMonthsBadge && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-semibold group-hover:bg-emerald-500 group-hover:text-white">
                <Gift size={10} />
                {bonusMonthsBadge}
              </span>
            )}
            
            {/* Savings Badge (only show if not in free promo) */}
            {priceComparison && !promoActive && (
              <span className="inline-flex items-center gap-1 px-2 py-1 bg-amber-100 text-amber-700 rounded-full text-[10px] font-semibold group-hover:bg-amber-500 group-hover:text-white">
                <Percent size={10} />
                Save {priceComparison.savings}
              </span>
            )}
          </div>
        )}

        {/* Description */}
        <p className="text-xs text-gray-600 group-hover:text-white/80 mb-3 line-clamp-2">
          {plan.description}
        </p>

        {/* Divider */}
        <div className="h-px w-full bg-gray-300 group-hover:bg-white/30 mb-3" />

        {/* Features */}
        <ul className="space-y-1.5 mb-3 flex-1">
          {features.map((feature, idx) => (
            <li key={idx} className="flex items-center gap-2 text-xs">
              <span className="text-emerald-500 group-hover:text-emerald-300 flex-shrink-0">
                ✓
              </span>
              <span className="text-gray-700 group-hover:text-white">
                {feature}
              </span>
            </li>
          ))}
        </ul>

        {/* Duration Info (if bonus months exist) */}
        {plan.bonus_months > 0 && (
          <div className="flex items-center gap-1.5 text-xs text-gray-500 group-hover:text-white/60 mb-3">
            <Clock size={12} />
            <span>Total: {totalDuration} months ({plan.billing_cycle_months || 12} + {plan.bonus_months} bonus)</span>
          </div>
        )}

        {/* Subscriber Count (for Active/Deprecated) */}
        {(plan.status === PLAN_STATUS.ACTIVE ||
          plan.status === PLAN_STATUS.DEPRECATED) && (
          <div
            className="
              flex items-center gap-2 text-xs text-gray-500 
              group-hover:text-white/70 mb-3 p-2 rounded-lg
              bg-white/50 group-hover:bg-white/10
            "
          >
            <Users size={14} />
            <span>{plan.subscriber_count || 0} active subscribers</span>
          </div>
        )}
      </div>

      {/* Action Buttons - Bottom */}
      <div className="mt-auto pt-3 flex gap-2">
        {/* Primary Action */}
        {actions.includes("activate") && (
          <button
            onClick={() => handleAction("activate")}
            className="
              flex-1 flex items-center justify-center gap-1.5
              py-2 rounded-lg text-xs font-semibold
              bg-emerald-600 text-white
              hover:bg-emerald-700 transition-all
            "
          >
            <PlayCircle size={14} />
            Activate
          </button>
        )}

        {actions.includes("suspend") && (
          <button
            onClick={() => handleAction("suspend")}
            className="
              flex-1 flex items-center justify-center gap-1.5
              py-2 rounded-lg text-xs font-semibold
              bg-orange-500 text-white
              hover:bg-orange-600 transition-all
            "
          >
            <PauseCircle size={14} />
            Suspend
          </button>
        )}

        {actions.includes("reactivate") && (
          <button
            onClick={() => handleAction("reactivate")}
            className="
              flex-1 flex items-center justify-center gap-1.5
              py-2 rounded-lg text-xs font-semibold
              bg-emerald-600 text-white
              hover:bg-emerald-700 transition-all
            "
          >
            <Power size={14} />
            Reactivate
          </button>
        )}

        {/* Clone - Always available, but not for custom plans */}
        {!isCustom && (
          <button
            onClick={() => handleAction("clone")}
            className="
              flex items-center justify-center gap-1.5
              px-3 py-2 rounded-lg text-xs font-semibold
              bg-white text-[#05015A] border border-[#05015A]/20
              hover:bg-[#05015A] hover:text-white 
              group-hover:bg-white group-hover:text-[#05015A]
              transition-all
            "
          >
            <Copy size={14} />
            Clone
          </button>
        )}

        {/* View button for custom plans */}
        {isCustom && (
          <button
            onClick={() => handleAction("view")}
            className="
              flex items-center justify-center gap-1.5
              px-3 py-2 rounded-lg text-xs font-semibold
              bg-white text-violet-600 border border-violet-200
              hover:bg-violet-600 hover:text-white 
              transition-all
            "
          >
            <Eye size={14} />
            View
          </button>
        )}
      </div>
    </div>
  );
}

// Small action button component
function ActionButton({ icon: Icon, tooltip, onClick, className = "" }) {
  return (
    <button
      onClick={onClick}
      title={tooltip}
      className={`
        p-1.5 rounded-lg bg-white/80 text-gray-600
        hover:bg-white hover:text-[#05015A] hover:shadow-md
        transition-all duration-200
        ${className}
      `}
    >
      <Icon size={14} />
    </button>
  );
}