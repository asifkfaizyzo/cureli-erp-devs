// src/pages/Subscription-management/RiskMonitorPage.jsx

import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  AlertTriangle,
  RefreshCw,
  BadgeIndianRupee,
  Clock,
  Ban,
  AlertCircle,
  CreditCard,
} from "lucide-react";

// Components
import TimeRangeFilter from "./comps/risk/TimeRangeFilter";
import ExpiringTable from "./comps/risk/ExpiringTable";
import GracePeriodTable from "./comps/risk/GracePeriodTable";
import SuspendedTable from "./comps/risk/SuspendedTable";
import SubscriptionRiskModal from "./comps/risk/SubscriptionRiskModal";

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
import useDynamicRowCount from "../../hooks/useDynamicRowCount";

export default function RiskMonitorPage() {
  const navigate = useNavigate();
  const toast = useToast();
  const rowsPerPage = useDynamicRowCount();

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

  // Pagination state for each tab
  const [currentPages, setCurrentPages] = useState({
    [RISK_TABS.EXPIRING]: 1,
    [RISK_TABS.GRACE_PERIOD]: 1,
    [RISK_TABS.SUSPENDED]: 1,
  });

  // Tab transition state
  const [isTabTransitioning, setIsTabTransitioning] = useState(false);
  const [displayedTab, setDisplayedTab] = useState(RISK_TABS.EXPIRING);

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

  // Reset pages when time range changes
  useEffect(() => {
    setCurrentPages({
      [RISK_TABS.EXPIRING]: 1,
      [RISK_TABS.GRACE_PERIOD]: 1,
      [RISK_TABS.SUSPENDED]: 1,
    });
  }, [timeRange]);

  // ============================================
  // HANDLERS
  // ============================================

  const handleRefresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  const handleTimeRangeChange = useCallback((newRange) => {
    setTimeRange(newRange);
  }, []);

  // Smooth tab transition handler
  const handleTabChange = useCallback(
    (tabId) => {
      if (tabId === activeTab || isTabTransitioning) return;

      setIsTabTransitioning(true);

      setTimeout(() => {
        setActiveTab(tabId);
        setDisplayedTab(tabId);
        setTimeout(() => {
          setIsTabTransitioning(false);
        }, 50);
      }, 150);
    },
    [activeTab, isTabTransitioning]
  );

  const handlePageChange = useCallback(
    (page) => {
      setCurrentPages((prev) => ({
        ...prev,
        [activeTab]: page,
      }));
    },
    [activeTab]
  );

  const handleViewDetails = useCallback((subscription) => {
    setSelectedSubscription(subscription);
    setModalOpen(true);
  }, []);

  const handleModalClose = useCallback(
    (shouldRefresh = false) => {
      setModalOpen(false);
      setSelectedSubscription(null);
      if (shouldRefresh) {
        fetchData();
      }
    },
    [fetchData]
  );

  const handleActionComplete = useCallback(() => {
    fetchData();
  }, [fetchData]);

  // ============================================
  // DERIVED DATA
  // ============================================

  const currentTabConfig = useMemo(() => {
    return TAB_CONFIG.find((t) => t.id === displayedTab) || TAB_CONFIG[0];
  }, [displayedTab]);

  const getCurrentTabData = useCallback(
    (tabId) => {
      switch (tabId) {
        case RISK_TABS.EXPIRING:
          return data.expiring;
        case RISK_TABS.GRACE_PERIOD:
          return data.gracePeriod;
        case RISK_TABS.SUSPENDED:
          return data.suspended;
        default:
          return [];
      }
    },
    [data]
  );

  const currentTabData = useMemo(() => {
    return getCurrentTabData(displayedTab);
  }, [displayedTab, getCurrentTabData]);

  const currentPage = currentPages[activeTab] || 1;
  const totalItems = currentTabData.length;

  // Paginate the data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return currentTabData.slice(startIndex, startIndex + rowsPerPage);
  }, [currentTabData, currentPage, rowsPerPage]);

  // Get category for modal
  const getModalCategory = () => {
    switch (displayedTab) {
      case RISK_TABS.EXPIRING:
        return "expiring";
      case RISK_TABS.GRACE_PERIOD:
        return "gracePeriod";
      case RISK_TABS.SUSPENDED:
        return "suspended";
      default:
        return "expiring";
    }
  };

  // ============================================
  // RENDER TABLE BASED ON TAB
  // ============================================

  const renderTable = () => {
    const commonProps = {
      loading,
      currentPage,
      setCurrentPage: handlePageChange,
      rowsPerPage,
      totalItems,
      onViewDetails: handleViewDetails,
    };

    switch (displayedTab) {
      case RISK_TABS.EXPIRING:
        return (
          <ExpiringTable
            data={paginatedData}
            emptyTitle={currentTabConfig.emptyTitle}
            emptySubtitle={`${currentTabConfig.emptySubtitle} (${timeRange} days)`}
            {...commonProps}
          />
        );

      case RISK_TABS.GRACE_PERIOD:
        return (
          <GracePeriodTable
            data={paginatedData}
            emptyTitle={currentTabConfig.emptyTitle}
            emptySubtitle={currentTabConfig.emptySubtitle}
            {...commonProps}
          />
        );

      case RISK_TABS.SUSPENDED:
        return (
          <SuspendedTable
            data={paginatedData}
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
    <div className="w-full h-full min-w-0 flex flex-col gap-3 overflow-hidden">
      {/* ========== HEADER ========== */}
      <div className="flex-shrink-0 flex flex-col gap-3">
        <div className="flex items-center justify-between flex-wrap gap-3">
          {/* Title */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#000060] flex items-center justify-center flex-shrink-0">
              <CreditCard size={20} className="text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-bold text-gray-900 truncate">
                Subscription Risk Monitor
              </h1>
              <p className="text-sm text-gray-500">
                {data.counts.total} subscription
                {data.counts.total !== 1 ? "s" : ""} need attention
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => navigate("/subscriptions/manage")}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg
                         hover:bg-gray-50 transition-all shadow-sm flex items-center gap-2"
            >
              <BadgeIndianRupee size={16} />
              <span className="hidden sm:inline">Manage Plans</span>
            </button>

            <button
              onClick={handleRefresh}
              disabled={loading}
              className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg
                         hover:bg-gray-50 transition-all shadow-sm flex items-center gap-2
                         disabled:opacity-50 flex-shrink-0"
            >
              <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
              <span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
        </div>

        {/* ========== FILTERS & TABS ========== */}
        <div className="bg-white rounded-xl border border-gray-200 p-3 sm:p-4 space-y-3">
          {/* Summary Stats Row - Clickable Tab Cards */}
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {/* Expiring Card */}
            <button
              onClick={() => handleTabChange(RISK_TABS.EXPIRING)}
              disabled={isTabTransitioning}
              className={`p-2 sm:p-3 rounded-lg border transition-all duration-200 text-left
                ${
                  activeTab === RISK_TABS.EXPIRING
                    ? "bg-indigo-50 border-indigo-200 ring-2 ring-[#000060]/20"
                    : "bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300"
                }
                ${isTabTransitioning ? "pointer-events-none" : ""}`}
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors duration-200
                  ${activeTab === RISK_TABS.EXPIRING ? "bg-[#000060]" : "bg-blue-100"}`}
                >
                  <Clock
                    size={18}
                    className={
                      activeTab === RISK_TABS.EXPIRING ? "text-white" : "text-blue-600"
                    }
                  />
                </div>
                <div className="min-w-0">
                  <p
                    className={`text-lg sm:text-2xl font-bold transition-colors duration-200
                    ${activeTab === RISK_TABS.EXPIRING ? "text-[#000060]" : "text-blue-700"}`}
                  >
                    {data.counts.expiring}
                  </p>
                  <p
                    className={`text-xs truncate transition-colors duration-200
                    ${activeTab === RISK_TABS.EXPIRING ? "text-[#000060]/70" : "text-blue-600"}`}
                  >
                    Expiring Soon
                  </p>
                </div>
              </div>
            </button>

            {/* Grace Period Card */}
            <button
              onClick={() => handleTabChange(RISK_TABS.GRACE_PERIOD)}
              disabled={isTabTransitioning}
              className={`p-2 sm:p-3 rounded-lg border transition-all duration-200 text-left
                ${
                  activeTab === RISK_TABS.GRACE_PERIOD
                    ? "bg-indigo-50 border-indigo-200 ring-2 ring-[#000060]/20"
                    : "bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300"
                }
                ${isTabTransitioning ? "pointer-events-none" : ""}`}
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors duration-200
                  ${activeTab === RISK_TABS.GRACE_PERIOD ? "bg-[#000060]" : "bg-amber-100"}`}
                >
                  <AlertTriangle
                    size={18}
                    className={
                      activeTab === RISK_TABS.GRACE_PERIOD ? "text-white" : "text-amber-600"
                    }
                  />
                </div>
                <div className="min-w-0">
                  <p
                    className={`text-lg sm:text-2xl font-bold transition-colors duration-200
                    ${activeTab === RISK_TABS.GRACE_PERIOD ? "text-[#000060]" : "text-amber-700"}`}
                  >
                    {data.counts.gracePeriod}
                  </p>
                  <p
                    className={`text-xs truncate transition-colors duration-200
                    ${activeTab === RISK_TABS.GRACE_PERIOD ? "text-[#000060]/70" : "text-amber-600"}`}
                  >
                    Grace Period
                  </p>
                </div>
              </div>
            </button>

            {/* Suspended Card */}
            <button
              onClick={() => handleTabChange(RISK_TABS.SUSPENDED)}
              disabled={isTabTransitioning}
              className={`p-2 sm:p-3 rounded-lg border transition-all duration-200 text-left
                ${
                  activeTab === RISK_TABS.SUSPENDED
                    ? "bg-indigo-50 border-indigo-200 ring-2 ring-[#000060]/20"
                    : "bg-gray-50 border-gray-200 hover:bg-gray-100 hover:border-gray-300"
                }
                ${isTabTransitioning ? "pointer-events-none" : ""}`}
            >
              <div className="flex items-center gap-2 sm:gap-3">
                <div
                  className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors duration-200
                  ${activeTab === RISK_TABS.SUSPENDED ? "bg-[#000060]" : "bg-red-100"}`}
                >
                  <Ban
                    size={18}
                    className={
                      activeTab === RISK_TABS.SUSPENDED ? "text-white" : "text-red-600"
                    }
                  />
                </div>
                <div className="min-w-0">
                  <p
                    className={`text-lg sm:text-2xl font-bold transition-colors duration-200
                    ${activeTab === RISK_TABS.SUSPENDED ? "text-[#000060]" : "text-red-700"}`}
                  >
                    {data.counts.suspended}
                  </p>
                  <p
                    className={`text-xs truncate transition-colors duration-200
                    ${activeTab === RISK_TABS.SUSPENDED ? "text-[#000060]/70" : "text-red-600"}`}
                  >
                    Suspended
                  </p>
                </div>
              </div>
            </button>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200" />

          {/* Time Range Filter Row */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <TimeRangeFilter
              value={timeRange}
              onChange={handleTimeRangeChange}
              disabled={loading}
            />

            <div className="text-sm text-gray-500">
              Viewing:{" "}
              <span className="font-medium text-gray-700">{currentTabConfig.label}</span>
              {totalItems > 0 && (
                <span className="ml-2 text-gray-400">
                  ({totalItems} item{totalItems !== 1 ? "s" : ""})
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ========== ERROR STATE ========== */}
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
      </div>

      {/* ========== TABLE CONTAINER WITH SMOOTH TRANSITION ========== */}
      <div className="flex-1 min-h-0 min-w-0 overflow-hidden">
        <div
          className={`h-full transition-all duration-200 ease-in-out
            ${isTabTransitioning ? "opacity-0 translate-y-1" : "opacity-100 translate-y-0"}`}
        >
          {renderTable()}
        </div>
      </div>

      {/* ========== SUBSCRIPTION RISK MODAL ========== */}
      <SubscriptionRiskModal
        isOpen={modalOpen}
        subscription={selectedSubscription}
        category={getModalCategory()}
        onClose={handleModalClose}
        onActionComplete={handleActionComplete}
      />
    </div>
  );
}