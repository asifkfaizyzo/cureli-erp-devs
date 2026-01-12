// src/pages/Subscription-management/comps/risk/TimeRangeFilter.jsx

import { Calendar } from "lucide-react";
import { TIME_RANGE_OPTIONS } from "../../../../config/modules/subscriptionRiskConfig";

export default function TimeRangeFilter({ value, onChange, disabled = false }) {
  return (
    <div className="flex items-center gap-2">
      {/* Label */}
      <div className="flex items-center gap-1.5 text-sm text-gray-600">
        <Calendar size={16} />
        <span className="hidden sm:inline">Time Range:</span>
      </div>

      {/* Options */}
      <div className="flex items-center bg-gray-100 rounded-lg p-1">
        {TIME_RANGE_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            disabled={disabled}
            className={`
              px-3 py-1.5 rounded-md text-sm font-medium transition-all
              ${
                value === option.value
                  ? "bg-white text-[#05015A] shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }
              ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
            `}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}