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

// Subscription Management
import RiskMonitorPage from "./pages/Subscription-management/RiskMonitorPage";
import SubscriptionPage from "./pages/Subscription-management/SubscriptionPage";

// Communications Pages
import CommunicationsPage from "./pages/Communications/CommunicationsPage";
import TicketsPage from "./pages/Communications/pages/Tickets/TicketsPage";
import EnquiriesPage from "./pages/Communications/pages/Enquiries/EnquiriesPage";
import BroadcastPage from "./pages/Communications/pages/Broadcast/BroadcastPage";

// Layout
import AppLayout from "./components/layout/AppLayout";

// Auth Provider
import { AuthProvider } from "./context/AuthContext";

// ══════════════════════════════════════════════════════
// Protected Layout - Wraps AppLayout with AuthProvider
// ══════════════════════════════════════════════════════
const ProtectedLayout = () => {
  return (
    <AuthProvider>
      <AppLayout />
    </AuthProvider>
  );
};

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
        {/* ══════════════════════════════════════════════════════
            PUBLIC ROUTES (No Layout)
        ══════════════════════════════════════════════════════ */}
        <Route path="/login" element={<AdminLoginPage />} />
        <Route path="/admin-forgot-password" element={<CAdminForgotPassword />} />
        <Route path="/reset-password" element={<CAdminResetPassword />} />

        {/* ══════════════════════════════════════════════════════
            PROTECTED ROUTES (With AppLayout + AuthProvider)
        ══════════════════════════════════════════════════════ */}
        <Route element={<ProtectedLayout />}>
          <Route path="/dashboard" element={<AdminDashboard />} />
          <Route path="/users" element={<UserPage />} />
          <Route path="/shops" element={<ShopsPage />} />
          <Route path="/verification" element={<VerificationPage />} />
          
          {/* Subscription Management */}
          <Route path="/subscriptions" element={<RiskMonitorPage />} />
          <Route path="/subscriptions/manage" element={<SubscriptionPage />} />

          <Route path="/audits" element={<div>Audits Page</div>} />
          <Route path="/settings" element={<div>Settings Page</div>} />
          <Route path="/admins" element={<AdminsPage />} />

          {/* ══════════════════════════════════════════════════════
              COMMUNICATIONS ROUTES
          ══════════════════════════════════════════════════════ */}
          <Route path="/communications" element={<CommunicationsPage />} />
          <Route path="/communications/tickets" element={<TicketsPage />} />
          <Route path="/communications/enquiries" element={<EnquiriesPage />} />
          <Route path="/communications/broadcast" element={<BroadcastPage />} />
        </Route>

        {/* ══════════════════════════════════════════════════════
            REDIRECTS
        ══════════════════════════════════════════════════════ */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;