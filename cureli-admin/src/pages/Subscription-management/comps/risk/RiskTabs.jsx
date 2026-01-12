// src/pages/Subscription-management/comps/risk/RiskTabs.jsx

import { Clock, AlertTriangle, Ban } from "lucide-react";
import { RISK_TABS } from "../../../../config/modules/subscriptionRiskConfig";

// Icon mapping
const TAB_ICONS = {
  [RISK_TABS.EXPIRING]: Clock,
  [RISK_TABS.GRACE_PERIOD]: AlertTriangle,
  [RISK_TABS.SUSPENDED]: Ban,
};

// Color mapping
const TAB_COLORS = {
  [RISK_TABS.EXPIRING]: {
    active: "border-blue-500 text-blue-700 bg-blue-50",
    inactive: "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50",
    badge: "bg-blue-100 text-blue-700",
  },
  [RISK_TABS.GRACE_PERIOD]: {
    active: "border-amber-500 text-amber-700 bg-amber-50",
    inactive: "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50",
    badge: "bg-amber-100 text-amber-700",
  },
  [RISK_TABS.SUSPENDED]: {
    active: "border-red-500 text-red-700 bg-red-50",
    inactive: "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50",
    badge: "bg-red-100 text-red-700",
  },
};

export default function RiskTabs({ tabs, activeTab, onTabChange }) {
  return (
    <div className="flex items-center gap-1">
      {tabs.map((tab) => {
        const Icon = TAB_ICONS[tab.id];
        const colors = TAB_COLORS[tab.id];
        const isActive = activeTab === tab.id;

        return (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium
              border-b-2 transition-all
              ${isActive ? colors.active : colors.inactive}
            `}
          >
            {Icon && <Icon size={16} />}
            <span className="hidden sm:inline">{tab.label}</span>
            
            {/* Count Badge */}
            <span
              className={`
                px-1.5 py-0.5 rounded-full text-xs font-bold min-w-[20px] text-center
                ${isActive ? colors.badge : "bg-gray-100 text-gray-600"}
              `}
            >
              {tab.count}
            </span>
          </button>
        );
      })}
    </div>
  );
}