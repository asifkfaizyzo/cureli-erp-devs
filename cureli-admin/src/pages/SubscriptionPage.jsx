import { Plus, CreditCard, ChevronLeft, ChevronRight, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";

// Components
import PlanCard from "../components/Subscription/PlanCard";
import PlanModal from "../components/Subscription/PlanModal";
import CreatePlanModal from "../components/Subscription/CreatePlanModal";
import ConfirmActionModal from "../components/Subscription/ConfirmActionModal";
import PlanFilterBar from "../components/Subscription/PlanFilterBar";

// Config
import { 
  PLAN_STATUS, 
  generateCloneName 
} from "../config/modules/subscriptionConfig";

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
  toPaisa,
  fromPaisa,
} from "../api/cadminPlans";

export default function SubscriptionPage() {
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
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  // NEW: Plan type filter (PRE_MADE or CUSTOM)
  const [planTypeFilter, setPlanTypeFilter] = useState("PRE_MADE");
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all");
  
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

  // Slider
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const sliderRef = useRef(null);

  // ============================================
  // DATA FETCHING
  // ============================================
  
  const fetchPlans = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch plans based on current type filter
      const [plansResponse, statsResponse] = await Promise.all([
        getPlans({ 
          limit: 100, 
          sort_by: "created_at", 
          sort_order: "desc",
          type: planTypeFilter,  // Filter by type
        }),
        getPlanStats(),  // Stats only count PRE_MADE plans
      ]);

      if (plansResponse.success) {
        setPlans(plansResponse.data.plans || []);
      }
      
      if (statsResponse.success) {
        setStats(statsResponse.data);
      }
    } catch (err) {
      console.error("Failed to fetch plans:", err);
      setError(err.response?.data?.message || "Failed to load plans");
    } finally {
      setLoading(false);
    }
  }, [planTypeFilter]);  // Re-fetch when type filter changes

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  // Reset status filter when switching plan types
  useEffect(() => {
    setFilter("all");
    setSearchQuery("");
  }, [planTypeFilter]);

  // ============================================
  // DERIVED DATA
  // ============================================
  
  // Filter plans based on search and status filter
  const filteredPlans = plans.filter((p) => {
    const matchesSearch = p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false;
    if (!matchesSearch) return false;
    if (filter === "all") return true;
    return p.status === filter;
  });

  // Plan counts for filter badges (use stats from API - only for PRE_MADE)
  const planCounts = {
    total: stats.total,
    draft: stats.draft,
    active: stats.active,
    deprecated: stats.deprecated,
    suspended: stats.suspended,
  };

  const showNavigation = filteredPlans.length > 4;

  // ============================================
  // SLIDER FUNCTIONS
  // ============================================
  const checkScrollPosition = useCallback(() => {
    if (sliderRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  }, []);

  const scrollSlider = (direction) => {
    if (sliderRef.current) {
      const scrollAmount = direction === "left" ? -320 : 320;
      sliderRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
      setTimeout(checkScrollPosition, 300);
    }
  };

  useEffect(() => {
    checkScrollPosition();
    window.addEventListener("resize", checkScrollPosition);
    const timeout = setTimeout(checkScrollPosition, 100);
    
    return () => {
      window.removeEventListener("resize", checkScrollPosition);
      clearTimeout(timeout);
    };
  }, [filteredPlans.length, checkScrollPosition]);

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
        
        if (action === "clone") {
          // Clones are PRE_MADE, so switch to that view if we're on CUSTOM
          if (planTypeFilter === "CUSTOM") {
            setPlanTypeFilter("PRE_MADE");
          }
          setTimeout(() => {
            if (sliderRef.current) {
              sliderRef.current.scrollTo({ left: 0, behavior: "smooth" });
            }
          }, 100);
        }
      }
    } catch (err) {
      console.error(`Failed to ${action} plan:`, err);
      setError(err.response?.data?.message || `Failed to ${action} plan`);
    } finally {
      setActionLoading(false);
      setConfirmModal({ open: false, action: null, plan: null, newName: null });
    }
  };

  const handleCreatePlan = async (formData) => {
    setActionLoading(true);
    
    try {
      // Convert price from rupees to paisa for API
      // Plans created from this page are always PRE_MADE
      const apiData = {
        name: formData.name,
        description: formData.description,
        price: toPaisa(formData.price),
        max_users: formData.usersLimit,
        max_branches: formData.branchesLimit,
        is_highlighted: formData.isHighlighted,
        type: "PRE_MADE",  // Always PRE_MADE from subscription page
      };

      const response = await createPlan(apiData);

      if (response?.success) {
        // Switch to PRE_MADE view if we created from CUSTOM view
        if (planTypeFilter === "CUSTOM") {
          setPlanTypeFilter("PRE_MADE");
        }
        await fetchPlans();
        setCreateModalOpen(false);

        setTimeout(() => {
          if (sliderRef.current) {
            sliderRef.current.scrollTo({ left: 0, behavior: "smooth" });
          }
        }, 100);
      }
    } catch (err) {
      console.error("Failed to create plan:", err);
      setError(err.response?.data?.message || "Failed to create plan");
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
        price: toPaisa(updatedPlan.price),
        max_users: updatedPlan.max_users,
        max_branches: updatedPlan.max_branches,
        is_highlighted: updatedPlan.is_highlighted,
      };

      const response = await updatePlan(updatedPlan.plan_id, updateData);

      if (response?.success) {
        await fetchPlans();
        setPlanModalOpen(false);
        setSelectedPlan(null);
      }
    } catch (err) {
      console.error("Failed to update plan:", err);
      setError(err.response?.data?.message || "Failed to update plan");
    } finally {
      setActionLoading(false);
    }
  };

  // ============================================
  // RENDER - LOADING STATE
  // ============================================
  if (loading) {
    return (
      <div className="w-full min-h-[400px] flex items-center justify-center">
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
      <div className="w-full min-h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 max-w-md text-center">
          <div className="p-4 bg-red-100 rounded-full">
            <AlertCircle size={40} className="text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800">Failed to Load Plans</h3>
          <p className="text-gray-500 text-sm">{error}</p>
          <button
            onClick={fetchPlans}
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
    <div className="w-full min-w-0 overflow-hidden px-2">
      
      {/* Error Banner (for non-critical errors) */}
      {error && plans.length > 0 && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle size={16} className="text-red-500" />
            <span className="text-red-700 text-sm">{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-700"
          >
            ×
          </button>
        </div>
      )}
      
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-[#05015A] rounded-xl shadow-lg shadow-[#05015A]/20">
            <CreditCard className="text-white" size={22} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-[#05015A]">Subscription Plans</h1>
            <p className="text-sm text-gray-500">Manage your billing plans and pricing tiers</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fetchPlans}
            disabled={loading}
            className="p-2.5 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-50 hover:border-gray-300 transition-all"
            title="Refresh plans"
          >
            <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
          </button>
          
          {/* Only show Create Plan button on PRE_MADE view */}
          {planTypeFilter === "PRE_MADE" && (
            <button
              onClick={() => setCreateModalOpen(true)}
              disabled={actionLoading}
              className="
                group flex items-center gap-2 
                bg-[#05015A] text-white 
                px-5 py-2.5 rounded-xl text-sm font-semibold
                shadow-lg shadow-[#05015A]/25
                hover:bg-[#0a0280] hover:shadow-xl
                active:scale-[0.98]
                transition-all duration-300
                disabled:opacity-50 disabled:cursor-not-allowed
              "
            >
              <Plus size={18} className="transition-transform duration-300 group-hover:rotate-90" />
              Create Plan
            </button>
          )}
        </div>
      </div>



      {/* Filter Bar */}
      <PlanFilterBar
        planTypeFilter={planTypeFilter}
        setPlanTypeFilter={setPlanTypeFilter}
        filter={filter}
        setFilter={setFilter}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        planCounts={planCounts}
      />

      {/* Plans Slider */}
      {filteredPlans.length > 0 ? (
        <div className="relative w-full overflow-hidden">
          
          {/* Left Arrow */}
          {showNavigation && canScrollLeft && (
            <button
              onClick={() => scrollSlider("left")}
              className="
                absolute left-2 top-1/2 -translate-y-1/2 z-10
                p-2.5 rounded-full shadow-lg border-2
                bg-[#05015A] text-white border-[#05015A] 
                hover:bg-[#0a0280] hover:scale-110 
                transition-all duration-300
              "
            >
              <ChevronLeft size={22} />
            </button>
          )}

          {/* Slider Container */}
          <div
            ref={sliderRef}
            onScroll={checkScrollPosition}
            className="flex gap-4 overflow-x-auto scroll-smooth py-3"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              paddingLeft: showNavigation ? "56px" : "4px",
              paddingRight: showNavigation ? "56px" : "4px",
            }}
          >
            {filteredPlans.map((plan) => (
              <div 
                key={plan.plan_id}
                className="flex-shrink-0 w-[280px] min-w-[280px]"
              >
                <PlanCard 
                  plan={plan} 
                  onAction={handlePlanAction}
                />
              </div>
            ))}
          </div>

          {/* Right Arrow */}
          {showNavigation && canScrollRight && (
            <button
              onClick={() => scrollSlider("right")}
              className="
                absolute right-2 top-1/2 -translate-y-1/2 z-10
                p-2.5 rounded-full shadow-lg border-2
                bg-[#05015A] text-white border-[#05015A] 
                hover:bg-[#0a0280] hover:scale-110 
                transition-all duration-300
              "
            >
              <ChevronRight size={22} />
            </button>
          )}

          {/* Pagination Dots */}
          {showNavigation && (
            <div className="flex justify-center gap-2 mt-4">
              {Array.from({ length: Math.ceil(filteredPlans.length / 4) }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    if (sliderRef.current) {
                      sliderRef.current.scrollTo({ 
                        left: index * 4 * 296, 
                        behavior: "smooth" 
                      });
                      setTimeout(checkScrollPosition, 300);
                    }
                  }}
                  className="
                    w-2 h-2 rounded-full bg-gray-300 
                    hover:bg-[#05015A] transition-all duration-300
                  "
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-2xl border-2 border-dashed border-gray-200">
          <div className="p-5 bg-gray-100 rounded-full mb-5">
            <CreditCard size={48} className="text-gray-400" />
          </div>
          <h3 className="text-xl font-semibold text-gray-700 mb-2">
            {planTypeFilter === "CUSTOM" ? "No Custom Plans" : "No Plans Found"}
          </h3>
          <p className="text-gray-500 mb-5 text-center max-w-md">
            {planTypeFilter === "CUSTOM" 
              ? "Custom plans are created when assigning subscriptions to individual shops."
              : searchQuery 
                ? `No plans match "${searchQuery}". Try a different search term.`
                : filter !== "all"
                  ? "No plans match the selected filter. Try changing your filter options."
                  : "Get started by creating your first subscription plan."
            }
          </p>
          {planTypeFilter === "PRE_MADE" && (searchQuery || filter !== "all") ? (
            <button
              onClick={() => { setFilter("all"); setSearchQuery(""); }}
              className="
                px-6 py-2.5 bg-[#05015A] text-white rounded-xl 
                text-sm font-semibold hover:bg-[#0a0280] 
                transition-all duration-300
              "
            >
              Clear Filters
            </button>
          ) : planTypeFilter === "PRE_MADE" ? (
            <button
              onClick={() => setCreateModalOpen(true)}
              className="
                px-6 py-2.5 bg-[#05015A] text-white rounded-xl 
                text-sm font-semibold hover:bg-[#0a0280] 
                transition-all duration-300
              "
            >
              Create First Plan
            </button>
          ) : (
            <button
              onClick={() => setPlanTypeFilter("PRE_MADE")}
              className="
                px-6 py-2.5 bg-violet-600 text-white rounded-xl 
                text-sm font-semibold hover:bg-violet-700 
                transition-all duration-300
              "
            >
              View Pre-made Plans
            </button>
          )}
        </div>
      )}

      {/* Modals */}
      <CreatePlanModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreatePlan}
        existingNames={plans.map(p => p.name)}
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
        onClose={() => setConfirmModal({ open: false, action: null, plan: null, newName: null })}
        onConfirm={handleConfirmAction}
        action={confirmModal.action}
        plan={confirmModal.plan}
        newName={confirmModal.newName}
        loading={actionLoading}
      />

    </div>
  );
}