import React from "react";

/**
 * SummaryStats - compact summary list with small progress bars
 * compact prop reduces spacing and font sizes.
 */

const STATS = [
  { id: "v1", label: "Shops Verified", value: 89, pct: 70 },
  { id: "v2", label: "Pending Review", value: 19, pct: 15 },
  { id: "v3", label: "Rejected", value: 8, pct: 6 },
  { id: "v4", label: "Resubmissions", value: 12, pct: 9 },
];

const SummaryStats = ({ compact = false }) => {
  return (
    <div className={`flex flex-col gap-3 ${compact ? "text-sm" : ""}`}>
      {STATS.map((s) => (
        <div key={s.id} className="flex flex-col gap-1">
          <div className="flex justify-between">
            <div className="text-sm text-gray-700 font-medium">{s.label}</div>
            <div className="text-sm text-gray-500">{s.value}</div>
          </div>

          <div className="w-full bg-gray-100 rounded-full h-2 overflow-hidden">
            <div style={{ width: `${s.pct}%` }} className="h-2 bg-[#000060]" />
          </div>
        </div>
      ))}
    </div>
  );
};

export default SummaryStats;
