// src/pages/Subscription-management/comps/risk/TimeRangeFilter.jsx

import { Calendar } from "lucide-react";
import { TIME_RANGE_OPTIONS } from "../../../../config/modules/subscriptionRiskConfig";

export default function TimeRangeFilter({ value, onChange, disabled = false }) {
  return (
    <div className="flex items-center gap-2">
      {/* Label */}
      <div className="flex items-center gap-1.5 text-sm text-gray-600">
        <Calendar size={16} className="text-gray-500" />
        <span className="hidden sm:inline font-medium">Time Range:</span>
      </div>

      {/* Options - Pill Style Tabs */}
      <div className="flex items-center bg-gray-100 rounded-lg p-1">
        {TIME_RANGE_OPTIONS.map((option, index) => {
          const isSelected = value === option.value;
          
          return (
            <button
              key={option.value}
              onClick={() => onChange(option.value)}
              disabled={disabled}
              className={`
                relative px-3 py-1.5 rounded-md text-sm font-medium 
                transition-all duration-200 ease-in-out
                ${
                  isSelected
                    ? "bg-white text-[#000060] shadow-sm"
                    : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                }
                ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}
              `}
            >
              {/* Sliding background indicator for smooth transition */}
              {isSelected && (
                <span 
                  className="absolute inset-0 bg-white rounded-md shadow-sm -z-10
                             animate-in fade-in duration-200"
                />
              )}
              <span className="relative z-10">{option.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}