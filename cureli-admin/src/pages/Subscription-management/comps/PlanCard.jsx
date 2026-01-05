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
} from "lucide-react";
import {
  PLAN_STATUS,
  STATUS_CONFIG,
  ALLOWED_ACTIONS,
  getCardTheme,
  generateFeatures,
  formatPrice,
  BILLING,
} from "../../../config/modules/subscriptionConfig";

export default function PlanCard({ plan, onAction }) {
  const statusConfig = STATUS_CONFIG[plan.status];
  const cardTheme = getCardTheme(plan);
  const features = generateFeatures(plan);
  const actions = ALLOWED_ACTIONS[plan.status];
  const isFree = plan.price === 0;
  const isCustom = plan.type === "CUSTOM";

  const handleAction = (actionType) => {
    onAction(actionType, plan);
  };

  return (
    <div
      className={`
    group relative h-full flex flex-col rounded-xl p-5 
    shadow-md border transition-all duration-300
    bg-gradient-to-b ${cardTheme.gradient} ${cardTheme.hoverGradient}
    ${cardTheme.borderAccent}
    ${isCustom ? "ring-2 ring-violet-200" : ""}
    hover:shadow-xl hover:-translate-y-1
  `}
    >
      {/* Top Row - Badges on Left, Actions on Right */}
      <div className="absolute top-3 left-3 right-3 flex items-center justify-between">
        {/* Left Side - Status & Highlight Badges */}
        <div className="flex items-center gap-2">
          {/* Status Badge */}
          <div
            className={`
          px-2.5 py-1 rounded-full text-[10px] 
          font-semibold border flex items-center gap-1.5
          ${statusConfig.badgeColor}
        `}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${statusConfig.dotColor}`}
            />
            {statusConfig.label}
          </div>

          {/* Custom Badge (for CUSTOM type plans) */}
          {isCustom && (
            <div
              className="
            px-2 py-1 rounded-full 
            bg-violet-500 text-white text-[10px] font-semibold
            flex items-center gap-1
          "
            >
              <Sparkles size={10} />
              Custom
            </div>
          )}

          {/* Highlighted Badge (only for non-custom plans) */}
          {!isCustom && plan.is_highlighted && (
            <div
              className="
            px-2 py-1 rounded-full 
            bg-amber-500 text-white text-[10px] font-semibold
            flex items-center gap-1
          "
            >
              <Sparkles size={10} />
              Featured
            </div>
          )}
        </div>

        {/* Right Side - Action Buttons */}
        <div className="flex gap-1.5">
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
      <div className="mt-10">
        {/* Plan Name */}
        <h2 className="text-lg font-bold text-gray-800 group-hover:text-white mb-2">
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
            <span>{plan.created_for_shop.business_name}</span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-baseline gap-1 mb-3">
          <span
            className={`
          text-2xl font-bold 
          ${isFree ? "text-emerald-600" : "text-[#05015A]"}
          group-hover:text-white
        `}
          >
            {formatPrice(plan.price)}
          </span>
          {!isFree && (
            <span className="text-sm text-gray-500 group-hover:text-white/70">
              {BILLING.displayText}
            </span>
          )}
        </div>

        {/* Description */}
        <p className="text-xs text-gray-600 group-hover:text-white/80 mb-4 line-clamp-2">
          {plan.description}
        </p>

        {/* Divider */}
        <div className="h-px w-full bg-gray-300 group-hover:bg-white/30 mb-4" />

        {/* Features */}
        <ul className="space-y-2 mb-4 flex-1">
          {features.map((feature, idx) => (
            <li key={idx} className="flex items-center gap-2 text-xs">
              <span className="text-emerald-500 group-hover:text-emerald-300">
                ✓
              </span>
              <span className="text-gray-700 group-hover:text-white">
                {feature}
              </span>
            </li>
          ))}
        </ul>

        {/* Subscriber Count (for Active/Deprecated) */}
        {(plan.status === PLAN_STATUS.ACTIVE ||
          plan.status === PLAN_STATUS.DEPRECATED) && (
          <div
            className="
          flex items-center gap-2 text-xs text-gray-500 
          group-hover:text-white/70 mb-4 p-2 rounded-lg
          bg-white/50 group-hover:bg-white/10
        "
          >
            <Users size={14} />
            <span>{plan.subscriber_count || 0} active subscribers</span>
          </div>
        )}
      </div>

      {/* Action Buttons - Bottom */}
      <div className="mt-auto pt-4 flex gap-2">
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
