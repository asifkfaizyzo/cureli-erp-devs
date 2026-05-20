// App.jsx

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { useEffect } from "react";

import AdminLoginPage from "./pages/Cadmin-Login/AdminLoginPage";
import AdminDashboard from "./pages/Dashboard/AdminDashboard";
import UserPage from "./pages/Users-management/UserPage";
import CAdminForgotPassword from "./pages/Cadmin-Login/CAdminForgotPassword";
import CAdminResetPassword from "./pages/Cadmin-Login/CAdminResetPassword";
import VerificationPage from "./pages/User-Shop-Verifications/VerificationPage";
import ShopsPage from "./pages/shops-management/ShopsPage";
import AdminsPage from "./pages/Cadmin-management/AdminsPage";
import OrdersPage from "./pages/orders/OrdersPage";
import MasterMedicinesPage from "./pages/MasterMedicines/MasterMedicinesPage";
import RiskMonitorPage from "./pages/Subscription-management/RiskMonitorPage";
import SubscriptionPage from "./pages/Subscription-management/SubscriptionPage";
import CommunicationsPage from "./pages/Communications/CommunicationsPage";
import TicketsPage from "./pages/Communications/pages/Tickets/TicketsPage";
import EnquiriesPage from "./pages/Communications/pages/Enquiries/EnquiriesPage";
import BroadcastPage from "./pages/Communications/pages/Broadcast/BroadcastPage";
import InAppBroadcastPage from "./pages/Communications/pages/Broadcast/InApp/InAppBroadcastPage";
import EmailBroadcastPage from "./pages/Communications/pages/Broadcast/Email/EmailBroadcastPage";
import NotificationsPage from "./pages/Notifications/NotificationsPage";
import AuditPage from "./pages/Audit/AuditPage";
import SettingsPage from "./pages/Settings/SettingsPage";

import AppLayout from "./components/layout/AppLayout";
import { AuthProvider } from "./context/AuthContext";
import { PermissionGuard } from "./components/common/PermissionGuard";
import { CADMIN_PERMISSIONS } from "./config/cadminPermissions";

const ProtectedLayout = () => (
  <AuthProvider>
    <AppLayout />
  </AuthProvider>
);

function App() {
  useEffect(() => {
    const disableZoomScroll = (e) => {
      if (e.ctrlKey) e.preventDefault();
    };
    const disableKeyZoom = (e) => {
      if (e.ctrlKey && ["+", "-", "=", "0"].includes(e.key))
        e.preventDefault();
    };
    const disablePinch = (e) => e.preventDefault();

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
        {/* ── Public ──────────────────────────────────────────────────── */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<AdminLoginPage />} />
        <Route
          path="/admin-forgot-password"
          element={<CAdminForgotPassword />}
        />
        <Route path="/reset-password" element={<CAdminResetPassword />} />

        {/* ── Protected ───────────────────────────────────────────────── */}
        <Route element={<ProtectedLayout />}>
          {/* Dashboard — the page itself handles the no-permission state */}
          <Route path="/dashboard" element={<AdminDashboard />} />

          {/* Shops */}
          <Route
            path="/shops"
            element={
              <PermissionGuard permission={CADMIN_PERMISSIONS.SHOPS_VIEW}>
                <ShopsPage />
              </PermissionGuard>
            }
          />

          {/* Users */}
          <Route
            path="/users"
            element={
              <PermissionGuard permission={CADMIN_PERMISSIONS.USERS_VIEW}>
                <UserPage />
              </PermissionGuard>
            }
          />

          {/* Document Verification */}
          <Route
            path="/verification"
            element={
              <PermissionGuard permission={CADMIN_PERMISSIONS.DOCUMENTS_VIEW}>
                <VerificationPage />
              </PermissionGuard>
            }
          />

          {/* Subscriptions — Risk Monitor */}
          <Route
            path="/subscriptions"
            element={
              <PermissionGuard
                permission={CADMIN_PERMISSIONS.SUBSCRIPTIONS_VIEW_AT_RISK}
              >
                <RiskMonitorPage />
              </PermissionGuard>
            }
          />

          {/* Subscriptions — Manage */}
          <Route
            path="/subscriptions/manage"
            element={
              <PermissionGuard
                permission={CADMIN_PERMISSIONS.SUBSCRIPTIONS_VIEW_DETAIL}
              >
                <SubscriptionPage />
              </PermissionGuard>
            }
          />

          {/* Orders — no permission gate */}
          <Route path="/orders" element={<OrdersPage />} />

          {/* Audit */}
          <Route
            path="/audits"
            element={
              <PermissionGuard permission={CADMIN_PERMISSIONS.AUDIT_VIEW}>
                <AuditPage />
              </PermissionGuard>
            }
          />

          {/* Admin Management */}
          <Route
            path="/admins"
            element={
              <PermissionGuard permission={CADMIN_PERMISSIONS.ADMINS_VIEW}>
                <AdminsPage />
              </PermissionGuard>
            }
          />

          {/* Master Medicines */}
          <Route
            path="/master-medicines"
            element={
              <PermissionGuard
                permission={CADMIN_PERMISSIONS.MASTER_MEDICINES_VIEW}
              >
                <MasterMedicinesPage />
              </PermissionGuard>
            }
          />

          {/* Notifications — all authenticated admins */}
          <Route path="/notifications" element={<NotificationsPage />} />

          {/* ── Communications ─────────────────────────────────────────── */}

          {/* Communications hub — visible if admin can access ANY child */}
          <Route
            path="/communications"
            element={
              <PermissionGuard
                permissions={[
                  CADMIN_PERMISSIONS.TICKETS_VIEW,
                  CADMIN_PERMISSIONS.ENQUIRIES_VIEW,
                  CADMIN_PERMISSIONS.BROADCAST_EMAIL_SEND,
                  CADMIN_PERMISSIONS.BROADCAST_EMAIL_VIEW_HISTORY,
                  CADMIN_PERMISSIONS.BROADCAST_EMAIL_MANAGE_DRAFTS,
                  CADMIN_PERMISSIONS.BROADCAST_EMAIL_SCHEDULE,
                  CADMIN_PERMISSIONS.BROADCAST_INAPP_SEND,
                  CADMIN_PERMISSIONS.BROADCAST_INAPP_VIEW_HISTORY,
                  CADMIN_PERMISSIONS.BROADCAST_INAPP_MANAGE_DRAFTS,
                  CADMIN_PERMISSIONS.BROADCAST_INAPP_SCHEDULE,
                ]}
                requireAll={false}
              >
                <CommunicationsPage />
              </PermissionGuard>
            }
          />

          {/* Tickets */}
          <Route
            path="/communications/tickets"
            element={
              <PermissionGuard permission={CADMIN_PERMISSIONS.TICKETS_VIEW}>
                <TicketsPage />
              </PermissionGuard>
            }
          />

          {/* Enquiries */}
          <Route
            path="/communications/enquiries"
            element={
              <PermissionGuard permission={CADMIN_PERMISSIONS.ENQUIRIES_VIEW}>
                <EnquiriesPage />
              </PermissionGuard>
            }
          />

          {/* Broadcast hub — visible if admin has any broadcast permission */}
          <Route
            path="/communications/broadcast"
            element={
              <PermissionGuard
                permissions={[
                  CADMIN_PERMISSIONS.BROADCAST_EMAIL_SEND,
                  CADMIN_PERMISSIONS.BROADCAST_EMAIL_VIEW_HISTORY,
                  CADMIN_PERMISSIONS.BROADCAST_EMAIL_MANAGE_DRAFTS,
                  CADMIN_PERMISSIONS.BROADCAST_EMAIL_SCHEDULE,
                  CADMIN_PERMISSIONS.BROADCAST_INAPP_SEND,
                  CADMIN_PERMISSIONS.BROADCAST_INAPP_VIEW_HISTORY,
                  CADMIN_PERMISSIONS.BROADCAST_INAPP_MANAGE_DRAFTS,
                  CADMIN_PERMISSIONS.BROADCAST_INAPP_SCHEDULE,
                ]}
                requireAll={false}
              >
                <BroadcastPage />
              </PermissionGuard>
            }
          />

          {/* In-App Broadcast */}
          <Route
            path="/communications/broadcast/in-app"
            element={
              <PermissionGuard
                permissions={[
                  CADMIN_PERMISSIONS.BROADCAST_INAPP_SEND,
                  CADMIN_PERMISSIONS.BROADCAST_INAPP_VIEW_HISTORY,
                  CADMIN_PERMISSIONS.BROADCAST_INAPP_MANAGE_DRAFTS,
                  CADMIN_PERMISSIONS.BROADCAST_INAPP_SCHEDULE,
                ]}
                requireAll={false}
              >
                <InAppBroadcastPage />
              </PermissionGuard>
            }
          />

          {/* Email Broadcast */}
          <Route
            path="/communications/broadcast/email"
            element={
              <PermissionGuard
                permissions={[
                  CADMIN_PERMISSIONS.BROADCAST_EMAIL_SEND,
                  CADMIN_PERMISSIONS.BROADCAST_EMAIL_VIEW_HISTORY,
                  CADMIN_PERMISSIONS.BROADCAST_EMAIL_MANAGE_DRAFTS,
                  CADMIN_PERMISSIONS.BROADCAST_EMAIL_SCHEDULE,
                ]}
                requireAll={false}
              >
                <EmailBroadcastPage />
              </PermissionGuard>
            }
          />

          {/* Settings */}
          <Route
            path="/settings"
            element={
              <PermissionGuard permission={CADMIN_PERMISSIONS.SETTINGS_VIEW}>
                <SettingsPage />
              </PermissionGuard>
            }
          />
        </Route>

        {/* ── Catch-all → always dashboard ────────────────────────────── */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;