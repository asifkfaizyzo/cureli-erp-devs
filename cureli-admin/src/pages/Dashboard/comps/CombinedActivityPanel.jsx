import React, { useState } from "react";
import ActivityFeed from "./ActivityFeed";
import OnboardingTable from "./OnboardingTable";

const CombinedActivityPanel = () => {
  const [tab, setTab] = useState("activity");

  return (
    <div className="bg-white rounded-xl shadow-md p-3 flex flex-col overflow-hidden">

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200 mb-3">
        <button
          onClick={() => setTab("activity")}
          className={`pb-2 text-sm font-medium ${
            tab === "activity"
              ? "text-[#000060] border-b-2 border-[#000060]"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Recent Activity
        </button>

        <button
          onClick={() => setTab("onboarding")}
          className={`pb-2 text-sm font-medium ${
            tab === "onboarding"
              ? "text-[#000060] border-b-2 border-[#000060]"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Onboarding Status
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-auto">
        {tab === "activity" && <ActivityFeed compact />}
        {tab === "onboarding" && <OnboardingTable compact />}
      </div>
    </div>
  );
};

export default CombinedActivityPanel;
