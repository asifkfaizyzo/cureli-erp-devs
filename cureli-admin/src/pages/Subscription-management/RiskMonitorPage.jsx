// src/pages/Subscription-management/RiskMonitorPage.jsx

import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  RefreshCw,
  CreditCard,
  Clock,
  Ban,
  AlertCircle,
  TrendingDown,
} from "lucide-react";

// Components
import TimeRangeFilter from "./comps/risk/TimeRangeFilter";
import RiskTabs from "./comps/risk/RiskTabs";
import ExpiringTable from "./comps/risk/ExpiringTable";
import GracePeriodTable from "./comps/risk/GracePeriodTable";
import SuspendedTable from "./comps/risk/SuspendedTable";
import SubscriptionDetailsModal from "./comps/SubscriptionDetailsModal";

// API
import { getAtRiskSubscriptions } from "../../api/cadminSubscriptions";

// Config
import {
  RISK_TABS,
  TAB_CONFIG,
  DEFAULT_TIME_RANGE,
} from "../../config/modules/subscriptionRiskConfig";

// Hooks & Utils
import { useToast } from "../../components/common/Toast";

export default function RiskMonitorPage() {
  const navigate = useNavigate();
  const toast = useToast();

  // ============================================
  // STATE
  // ============================================

  // Data state
  const [data, setData] = useState({
    expiring: [],
    gracePeriod: [],
    suspended: [],
    counts: { expiring: 0, gracePeriod: 0, suspended: 0, total: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter state
  const [timeRange, setTimeRange] = useState(DEFAULT_TIME_RANGE);
  const [activeTab, setActiveTab] = useState(RISK_TABS.EXPIRING);

  // Modal state
  const [selectedSubscription, setSelectedSubscription] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  // ============================================
  // DATA FETCHING
  // ============================================

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await getAtRiskSubscriptions({ range: timeRange });
      const result = response.data?.data || response.data;

      setData({
        expiring: result.expiring || [],
        gracePeriod: result.gracePeriod || [],
        suspended: result.suspended || [],
        counts: result.counts || { expiring: 0, gracePeriod: 0, suspended: 0, total: 0 },
      });
    } catch (err) {
      console.error("Failed to fetch at-risk subscriptions:", err);
      const errorMsg = err.response?.data?.message || "Failed to load data";
      setError(errorMsg);
      toast.error("Failed to Load", errorMsg);
    } finally {
      setLoading(false);
    }
  }, [timeRange, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ============================================
  // HANDLERS
  // ============================================

  const handleRefresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  const handleTimeRangeChange = useCallback((newRange) => {
    setTimeRange(newRange);
  }, []);

  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
  }, []);

  const handleViewDetails = useCallback((subscription) => {
    setSelectedSubscription(subscription);
    setModalOpen(true);
  }, []);

  const handleModalClose = useCallback((shouldRefresh = false) => {
    setModalOpen(false);
    setSelectedSubscription(null);
    if (shouldRefresh) {
      fetchData();
    }
  }, [fetchData]);

  const handleNavigateToShop = useCallback((shopId) => {
    navigate(`/shops?search=${shopId}`);
  }, [navigate]);

  const handleActionComplete = useCallback(() => {
    fetchData();
    toast.success("Action Completed", "The subscription has been updated.");
  }, [fetchData, toast]);

  // ============================================
  // DERIVED DATA
  // ============================================

  const tabsWithCounts = useMemo(() => {
    return TAB_CONFIG.map((tab) => ({
      ...tab,
      count: data.counts[tab.id] || 0,
    }));
  }, [data.counts]);

  const currentTabData = useMemo(() => {
    switch (activeTab) {
      case RISK_TABS.EXPIRING:
        return data.expiring;
      case RISK_TABS.GRACE_PERIOD:
        return data.gracePeriod;
      case RISK_TABS.SUSPENDED:
        return data.suspended;
      default:
        return [];
    }
  }, [activeTab, data]);

  const currentTabConfig = useMemo(() => {
    return TAB_CONFIG.find((t) => t.id === activeTab) || TAB_CONFIG[0];
  }, [activeTab]);

  // ============================================
  // RENDER TABLE BASED ON TAB
  // ============================================

  const renderTable = () => {
    const commonProps = {
      loading,
      onViewDetails: handleViewDetails,
      onNavigateToShop: handleNavigateToShop,
      onActionComplete: handleActionComplete,
    };

    switch (activeTab) {
      case RISK_TABS.EXPIRING:
        return (
          <ExpiringTable
            data={data.expiring}
            emptyTitle={currentTabConfig.emptyTitle}
            emptySubtitle={`${currentTabConfig.emptySubtitle} (${timeRange} days)`}
            {...commonProps}
          />
        );

      case RISK_TABS.GRACE_PERIOD:
        return (
          <GracePeriodTable
            data={data.gracePeriod}
            emptyTitle={currentTabConfig.emptyTitle}
            emptySubtitle={currentTabConfig.emptySubtitle}
            {...commonProps}
          />
        );

      case RISK_TABS.SUSPENDED:
        return (
          <SuspendedTable
            data={data.suspended}
            emptyTitle={currentTabConfig.emptyTitle}
            emptySubtitle={currentTabConfig.emptySubtitle}
            {...commonProps}
          />
        );

      default:
        return null;
    }
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <div className="w-full h-full min-w-0 flex flex-col gap-4 overflow-hidden">
      {/* ========== HEADER ========== */}
      <div className="flex-shrink-0">
        <div className="flex items-center justify-between flex-wrap gap-3">
          {/* Title */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-lg shadow-red-500/20">
              <TrendingDown size={20} className="text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-gray-900 truncate">
                Subscription Risk Monitor
              </h1>
              <p className="text-sm text-gray-500">
                {data.counts.total} subscription{data.counts.total !== 1 ? "s" : ""} need attention
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Manage Plans Button */}
            <button
              onClick={() => navigate("/subscriptions/manage")}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg
                         hover:bg-gray-50 transition-all shadow-sm flex items-center gap-2"
            >
              <CreditCard size={16} />
              <span className="hidden sm:inline">Manage Plans</span>
            </button>

            {/* Refresh Button */}
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg
                         hover:bg-gray-50 transition-all shadow-sm flex items-center gap-2
                         disabled:opacity-50"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* ========== SUMMARY CARDS ========== */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          {/* Expiring Card */}
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
              <Clock size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-700">{data.counts.expiring}</p>
              <p className="text-xs text-blue-600">Expiring Soon</p>
            </div>
          </div>

          {/* Grace Period Card */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
              <AlertTriangle size={20} className="text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-amber-700">{data.counts.gracePeriod}</p>
              <p className="text-xs text-amber-600">In Grace Period</p>
            </div>
          </div>

          {/* Suspended Card */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-3 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <Ban size={20} className="text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-700">{data.counts.suspended}</p>
              <p className="text-xs text-red-600">Suspended</p>
            </div>
          </div>
        </div>
      </div>

      {/* ========== FILTERS & TABS ========== */}
      <div className="flex-shrink-0 bg-white rounded-xl border border-gray-200 p-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          {/* Time Range Filter */}
          <TimeRangeFilter
            value={timeRange}
            onChange={handleTimeRangeChange}
            disabled={loading}
          />

          {/* Tabs */}
          <RiskTabs
            tabs={tabsWithCounts}
            activeTab={activeTab}
            onTabChange={handleTabChange}
          />
        </div>
      </div>

      {/* ========== ERROR STATE ========== */}
      {error && (
        <div className="flex-shrink-0 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-center justify-between">
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

      {/* ========== TABLE CONTAINER ========== */}
      <div className="flex-1 min-h-0 min-w-0 overflow-hidden bg-white rounded-xl border border-gray-200">
        {renderTable()}
      </div>

      {/* ========== DETAILS MODAL ========== */}
      <SubscriptionDetailsModal
        isOpen={modalOpen}
        subscription={selectedSubscription}
        onClose={handleModalClose}
        onActionComplete={handleActionComplete}
      />
    </div>
  );
}