import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react";

const colorMap = {
  emerald: {
    bg: "bg-emerald-50",
    icon: "text-emerald-600",
    badge: "bg-emerald-100 text-emerald-700",
  },
  blue: {
    bg: "bg-blue-50",
    icon: "text-blue-600",
    badge: "bg-blue-100 text-blue-700",
  },
  violet: {
    bg: "bg-violet-50",
    icon: "text-violet-600",
    badge: "bg-violet-100 text-violet-700",
  },
  amber: {
    bg: "bg-amber-50",
    icon: "text-amber-600",
    badge: "bg-amber-100 text-amber-700",
  },
};

const KPICard = ({ label, value, change, trend, icon: Icon, color = "blue" }) => {
  const colors = colorMap[color] || colorMap.blue;

  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4 shadow-sm hover:shadow-md transition-shadow">
      
      {/* Icon */}
      <div className={`w-12 h-12 rounded-xl ${colors.bg} flex items-center justify-center flex-shrink-0`}>
        <Icon size={22} className={colors.icon} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 truncate">{label}</p>
        <p className="text-xl font-bold text-gray-900 truncate">{value}</p>
      </div>

      {/* Trend Badge */}
      <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${colors.badge} flex-shrink-0`}>
        {trend === "up" ? (
          <TrendingUp size={12} />
        ) : (
          <TrendingDown size={12} />
        )}
        <span>{change}</span>
      </div>
    </div>
  );
};

export default KPICard;