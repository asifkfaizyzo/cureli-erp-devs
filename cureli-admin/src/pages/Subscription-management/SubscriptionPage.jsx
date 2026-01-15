// cureli-admin/src/pages/Subscription-management/SubscriptionPage.jsx

import {
  Plus,
  BadgeIndianRupee,
  Loader2,
  AlertCircle,
  RefreshCw,
  Search,
  X,
  Package,
  CheckCircle,
  Clock,
  Ban,
  Sparkles,
  Archive,
} from "lucide-react";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useToast } from "../../components/common/Toast";
import { useMenuStore } from "../../store/useMenuStore";
import Pagination from "../../components/common/Pagination";

// Components
import PlanCard from "./comps/plans/PlanCard";
import PlanModal from "./comps/plans/PlanModal";
import CreatePlanModal from "./comps/plans/CreatePlanModal";
import ConfirmActionModal from "./comps/plans/ConfirmActionModal";

// Config
import { generateCloneName, PLAN_STATUS } from "../../config/modules/subscriptionConfig";

// API
import {
  getPlans,
  getPlanStats,
  createPlan,
  updatePlan,
  activatePlan,
  suspendPlan,
  reactivatePlan,
  clonePlan,
  deletePlan,
} from "../../api/cadminPlans";

// Plans per page (2 rows × 4 columns = 8)
const PLANS_PER_PAGE = 8;

// Status filter options - using UPPERCASE to match backend values
const STATUS_FILTERS = [
  { key: "all", label: "All", icon: Package },
  { key: PLAN_STATUS.ACTIVE, label: "Active", icon: CheckCircle },
  { key: PLAN_STATUS.DRAFT, label: "Draft", icon: Clock },
  { key: PLAN_STATUS.DEPRECATED, label: "Deprecated", icon: Archive },
  { key: PLAN_STATUS.SUSPENDED, label: "Suspended", icon: Ban },
];

export default function SubscriptionPage() {
  const toast = useToast();
  const setBreadcrumbs = useMenuStore((s) => s.setBreadcrumbs);

  // ============================================
  // STATE
  // ============================================
  const [plans, setPlans] = useState([]);
  const [stats, setStats] = useState({
    total: 0,
    draft: 0,
    active: 0,
    deprecated: 0,
    suspended: 0,
    with_active_promo: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Filters
  const [planTypeFilter, setPlanTypeFilter] = useState("PRE_MADE");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);

  // Modal states
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [planModalOpen, setPlanModalOpen] = useState(false);
  const [planModalMode, setPlanModalMode] = useState("view");
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    action: null,
    plan: null,
    newName: null,
  });

  useEffect(() => {
    setBreadcrumbs(["Subscriptions", "Plans"]);
  }, [setBreadcrumbs]);

  // ============================================
  // DATA FETCHING
  // ============================================

  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [plansResponse, statsResponse] = await Promise.all([
        getPlans({
          limit: 100,
          sort_by: "created_at",
          sort_order: "desc",
          type: planTypeFilter,
        }),
        getPlanStats(),
      ]);

      if (plansResponse.success) {
        setPlans(plansResponse.data.plans || []);
      }

      if (statsResponse.success) {
        setStats(statsResponse.data);
      }
    } catch (err) {
      console.error("Failed to fetch plans:", err);
      const errorMsg = err.response?.data?.message || "Failed to load plans";
      setError(errorMsg);
      toast.error("Load Failed", errorMsg);
    } finally {
      setLoading(false);
    }
  }, [planTypeFilter, toast]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  // Reset filters when switching plan types
  useEffect(() => {
    setStatusFilter("all");
    setSearchQuery("");
    setCurrentPage(1);
  }, [planTypeFilter]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  const handleRefresh = useCallback(() => {
    toast.info("Data Refreshed", "Loading latest plans...");
    fetchPlans();
  }, [toast, fetchPlans]);

  // ============================================
  // DERIVED DATA
  // ============================================

  // Filter plans based on search and status
  const filteredPlans = useMemo(() => {
    return plans.filter((p) => {
      const matchesSearch =
        p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false;
      if (!matchesSearch) return false;
      if (statusFilter === "all") return true;
      return p.status === statusFilter;
    });
  }, [plans, searchQuery, statusFilter]);

  // Paginate filtered plans
  const paginatedPlans = useMemo(() => {
    const startIndex = (currentPage - 1) * PLANS_PER_PAGE;
    return filteredPlans.slice(startIndex, startIndex + PLANS_PER_PAGE);
  }, [filteredPlans, currentPage]);

  // Stats for current filter - use stats from API for accuracy
  const planCounts = useMemo(() => ({
    all: plans.length,
    [PLAN_STATUS.ACTIVE]: stats.active || plans.filter((p) => p.status === PLAN_STATUS.ACTIVE).length,
    [PLAN_STATUS.DRAFT]: stats.draft || plans.filter((p) => p.status === PLAN_STATUS.DRAFT).length,
    [PLAN_STATUS.DEPRECATED]: stats.deprecated || plans.filter((p) => p.status === PLAN_STATUS.DEPRECATED).length,
    [PLAN_STATUS.SUSPENDED]: stats.suspended || plans.filter((p) => p.status === PLAN_STATUS.SUSPENDED).length,
  }), [plans, stats]);

  const hasActiveFilters = searchQuery.trim().length > 0 || statusFilter !== "all";

  // ============================================
  // PLAN ACTIONS
  // ============================================

  const handlePlanAction = (actionType, plan) => {
    switch (actionType) {
      case "edit":
        setSelectedPlan(plan);
        setPlanModalMode("edit");
        setPlanModalOpen(true);
        break;

      case "view":
        setSelectedPlan(plan);
        setPlanModalMode("view");
        setPlanModalOpen(true);
        break;

      case "activate":
      case "suspend":
      case "reactivate":
      case "delete":
        setConfirmModal({
          open: true,
          action: actionType,
          plan: plan,
          newName: null,
        });
        break;

      case "clone":
        const cloneName = generateCloneName(plan.name, plans);
        setConfirmModal({
          open: true,
          action: "clone",
          plan: plan,
          newName: cloneName,
        });
        break;

      default:
        break;
    }
  };

  const handleConfirmAction = async () => {
    const { action, plan, newName } = confirmModal;
    setActionLoading(true);

    try {
      let response;

      switch (action) {
        case "activate":
          response = await activatePlan(plan.plan_id);
          break;
        case "suspend":
          response = await suspendPlan(plan.plan_id);
          break;
        case "reactivate":
          response = await reactivatePlan(plan.plan_id);
          break;
        case "clone":
          response = await clonePlan(plan.plan_id, newName);
          break;
        case "delete":
          response = await deletePlan(plan.plan_id);
          break;
        default:
          break;
      }

      if (response?.success) {
        await fetchPlans();

        const actionMessages = {
          activate: `Plan "${plan.name}" activated successfully.`,
          suspend: `Plan "${plan.name}" suspended successfully.`,
          reactivate: `Plan "${plan.name}" reactivated successfully.`,
          clone: `Plan "${newName}" created successfully.`,
          delete: `Plan "${plan.name}" deleted successfully.`,
        };

        toast.success(
          action.charAt(0).toUpperCase() + action.slice(1) + " Successful",
          actionMessages[action]
        );

        if (action === "clone" && planTypeFilter === "CUSTOM") {
          setPlanTypeFilter("PRE_MADE");
        }
      }
    } catch (err) {
      console.error(`Failed to ${action} plan:`, err);
      const errorMsg = err.response?.data?.message || `Failed to ${action} plan`;
      toast.error(
        `${action.charAt(0).toUpperCase() + action.slice(1)} Failed`,
        errorMsg
      );
    } finally {
      setActionLoading(false);
      setConfirmModal({ open: false, action: null, plan: null, newName: null });
    }
  };

  const handleCreatePlan = async (formData) => {
    setActionLoading(true);

    try {
      const apiData = {
        name: formData.name,
        description: formData.description,
        price: Number(formData.price),
        max_users: formData.max_users,
        max_branches: formData.max_branches,
        billing_cycle_months: formData.billing_cycle_months || 12,
        is_featured: formData.is_featured,
        type: "PRE_MADE",
      };

      if (formData.compare_at_price) {
        apiData.compare_at_price = Number(formData.compare_at_price);
      }
      if (formData.bonus_months) {
        apiData.bonus_months = Number(formData.bonus_months);
      }
      if (formData.promo_free_until) {
        apiData.promo_free_until = formData.promo_free_until;
      }

      const response = await createPlan(apiData);

      if (response?.success) {
        if (planTypeFilter === "CUSTOM") {
          setPlanTypeFilter("PRE_MADE");
        }
        await fetchPlans();
        setCreateModalOpen(false);
        setCurrentPage(1);

        toast.success("Plan Created", `${formData.name} has been created successfully.`);
      }
    } catch (err) {
      console.error("Failed to create plan:", err);
      const errorMsg = err.response?.data?.message || "Failed to create plan";
      toast.error("Creation Failed", errorMsg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSavePlan = async (updatedPlan) => {
    setActionLoading(true);

    try {
      const updateData = {
        name: updatedPlan.name,
        description: updatedPlan.description,
        price: Number(updatedPlan.price),
        max_users: updatedPlan.max_users,
        max_branches: updatedPlan.max_branches,
        billing_cycle_months: updatedPlan.billing_cycle_months || 12,
        is_featured: updatedPlan.is_featured,
        compare_at_price: updatedPlan.compare_at_price
          ? Number(updatedPlan.compare_at_price)
          : null,
        bonus_months: updatedPlan.bonus_months
          ? Number(updatedPlan.bonus_months)
          : 0,
        promo_free_until: updatedPlan.promo_free_until || null,
      };

      const response = await updatePlan(updatedPlan.plan_id, updateData);

      if (response?.success) {
        await fetchPlans();
        setPlanModalOpen(false);
        setSelectedPlan(null);

        toast.success("Plan Updated", `${updatedPlan.name} has been updated successfully.`);
      }
    } catch (err) {
      console.error("Failed to update plan:", err);
      const errorMsg = err.response?.data?.message || "Failed to update plan";
      toast.error("Update Failed", errorMsg);
    } finally {
      setActionLoading(false);
    }
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
  };

  // ============================================
  // RENDER - LOADING STATE
  // ============================================
  if (loading) {
    return (
      <div className="w-full min-h-[500px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={40} className="text-[#05015A] animate-spin" />
          <p className="text-gray-500 text-sm">Loading plans...</p>
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER - ERROR STATE
  // ============================================
  if (error && plans.length === 0) {
    return (
      <div className="w-full min-h-[500px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 max-w-md text-center">
          <div className="p-4 bg-red-100 rounded-full">
            <AlertCircle size={40} className="text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800">Failed to Load Plans</h3>
          <p className="text-gray-500 text-sm">{error}</p>
          <button
            onClick={handleRefresh}
            className="flex items-center gap-2 px-4 py-2 bg-[#05015A] text-white rounded-lg text-sm font-medium hover:bg-[#0a0280] transition-all"
          >
            <RefreshCw size={16} />
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ============================================
  // RENDER - MAIN
  // ============================================
  return (
    <div className="w-full h-full min-w-0 flex flex-col gap-4 overflow-hidden">
      {/* Error Banner */}
      {error && plans.length > 0 && (
        <div className="flex-shrink-0 p-3 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-red-500" />
            <span className="text-red-700 text-sm">{error}</span>
          </div>
          <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex-shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#05015A] rounded-xl flex items-center justify-center shadow-lg shadow-[#05015A]/20">
            <BadgeIndianRupee className="text-white" size={20} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Subscription Plans</h1>
            <p className="text-sm text-gray-500">
              {stats.total} total plans • {stats.active} active
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="p-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50"
            title="Refresh plans"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>

          {planTypeFilter === "PRE_MADE" && (
            <button
              onClick={() => setCreateModalOpen(true)}
              disabled={actionLoading}
              className="flex items-center gap-2 bg-[#05015A] text-white px-4 py-2.5 rounded-xl text-sm font-semibold
                         shadow-lg shadow-[#05015A]/25 hover:bg-[#0a0280] transition-all disabled:opacity-50"
            >
              <Plus size={18} />
              Create Plan
            </button>
          )}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex-shrink-0 bg-white rounded-xl border border-gray-200 p-4 space-y-4">
        {/* Plan Type Toggle + Search */}
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Plan Type Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => setPlanTypeFilter("PRE_MADE")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                planTypeFilter === "PRE_MADE"
                  ? "bg-white text-[#05015A] shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Pre-made Plans
            </button>
            <button
              onClick={() => setPlanTypeFilter("CUSTOM")}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                planTypeFilter === "CUSTOM"
                  ? "bg-white text-violet-600 shadow-sm"
                  : "text-gray-600 hover:text-gray-900"
              }`}
            >
              Custom Plans
            </button>
          </div>

          {/* Search */}
          <div className="relative flex-1 min-w-[200px]">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search plans..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full h-10 pl-10 pr-10 border border-gray-200 rounded-lg text-sm 
                         bg-gray-50 focus:bg-white focus:ring-2 focus:ring-[#05015A]/20 
                         focus:border-[#05015A] transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded text-gray-400 hover:text-gray-600"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* Status Filters - Only show for PRE_MADE */}
        {planTypeFilter === "PRE_MADE" && (
          <div className="flex items-center gap-2 flex-wrap">
            {STATUS_FILTERS.map((filterOption) => {
              const Icon = filterOption.icon;
              const count = planCounts[filterOption.key] || 0;
              const isActive = statusFilter === filterOption.key;

              // Skip deprecated and suspended if count is 0
              if (
                (filterOption.key === PLAN_STATUS.DEPRECATED || filterOption.key === PLAN_STATUS.SUSPENDED) &&
                count === 0
              ) {
                return null;
              }

              return (
                <button
                  key={filterOption.key}
                  onClick={() => setStatusFilter(filterOption.key)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                    ${isActive
                      ? "bg-[#05015A] text-white shadow-sm"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                >
                  <Icon size={14} />
                  {filterOption.label}
                  <span className={`px-1.5 py-0.5 rounded-full text-xs ${
                    isActive ? "bg-white/20 text-white" : "bg-gray-200 text-gray-600"
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}

            {/* Promo Filter */}
            {stats.with_active_promo > 0 && (
              <button
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium 
                           bg-gradient-to-r from-amber-50 to-orange-50 text-amber-700 
                           border border-amber-200 hover:border-amber-300 transition-all"
              >
                <Sparkles size={14} />
                With Promo
                <span className="px-1.5 py-0.5 rounded-full text-xs bg-amber-100">
                  {stats.with_active_promo}
                </span>
              </button>
            )}

            {/* Clear Filters */}
            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-red-600 hover:text-red-700 
                           hover:bg-red-50 rounded-lg transition-all ml-auto"
              >
                <X size={14} />
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* Info text for Custom Plans */}
        {planTypeFilter === "CUSTOM" && (
          <div className="text-sm text-gray-500 italic">
            Custom plans are created specifically for individual shops when assigning subscriptions.
          </div>
        )}
      </div>

      {/* Plans Grid */}
      <div className="flex-1 min-h-0 overflow-auto">
        {paginatedPlans.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-4">
            {paginatedPlans.map((plan) => (
              <PlanCard key={plan.plan_id} plan={plan} onAction={handlePlanAction} />
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200">
            <div className="p-5 bg-gray-100 rounded-full mb-4">
              <BadgeIndianRupee size={40} className="text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-2">
              {planTypeFilter === "CUSTOM" ? "No Custom Plans" : "No Plans Found"}
            </h3>
            <p className="text-gray-500 mb-5 text-center max-w-md text-sm">
              {planTypeFilter === "CUSTOM"
                ? "Custom plans are created when assigning subscriptions to individual shops."
                : hasActiveFilters
                ? "No plans match your current filters. Try adjusting your search or filter criteria."
                : "Get started by creating your first subscription plan."}
            </p>
            {planTypeFilter === "PRE_MADE" && hasActiveFilters ? (
              <button
                onClick={handleClearFilters}
                className="px-5 py-2.5 bg-[#05015A] text-white rounded-xl text-sm font-semibold hover:bg-[#0a0280] transition-all"
              >
                Clear Filters
              </button>
            ) : planTypeFilter === "PRE_MADE" ? (
              <button
                onClick={() => setCreateModalOpen(true)}
                className="px-5 py-2.5 bg-[#05015A] text-white rounded-xl text-sm font-semibold hover:bg-[#0a0280] transition-all"
              >
                Create First Plan
              </button>
            ) : (
              <button
                onClick={() => setPlanTypeFilter("PRE_MADE")}
                className="px-5 py-2.5 bg-violet-600 text-white rounded-xl text-sm font-semibold hover:bg-violet-700 transition-all"
              >
                View Pre-made Plans
              </button>
            )}
          </div>
        )}
      </div>

      {/* Pagination */}
      {filteredPlans.length > PLANS_PER_PAGE && (
        <div className="flex-shrink-0 bg-white rounded-xl border border-gray-200">
          <Pagination
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            totalItems={filteredPlans.length}
            rowsPerPage={PLANS_PER_PAGE}
          />
        </div>
      )}

      {/* Modals */}
      <CreatePlanModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreatePlan}
        existingNames={plans.map((p) => p.name)}
        loading={actionLoading}
      />

      <PlanModal
        isOpen={planModalOpen}
        onClose={() => {
          setPlanModalOpen(false);
          setSelectedPlan(null);
        }}
        plan={selectedPlan}
        onSave={handleSavePlan}
        allPlans={plans}
        mode={planModalMode}
        loading={actionLoading}
      />

      <ConfirmActionModal
        isOpen={confirmModal.open}
        onClose={() =>
          setConfirmModal({ open: false, action: null, plan: null, newName: null })
        }
        onConfirm={handleConfirmAction}
        action={confirmModal.action}
        plan={confirmModal.plan}
        newName={confirmModal.newName}
        loading={actionLoading}
      />
    </div>
  );
}