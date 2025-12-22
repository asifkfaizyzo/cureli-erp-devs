// src/pages/setup/SetupRouter.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";

import { useSetupStore } from "../../store/useSetupStore";
import { getMySubscription } from "../../api/subscription";

/**
 * SetupRouter
 * Entry controller for the setup flow
 * 
 * Responsibilities:
 * 1. Check if user has active subscription
 * 2. Check if setup is already complete → redirect to dashboard
 * 3. Initialize plan limits from API
 * 4. Route to the first incomplete step
 * 
 * Decision Logic:
 * - No subscription → /plan-selection
 * - Setup complete → /dashboard
 * - No branches → /setup/branches
 * - Has branches, no users (optional) → /setup/users
 * - Otherwise → /setup/branch-operator
 */

const SetupRouter = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Store
  const {
    isSetupComplete,
    branches,
    planLimits,
    initializeSetup,
    resetSetup,
  } = useSetupStore();

  // Get user info from localStorage
  const userName = localStorage.getItem("user_name") || "";
  const userId = localStorage.getItem("user_id") || "";

  useEffect(() => {
    handleRouting();
  }, []);

  const handleRouting = async () => {
    try {
      setLoading(true);
      setError(null);

      // ============================================
      // CHECK 1: Setup already complete?
      // ============================================
      if (isSetupComplete) {
        console.log("✅ Setup already complete, redirecting to dashboard");
        navigate("/dashboard", { replace: true });
        return;
      }

      // ============================================
      // CHECK 2: Has active subscription?
      // ============================================
      const res = await getMySubscription();
      const data = res.data?.data;

      if (!data?.has_active_subscription) {
        console.log("❌ No active subscription, redirecting to plan selection");
        navigate("/plan-selection", { replace: true });
        return;
      }

      // ============================================
      // INITIALIZE: Set plan limits if not already set
      // ============================================
      if (!planLimits.plan_id) {
        console.log("📦 Initializing setup with plan limits");
        
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
      }

      // ============================================
      // ROUTE: Determine first incomplete step
      // ============================================
      const currentBranches = useSetupStore.getState().branches;

      if (currentBranches.length === 0) {
        // No branches created yet
        console.log("📍 Routing to: /setup/branches (no branches)");
        navigate("/setup/branches", { replace: true });
      } else {
        // Has branches - go to users (they can skip if they want)
        console.log("📍 Routing to: /setup/users (has branches)");
        navigate("/setup/users", { replace: true });
      }

    } catch (err) {
      console.error("SetupRouter error:", err);
      
      if (err.response?.status === 401) {
        // Unauthorized - redirect to login
        localStorage.clear();
        navigate("/login", { replace: true });
        return;
      }

      setError("Failed to load setup. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ============================================
  // LOADING STATE
  // ============================================
  if (loading) {
    return (
      <div className="min-h-dvh h-dvh flex items-center justify-center bg-gray-50 font-poppins">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={48} className="text-[#000060] animate-spin" />
          <p className="text-gray-600 text-lg font-medium">
            Preparing your setup...
          </p>
        </div>
      </div>
    );
  }

  // ============================================
  // ERROR STATE
  // ============================================
  if (error) {
    return (
      <div className="min-h-dvh h-dvh flex items-center justify-center bg-gray-50 font-poppins">
        <div className="flex flex-col items-center gap-6 max-w-md text-center px-4">
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
          <p className="text-gray-600">{error}</p>
          <div className="flex gap-3">
            <button
              onClick={() => navigate("/plan-selection", { replace: true })}
              className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-all"
            >
              Back to Plans
            </button>
            <button
              onClick={handleRouting}
              className="px-5 py-2.5 bg-[#000060] text-white rounded-xl font-medium hover:bg-[#000080] transition-all"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Should not reach here - redirects happen in handleRouting
  return null;
};

export default SetupRouter;