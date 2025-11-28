import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect } from "react";

// Admin Pages
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminDashboard from "./pages/AdminDashboard";
import UserPage from "./pages/UserPage";
import CAdminForgotPassword from "./pages/CAdminForgotPassword";
import CAdminResetPassword from "./pages/CAdminResetPassword";

// Layout
import AppLayout from "./components/layout/AppLayout";

function App() {
  useEffect(() => {
    // Disable Ctrl + Scroll Zoom
    const disableZoomScroll = (e) => {
      if (e.ctrlKey) e.preventDefault();
    };

    // Disable Ctrl + (+, -, 0)
    const disableKeyZoom = (e) => {
      if (
        e.ctrlKey &&
        (e.key === "+" || e.key === "-" || e.key === "=" || e.key === "0")
      ) {
        e.preventDefault();
      }
    };

    // Disable pinch zoom
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

        {/* PUBLIC ADMIN ROUTES */}
        <Route path="/" element={<AdminLoginPage />} />
        <Route path="/admin-forgot-password" element={<CAdminForgotPassword />} />
        <Route path="/admin-reset-password" element={<CAdminResetPassword />} />

        {/* PROTECTED ADMIN DASHBOARD (with AppLayout) */}
        <Route path="/" element={<AppLayout />}>
          <Route path="admin-dashboard" element={<AdminDashboard />} />
          <Route path="users" element={<UserPage />} />
        </Route>

      </Routes>
    </Router>
  );
}

export default App;
