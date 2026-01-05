import React from "react";

/**
 * Chart placeholder with NO fixed height.
 * Expands based on content or parent.
 */

const ChartPlaceholder = ({ title, subtitle, hint, small = false }) => {
  return (
    <div className={`flex flex-col ${small ? "py-2" : "py-3"}`}>
      <div className={`${small ? "text-sm" : "text-base"} font-medium text-gray-700`}>
        {title}
      </div>
      <div className="text-xs text-gray-400 mb-2">{subtitle}</div>

      <div
        className="
          rounded-md bg-gradient-to-br
          from-gray-50 to-gray-100
          border border-dashed border-gray-200
          flex items-center justify-center
          text-sm text-gray-400 style={{ minHeight: 100px }}
          p-4
        "
      >
        {hint || "Chart placeholder"}
      </div>
    </div>
  );
};

export default ChartPlaceholder;
