// src/pages/Dashboard/comps/KPICard.jsx

import { TrendingUp, TrendingDown, Minus } from "lucide-react";

const KPICard = ({
  title,
  value,
  change,
  changeLabel,
  icon: Icon,
  iconBg,
  iconColor,
  loading = false,
  onClick,
}) => {
  const isPositive = change > 0;
  const isNegative = change < 0;
  const isNeutral = change === 0 || change === null || change === undefined;

  const TrendIcon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;

  const trendColor = isPositive 
    ? "text-emerald-600 bg-emerald-50" 
    : isNegative 
    ? "text-red-600 bg-red-50" 
    : "text-gray-500 bg-gray-50";

  return (
    <div
      onClick={onClick}
      className={`
        bg-white rounded-xl border border-gray-200 p-5 
        transition-all duration-200 hover:shadow-lg hover:border-gray-300
        ${onClick ? "cursor-pointer" : ""}
        ${loading ? "animate-pulse" : ""}
      `}
    >
      <div className="flex items-start justify-between">
        {/* Icon */}
        <div className={`w-12 h-12 rounded-xl ${iconBg} flex items-center justify-center`}>
          <Icon className={`w-6 h-6 ${iconColor}`} />
        </div>

        {/* Trend Badge */}
        {!loading && !isNeutral && (
          <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${trendColor}`}>
            <TrendIcon size={12} />
            <span>{Math.abs(change)}%</span>
          </div>
        )}
      </div>

      {/* Value */}
      <div className="mt-4">
        {loading ? (
          <div className="h-8 w-20 bg-gray-200 rounded animate-pulse" />
        ) : (
          <p className="text-3xl font-bold text-gray-900">{value}</p>
        )}
      </div>

      {/* Title & Change Label */}
      <div className="mt-2 flex items-center justify-between">
        <p className="text-sm text-gray-500">{title}</p>
        {!loading && changeLabel && (
          <p className="text-xs text-gray-400">{changeLabel}</p>
        )}
      </div>
    </div>
  );
};

export default KPICard;