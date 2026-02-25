// src/pages/Dashboard/AdminDashboard.jsx

import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { RefreshCw, LayoutDashboard, Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../components/common/Toast";
import { useMenuStore } from "../../store/useMenuStore";

// Components
import WelcomeBanner from "./comps/WelcomeBanner";
import AlertsBanner from "./comps/AlertsBanner";
import PeriodSelector from "./comps/PeriodSelector";
import KPICardsGrid from "./comps/KPICardsGrid";
import QuickActionsPanel from "./comps/QuickActionsPanel";
import PendingActionsPanel from "./comps/PendingActionsPanel";
import RevenueChart from "./comps/RevenueChart";
import SubscriptionDonut from "./comps/SubscriptionDonut";
import UserGrowthChart from "./comps/UserGrowthChart";
import OnboardingTable from "./comps/OnboardingTable";
import TopShopsTable from "./comps/TopShopsTable";
import ActivityFeed from "./comps/ActivityFeed";

// API
import {
  getDashboardOverview,
  getDashboardAlerts,
} from "../../api/cadminDashboard";

// ============================================
// ROLE PERMISSIONS CONFIG
// ============================================
const ROLE_PERMISSIONS = {
  SUPER_ADMIN: {
    canViewKPIs: true,
    canViewRevenue: true,
    canViewSubscriptions: true,
    canViewUserGrowth: true,
    canViewOnboarding: true,
    canViewTopShops: true,
    canViewActivity: true,
    canViewAlerts: true,
    canViewQuickActions: true,
    canViewPendingActions: true,
  },
  ANALYST: {
    canViewKPIs: true,
    canViewRevenue: true,
    canViewSubscriptions: true,
    canViewUserGrowth: true,
    canViewOnboarding: true,
    canViewTopShops: true,
    canViewActivity: true,
    canViewAlerts: true,
    canViewQuickActions: false,
    canViewPendingActions: false,
  },
  ACCOUNTING: {
    canViewKPIs: true,
    canViewRevenue: true,
    canViewSubscriptions: true,
    canViewUserGrowth: false,
    canViewOnboarding: false,
    canViewTopShops: true,
    canViewActivity: false,
    canViewAlerts: true,
    canViewQuickActions: false,
    canViewPendingActions: true,
  },
};

// ============================================
// MAIN DASHBOARD COMPONENT
// ============================================
const AdminDashboard = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { admin, pendingCounts } = useAuth();
  const setBreadcrumbs = useMenuStore((s) => s.setBreadcrumbs);

  // State
  const [period, setPeriod] = useState("30d");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [overviewData, setOverviewData] = useState(null);
  const [alerts, setAlerts] = useState([]);

  // Get permissions based on role
  const permissions = useMemo(() => {
    const role = admin?.role?.toUpperCase() || "ANALYST";
    console.log("[DASHBOARD] Admin role:", role);
    return ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.ANALYST;
  }, [admin?.role]);

  // Set breadcrumbs
  useEffect(() => {
    setBreadcrumbs(["Dashboard"]);
  }, [setBreadcrumbs]);

  // Fetch dashboard data
  const fetchDashboardData = useCallback(async (showToast = false) => {
    try {
      if (showToast) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      console.log("[DASHBOARD] Fetching data for period:", period);

      const [overviewRes, alertsRes] = await Promise.allSettled([
        getDashboardOverview(period),
        getDashboardAlerts(),
      ]);

      // Process overview
      if (overviewRes.status === "fulfilled") {
        console.log("[DASHBOARD] Overview data:", overviewRes.value);
        setOverviewData(overviewRes.value.data);
      } else {
        console.error("[DASHBOARD] Overview failed:", overviewRes.reason);
        setError("Failed to load dashboard overview");
      }

      // Process alerts
      if (alertsRes.status === "fulfilled") {
        console.log("[DASHBOARD] Alerts data:", alertsRes.value);
        setAlerts(alertsRes.value.data || []);
      } else {
        console.error("[DASHBOARD] Alerts failed:", alertsRes.reason);
      }

      if (showToast) {
        toast.success("Dashboard Refreshed", "All data has been updated.");
      }
    } catch (err) {
      console.error("[DASHBOARD] fetchDashboardData error:", err);
      setError(err.message || "Failed to load dashboard data");
      toast.error("Load Failed", "Some dashboard data could not be loaded.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period, toast]);

  // Initial load and period change
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Refresh handler
  const handleRefresh = useCallback(() => {
    fetchDashboardData(true);
  }, [fetchDashboardData]);

  // Dismiss alert
  const handleDismissAlert = useCallback((alertId) => {
    setAlerts((prev) => prev.filter((a) => a.id !== alertId));
  }, []);

  // Loading state
  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#000060] to-violet-600 flex items-center justify-center animate-pulse">
              <LayoutDashboard size={32} className="text-white" />
            </div>
            <Loader2 
              size={24} 
              className="absolute -bottom-1 -right-1 text-[#000060] animate-spin" 
            />
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-gray-800">Loading Dashboard</p>
            <p className="text-sm text-gray-500">Fetching your data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full min-w-0 flex flex-col gap-4 overflow-hidden">
      {/* ===== HEADER ===== */}
      <div className="flex-shrink-0 flex flex-col gap-3">
        {/* Title Row */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#000060] to-violet-600 flex items-center justify-center flex-shrink-0 shadow-lg shadow-[#000060]/25">
              <LayoutDashboard size={20} className="text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-gray-900 truncate">
                Dashboard
              </h1>
              <p className="text-sm text-gray-500">
                Welcome back, {admin?.name || "Admin"}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <PeriodSelector value={period} onChange={setPeriod} />
            
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg
                         hover:bg-gray-50 transition-all shadow-sm flex items-center gap-2
                         disabled:opacity-50"
            >
              <RefreshCw size={16} className={refreshing ? "animate-spin" : ""} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* Welcome Banner */}
        <WelcomeBanner 
          admin={admin} 
          pendingCounts={pendingCounts}
          overviewData={overviewData}
        />

        {/* Error Banner */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle size={18} />
              <span className="text-sm">{error}</span>
            </div>
            <button
              onClick={handleRefresh}
              className="text-red-700 hover:text-red-900 font-medium underline text-sm"
            >
              Retry
            </button>
          </div>
        )}

        {/* Alerts Banner */}
        {permissions.canViewAlerts && alerts.length > 0 && (
          <AlertsBanner alerts={alerts} onDismiss={handleDismissAlert} />
        )}
      </div>

      {/* ===== SCROLLABLE CONTENT ===== */}
      <div className="flex-1 min-h-0 overflow-auto space-y-4 pb-4">
        {/* KPI Cards */}
        {permissions.canViewKPIs && overviewData && (
          <KPICardsGrid 
            data={overviewData} 
            period={period}
            role={admin?.role}
          />
        )}

        {/* Quick Actions (SUPER_ADMIN only) */}
        {permissions.canViewQuickActions && (
          <QuickActionsPanel />
        )}

        {/* Pending Actions Panel */}
        {permissions.canViewPendingActions && overviewData && (
          <PendingActionsPanel 
            data={overviewData} 
            pendingCounts={pendingCounts}
            role={admin?.role}
          />
        )}

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {/* Revenue Chart */}
          {permissions.canViewRevenue && (
            <div className="xl:col-span-2">
              <RevenueChart period={period} />
            </div>
          )}

          {/* Subscription Donut */}
          {permissions.canViewSubscriptions && overviewData?.subscriptions && (
            <SubscriptionDonut data={overviewData.subscriptions} />
          )}
        </div>

        {/* User Growth Chart */}
        {permissions.canViewUserGrowth && (
          <UserGrowthChart period={period} />
        )}

        {/* Tables Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Onboarding Table */}
          {permissions.canViewOnboarding && (
            <OnboardingTable />
          )}

          {/* Top Shops Table */}
          {permissions.canViewTopShops && (
            <TopShopsTable period={period} />
          )}
        </div>

        {/* Activity Feed */}
        {permissions.canViewActivity && (
          <ActivityFeed limit={10} />
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;