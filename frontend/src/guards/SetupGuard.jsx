// src/guards/SetupGuard.jsx

import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { getSetupStatus } from "../api/setup";

/**
 * ============================================
 * SETUP GUARD
 * ============================================
 *
 * Ensures setup is complete before accessing ERP routes.
 *
 * Special Rule (IMPORTANT):
 * - `/setup/users` is allowed for admin users even AFTER setup is complete
 *   (used for adding users from ERP)
 */

const SetupGuard = ({ children }) => {
  const location = useLocation();

  const user = useAuthStore((state) => state.user);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const [isChecking, setIsChecking] = useState(true);
  const [isSetupComplete, setIsSetupComplete] = useState(false);
  const [error, setError] = useState(null);

 useEffect(() => {
  const checkSetup = async () => {
    if (!isAuthenticated || !user) {
      setIsChecking(false);
      return;
    }

    const isAdmin =
      user.role === "super_admin" || user.role === "branch_admin";
    const isUsersSetupRoute = location.pathname === "/setup/users";

    // ✅ Admin override
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
        setIsSetupComplete(is_complete);
      } catch {
        setIsSetupComplete(false);
      }
    }

    setIsChecking(false);
  };

  checkSetup();
}, [
  isAuthenticated,     // boolean
  user,                // object
  location.pathname,   // string
]);


  // ==================================================
  // LOADING
  // ==================================================
  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-[#000060] border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-600 font-medium">
            Checking setup status...
          </p>
        </div>
      </div>
    );
  }

  // ==================================================
  // ERROR
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
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 bg-[#000060] text-white rounded-lg hover:bg-[#000080] transition"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // ==================================================
  // SETUP NOT COMPLETE → REDIRECT
  // ==================================================
  if (!isSetupComplete) {
    console.log("🚫 SetupGuard: Setup not complete, redirecting to /setup");
    return (
      <Navigate to="/setup" state={{ from: location.pathname }} replace />
    );
  }

  // ==================================================
  // SETUP COMPLETE → ALLOW
  // ==================================================
  return children ? children : <Outlet />;
};

export default SetupGuard;
