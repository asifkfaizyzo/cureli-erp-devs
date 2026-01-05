import React from "react";
import KPICard from "./comps/KPICard";
import RevenueChart from "./comps/RevenueChart";
import ActivityFeed from "./comps/ActivityFeed";
import SubscriptionDonut from "./comps/SubscriptionDonut";
import QuickActionsPanel from "./comps/QuickActionsPanel";
import AlertsBanner from "./comps/AlertsBanner";
import TopShopsTable from "./comps/TopShopsTable";

import { DollarSign, Users, Store, Clock } from "lucide-react";

const AdminDashboard = () => {
  const kpis = [
    {
      id: "revenue",
      label: "Monthly Revenue",
      value: "₹4,52,800",
      change: "+12.5%",
      trend: "up",
      icon: DollarSign,
      color: "emerald",
    },
    {
      id: "users",
      label: "Active Users",
      value: "1,284",
      change: "+8.2%",
      trend: "up",
      icon: Users,
      color: "blue",
    },
    {
      id: "shops",
      label: "Registered Shops",
      value: "342",
      change: "+23",
      trend: "up",
      icon: Store,
      color: "violet",
    },
    {
      id: "pending",
      label: "Pending Approvals",
      value: "18",
      change: "-4",
      trend: "down",
      icon: Clock,
      color: "amber",
    },
  ];

  return (
    <div className="w-full space-y-4 pb-6">
      
      {/* Alerts */}
      <AlertsBanner />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <KPICard key={kpi.id} {...kpi} />
        ))}
      </div>

      {/* Main Row: Chart + Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <RevenueChart />
        </div>
        <div>
          <ActivityFeed />
        </div>
      </div>

      {/* Bottom Row: Donut + Table + Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <SubscriptionDonut />
        <TopShopsTable />
        <QuickActionsPanel />
      </div>
    </div>
  );
};

export default AdminDashboard;