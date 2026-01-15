// frontend/src/pages/settings/plans/UpgradePlanPage.jsx

import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  CreditCard,
  Loader2,
  AlertCircle,
  RefreshCw,
  Mail,
  Sparkles,
  Check,
  Users,
  Building2,
  ArrowLeft,
} from "lucide-react";

// API
import {
  getPlans,
  getMySubscription,
  changePlan,
  confirmPayment,
  cancelPendingSubscription,
} from "../../../api/subscription";
import { fetchUserLimits } from "../../../api/users";
import { fetchBranchLimits } from "../../../api/branches";

// Utils & Config
import { analyzePlanChange } from "../../../utils/planChangeUtils";
import { normalizePlans } from "../../../utils/normalizePlan"; // ✅ NEW IMPORT

// Components
import CurrentPlanBanner from "./comps/CurrentPlanBanner";
import PlanCard from "./comps/PlanCard";
import DowngradeWarningModal from "./comps/DowngradeWarningModal";
import ComplianceModal from "./comps/ComplianceModal";
import FinalConfirmationModal from "./comps/FinalConfirmationModal";
import UpgradeConfirmModal from "./comps/UpgradeConfirmModal";
import RenewalConfirmModal from "./comps/RenewalConfirmModal";

/**
 * UpgradePlanPage
 * Plan management page for Super Admin
 * Handles upgrades (Razorpay) and downgrades (compliance flow)
 */
const UpgradePlanPage = () => {
  const navigate = useNavigate();

  // ============================================
  // STATE
  // ============================================

  // Data
  const [plans, setPlans] = useState([]);
  const [currentSubscription, setCurrentSubscription] = useState(null);
  const [usage, setUsage] = useState({ activeUsers: 0, activeBranches: 0 });

  // UI State
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Selected plan & analysis
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [planAnalysis, setPlanAnalysis] = useState(null);

  // Modal state machine
  const [modalState, setModalState] = useState(null);
  // null | "upgrade_confirm" | "downgrade_warning" | "compliance" | "final_confirm"

  // Processing state
  const [processing, setProcessing] = useState(false);
  const [modalError, setModalError] = useState("");

  // Compliance selections (for downgrade)
  const [complianceData, setComplianceData] = useState({
    usersToDisable: [],
    branchesToDeactivate: [],
  });

  // ============================================
  // DATA LOADING
  // ============================================

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch all data in parallel
      const [plansRes, subscriptionRes, userLimitsRes, branchLimitsRes] =
        await Promise.all([
          getPlans(),
          getMySubscription(),
          fetchUserLimits(),
          fetchBranchLimits(),
        ]);

      // Plans - ✅ NORMALIZE PLANS
      const plansData =
        plansRes.data?.data?.plans || plansRes.data?.plans || [];
      const normalizedPlans = normalizePlans(plansData);
      setPlans(normalizedPlans);

      // Current subscription
      const subData = subscriptionRes.data?.data || subscriptionRes.data;
      if (subData?.has_active_subscription && subData?.current_plan) {
        setCurrentSubscription({
          ...subData.subscription,
          plan: subData.current_plan,
        });
      } else {
        setCurrentSubscription(null);
      }

      // Usage counts
      const userCount = userLimitsRes.data?.current_count || 0;
      const branchCount = branchLimitsRes.data?.current_count || 0;
      setUsage({
        activeUsers: userCount,
        activeBranches: branchCount,
      });
    } catch (err) {
      console.error("Failed to load data:", err);
      setError("Failed to load plan information. Please try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ============================================
  // PLAN SELECTION HANDLER
  // ============================================

  const handleSelectPlan = (plan) => {
    // Analyze the change
    const analysis = analyzePlanChange(
      currentSubscription?.plan || { max_users: 0, max_branches: 0, price: 0 },
      plan,
      usage
    );

    setSelectedPlan(plan);
    setPlanAnalysis(analysis);
    setModalError("");
    setComplianceData({ usersToDisable: [], branchesToDeactivate: [] });

    // Determine which modal to show
    if (analysis.direction === "renew") {
      setModalState("renew_confirm");
    } else if (analysis.direction === "upgrade") {
      setModalState("upgrade_confirm");
    } else if (analysis.direction === "downgrade") {
      setModalState("downgrade_warning");
    } else {
      alert("No change detected.");
    }
  };

  // ============================================
  // RENEWAL FLOW
  // ============================================

  const handleRenewConfirm = async () => {
    if (!selectedPlan || processing) return;

    setProcessing(true);
    setModalError("");

    try {
      const response = await changePlan({ plan_id: selectedPlan.plan_id });
      const data = response.data.data;

      if (data.requires_payment) {
        openRazorpayCheckout({
          ...data.razorpay,
          subscription_id: data.subscription_id,
          plan_name: selectedPlan.name,
        });
      } else {
        alert("Plan renewed successfully!");
        handleCloseModals();
        loadData();
      }
    } catch (err) {
      console.error("Renewal error:", err);
      setModalError(
        err.response?.data?.message ||
          "Failed to process renewal. Please try again."
      );
      setProcessing(false);
    }
  };

  // ============================================
  // UPGRADE FLOW
  // ============================================

  const handleUpgradeConfirm = async () => {
    if (!selectedPlan || processing) return;

    setProcessing(true);
    setModalError("");

    try {
      const response = await changePlan({ plan_id: selectedPlan.plan_id });
      const data = response.data.data;

      if (data.requires_payment) {
        openRazorpayCheckout({
          ...data.razorpay,
          subscription_id: data.subscription_id,
          plan_name: selectedPlan.name,
        });
      } else {
        alert("Plan upgraded successfully!");
        handleCloseModals();
        loadData();
      }
    } catch (err) {
      console.error("Upgrade error:", err);
      setModalError(
        err.response?.data?.message ||
          "Failed to process upgrade. Please try again."
      );
      setProcessing(false);
    }
  };

  const openRazorpayCheckout = (data) => {
    const options = {
      key: data.key,
      amount: data.amount,
      currency: data.currency,
      name: data.name,
      description: data.description,
      order_id: data.order_id,
      prefill: data.prefill,
      theme: { color: "#000060" },
      handler: async function (response) {
        try {
          await confirmPayment({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
            subscription_id: data.subscription_id,
          });
          alert("Payment successful! Your plan has been upgraded.");
          handleCloseModals();
          loadData();
        } catch (err) {
          console.error("Payment confirmation error:", err);
          setModalError(
            "Payment was successful but activation failed. Please contact support."
          );
          setProcessing(false);
        }
      },
      modal: {
        ondismiss: async function () {
          try {
            await cancelPendingSubscription(data.subscription_id);
          } catch (err) {
            console.error("Failed to cancel pending subscription:", err);
          }
          setModalError("Payment was cancelled.");
          setProcessing(false);
        },
        escape: false,
        backdropclose: false,
      },
    };

    const rzp = new window.Razorpay(options);

    rzp.on("payment.failed", async function (response) {
      console.error("Payment failed:", response.error);
      try {
        await cancelPendingSubscription(data.subscription_id);
      } catch (err) {
        console.error("Failed to cancel pending subscription:", err);
      }
      setModalError(
        response.error.description || "Payment failed. Please try again."
      );
      setProcessing(false);
    });

    rzp.open();
  };

  // ============================================
  // DOWNGRADE FLOW
  // ============================================

  const handleDowngradeWarningAccept = () => {
    if (planAnalysis?.hasImpact) {
      setModalState("compliance");
    } else {
      setModalState("final_confirm");
    }
  };

  const handleComplianceComplete = (data) => {
    setComplianceData(data);
    setModalState("final_confirm");
  };

  const handleFinalConfirm = async () => {
    if (!selectedPlan || processing) return;

    setProcessing(true);
    setModalError("");

    try {
      const response = await changePlan({
        plan_id: selectedPlan.plan_id,
        users_to_disable: complianceData.usersToDisable,
        branches_to_deactivate: complianceData.branchesToDeactivate,
      });

      const data = response.data.data;

      let message = "Plan changed successfully!";
      if (data.disabled_users > 0 || data.deactivated_branches > 0) {
        message += ` ${data.disabled_users} user(s) disabled, ${data.deactivated_branches} branch(es) deactivated.`;
      }

      alert(message);
      handleCloseModals();
      loadData();
    } catch (err) {
      console.error("Downgrade error:", err);
      setModalError(
        err.response?.data?.message ||
          "Failed to change plan. Please try again."
      );
      setProcessing(false);
    }
  };

  // ============================================
  // MODAL MANAGEMENT
  // ============================================

  const handleCloseModals = () => {
    if (processing) return;
    setModalState(null);
    setSelectedPlan(null);
    setPlanAnalysis(null);
    setModalError("");
    setProcessing(false);
    setComplianceData({ usersToDisable: [], branchesToDeactivate: [] });
  };

  const handleBackToWarning = () => {
    setModalState("downgrade_warning");
  };

  const handleBackToCompliance = () => {
    setModalState("compliance");
  };

  // ============================================
  // NAVIGATION
  // ============================================

  const handleBackToProfile = () => {
    navigate("/settings/profile");
  };

  // ============================================
  // LOADING STATE
  // ============================================

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 size={32} className="animate-spin text-[#000060]" />
          <p className="text-gray-500">Loading plans...</p>
        </div>
      </div>
    );
  }

  // ============================================
  // ERROR STATE
  // ============================================

  if (error && plans.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="flex flex-col items-center gap-4 text-center max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <AlertCircle size={32} className="text-red-500" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900">
            Failed to load plans
          </h3>
          <p className="text-gray-500">{error}</p>
          <div className="flex gap-3">
            <button
              onClick={handleBackToProfile}
              className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ArrowLeft size={16} />
              Back to Profile
            </button>
            <button
              onClick={loadData}
              className="flex items-center gap-2 px-4 py-2 bg-[#000060] text-white rounded-lg hover:bg-[#000080] transition-colors"
            >
              <RefreshCw size={16} />
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
    <div className="h-full flex flex-col gap-6 p-1 overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={handleBackToProfile}
            className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <ArrowLeft size={20} />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-[#000060]/10 rounded-xl flex items-center justify-center">
              <CreditCard size={24} className="text-[#000060]" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Manage Plans</h1>
              <p className="text-sm text-gray-500">
                View and change your subscription plan
              </p>
            </div>
          </div>
        </div>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={loadData}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          <span className="text-sm">Refresh</span>
        </motion.button>
      </div>

      {/* Current Plan Banner */}
      {currentSubscription && (
        <CurrentPlanBanner subscription={currentSubscription} usage={usage} />
      )}

      {/* Error Banner (non-critical) */}
      {error && plans.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center justify-between"
        >
          <div className="flex items-center gap-3">
            <AlertCircle size={20} className="text-red-500" />
            <span className="text-red-700 text-sm">{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-700 font-bold text-xl"
          >
            ×
          </button>
        </motion.div>
      )}

      {/* Plans Section */}
      <div className="flex-1">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Available Plans
        </h2>

        <div className="flex flex-wrap justify-center gap-6">
          {plans.map((plan) => (
            <PlanCard
              key={plan.plan_id}
              plan={plan}
              currentPlan={currentSubscription?.plan}
              usage={usage}
              onSelect={handleSelectPlan}
              disabled={processing}
            />
          ))}

          <CustomPlanCard />
        </div>
      </div>

      {/* Footer Note */}
      <div className="text-center py-4 flex-shrink-0">
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

      {/* ============================================ */}
      {/* MODALS */}
      {/* ============================================ */}

      {modalState === "upgrade_confirm" && selectedPlan && (
        <UpgradeConfirmModal
          plan={selectedPlan}
          currentPlan={currentSubscription?.plan}
          onConfirm={handleUpgradeConfirm}
          onClose={handleCloseModals}
          loading={processing}
          error={modalError}
        />
      )}

      {modalState === "downgrade_warning" && selectedPlan && planAnalysis && (
        <DowngradeWarningModal
          currentPlan={currentSubscription?.plan}
          targetPlan={selectedPlan}
          analysis={planAnalysis}
          onAccept={handleDowngradeWarningAccept}
          onClose={handleCloseModals}
        />
      )}

      {modalState === "compliance" && selectedPlan && planAnalysis && (
        <ComplianceModal
          targetPlan={selectedPlan}
          analysis={planAnalysis}
          onComplete={handleComplianceComplete}
          onBack={handleBackToWarning}
          onClose={handleCloseModals}
        />
      )}

      {modalState === "renew_confirm" && selectedPlan && (
        <RenewalConfirmModal
          plan={selectedPlan}
          currentSubscription={currentSubscription}
          onConfirm={handleRenewConfirm}
          onClose={handleCloseModals}
          loading={processing}
          error={modalError}
        />
      )}

      {modalState === "final_confirm" && selectedPlan && (
        <FinalConfirmationModal
          currentPlan={currentSubscription?.plan}
          targetPlan={selectedPlan}
          complianceData={complianceData}
          hasImpact={planAnalysis?.hasImpact}
          onConfirm={handleFinalConfirm}
          onBack={
            planAnalysis?.hasImpact
              ? handleBackToCompliance
              : handleBackToWarning
          }
          onClose={handleCloseModals}
          loading={processing}
          error={modalError}
        />
      )}
    </div>
  );
};

// ============================================
// CUSTOM PLAN CARD (Static)
// ============================================

function CustomPlanCard() {
  return (
    <div
      className={`
        group relative flex flex-col rounded-2xl p-6
        shadow-md border-2 transition-all duration-300
        bg-gradient-to-b from-amber-50 to-orange-100
        hover:from-amber-600 hover:to-orange-600
        border-amber-300 border-dashed
        hover:shadow-xl hover:-translate-y-1
        w-[265px] h-[390px]
      `}
    >
      <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
        <div className="whitespace-nowrap flex items-center gap-1.5 px-4 py-1.5 bg-amber-600 text-white text-xs font-bold rounded-full shadow-lg">
          <Sparkles size={12} />
          TAILORED FOR YOU
        </div>
      </div>

      <div className="flex-1 flex flex-col">
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

        <div className="h-px w-full bg-gray-300 group-hover:bg-white/30 my-3" />

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
            className="mt-auto w-full py-2.5 rounded-xl text-sm font-semibold text-white transition-all duration-300 bg-amber-600 hover:bg-amber-700 shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
          >
            <Mail size={16} />
            Contact Sales
          </a>
        </div>
      </div>
    </div>
  );
}

export default UpgradePlanPage;