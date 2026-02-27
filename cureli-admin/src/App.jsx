// src/App.jsx

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useEffect } from "react";

// Admin Pages
import AdminLoginPage from "./pages/Cadmin-Login/AdminLoginPage";
import AdminDashboard from "./pages/Dashboard/AdminDashboard";
import UserPage from "./pages/Users-management/UserPage";
import CAdminForgotPassword from "./pages/Cadmin-Login/CAdminForgotPassword";
import CAdminResetPassword from "./pages/Cadmin-Login/CAdminResetPassword";
import VerificationPage from "./pages/User-Shop-Verifications/VerificationPage";
import ShopsPage from "./pages/shops-management/ShopsPage";
import AdminsPage from "./pages/Cadmin-management/AdminsPage";
import OrdersPage from "./pages/orders/OrdersPage";

// Subscription Management
import RiskMonitorPage from "./pages/Subscription-management/RiskMonitorPage";
import SubscriptionPage from "./pages/Subscription-management/SubscriptionPage";

// Communications Pages
import CommunicationsPage from "./pages/Communications/CommunicationsPage";
import TicketsPage from "./pages/Communications/pages/Tickets/TicketsPage";
import EnquiriesPage from "./pages/Communications/pages/Enquiries/EnquiriesPage";
import BroadcastPage from "./pages/Communications/pages/Broadcast/BroadcastPage";
import InAppBroadcastPage from "./pages/Communications/pages/Broadcast/InApp/InAppBroadcastPage";
import EmailBroadcastPage from "./pages/Communications/pages/Broadcast/Email/EmailBroadcastPage";

// Notifications Page
import NotificationsPage from "./pages/Notifications/NotificationsPage";

// Audit Page
import AuditPage from "./pages/Audit/AuditPage";

// Layout
import AppLayout from "./components/layout/AppLayout";

// Auth Provider
import { AuthProvider } from "./context/AuthContext";

// Permission Guard
import { PermissionGuard } from "./components/common/PermissionGuard";
import { CADMIN_PERMISSIONS } from "./config/cadminPermissions";

// ══════════════════════════════════════════════════════════════
// Protected Layout - Wraps AppLayout with AuthProvider
// ══════════════════════════════════════════════════════════════
const ProtectedLayout = () => {
  return (
    <AuthProvider>
      <AppLayout />
    </AuthProvider>
  );
};

// ══════════════════════════════════════════════════════════════
// App Component
// ══════════════════════════════════════════════════════════════
function App() {
  useEffect(() => {
    const disableZoomScroll = (e) => {
      if (e.ctrlKey) e.preventDefault();
    };

    const disableKeyZoom = (e) => {
      if (
        e.ctrlKey &&
        (e.key === "+" || e.key === "-" || e.key === "=" || e.key === "0")
      ) {
        e.preventDefault();
      }
    };

    const disablePinch = (e) => {
      e.preventDefault();
    };

    window.addEventListener("wheel", disableZoomScroll, { passive: false });
    window.addEventListener("keydown", disableKeyZoom);
    window.addEventListener("gesturestart", disablePinch);
    window.addEventListener("gesturechange", disablePinch);
    window.addEventListener("gestureend", disablePinch);

    return () => {
      window.removeEventListener("wheel", disableZoomScroll);
      window.removeEventListener("keydown", disableKeyZoom);
      window.removeEventListener("gesturestart", disablePinch);
      window.removeEventListener("gesturechange", disablePinch);
      window.removeEventListener("gestureend", disablePinch);
    };
  }, []);

  return (
    <Router>
      <Routes>
        {/* ════════════════════════════════════════════════════════════
            PUBLIC ROUTES - No authentication required
        ════════════════════════════════════════════════════════════ */}
        <Route path="/login" element={<AdminLoginPage />} />
        <Route path="/admin-forgot-password" element={<CAdminForgotPassword />} />
        <Route path="/reset-password" element={<CAdminResetPassword />} />

        {/* ════════════════════════════════════════════════════════════
            PROTECTED ROUTES - Wrapped with AuthProvider + Permission Guards
        ════════════════════════════════════════════════════════════ */}
        <Route element={<ProtectedLayout />}>
          
          {/* ──────────────────────────────────────────────────────────
              DASHBOARD - All roles can access
          ────────────────────────────────────────────────────────── */}
          <Route
            path="/dashboard"
            element={
              <PermissionGuard permission={CADMIN_PERMISSIONS.DASHBOARD_VIEW}>
                <AdminDashboard />
              </PermissionGuard>
            }
          />

          {/* ──────────────────────────────────────────────────────────
              SHOPS - SUPER_CADMIN, ANALYST, ACCOUNTANT, SALESMAN
          ────────────────────────────────────────────────────────── */}
          <Route
            path="/shops"
            element={
              <PermissionGuard permission={CADMIN_PERMISSIONS.SHOPS_VIEW}>
                <ShopsPage />
              </PermissionGuard>
            }
          />

          {/* ──────────────────────────────────────────────────────────
              USERS - SUPER_CADMIN, ANALYST only
          ────────────────────────────────────────────────────────── */}
          <Route
            path="/users"
            element={
              <PermissionGuard permission={CADMIN_PERMISSIONS.USERS_VIEW}>
                <UserPage />
              </PermissionGuard>
            }
          />

          {/* ──────────────────────────────────────────────────────────
              VERIFICATIONS - SUPER_CADMIN, SALESMAN only
          ────────────────────────────────────────────────────────── */}
          <Route
            path="/verification"
            element={
              <PermissionGuard permission={CADMIN_PERMISSIONS.VERIFICATIONS_VIEW}>
                <VerificationPage />
              </PermissionGuard>
            }
          />

          {/* ──────────────────────────────────────────────────────────
              SUBSCRIPTIONS - SUPER_CADMIN, ANALYST, ACCOUNTANT
          ────────────────────────────────────────────────────────── */}
          <Route
            path="/subscriptions"
            element={
              <PermissionGuard permission={CADMIN_PERMISSIONS.RISK_VIEW}>
                <RiskMonitorPage />
              </PermissionGuard>
            }
          />
          <Route
            path="/subscriptions/manage"
            element={
              <PermissionGuard permission={CADMIN_PERMISSIONS.SUBSCRIPTIONS_VIEW}>
                <SubscriptionPage />
              </PermissionGuard>
            }
          />

          {/* ──────────────────────────────────────────────────────────
              ORDERS - All roles can view
          ────────────────────────────────────────────────────────── */}
          <Route
            path="/orders"
            element={
              <PermissionGuard permission={CADMIN_PERMISSIONS.ORDERS_VIEW}>
                <OrdersPage />
              </PermissionGuard>
            }
          />

          {/* ──────────────────────────────────────────────────────────
              AUDIT LOGS - SUPER_CADMIN, ANALYST, ACCOUNTANT
          ────────────────────────────────────────────────────────── */}
          <Route
            path="/audits"
            element={
              <PermissionGuard permission={CADMIN_PERMISSIONS.AUDIT_VIEW}>
                <AuditPage />
              </PermissionGuard>
            }
          />

          {/* ──────────────────────────────────────────────────────────
              ADMIN MANAGEMENT - SUPER_CADMIN only
          ────────────────────────────────────────────────────────── */}
          <Route
            path="/admins"
            element={
              <PermissionGuard 
                permission={CADMIN_PERMISSIONS.ADMINS_VIEW}
                roles={["SUPER_CADMIN"]}
              >
                <AdminsPage />
              </PermissionGuard>
            }
          />

          {/* ──────────────────────────────────────────────────────────
              NOTIFICATIONS - All authenticated admins
          ────────────────────────────────────────────────────────── */}
          <Route
            path="/notifications"
            element={
              <PermissionGuard permission={CADMIN_PERMISSIONS.NOTIFICATIONS_VIEW}>
                <NotificationsPage />
              </PermissionGuard>
            }
          />

          {/* ──────────────────────────────────────────────────────────
              COMMUNICATIONS - Hub page (accessible if any comm permission)
          ────────────────────────────────────────────────────────── */}
          <Route
            path="/communications"
            element={
              <PermissionGuard
                permissions={[
                  CADMIN_PERMISSIONS.BROADCAST_VIEW,
                  CADMIN_PERMISSIONS.ENQUIRIES_VIEW,
                  CADMIN_PERMISSIONS.TICKETS_VIEW,
                ]}
              >
                <CommunicationsPage />
              </PermissionGuard>
            }
          />

          {/* ──────────────────────────────────────────────────────────
              TICKETS - SUPER_CADMIN, ANALYST (view), SALESMAN (full)
          ────────────────────────────────────────────────────────── */}
          <Route
            path="/communications/tickets"
            element={
              <PermissionGuard permission={CADMIN_PERMISSIONS.TICKETS_VIEW}>
                <TicketsPage />
              </PermissionGuard>
            }
          />

          {/* ──────────────────────────────────────────────────────────
              ENQUIRIES - SUPER_CADMIN, ANALYST, SALESMAN
          ────────────────────────────────────────────────────────── */}
          <Route
            path="/communications/enquiries"
            element={
              <PermissionGuard permission={CADMIN_PERMISSIONS.ENQUIRIES_VIEW}>
                <EnquiriesPage />
              </PermissionGuard>
            }
          />

          {/* ──────────────────────────────────────────────────────────
              BROADCAST - SUPER_CADMIN, ANALYST only
          ────────────────────────────────────────────────────────── */}
          <Route
            path="/communications/broadcast"
            element={
              <PermissionGuard permission={CADMIN_PERMISSIONS.BROADCAST_VIEW}>
                <BroadcastPage />
              </PermissionGuard>
            }
          />
          <Route
            path="/communications/broadcast/in-app"
            element={
              <PermissionGuard permission={CADMIN_PERMISSIONS.BROADCAST_VIEW}>
                <InAppBroadcastPage />
              </PermissionGuard>
            }
          />
          <Route
            path="/communications/broadcast/email"
            element={
              <PermissionGuard permission={CADMIN_PERMISSIONS.BROADCAST_VIEW}>
                <EmailBroadcastPage />
              </PermissionGuard>
            }
          />

          {/* ──────────────────────────────────────────────────────────
              SETTINGS (placeholder)
          ────────────────────────────────────────────────────────── */}
          <Route
            path="/settings"
            element={
              <PermissionGuard roles={["SUPER_CADMIN"]}>
                <div className="p-6">
                  <h1 className="text-2xl font-bold">Settings Page</h1>
                  <p className="text-gray-600 mt-2">Coming soon...</p>
                </div>
              </PermissionGuard>
            }
          />
        </Route>

        {/* ════════════════════════════════════════════════════════════
            REDIRECTS
        ════════════════════════════════════════════════════════════ */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;