// src/components/setup/SetupLayout.jsx
import React, { useEffect, useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2 } from "lucide-react";

import OnboardingHeader from "../layout/OnboardingHeader";
import SetupStepper from "./SetupStepper";
import PlanLimitsBanner from "./PlanLimitsBanner";
import { useSetupStore } from "../../store/useSetupStore";
import { getMySubscription } from "../../api/subscription";
import { getSetupStatus } from "../../api/setup";

/**
 * SetupLayout
 * Wrapper layout for all setup pages (3 steps)
 * 
 * IMPORTANT: Always fetches fresh plan limits from API to ensure
 * the store has correct values before rendering child pages.
 */
const SetupLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Store state
  const {
    isSetupComplete,
    isInitialized,
    planLimits,
    initializeSetup,
    completeSetup,
  } = useSetupStore();

  // Get user name from localStorage
  const userName = localStorage.getItem("user_name") || "";
  const userId = localStorage.getItem("user_id") || "";

  // Loading state for initial data fetch
  const [isLoading, setIsLoading] = useState(true);
  const [initError, setInitError] = useState(null);

  // ============================================
  // INITIALIZATION - ALWAYS FETCH FRESH DATA
  // ============================================
  useEffect(() => {
    initializeFromAPI();
  }, []);

  const initializeFromAPI = async () => {
    try {
      setIsLoading(true);
      setInitError(null);

      console.log("🔄 SetupLayout: Fetching fresh data from API...");

      // Step 1: Check if setup is already complete on backend
      try {
        const statusRes = await getSetupStatus();
        const statusData = statusRes.data?.data;

        if (statusData?.is_complete) {
          console.log("✅ Setup already complete (backend), redirecting to dashboard");
          completeSetup();
          navigate("/dashboard", { replace: true });
          return;
        }
      } catch (err) {
        console.warn("Setup status check failed, continuing...", err);
      }

      // Step 2: Fetch subscription data (ALWAYS, to get correct limits)
      const res = await getMySubscription();
      const data = res.data?.data;

      console.log("📦 Subscription data:", data);

      if (!data?.has_active_subscription) {
        console.log("❌ No active subscription, redirecting to plan selection");
        navigate("/plan-selection", { replace: true });
        return;
      }

      // Step 3: Extract limits from subscription
      const maxBranches = data.subscription?.branch_limit ?? 
                          data.current_plan?.max_branches ?? 
                          1;
      const maxUsers = data.subscription?.user_limit ?? 
                       data.current_plan?.max_users ?? 
                       1;

      console.log("📊 Plan limits:", { 
        maxBranches, 
        maxUsers, 
        planName: data.current_plan?.name 
      });

      // Step 4: Initialize store with fresh data
      initializeSetup({
        planLimits: {
          plan_id: data.current_plan.plan_id,
          plan_name: data.current_plan.name,
          max_branches: maxBranches,
          max_users: maxUsers,
        },
        superAdmin: {
          user_id: userId,
          name: userName,
        },
        forceRefresh: true, // Force update even if already initialized
      });

      console.log("✅ Setup store initialized successfully");
      setIsLoading(false);

    } catch (err) {
      console.error("❌ Failed to initialize setup:", err);
      
      if (err.response?.status === 401) {
        localStorage.clear();
        navigate("/login", { replace: true });
        return;
      }
      
      setInitError("Failed to load subscription data. Please try again.");
      setIsLoading(false);
    }
  };

  // ============================================
  // DETERMINE CURRENT STEP FROM ROUTE (3 steps)
  // ============================================
  const getStepFromPath = (pathname) => {
    if (pathname.includes("/setup/branches")) return 1;
    if (pathname.includes("/setup/users")) return 2;
    if (pathname.includes("/setup/review")) return 3;
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
            <p className="text-gray-400 text-sm">
              Fetching your plan details
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
  // NOT INITIALIZED STATE (shouldn't happen, but safety check)
  // ============================================
  if (!isInitialized || !planLimits.plan_id) {
    return (
      <div className="min-h-dvh h-dvh flex flex-col bg-gray-50 font-poppins">
        <OnboardingHeader userName={userName} />
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 size={48} className="text-[#000060] animate-spin" />
            <p className="text-gray-600 text-lg font-medium">
              Initializing...
            </p>
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

export default SetupLayout;