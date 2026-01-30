// src/guards/SetupGuard.jsx

import { useEffect, useState, useRef } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { useSetupStore } from "../store/useSetupStore";
import { getSetupStatus } from "../api/setup";

/**
 * ============================================
 * SETUP GUARD
 * ============================================
 *
 * Ensures setup is complete before accessing ERP routes.
 *
 * CRITICAL RULES:
 * 1. Backend is SOURCE OF TRUTH for setup completion
 * 2. Syncs local store with backend to prevent loops
 * 3. Has loop prevention counter
 * 4. Allows setup routes to pass through
 */

const SetupGuard = ({ children }) => {
  const location = useLocation();

  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const completeSetup = useSetupStore((state) => state.completeSetup);
  const storeIsComplete = useSetupStore((state) => state.isSetupComplete);

  const [isChecking, setIsChecking] = useState(true);
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [error, setError] = useState(null);

  // Loop prevention
  const checkCount = useRef(0);
  const lastCheckTime = useRef(0);

  useEffect(() => {
    const checkSetup = async () => {
      // Loop prevention: max 3 checks within 5 seconds
      const now = Date.now();
      if (now - lastCheckTime.current < 5000) {
        checkCount.current += 1;
        if (checkCount.current > 15) {
          console.error("❌ SetupGuard: Too many checks, stopping to prevent loop");
          setError(
            "Navigation error detected. Please clear your browser cache and try again."
          );
          setIsChecking(false);
          return;
        }
      } else {
        checkCount.current = 1;
      }
      lastCheckTime.current = now;

      if (!isAuthenticated || !user) {
        setIsChecking(false);
        return;
      }

      const isAdmin = user.role === "super_admin" || user.role === "branch_admin";
      const isUsersSetupRoute = location.pathname === "/setup/users";

      // Admin override for /setup/users route (used from ERP)
      if (isAdmin && isUsersSetupRoute) {
        setIsSetupComplete(true);
        setIsChecking(false);
        return;
      }

      // Branch admin & staff skip setup check
      if (user.role === "staff" || user.role === "branch_admin") {
        setIsSetupComplete(true);
        setIsChecking(false);
        return;
      }

      // Super admin → check backend setup status
      if (user.role === "super_admin") {
        try {
          const response = await getSetupStatus();
          const { is_complete } = response.data?.data || {};

          console.log("📋 SetupGuard: Backend setup status:", is_complete);

          // Sync local store with backend
          if (is_complete) {
            completeSetup();
          }

          setIsSetupComplete(is_complete);
        } catch (err) {
          console.error("SetupGuard API error:", err);

          // If API fails and store says complete, allow access
          if (storeIsComplete && location.pathname === "/dashboard") {
            console.log(
              "⚠️ SetupGuard: API failed but store says complete, allowing access"
            );
            setIsSetupComplete(true);
          } else {
            setIsSetupComplete(false);
          }
        }
      }

      setIsChecking(false);
    };

    checkSetup();
  }, [isAuthenticated, user?.user_id, user?.role, location.pathname]);

  // ==================================================
  // LOADING
  // ==================================================
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#000060] border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600 font-medium">Checking setup status...</p>
        </div>
      </div>
    );
  }

  // ==================================================
  // ERROR (Loop detected)
  // ==================================================
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-red-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Something went wrong
          </h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <div className="flex gap-3 justify-center">
            <button
              onClick={() => {
                localStorage.clear();
                sessionStorage.clear();
                window.location.href = "/login";
              }}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
            >
              Start Fresh
            </button>
            <button
              onClick={() => {
                checkCount.current = 0;
                window.location.reload();
              }}
              className="px-6 py-2 bg-[#000060] text-white rounded-lg hover:bg-[#000080] transition"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==================================================
  // SETUP NOT COMPLETE → REDIRECT
  // ==================================================
  if (!isSetupComplete) {
    // CRITICAL: Allow setup routes to pass through (prevent loop)
    if (location.pathname.startsWith("/setup")) {
      return children ? children : <Outlet />;
    }

    console.log("🚫 SetupGuard: Setup not complete, redirecting to /setup");
    return <Navigate to="/setup" state={{ from: location.pathname }} replace />;
  }

  // ==================================================
  // SETUP COMPLETE → ALLOW
  // ==================================================
  return children ? children : <Outlet />;
};

export default SetupGuard;