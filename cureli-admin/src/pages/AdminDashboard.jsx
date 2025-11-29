import React from "react";
import StatCard from "../components/Dashboard/StatCard";
import CombinedChartCard from "../components/Dashboard/CombinedChartCard";
import CombinedActivityPanel from "../components/Dashboard/CombinedActivityPanel";
import SummaryStats from "../components/Dashboard/SummaryStats";

import { Store, FileText, Package, Users } from "lucide-react";

/**
 * FIXED VERSION:
 * - Perfect 3-column layout
 * - Columns are equal height using min-h-0
 * - NO fixed heights anywhere
 * - ALL scroll happens inside inner components
 * - No shifting, no breaking, no collapsing
 */

const AdminDashboard = () => {
  const kpis = [
    {
      id: "shops",
      label: "Total Shops",
      value: 128,
      delta: "+4",
      icon: Store,
      color: "text-[#0b3a8a]",
    },
    {
      id: "pending",
      label: "Pending Verifications",
      value: 19,
      delta: "+3",
      icon: FileText,
      color: "text-[#c97a00]",
    },
    {
      id: "subscriptions",
      label: "Active Subscriptions",
      value: 84,
      delta: "+1",
      icon: Package,
      color: "text-[#0b8a5a]",
    },
    {
      id: "users",
      label: "Total Users",
      value: 642,
      delta: "+22",
      icon: Users,
      color: "text-[#5a4b9b]",
    },
  ];

  return (
    <div className="w-full h-full flex gap-4 min-h-0 overflow-hidden">
      {/* LEFT COLUMN */}
      <div className="w-1/4 flex flex-col gap-4 min-h-0">
        {/* KPI */}
        <div className="grid grid-cols-1 gap-3">
          {kpis.map((k) => (
            <StatCard
              key={k.id}
              label={k.label}
              value={k.value}
              delta={k.delta}
              Icon={k.icon}
              colorClass={k.color}
              compact
            />
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-md p-3 flex items-center justify-between">
          <div>
            <h4 className="text-sm font-semibold text-[#000060]">
              Quick Actions
            </h4>
            <p className="text-xs text-gray-500 mt-1">
              Approve pending shops, view flagged items.
            </p>
          </div>

          <div className="flex gap-2">
            <button className="px-3 py-2 rounded-md bg-[#000060] text-white text-sm shadow-sm hover:opacity-95">
              Approve 5
            </button>
            <button className="px-3 py-2 rounded-md border border-gray-200 text-sm">
              Export CSV
            </button>
          </div>
        </div>
      </div>

      {/* MIDDLE COLUMN */}
      <div className="w-1/2 flex flex-col gap-4 min-h-0">
        <div className="flex-1 bg-white rounded-xl shadow-md p-4 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-[#000060]">Activity</h3>
            <div className="text-sm text-gray-500">Live</div>
          </div>

          {/* Main panel scroll */}
          <div className="flex-1 min-h-0 overflow-auto">
            <CombinedActivityPanel />
          </div>
        </div>

        {/* Quick actions */}
      </div>

      {/* RIGHT COLUMN */}
      <div className="w-1/4 flex flex-col gap-4 min-h-0">
        {/* Summary */}
        <div className="bg-white rounded-xl shadow-md p-3 flex flex-col min-h-0">
          <h3 className="text-lg font-semibold text-[#000060] mb-2">
            Verification Summary
          </h3>

          <div className="flex-1 min-h-0 overflow-auto">
            <SummaryStats compact />
          </div>
        </div>
        {/* Chart block */}
        <div className="min-h-0 flex-1">
          <CombinedChartCard />
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
