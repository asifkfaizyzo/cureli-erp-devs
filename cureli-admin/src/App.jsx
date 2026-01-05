import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useEffect } from "react";

// Admin Pages
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminDashboard from "./pages/Dashboard/AdminDashboard";
import UserPage from "./pages/UserPage";
import CAdminForgotPassword from "./pages/CAdminForgotPassword";
import CAdminResetPassword from "./pages/CAdminResetPassword";
import VerificationPage from "./pages/VerificationPage";
import SubscriptionPage from "./pages/SubscriptionPage";
import ShopsPage from "./pages/shops-management/ShopsPage";
import AdminsPage from "./pages/Cadmin-management/AdminsPage";
import TicketsPage from "./pages/Tickets/TicketsPage";
import EnquiriesPage from "./pages/Enquiries/EnquiriesPage";

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
        <Route path="/forgot-password" element={<CAdminForgotPassword />} />
        <Route path="/reset-password" element={<CAdminResetPassword />} />

        {/* ══════════════════════════════════════════════════════
            PROTECTED ROUTES (With AppLayout + AuthProvider)
        ══════════════════════════════════════════════════════ */}
        <Route element={<ProtectedLayout />}>
          <Route path="/dashboard" element={<AdminDashboard />} />
          <Route path="/users" element={<UserPage />} />
          <Route path="/shops" element={<ShopsPage />} />
          <Route path="/verification" element={<VerificationPage />} />
          <Route path="/subscriptions" element={<SubscriptionPage />} />
          <Route path="/audits" element={<div>Audits Page</div>} />
          <Route path="/settings" element={<div>Settings Page</div>} />
          <Route path="/admins" element={<AdminsPage />} />
          <Route path="/tickets" element={<TicketsPage />} />
          <Route path="/enquires" element={<EnquiriesPage />} />
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