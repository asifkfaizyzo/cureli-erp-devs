import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect } from "react";

// Public Pages
import Home from "./pages/HomePage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import OnboardingPage from "./pages/OnboardingPage.jsx";
import ErrorPage from "./pages/ErrorPage.jsx";
import TermsPage from "./pages/TermsPage.jsx";
import PrivacyPage from "./pages/PrivacyPage.jsx";
import ForgotPasswordPage from "./pages/ForgotPasswordPage.jsx";
import ResetPasswordPage from "./pages/ResetPasswordPage.jsx";
import PlanSelectionPage from "./pages/PlanSelectionPage.jsx";
import PendingUsersPage from "./pages/PendingUsersPage.jsx";
import SupplierPage from "./pages/SupplierPage.jsx";

// Protected Pages (ERP)
import AppLayout from "./components/layout/AppLayout.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import BillingPage from "./pages/BillingPage.jsx";
import InvoicePage from "./pages/InvoicePage.jsx";
import PurchasePage from "./pages/PurchasePage.jsx";

import "./index.css";

const App = () => {
   useEffect(() => {
    // Disable Ctrl + Scroll Zoom
    const disableZoomScroll = (e) => {
      if (e.ctrlKey) e.preventDefault();
    };

    // Disable Ctrl + (+, -, 0) keys
    const disableKeyZoom = (e) => {
      if (
        e.ctrlKey &&
        (e.key === "+" || e.key === "-" || e.key === "=" || e.key === "0")
      ) {
        e.preventDefault();
      }
    };

    // Disable touchpad pinch zoom
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
        {/* PUBLIC ROUTES */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* PROTECTED ERP ROUTES (with layout) */}
        <Route path="/" element={<AppLayout />}>
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="Salesbilling" element={<BillingPage />} />
          <Route path="Salesinvoice" element={<InvoicePage />} />
          <Route path="plan-selection" element={<PlanSelectionPage />} />
          <Route path="pending-users" element={<PendingUsersPage />} />
          <Route path="purchase-billing" element={<PurchasePage />} />
          <Route path="suppliers" element={<SupplierPage />} />

        </Route>

        {/* ERROR PAGE */}
        <Route path="/error" element={<ErrorPage />} />
      </Routes>
    </Router>
  );
};

export default App;
