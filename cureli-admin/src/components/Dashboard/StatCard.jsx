import React from "react";

/**
 * StatCard - compact variant
 * Props:
 *  - label, value, delta, Icon, colorClass, compact (boolean)
 */

const StatCard = ({ label, value, delta, Icon, colorClass = "", compact = false }) => {
  return (
    <div
      className={`bg-white rounded-xl shadow-sm p-3 flex items-center justify-between ${
        compact ? "gap-3" : "gap-4"
      }`}
      style={{ minHeight: compact ? 56 : 84 }}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg bg-[#F5F8FF]`}>
          <Icon size={20} className={`${colorClass}`} />
        </div>

        <div>
          <div className="text-sm text-gray-500">{label}</div>
          <div className={`font-semibold ${compact ? "text-lg" : "text-2xl"} text-gray-800`}>
            {value}
          </div>
        </div>
      </div>

      <div className="text-right">
        <div className="text-xs text-gray-400">since last</div>
        <div className="text-sm font-medium text-gray-600">{delta}</div>
      </div>
    </div>
  );
};

export default StatCard;
