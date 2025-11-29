import React, { useState } from "react";
import ChartPlaceholder from "./ChartPlaceholder";

const CombinedChartCard = () => {
  const [activeTab, setActiveTab] = useState("shops");

  return (
    <div className="bg-white rounded-xl shadow-md p-3 flex flex-col overflow-hidden">
      
      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200 mb-3">
        <button
          onClick={() => setActiveTab("shops")}
          className={`pb-2 text-sm font-medium ${
            activeTab === "shops"
              ? "text-[#000060] border-b-2 border-[#000060]"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Shops Growth
        </button>

        <button
          onClick={() => setActiveTab("subs")}
          className={`pb-2 text-sm font-medium ${
            activeTab === "subs"
              ? "text-[#000060] border-b-2 border-[#000060]"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Subscription Mix
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0">
        {activeTab === "shops" && (
          <ChartPlaceholder
            small
            title="6 Months Growth"
            subtitle="Registrations / Month"
            hint="Placeholder chart"
          />
        )}

        {activeTab === "subs" && (
          <ChartPlaceholder
            small
            title="Active Plans"
            subtitle="Monthly / Yearly / Trial"
            hint="Placeholder chart"
          />
        )}
      </div>
    </div>
  );
};

export default CombinedChartCard;
