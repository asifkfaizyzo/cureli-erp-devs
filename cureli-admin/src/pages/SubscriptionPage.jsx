import { 
  Plus, 
  LayoutGrid, 
  CheckCircle2, 
  XCircle, 
  Search,
  SlidersHorizontal,
  CreditCard,
  Users,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useState, useRef, useEffect } from "react";

import PlanCard from "../components/Subscription/PlanCard";
import PlanEditModal from "../components/Subscription/PlanEditModal";
import CreatePlanModal from "../components/Subscription/CreatePlanModal";

export default function SubscriptionPage() {
  // ===== ALL STATE DECLARATIONS FIRST =====
  const [plans, setPlans] = useState([
    {
      id: 1,
      name: "Basic Plan",
      price: "FREE",
      duration: "/month",
      description: "Get started with our Basic plan kickstart your Cureli journey.",
      features: ["Only 2 users", "Single Branch"],
      buttonText: "Get Plan",
      active: false,
    },
    {
      id: 2,
      name: "Standard Plan",
      price: "1000",
      duration: "/month",
      description: "Standard Plan for a comprehensive Cureli experience.",
      features: ["Up to 6 users", "2 Branches allowed"],
      buttonText: "Get Plan",
      active: true,
    },
    {
      id: 3,
      name: "Premium Plan",
      price: "5000",
      duration: "/month",
      description: "Go Pro and take your Cureli level with a tutor.",
      features: ["Up to 10 users", "4 Branches allowed"],
      buttonText: "Get Plan",
      active: true,
    },
    {
      id: 4,
      name: "Custom Plan",
      price: "??",
      duration: "/custom",
      description: "Perfect for large scale.",
      features: ["Customize your users", "Customize your branches"],
      buttonText: "Contact Us",
      active: false,
    },
    {
      id: 5,
      name: "Enterprise Plan",
      price: "10000",
      duration: "/month",
      description: "For large organizations.",
      features: ["Unlimited users", "10 Branches allowed"],
      buttonText: "Get Plan",
      active: true,
    },
    {
      id: 6,
      name: "Starter Plan",
      price: "500",
      duration: "/month",
      description: "Perfect for small teams.",
      features: ["Up to 3 users", "1 Branch allowed"],
      buttonText: "Get Plan",
      active: false,
    },
  ]);

  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // Refs
  const sliderRef = useRef(null);

  // ===== DERIVED VALUES =====
  const filteredPlans = plans.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (filter === "all") return true;
    if (filter === "active") return p.active;
    if (filter === "suspended") return !p.active;
    return true;
  });

  const totalPlans = plans.length;
  const activePlans = plans.filter(p => p.active).length;
  const suspendedPlans = plans.filter(p => !p.active).length;
  const totalUsers = plans.reduce((acc, p) => {
    const match = p.features[0]?.match(/\d+/);
    return acc + (match ? parseInt(match[0]) : 0);
  }, 0);

  const showNavigation = filteredPlans.length > 4;

  const filterButtons = [
    { 
      key: "all", 
      label: "All Plans", 
      icon: LayoutGrid,
      count: totalPlans,
      activeColor: "bg-[#05015A]",
    },
    { 
      key: "active", 
      label: "Active", 
      icon: CheckCircle2,
      count: activePlans,
      activeColor: "bg-emerald-600",
    },
    { 
      key: "suspended", 
      label: "Suspended", 
      icon: XCircle,
      count: suspendedPlans,
      activeColor: "bg-red-600",
    },
  ];

  // ===== FUNCTIONS =====
  const checkScrollPosition = () => {
    if (sliderRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
    }
  };

  const scrollLeft = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: -300, behavior: "smooth" });
      setTimeout(checkScrollPosition, 300);
    }
  };

  const scrollRight = () => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: 300, behavior: "smooth" });
      setTimeout(checkScrollPosition, 300);
    }
  };

  const togglePlanStatus = (id) => {
    setPlans((prev) =>
      prev.map((p) =>
        p.id === id ? { ...p, active: !p.active } : p
      )
    );
  };

  const handleEdit = (plan) => {
    setSelectedPlan(plan);
    setIsEditOpen(true);
  };

  const handleSave = (updatedPlan) => {
    setPlans((prev) =>
      prev.map((p) => (p.id === updatedPlan.id ? updatedPlan : p))
    );
    setIsEditOpen(false);
  };

  const handleCreatePlan = (data) => {
    const newPlan = {
      id: plans.length + 1,
      name: data.planName,
      price: data.price,
      duration: data.duration,
      description: data.detail,
      features: [
        `${data.users} users allowed`,
        `${data.branches} branches allowed`,
      ],
      buttonText: data.buttonText || "Get Plan",
      active: false,
    };

    setPlans([...plans, newPlan]);
    setIsCreateOpen(false);
    
    setTimeout(() => {
      if (sliderRef.current) {
        sliderRef.current.scrollTo({ left: sliderRef.current.scrollWidth, behavior: "smooth" });
        setTimeout(checkScrollPosition, 300);
      }
    }, 100);
  };

  // ===== EFFECTS =====
  useEffect(() => {
    checkScrollPosition();
    
    const handleResize = () => {
      checkScrollPosition();
    };

    window.addEventListener("resize", handleResize);
    const timeout = setTimeout(checkScrollPosition, 100);
    
    return () => {
      window.removeEventListener("resize", handleResize);
      clearTimeout(timeout);
    };
  }, [filteredPlans.length]);

  // ===== RENDER =====
  return (
    <div className="w-full min-w-0 overflow-hidden">

      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-[#05015A] rounded-lg shadow-md shadow-[#05015A]/20">
            <CreditCard className="text-white" size={18} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#05015A]">Subscription Plans</h1>
            <p className="text-xs text-gray-500">Manage your subscription tiers</p>
          </div>
        </div>

        <button
          className="
            group flex items-center gap-1.5 
            bg-[#05015A] text-white 
            px-4 py-2 rounded-lg text-sm font-medium
            shadow-md shadow-[#05015A]/25
            hover:bg-[#0a0280] hover:shadow-lg
            active:scale-[0.98]
            transition-all duration-300
            flex-shrink-0
          "
          onClick={() => setIsCreateOpen(true)}
        >
          <Plus size={16} className="transition-transform duration-300 group-hover:rotate-90" />
          Create Plan
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
        
        <div className="group bg-white p-3 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-[#05015A]/20 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Total Plans</p>
              <p className="text-xl font-bold text-[#05015A]">{totalPlans}</p>
            </div>
            <div className="p-2 bg-[#05015A]/10 rounded-lg group-hover:bg-[#05015A] transition-all duration-300">
              <LayoutGrid size={16} className="text-[#05015A] group-hover:text-white transition-colors" />
            </div>
          </div>
        </div>

        <div className="group bg-white p-3 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-emerald-200 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Active</p>
              <p className="text-xl font-bold text-emerald-600">{activePlans}</p>
            </div>
            <div className="p-2 bg-emerald-100 rounded-lg group-hover:bg-emerald-500 transition-all duration-300">
              <CheckCircle2 size={16} className="text-emerald-600 group-hover:text-white transition-colors" />
            </div>
          </div>
        </div>

        <div className="group bg-white p-3 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-red-200 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Suspended</p>
              <p className="text-xl font-bold text-red-600">{suspendedPlans}</p>
            </div>
            <div className="p-2 bg-red-100 rounded-lg group-hover:bg-red-500 transition-all duration-300">
              <XCircle size={16} className="text-red-600 group-hover:text-white transition-colors" />
            </div>
          </div>
        </div>

        <div className="group bg-white p-3 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition-all duration-300">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-gray-500">Users Capacity</p>
              <p className="text-xl font-bold text-blue-600">{totalUsers}+</p>
            </div>
            <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-500 transition-all duration-300">
              <Users size={16} className="text-blue-600 group-hover:text-white transition-colors" />
            </div>
          </div>
        </div>

      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-100 mb-5">
        <div className="flex flex-col lg:flex-row items-center justify-between gap-3">

          <div className="flex items-center gap-1.5 flex-wrap">
            <SlidersHorizontal size={14} className="text-gray-400 mr-1" />
            {filterButtons.map((btn) => (
              <button
                key={btn.key}
                onClick={() => setFilter(btn.key)}
                className={`
                  flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium text-xs
                  transition-all duration-300
                  ${filter === btn.key 
                    ? `${btn.activeColor} text-white shadow-md` 
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }
                `}
              >
                <btn.icon size={12} />
                {btn.label}
                <span className={`
                  px-1.5 py-0.5 rounded-full text-[10px] font-bold
                  ${filter === btn.key 
                    ? "bg-white/20 text-white" 
                    : "bg-gray-200 text-gray-600"
                  }
                `}>
                  {btn.count}
                </span>
              </button>
            ))}
          </div>

          <div className="relative w-full lg:w-auto">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search plans..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="
                w-full lg:w-[220px] pl-9 pr-3 py-1.5 
                border-2 border-gray-200 rounded-lg text-xs
                focus:border-[#05015A] focus:ring-2 focus:ring-[#05015A]/20
                transition-all duration-300 outline-none
                hover:border-[#05015A]/50
              "
            />
          </div>

        </div>
      </div>

      {/* Plans Slider */}
      {filteredPlans.length > 0 ? (
        <div className="relative w-full overflow-hidden">
          
          {showNavigation && canScrollLeft && (
            <button
              onClick={scrollLeft}
              className="
                absolute left-2 top-1/2 -translate-y-1/2 z-10
                p-2 rounded-full shadow-lg border-2
                bg-[#05015A] text-white border-[#05015A] 
                hover:bg-[#0a0280] hover:scale-110 
                transition-all duration-300
              "
            >
              <ChevronLeft size={20} />
            </button>
          )}

          <div
            ref={sliderRef}
            onScroll={checkScrollPosition}
            className="flex gap-4 overflow-x-auto scroll-smooth py-2"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              paddingLeft: showNavigation ? '50px' : '4px',
              paddingRight: showNavigation ? '50px' : '4px',
            }}
          >
            {filteredPlans.map((plan) => (
              <div 
                key={plan.id}
                className="flex-shrink-0 w-[260px] min-w-[260px]"
              >
                <PlanCard 
                  plan={plan} 
                  onEdit={handleEdit} 
                  onToggle={togglePlanStatus}
                />
              </div>
            ))}
          </div>

          {showNavigation && canScrollRight && (
            <button
              onClick={scrollRight}
              className="
                absolute right-2 top-1/2 -translate-y-1/2 z-10
                p-2 rounded-full shadow-lg border-2
                bg-[#05015A] text-white border-[#05015A] 
                hover:bg-[#0a0280] hover:scale-110 
                transition-all duration-300
              "
            >
              <ChevronRight size={20} />
            </button>
          )}

          {showNavigation && (
            <div className="flex justify-center gap-2 mt-3">
              {Array.from({ length: Math.ceil(filteredPlans.length / 4) }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    if (sliderRef.current) {
                      sliderRef.current.scrollTo({ 
                        left: index * 4 * 276, 
                        behavior: "smooth" 
                      });
                      setTimeout(checkScrollPosition, 300);
                    }
                  }}
                  className="w-2 h-2 rounded-full bg-gray-300 hover:bg-[#05015A] transition-all duration-300"
                />
              ))}
            </div>
          )}

        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-dashed border-gray-300">
          <div className="p-4 bg-gray-100 rounded-full mb-4">
            <CreditCard size={40} className="text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No Plans Found</h3>
          <p className="text-gray-500 mb-4 text-center max-w-md text-sm">
            {searchQuery 
              ? `No plans match "${searchQuery}". Try a different search term.`
              : "No plans match the selected filter. Try changing your filter options."
            }
          </p>
          <button
            onClick={() => { setFilter("all"); setSearchQuery(""); }}
            className="px-5 py-2 bg-[#05015A] text-white rounded-lg text-sm font-medium hover:bg-[#0a0280] transition-all duration-300"
          >
            Clear Filters
          </button>
        </div>
      )}

      <PlanEditModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        plan={selectedPlan}
        onSave={handleSave}
      />

      <CreatePlanModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleCreatePlan}
      />
    </div>
  );
}