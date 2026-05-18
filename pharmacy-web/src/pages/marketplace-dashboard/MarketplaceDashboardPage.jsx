// src/pages/marketplace/dashboard/MarketplaceDashboardPage.jsx

import { LayoutGrid } from "lucide-react";

const MarketplaceDashboardPage = () => {
  return (
    <div className="flex items-center justify-center min-h-[70vh]">
      <div className="text-center max-w-sm">
        <div className="w-16 h-16 bg-gradient-to-br from-[#05015A] to-[#0a0280] rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg">
          <LayoutGrid size={28} className="text-white" />
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Marketplace Dashboard
        </h1>
        <p className="text-gray-500 text-sm mb-5">
          Your marketplace analytics and overview will appear here.
        </p>
        <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 text-indigo-700 text-sm font-semibold rounded-full border border-indigo-200">
          Coming Soon
        </span>
      </div>
    </div>
  );
};

export default MarketplaceDashboardPage;