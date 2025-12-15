import { Plus, CreditCard, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";

// Components
import PlanCard from "../components/Subscription/PlanCard";
import PlanModal from "../components/Subscription/PlanModal";
import CreatePlanModal from "../components/Subscription/CreatePlanModal";
import ConfirmActionModal from "../components/Subscription/ConfirmActionModal";
import PlanStatsGrid from "../components/Subscription/PlanStatsGrid";
import PlanFilterBar from "../components/Subscription/PlanFilterBar";

// Config & Data
import { 
  PLAN_STATUS, 
  generateCloneName,
  isNameAvailable 
} from "../config/modules/subscriptionConfig";
import { dummyPlans, generatePlanId } from "../data/subscriptionDummyData";

export default function SubscriptionPage() {
  // ============================================
  // STATE
  // ============================================
  const [plans, setPlans] = useState(dummyPlans);
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
  // DERIVED DATA
  // ============================================
  
  // Sort by createdAt descending (newest first)
  const sortedPlans = [...plans].sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
  );

  // Filter plans
  const filteredPlans = sortedPlans.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (filter === "all") return true;
    return p.status === filter;
  });

  // Plan counts for stats and filters
  const planCounts = {
    total: plans.length,
    draft: plans.filter(p => p.status === PLAN_STATUS.DRAFT).length,
    active: plans.filter(p => p.status === PLAN_STATUS.ACTIVE).length,
    deprecated: plans.filter(p => p.status === PLAN_STATUS.DEPRECATED).length,
    suspended: plans.filter(p => p.status === PLAN_STATUS.SUSPENDED).length,
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

  const handleConfirmAction = () => {
    const { action, plan, newName } = confirmModal;

    switch (action) {
      case "activate":
        setPlans(prev => prev.map(p => 
          p.id === plan.id 
            ? { ...p, status: PLAN_STATUS.ACTIVE, activatedAt: new Date().toISOString() }
            : p
        ));
        break;

      case "suspend":
        setPlans(prev => prev.map(p => {
          if (p.id !== plan.id) return p;
          const newStatus = p.subscriberCount > 0 
            ? PLAN_STATUS.DEPRECATED 
            : PLAN_STATUS.SUSPENDED;
          return { ...p, status: newStatus, suspendedAt: new Date().toISOString() };
        }));
        break;

      case "reactivate":
        setPlans(prev => prev.map(p => 
          p.id === plan.id 
            ? { ...p, status: PLAN_STATUS.ACTIVE, activatedAt: new Date().toISOString() }
            : p
        ));
        break;

      case "clone":
        const clonedPlan = {
          ...plan,
          id: generatePlanId(),
          name: newName,
          status: PLAN_STATUS.DRAFT,
          subscriberCount: 0,
          createdAt: new Date().toISOString(),
          activatedAt: null,
          suspendedAt: null,
        };
        setPlans(prev => [clonedPlan, ...prev]);
        break;

      default:
        break;
    }

    setConfirmModal({ open: false, action: null, plan: null, newName: null });
  };

  const handleCreatePlan = (formData) => {
    const newPlan = {
      id: generatePlanId(),
      ...formData,
      status: PLAN_STATUS.DRAFT,
      subscriberCount: 0,
      createdAt: new Date().toISOString(),
      activatedAt: null,
      createdBy: "current_admin", // Would come from auth context
    };

    setPlans(prev => [newPlan, ...prev]);
    setCreateModalOpen(false);

    // Scroll to show new plan
    setTimeout(() => {
      if (sliderRef.current) {
        sliderRef.current.scrollTo({ left: 0, behavior: "smooth" });
        setTimeout(checkScrollPosition, 300);
      }
    }, 100);
  };

  const handleSavePlan = (updatedPlan) => {
    setPlans(prev => prev.map(p => 
      p.id === updatedPlan.id ? updatedPlan : p
    ));
    setPlanModalOpen(false);
  };

  // ============================================
  // RENDER
  // ============================================
  return (
    <div className="w-full min-w-0 overflow-hidden">
      
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

        <button
          onClick={() => setCreateModalOpen(true)}
          className="
            group flex items-center gap-2 
            bg-[#05015A] text-white 
            px-5 py-2.5 rounded-xl text-sm font-semibold
            shadow-lg shadow-[#05015A]/25
            hover:bg-[#0a0280] hover:shadow-xl
            active:scale-[0.98]
            transition-all duration-300
          "
        >
          <Plus size={18} className="transition-transform duration-300 group-hover:rotate-90" />
          Create Plan
        </button>
      </div>

      {/* Stats Grid */}
      <PlanStatsGrid plans={plans} />

      {/* Filter Bar */}
      <PlanFilterBar
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
                key={plan.id}
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
          <h3 className="text-xl font-semibold text-gray-700 mb-2">No Plans Found</h3>
          <p className="text-gray-500 mb-5 text-center max-w-md">
            {searchQuery 
              ? `No plans match "${searchQuery}". Try a different search term.`
              : "No plans match the selected filter. Try changing your filter options."
            }
          </p>
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
        </div>
      )}

      {/* Modals */}
      <CreatePlanModal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        onSubmit={handleCreatePlan}
        existingNames={plans.map(p => p.name)}
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
      />

      <ConfirmActionModal
        isOpen={confirmModal.open}
        onClose={() => setConfirmModal({ open: false, action: null, plan: null, newName: null })}
        onConfirm={handleConfirmAction}
        action={confirmModal.action}
        plan={confirmModal.plan}
        newName={confirmModal.newName}
      />

    </div>
  );
}