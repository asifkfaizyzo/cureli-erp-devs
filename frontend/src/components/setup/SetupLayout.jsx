// src/components/setup/SetupLayout.jsx
import { useEffect,useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";

import OnboardingHeader from "../layout/OnboardingHeader";
import SetupStepper from "./SetupStepper";
import PlanLimitsBanner from "./PlanLimitsBanner";
import { useSetupStore } from "../../store/useSetupStore";
import { getMySubscription } from "../../api/subscription";

/**
 * SetupLayout
 * Wrapper layout for all setup pages
 * - Displays OnboardingHeader (minimal header with logout)
 * - Shows SetupStepper (progress indicator)
 * - Shows PlanLimitsBanner (current usage vs limits)
 * - Handles plan limits initialization from API
 */
const SetupLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Store state
  const {
    isSetupComplete,
    currentStep,
    planLimits,
    initializeSetup,
    setError,
  } = useSetupStore();

  // Get user name from localStorage
  const userName = localStorage.getItem("user_name") || "";
  const userId = localStorage.getItem("user_id") || "";

  // Loading state for initial data fetch
  const [isLoading, setIsLoading] = React.useState(true);
  const [initError, setInitError] = React.useState(null);

  // ============================================
  // INITIALIZATION
  // ============================================
  useEffect(() => {
    initializeFromAPI();
  }, []);

  const initializeFromAPI = async () => {
    try {
      setIsLoading(true);
      setInitError(null);

      // If setup is already complete, redirect to dashboard
      if (isSetupComplete) {
        navigate("/dashboard", { replace: true });
        return;
      }

      // Check if we already have plan limits
      if (planLimits.plan_id) {
        setIsLoading(false);
        return;
      }

      // Fetch subscription data
      const res = await getMySubscription();
      const data = res.data?.data;

      if (!data?.has_active_subscription) {
        // No active subscription - redirect to plan selection
        navigate("/plan-selection", { replace: true });
        return;
      }

      // Initialize store with plan limits
      initializeSetup({
        planLimits: {
          plan_id: data.current_plan.plan_id,
          plan_name: data.current_plan.name,
          max_branches: data.subscription?.branch_limit ?? data.current_plan?.max_branches ?? 1,
          max_users: data.subscription?.user_limit ?? data.current_plan?.max_users ?? 1,
        },
        superAdmin: {
          user_id: userId,
          name: userName,
        },
      });

      setIsLoading(false);
    } catch (err) {
      console.error("Failed to initialize setup:", err);
      setInitError("Failed to load subscription data. Please try again.");
      setIsLoading(false);
    }
  };

  // ============================================
  // DETERMINE CURRENT STEP FROM ROUTE
  // ============================================
  const getStepFromPath = (pathname) => {
    if (pathname.includes("/setup/branches")) return 1;
    if (pathname.includes("/setup/users")) return 2;
    if (pathname.includes("/setup/branch-operator")) return 3;
    if (pathname.includes("/setup/review")) return 4;
    return 1;
  };

  const activeStep = getStepFromPath(location.pathname);

  // ============================================
  // LOADING STATE
  // ============================================
  if (isLoading) {
    return (
      <div className="min-h-dvh h-dvh flex flex-col bg-gray-50 font-poppins">
        <OnboardingHeader userName={userName} />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 size={48} className="text-[#000060] animate-spin" />
            <p className="text-gray-600 text-lg font-medium">
              Loading setup...
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ============================================
  // ERROR STATE
  // ============================================
  if (initError) {
    return (
      <div className="min-h-dvh h-dvh flex flex-col bg-gray-50 font-poppins">
        <OnboardingHeader userName={userName} />
        <div className="flex-1 flex items-center justify-center px-4">
          <div className="flex flex-col items-center gap-6 max-w-md text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-800">Setup Error</h2>
            <p className="text-gray-600">{initError}</p>
            <button
              onClick={initializeFromAPI}
              className="px-6 py-3 bg-[#000060] text-white rounded-xl font-semibold hover:bg-[#000080] transition-all"
            >
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
    <div className="min-h-dvh h-dvh bg-gray-50 flex flex-col font-poppins">
      {/* Header */}
      <OnboardingHeader userName={userName} />

      {/* Stepper */}
      <div className="flex-shrink-0 w-full flex justify-center px-4 pt-4 pb-2">
        <SetupStepper currentStep={activeStep} />
      </div>

      {/* Plan Limits Banner */}
      <div className="flex-shrink-0 w-full flex justify-center px-4 pb-4">
        <PlanLimitsBanner />
      </div>

      {/* Main Content */}
      <div className="flex-1 min-h-0 w-full flex justify-center overflow-y-auto px-4 pb-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, x: 25 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -25 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="w-full max-w-4xl"
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
};

// Need to import React for useState
import React from "react";

export default SetupLayout;