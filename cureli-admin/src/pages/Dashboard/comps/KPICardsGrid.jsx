// src/pages/Dashboard/comps/KPICardsGrid.jsx

import { useNavigate } from "react-router-dom";
import {
  Store,
  Users,
  CreditCard,
  Ticket,
  Mail,
  ShieldCheck,
  AlertTriangle,
  Ban,
  TrendingUp,
  BadgeIndianRupee,
  Clock,
} from "lucide-react";
import KPICard from "./KPICard";

const KPICardsGrid = ({ data, period, role }) => {
  const navigate = useNavigate();
  
  console.log("[KPICardsGrid] data:", data);
  console.log("[KPICardsGrid] role:", role);

  if (!data) {
    console.log("[KPICardsGrid] No data available");
    return null;
  }

  const isAccounting = role?.toUpperCase() === "ACCOUNTING";
  const isSuperAdmin = role?.toUpperCase() === "SUPER_ADMIN";

  // Build KPIs based on available data
  const kpis = [];

  // Total Shops
  if (data.shops) {
    kpis.push({
      id: "total-shops",
      title: "Total Shops",
      value: data.shops.total || 0,
      change: data.shops.growth || null,
      changeLabel: data.shops.growth !== null ? "vs previous period" : null,
      icon: Store,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      onClick: () => navigate("/shops"),
    });
  }

  // Active Subscriptions
  if (data.subscriptions) {
    kpis.push({
      id: "active-subscriptions",
      title: "Active Subscriptions",
      value: data.subscriptions.active || 0,
      change: null,
      icon: CreditCard,
      iconBg: "bg-emerald-100",
      iconColor: "text-emerald-600",
      onClick: () => navigate("/subscriptions/manage"),
    });
  }

  // For SUPER_ADMIN and ANALYST
  if (!isAccounting) {
    // Verified Shops
    if (data.shops) {
      kpis.push({
        id: "verified-shops",
        title: "Verified Shops",
        value: data.shops.verified || 0,
        change: null,
        icon: ShieldCheck,
        iconBg: "bg-violet-100",
        iconColor: "text-violet-600",
        onClick: () => navigate("/verification"),
      });
    }

    // Pending Verification
    if (data.shops) {
      kpis.push({
        id: "pending-verification",
        title: "Pending Verification",
        value: data.shops.pendingVerification || 0,
        change: null,
        icon: Clock,
        iconBg: "bg-amber-100",
        iconColor: "text-amber-600",
        onClick: () => navigate("/verification"),
      });
    }

    // Total Users
    if (data.users) {
      kpis.push({
        id: "total-users",
        title: "Total Users",
        value: data.users.total || 0,
        change: data.users.growth || null,
        changeLabel: data.users.growth !== null ? "vs previous period" : null,
        icon: Users,
        iconBg: "bg-indigo-100",
        iconColor: "text-indigo-600",
        onClick: () => navigate("/users"),
      });
    }

    // Open Tickets
    if (data.tickets) {
      kpis.push({
        id: "open-tickets",
        title: "Open Tickets",
        value: data.tickets.total || 0,
        change: null,
        icon: Ticket,
        iconBg: "bg-orange-100",
        iconColor: "text-orange-600",
        onClick: () => navigate("/communications/tickets"),
      });
    }
  }

  // For ACCOUNTING
  if (isAccounting || isSuperAdmin) {
    // At-Risk Total
    if (data.subscriptions) {
      kpis.push({
        id: "at-risk",
        title: "At-Risk Subscriptions",
        value: data.subscriptions.atRiskTotal || 0,
        change: null,
        icon: AlertTriangle,
        iconBg: "bg-red-100",
        iconColor: "text-red-600",
        onClick: () => navigate("/subscriptions/risk"),
      });
    }

    // Suspended
    if (data.subscriptions && isAccounting) {
      kpis.push({
        id: "suspended",
        title: "Suspended",
        value: data.subscriptions.suspended || 0,
        change: null,
        icon: Ban,
        iconBg: "bg-gray-100",
        iconColor: "text-gray-600",
        onClick: () => navigate("/subscriptions/risk"),
      });

      // Grace Period
      kpis.push({
        id: "grace-period",
        title: "In Grace Period",
        value: data.subscriptions.gracePeriod || 0,
        change: null,
        icon: AlertTriangle,
        iconBg: "bg-amber-100",
        iconColor: "text-amber-600",
        onClick: () => navigate("/subscriptions/risk"),
      });

      // Expiring
      kpis.push({
        id: "expiring",
        title: "Expiring Soon",
        value: data.subscriptions.expiring || 0,
        change: null,
        icon: Clock,
        iconBg: "bg-blue-100",
        iconColor: "text-blue-600",
        onClick: () => navigate("/subscriptions/risk"),
      });
    }

    // Revenue (if available)
    if (data.revenue) {
      kpis.push({
        id: "revenue",
        title: "Period Revenue",
        value: `₹${(data.revenue.totalRevenue / 100).toLocaleString("en-IN")}`,
        change: data.revenue.revenueGrowth || null,
        changeLabel: data.revenue.revenueGrowth !== null ? "vs previous period" : null,
        icon: BadgeIndianRupee,
        iconBg: "bg-emerald-100",
        iconColor: "text-emerald-600",
        onClick: null,
      });
    }
  }

  console.log("[KPICardsGrid] Generated KPIs:", kpis.length);

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
      {kpis.map((kpi) => (
        <KPICard
          key={kpi.id}
          title={kpi.title}
          value={kpi.value}
          change={kpi.change}
          changeLabel={kpi.changeLabel}
          icon={kpi.icon}
          iconBg={kpi.iconBg}
          iconColor={kpi.iconColor}
          onClick={kpi.onClick}
        />
      ))}
    </div>
  );
};

export default KPICardsGrid;