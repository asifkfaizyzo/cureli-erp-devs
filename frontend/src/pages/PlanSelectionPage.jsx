// Q:\PROJECTS\YourZeroesAndOnes\cureli\curely_erp\frontend\src\pages\PlanSelectionPage.jsx

import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  Loader2, 
  AlertCircle, 
  RefreshCw, 
  Users, 
  Building2, 
  Check,
  Sparkles,
  Mail,
  LogOut,
} from "lucide-react";

import { getPlans, selectPlan } from "../api/subscription";
import {
  BILLING,
  CARD_THEMES,
  formatPrice,
  getCardTheme,
  generateFeatures,
} from "../config/planConfig";
import logo from "../assets/icons/cureli.png";

// ============================================
// HEADER COMPONENT (Simplified for Plan Selection)
// ============================================
function PlanSelectionHeader() {
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  const displayName = localStorage.getItem("user_name") || "User";
  const avatarLetter = displayName.charAt(0).toUpperCase();

  const handleLogout = async () => {
    setLoggingOut(true);
    
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("shop_id");
    localStorage.removeItem("user_id");
    localStorage.removeItem("user_name");
    
    await new Promise((resolve) => setTimeout(resolve, 300));
    navigate("/", { replace: true });
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-white border-b border-gray-200 px-4 sm:px-6 py-3 shadow-sm">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left - Logo */}
        <div className="flex items-center gap-2">
          <img
            src={logo}
            alt="Cureli"
            className="w-8 h-7 sm:w-10 sm:h-9 object-contain"
          />
          <span className="font-bold text-[#000060] text-xl sm:text-2xl">
            Cureli
          </span>
        </div>

        {/* Right - User info + Logout */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* User Avatar & Name */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#000060] flex items-center justify-center text-white font-semibold text-sm sm:text-base">
              {avatarLetter}
            </div>
            <span className="hidden sm:block text-sm font-medium text-gray-700 max-w-[120px] truncate">
              {displayName}
            </span>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            title="Logout"
          >
            {loggingOut ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <LogOut size={16} />
            )}
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
}

// ============================================
// PLAN CARD COMPONENT
// ============================================
function PlanCard({ plan, onSelect, isSelecting }) {
  const theme = getCardTheme(plan);
  const features = generateFeatures(plan);
  const isFree = plan.price === 0;

  return (
    <div
      className={`
        group relative flex flex-col rounded-2xl p-6
        shadow-md border-2 transition-all duration-300
        bg-gradient-to-b ${theme.gradient} ${theme.hoverGradient}
        ${theme.borderAccent}
        hover:shadow-xl hover:-translate-y-1
        w-[280px] h-[390px]
      `}
    >
      {/* Highlighted Badge */}
      {plan.is_highlighted && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <div className="whitespace-nowrap flex items-center gap-1.5 px-4 py-1.5 bg-violet-600 text-white text-xs font-bold rounded-full shadow-lg">
            <Sparkles size={12} />
            POPULAR
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 flex flex-col">
        
        {/* ===== TOP SECTION (Fixed Height) ===== */}
        <div className="h-[160px] flex flex-col">
          {/* Plan Name */}
          <h2 className="text-xl font-bold text-gray-800 group-hover:text-white text-center">
            {plan.name}
          </h2>

          {/* Description */}
          <p className="text-sm text-gray-600 group-hover:text-white/80 text-center mt-1 line-clamp-2 min-h-[40px]">
            {plan.description || "Perfect for getting started"}
          </p>

          {/* Price */}
          <div className="flex items-baseline justify-center gap-1 mt-3">
            <span
              className={`
                text-3xl font-bold 
                ${isFree ? "text-emerald-600" : theme.accentColor}
                group-hover:text-white
              `}
            >
              {formatPrice(plan.price)}
            </span>
            {!isFree && (
              <span className="text-sm text-gray-500 group-hover:text-white/70">
                {BILLING.displayText}
              </span>
            )}
          </div>

          {/* Limits */}
          <div className="flex justify-center gap-4 mt-3">
            <div className="flex items-center gap-1.5 text-xs text-gray-600 group-hover:text-white/80">
              <Users size={14} />
              <span>
                {plan.max_users === -1 ? "Unlimited" : plan.max_users} Users
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-600 group-hover:text-white/80">
              <Building2 size={14} />
              <span>
                {plan.max_branches === -1 ? "Unlimited" : plan.max_branches} Branch{plan.max_branches !== 1 ? "es" : ""}
              </span>
            </div>
          </div>
        </div>

        {/* ===== DIVIDER ===== */}
        <div className="h-px w-full bg-gray-300 group-hover:bg-white/30 my-3" />

        {/* ===== BOTTOM SECTION ===== */}
        <div className="flex-1 flex flex-col">
          {/* Features */}
          <ul className="space-y-1.5 flex-1">
            {features.map((feature, idx) => (
              <li key={idx} className="flex items-center gap-2 text-sm">
                <span className="text-emerald-500 group-hover:text-emerald-300 flex-shrink-0">
                  <Check size={14} />
                </span>
                <span className="text-gray-700 group-hover:text-white text-xs">
                  {feature}
                </span>
              </li>
            ))}
          </ul>

          {/* Select Button */}
          <button
            onClick={() => onSelect(plan.plan_id)}
            disabled={isSelecting}
            className={`
              mt-auto w-full py-2.5 rounded-xl text-sm font-semibold
              text-white transition-all duration-300
              ${theme.buttonBg}
              disabled:opacity-50 disabled:cursor-not-allowed
              shadow-lg hover:shadow-xl
            `}
          >
            {isSelecting ? (
              <span className="flex items-center justify-center gap-2">
                <Loader2 size={16} className="animate-spin" />
                Processing...
              </span>
            ) : isFree ? (
              "Start Free"
            ) : (
              "Select Plan"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// CUSTOM PLAN CARD
// ============================================
function CustomPlanCard() {
  const theme = CARD_THEMES.custom;

  return (
    <div
      className={`
        group relative flex flex-col rounded-2xl p-6
        shadow-md border-2 transition-all duration-300
        bg-gradient-to-b ${theme.gradient} ${theme.hoverGradient}
        ${theme.borderAccent}
        hover:shadow-xl hover:-translate-y-1
        w-[280px] h-[390px]
      `}
    >
      {/* Badge */}
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
        <div className="whitespace-nowrap flex items-center gap-1.5 px-4 py-1.5 bg-amber-600 text-white text-xs font-bold rounded-full shadow-lg">
          <Sparkles size={12} />
          TAILORED FOR YOU
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col">
        
        {/* ===== TOP SECTION ===== */}
        <div className="h-[160px] flex flex-col">
          <h2 className="text-xl font-bold text-gray-800 group-hover:text-white text-center">
            Custom Plan
          </h2>

          <p className="text-sm text-gray-600 group-hover:text-white/80 text-center mt-1 line-clamp-2 min-h-[40px]">
            Need something specific? We'll tailor a plan for your business.
          </p>

          <div className="flex items-baseline justify-center gap-1 mt-3">
            <span className="text-2xl font-bold text-amber-600 group-hover:text-white">
              Custom Pricing
            </span>
          </div>

          <div className="flex justify-center gap-4 mt-3">
            <div className="flex items-center gap-1.5 text-xs text-gray-600 group-hover:text-white/80">
              <Users size={14} />
              <span>Flexible</span>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-600 group-hover:text-white/80">
              <Building2 size={14} />
              <span>Flexible</span>
            </div>
          </div>
        </div>

        {/* ===== DIVIDER ===== */}
        <div className="h-px w-full bg-gray-300 group-hover:bg-white/30 my-3" />

        {/* ===== BOTTOM SECTION ===== */}
        <div className="flex-1 flex flex-col">
          <ul className="space-y-1.5 flex-1">
            {[
              "Unlimited users & branches",
              "Priority 24/7 support",
              "Custom integrations",
              "Dedicated account manager",
            ].map((feature, idx) => (
              <li key={idx} className="flex items-center gap-2 text-sm">
                <span className="text-emerald-500 group-hover:text-emerald-300 flex-shrink-0">
                  <Check size={14} />
                </span>
                <span className="text-gray-700 group-hover:text-white text-xs">
                  {feature}
                </span>
              </li>
            ))}
          </ul>

          <a
            href="mailto:sales@cureli.com"
            className={`
              mt-auto w-full py-2.5 rounded-xl text-sm font-semibold
              text-white transition-all duration-300
              ${theme.buttonBg}
              shadow-lg hover:shadow-xl
              flex items-center justify-center gap-2
            `}
          >
            <Mail size={16} />
            Contact Sales
          </a>
        </div>
      </div>
    </div>
  );
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================
const PlanSelectionPage = () => {
  const navigate = useNavigate();

  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selecting, setSelecting] = useState(false);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [error, setError] = useState("");

  // Load plans
  useEffect(() => {
    async function loadPlans() {
      try {
        setLoading(true);
        setError("");
        
        const res = await getPlans();
        const backendPlans = res.data?.data?.plans || [];
        
        setPlans(backendPlans);
      } catch (err) {
        console.error("Failed to load plans:", err);
        setError(err.response?.data?.message || "Failed to load plans. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    loadPlans();
  }, []);

  // Handle plan selection
  const handleSelect = async (planId) => {
    try {
      setSelecting(true);
      setSelectedPlanId(planId);
      setError("");

      await selectPlan({ plan_id: planId });

      navigate("/dashboard");
    } catch (err) {
      console.error("Select plan error:", err);
      setError(err.response?.data?.message || "Unable to select this plan. Please try again.");
    } finally {
      setSelecting(false);
      setSelectedPlanId(null);
    }
  };

  // Retry loading
  const handleRetry = () => {
    setError("");
    setLoading(true);
    getPlans()
      .then((res) => {
        setPlans(res.data?.data?.plans || []);
      })
      .catch((err) => {
        setError(err.response?.data?.message || "Failed to load plans.");
      })
      .finally(() => {
        setLoading(false);
      });
  };

  // ============================================
  // LOADING STATE
  // ============================================
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <PlanSelectionHeader />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 size={48} className="text-[#000060] animate-spin" />
            <p className="text-gray-600 text-lg font-medium">Loading plans...</p>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // ERROR STATE
  // ============================================
  if (error && plans.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <PlanSelectionHeader />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="flex flex-col items-center gap-6 max-w-md text-center">
            <div className="p-4 bg-red-100 rounded-full">
              <AlertCircle size={48} className="text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800">Unable to Load Plans</h2>
            <p className="text-gray-600">{error}</p>
            <button
              onClick={handleRetry}
              className="flex items-center gap-2 px-6 py-3 bg-[#000060] text-white rounded-xl font-semibold hover:bg-[#000080] transition-all"
            >
              <RefreshCw size={18} />
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // MAIN RENDER
  // ============================================
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <PlanSelectionHeader />

      {/* Main Content */}
      <main className="flex-1 py-8 px-4 sm:px-6 lg:px-8 overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {/* Page Title */}
          <div className="text-center mb-10">
            <h1 className="text-3xl sm:text-4xl font-bold text-[#000060]">
              Choose Your Plan
            </h1>
            <p className="text-gray-600 text-base sm:text-lg max-w-2xl mx-auto mt-2">
              Select the plan that best fits your business needs. 
              Upgrade or downgrade anytime.
            </p>
          </div>

          {/* Error Banner (non-critical) */}
          {error && plans.length > 0 && (
            <div className="mb-8 max-w-2xl mx-auto p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <AlertCircle size={20} className="text-red-500 flex-shrink-0" />
                <span className="text-red-700 text-sm">{error}</span>
              </div>
              <button
                onClick={() => setError("")}
                className="text-red-500 hover:text-red-700 font-bold text-xl ml-4"
              >
                ×
              </button>
            </div>
          )}

          {/* Plans Grid */}
          <div className="flex flex-wrap justify-center gap-6">
            {plans.map((plan) => (
              <PlanCard
                key={plan.plan_id}
                plan={plan}
                onSelect={handleSelect}
                isSelecting={selecting && selectedPlanId === plan.plan_id}
              />
            ))}
            <CustomPlanCard />
          </div>

          {/* Footer Note */}
          <div className="mt-12 text-center">
            <p className="text-gray-500 text-sm">
              Need help choosing?{" "}
              <a
                href="mailto:support@cureli.com"
                className="text-[#000060] font-medium hover:underline"
              >
                Contact our team
              </a>
            </p>
          </div>
        </div>
      </main>
    </div>
  );
};

export default PlanSelectionPage;