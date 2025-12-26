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
 * Logic:
 * - super_admin: Must have completed setup (at least 1 branch)
 * - branch_admin/staff: Skip check (they're created after setup)
 * 
 * Usage:
 *   <Route element={<AuthGuard />}>
 *     <Route element={<SetupGuard />}>
 *       <Route path="dashboard" element={<Dashboard />} />
 *     </Route>
 *   </Route>
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
      // Not authenticated - AuthGuard should handle this
      if (!isAuthenticated || !user) {
        setIsChecking(false);
        return;
      }

      // Staff and Branch Admin skip setup check
      // They are created AFTER setup is complete
      if (user.role === "staff" || user.role === "branch_admin") {
        console.log(`✅ SetupGuard: ${user.role} skips setup check`);
        setIsSetupComplete(true);
        setIsChecking(false);
        return;
      }

      // Super Admin - check if setup is complete
      if (user.role === "super_admin") {
        try {
          const response = await getSetupStatus();
          const { is_complete } = response.data?.data || {};
          
          console.log("📋 SetupGuard: Setup status =", is_complete);
          setIsSetupComplete(is_complete);
        } catch (err) {
          console.error("SetupGuard: Failed to check setup status", err);
          setError("Failed to verify setup status");
          // On error, assume setup not complete to be safe
          setIsSetupComplete(false);
        }
      }

      setIsChecking(false);
    };

    checkSetup();
  }, [isAuthenticated, user]);

  // Still checking
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

  // Error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="bg-white p-8 rounded-xl shadow-lg max-w-md text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Something went wrong</h2>
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

  // Setup not complete → redirect to setup
  if (!isSetupComplete) {
    console.log("🚫 SetupGuard: Setup not complete, redirecting to /setup");
    return <Navigate to="/setup" state={{ from: location.pathname }} replace />;
  }

  // Setup complete → render children or Outlet
  return children ? children : <Outlet />;
};

export default SetupGuard;