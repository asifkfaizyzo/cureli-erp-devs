// src/pages/Dashboard/AdminDashboard.jsx

import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { 
  RefreshCw, 
  LayoutDashboard, 
  Loader2, 
  AlertCircle,
  Sparkles,
  Clock,
} from "lucide-react";
import { motion } from "framer-motion";
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

// ════════════════════════════════════════════
// GRID PATTERN BACKGROUND
// ════════════════════════════════════════════

const GridPattern = () => (
  <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-[0.02]">
    <svg width="100%" height="100%">
      <defs>
        <pattern id="grid" width="32" height="32" patternUnits="userSpaceOnUse">
          <circle cx="16" cy="16" r="1" fill="currentColor" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>
  </div>
);

// ════════════════════════════════════════════
// ROLE PERMISSIONS
// ════════════════════════════════════════════

const ROLE_PERMISSIONS = {
  SUPER_CADMIN: {
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
    canViewRevenue: false,
    canViewSubscriptions: true,
    canViewUserGrowth: true,
    canViewOnboarding: true,
    canViewTopShops: false,
    canViewActivity: true,
    canViewAlerts: true,
    canViewQuickActions: false,
    canViewPendingActions: true,
  },
  ACCOUNTANT: {
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
  SALESMAN: {
    canViewKPIs: true,
    canViewRevenue: false,
    canViewSubscriptions: false,
    canViewUserGrowth: false,
    canViewOnboarding: true,
    canViewTopShops: true,
    canViewActivity: false,
    canViewAlerts: false,
    canViewQuickActions: false,
    canViewPendingActions: false,
  },
};

const normalizeRole = (role) => {
  if (!role) return "ANALYST";
  const upper = role.toUpperCase();
  if (upper === "SUPER_ADMIN" || upper === "SUPER_CADMIN") return "SUPER_CADMIN";
  if (upper === "ACCOUNTING" || upper === "ACCOUNTANT") return "ACCOUNTANT";
  if (upper === "SALES" || upper === "SALESMAN") return "SALESMAN";
  return upper;
};

const formatDateTime = (date) =>
  new Date(date).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });

// ════════════════════════════════════════════
// MAIN DASHBOARD
// ════════════════════════════════════════════

const AdminDashboard = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { admin, pendingCounts } = useAuth();
  const setBreadcrumbs = useMenuStore((s) => s.setBreadcrumbs);

  const [period, setPeriod] = useState("30d");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [overviewData, setOverviewData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [lastUpdated, setLastUpdated] = useState(null);

  const normalizedRole = useMemo(() => normalizeRole(admin?.role), [admin?.role]);
  const permissions = useMemo(
    () => ROLE_PERMISSIONS[normalizedRole] || ROLE_PERMISSIONS.ANALYST,
    [normalizedRole]
  );

  useEffect(() => {
    setBreadcrumbs(["Dashboard"]);
  }, [setBreadcrumbs]);

  const fetchDashboardData = useCallback(async (showToast = false) => {
    try {
      if (showToast) setRefreshing(true);
      else setLoading(true);
      setError(null);

      const [overviewRes, alertsRes] = await Promise.allSettled([
        getDashboardOverview(period),
        permissions.canViewAlerts ? getDashboardAlerts() : Promise.resolve({ data: [] }),
      ]);

      if (overviewRes.status === "fulfilled") {
        setOverviewData(overviewRes.value.data);
      } else {
        setError("Failed to load dashboard data");
      }

      if (alertsRes.status === "fulfilled") {
        setAlerts(alertsRes.value.data || []);
      }

      setLastUpdated(new Date());

      if (showToast) {
        toast.success("Refreshed", "Dashboard data updated");
      }
    } catch (err) {
      setError(err.message || "Failed to load dashboard");
      toast.error("Error", "Could not load dashboard data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period, permissions.canViewAlerts, toast]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  const handleRefresh = useCallback(() => fetchDashboardData(true), [fetchDashboardData]);
  const handleDismissAlert = useCallback((id) => setAlerts((p) => p.filter((a) => a.id !== id)), []);

  // Loading state
  if (loading) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-3"
        >
          <div className="relative">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#000060] to-violet-600 flex items-center justify-center">
              <LayoutDashboard size={24} className="text-white" />
            </div>
            <Loader2 size={20} className="absolute -bottom-1 -right-1 text-[#000060] animate-spin" />
          </div>
          <p className="text-sm font-semibold text-gray-700">Loading Dashboard</p>
          <p className="text-[10px] text-gray-400">Fetching your data...</p>
        </motion.div>
      </div>
    );
  }

  // Error state
  if (error && !overviewData) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full text-center"
        >
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <AlertCircle size={24} className="text-red-500" />
          </div>
          <h2 className="text-base font-bold text-gray-900 mb-1">Dashboard Error</h2>
          <p className="text-xs text-gray-500 mb-4">{error}</p>
          <button
            onClick={() => fetchDashboardData(true)}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl font-medium text-xs hover:bg-indigo-700 transition-colors"
          >
            Retry
          </button>
        </motion.div>
      </div>
    );
  }

  const showChartsRow = permissions.canViewRevenue || permissions.canViewSubscriptions;
  const showTablesRow = permissions.canViewOnboarding || permissions.canViewTopShops;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-gray-50 to-blue-50/30 relative">
      <GridPattern />

      <div className="relative max-w-[1800px] mx-auto px-3 py-3 lg:px-4 lg:py-3 space-y-3">
        {/* ── HEADER ── */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <WelcomeBanner 
            admin={admin} 
            role={normalizedRole}
            pendingCounts={pendingCounts}
            overviewData={overviewData}
          />

          <div className="flex items-center gap-2 flex-shrink-0">
            <PeriodSelector value={period} onChange={setPeriod} />
            
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="p-2 rounded-xl bg-white/80 backdrop-blur border border-gray-200/60 
                text-gray-500 hover:bg-gray-50 transition-all disabled:opacity-40 shadow-sm"
            >
              <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            </button>
          </div>
        </div>

        {/* ── ALERTS ── */}
        {permissions.canViewAlerts && alerts.length > 0 && (
          <AlertsBanner alerts={alerts} onDismiss={handleDismissAlert} />
        )}

        {/* ── QUICK ACTIONS ── */}
        {permissions.canViewQuickActions && <QuickActionsPanel />}

        {/* ── KPI CARDS ── */}
        {permissions.canViewKPIs && overviewData && (
          <KPICardsGrid data={overviewData} period={period} role={normalizedRole} loading={false} />
        )}

        {/* ── PENDING ACTIONS ── */}
        {permissions.canViewPendingActions && overviewData && (
          <PendingActionsPanel data={overviewData} pendingCounts={pendingCounts} role={normalizedRole} />
        )}

        {/* ── CHARTS ROW ── */}
        {showChartsRow && (
          <div className={`grid gap-3 ${
            permissions.canViewRevenue && permissions.canViewSubscriptions
              ? "grid-cols-1 xl:grid-cols-12"
              : "grid-cols-1"
          }`}>
            {permissions.canViewRevenue && (
              <div className={permissions.canViewSubscriptions ? "xl:col-span-7" : ""}>
                <RevenueChart period={period} />
              </div>
            )}
            {permissions.canViewSubscriptions && (
              <div className={permissions.canViewRevenue ? "xl:col-span-5" : ""}>
                <SubscriptionDonut />
              </div>
            )}
          </div>
        )}

        {/* ── USER GROWTH ── */}
        {permissions.canViewUserGrowth && <UserGrowthChart period={period} />}

        {/* ── TABLES ROW ── */}
        {showTablesRow && (
          <div className={`grid gap-3 ${
            permissions.canViewOnboarding && permissions.canViewTopShops
              ? "grid-cols-1 lg:grid-cols-2"
              : "grid-cols-1"
          }`}>
            {permissions.canViewOnboarding && <OnboardingTable />}
            {permissions.canViewTopShops && <TopShopsTable period={period} />}
          </div>
        )}

        {/* ── ACTIVITY FEED ── */}
        {permissions.canViewActivity && <ActivityFeed limit={8} />}

        {/* ── FOOTER ── */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-center gap-2 py-2"
        >
          <Clock size={10} className="text-gray-400" />
          <p className="text-[10px] text-gray-400 font-medium">
            Last synced: {lastUpdated ? formatDateTime(lastUpdated) : "Syncing..."}
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default AdminDashboard;