// src/App.jsx

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect } from "react";

// ============================================
// AUTH INITIALIZATION
// ============================================
import { useAuthStore } from "./store/useAuthStore";

// ============================================
// GUARDS
// ============================================
import AuthGuard from "./guards/AuthGuard";
import SetupGuard from "./guards/SetupGuard";
import PermissionGuard from "./guards/PermissionGuard";

// ============================================
// PERMISSIONS CONFIG
// ============================================
import { PERMISSIONS } from "./config/permissions";

// ============================================
// PUBLIC PAGES
// ============================================
import NotFoundPage from "./components/common/NotFoundPage.jsx";  
import LoginPage from "./pages/LoginPage.jsx";
import OnboardingPage from "./pages/OnboardingPage.jsx";
import ErrorPage from "./pages/ErrorPage.jsx";
import TermsPage from "./pages/TermsPage.jsx";
import PrivacyPage from "./pages/PrivacyPage.jsx";
import ForgotPasswordPage from "./pages/ForgotPasswordPage.jsx";
import ResetPasswordPage from "./pages/ResetPasswordPage.jsx";
import PlanSelectionPage from "./pages/PlanSelectionPage.jsx";
import VerificationPage from "./pages/VerificationPage.jsx";

// ============================================
// PROTECTED PAGES (ERP)
// ============================================
import AppLayout from "./components/layout/AppLayout.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import BillingPage from "./pages/sales/billing/BillingPage.jsx";
import InvoicePage from "./pages/sales/invoice/InvoicePage.jsx";
import PurchaseInvoicePage from "./pages/purchase/invoice/PurchaseInvoicePage.jsx";
import PurchasePage from "./pages/purchase/billing/PurchasePage.jsx";
import ReportPage from "./pages/report/sales/SalesReportPage.jsx";
import InventoryPage from "./pages/inventory/InventoryPage.jsx";
import PendingUsersPage from "./pages/PendingUsersPage.jsx";
import SupplierPage from "./pages/suppliers/SupplierPage.jsx";

// ============================================
// SETUP PAGES (3-step wizard)
// ============================================
import SetupLayout from "./components/setup/SetupLayout.jsx";
import SetupRouter from "./pages/setup/SetupRouter.jsx";
import SetupBranchesPage from "./pages/setup/SetupBranchesPage.jsx";
import SetupUsersPage from "./pages/setup/SetupUsersPage.jsx";
import SetupReviewPage from "./pages/setup/SetupReviewPage.jsx";

// ============================================
// LANDING PAGES
// ============================================
import Home from "./pages/landingPages/home/Home.jsx";
import About from "./pages/landingPages/about/About.jsx";
import Contact from "./pages/landingPages/contact/Contact.jsx";
import Pricing from "./pages/landingPages/pricing/Pricing.jsx";
import ScrollToTop from "./pages/landingPages/component/ScrollToTop.jsx";

import "./index.css";

// ============================================
// AUTH INITIALIZER COMPONENT
// ============================================
const AuthInitializer = ({ children }) => {
  const initialize = useAuthStore((state) => state.initialize);
  const isInitialized = useAuthStore((state) => state.isInitialized);

  useEffect(() => {
    if (!isInitialized) {
      initialize();
    }
  }, [initialize, isInitialized]);

  return children;
};

// ============================================
// MAIN APP COMPONENT
// ============================================
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
      <AuthInitializer>
        <ScrollToTop />

        <Routes>
          {/* ============================================ */}
          {/* LANDING PAGES (Public) */}
          {/* ============================================ */}
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/pricing" element={<Pricing />} />

          {/* ============================================ */}
          {/* PUBLIC ROUTES (No auth required) */}
          {/* ============================================ */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* ============================================ */}
          {/* AUTH REQUIRED - ONBOARDING ROUTES */}
          {/* These need auth but NOT setup completion */}
          {/* ============================================ */}
          <Route element={<AuthGuard />}>
            <Route path="/onboarding" element={<OnboardingPage />} />
            <Route path="/verification" element={<VerificationPage />} />
            <Route path="/plan-selection" element={<PlanSelectionPage />} />

            {/* Setup Routes - Auth required, but not setup guard */}
            <Route path="/setup" element={<SetupRouter />} />
            <Route element={<SetupLayout />}>
              <Route path="/setup/branches" element={<SetupBranchesPage />} />
              <Route path="/setup/users" element={<SetupUsersPage />} />
              <Route path="/setup/review" element={<SetupReviewPage />} />
            </Route>
          </Route>

          {/* ============================================ */}
          {/* PROTECTED ERP ROUTES */}
          {/* Auth + Setup required + Permission checks */}
          {/* ============================================ */}
          <Route element={<AuthGuard />}>
            <Route element={<SetupGuard />}>
              <Route element={<AppLayout />}>
                
                {/* Dashboard - Everyone with dashboard:view */}
                <Route
                  path="/dashboard"
                  element={
                    <PermissionGuard permission={PERMISSIONS.DASHBOARD_VIEW}>
                      <DashboardPage />
                    </PermissionGuard>
                  }
                />

                {/* ============================================ */}
                {/* SALES ROUTES */}
                {/* ============================================ */}
                <Route
                  path="/Salesbilling"
                  element={
                    <PermissionGuard permission={PERMISSIONS.BILLING_CREATE}>
                      <BillingPage />
                    </PermissionGuard>
                  }
                />
                <Route
                  path="/Salesinvoice"
                  element={
                    <PermissionGuard permission={PERMISSIONS.BILLING_VIEW}>
                      <InvoicePage />
                    </PermissionGuard>
                  }
                />

                {/* ============================================ */}
                {/* PURCHASE ROUTES */}
                {/* ============================================ */}
                <Route
                  path="/purchase-billing"
                  element={
                    <PermissionGuard permission={PERMISSIONS.PURCHASE_CREATE}>
                      <PurchasePage />
                    </PermissionGuard>
                  }
                />
                <Route
                  path="/purchase-invoices"
                  element={
                    <PermissionGuard permission={PERMISSIONS.PURCHASE_VIEW}>
                      <PurchaseInvoicePage />
                    </PermissionGuard>
                  }
                />

                {/* ============================================ */}
                {/* INVENTORY ROUTES */}
                {/* ============================================ */}
                <Route
                  path="/inventory"
                  element={
                    <PermissionGuard permission={PERMISSIONS.INVENTORY_VIEW}>
                      <InventoryPage />
                    </PermissionGuard>
                  }
                />

                {/* ============================================ */}
                {/* SUPPLIERS */}
                {/* ============================================ */}
                <Route
                  path="/suppliers"
                  element={
                    <PermissionGuard permission={PERMISSIONS.SUPPLIERS_VIEW}>
                      <SupplierPage />
                    </PermissionGuard>
                  }
                />

                {/* ============================================ */}
                {/* REPORTS */}
                {/* ============================================ */}
                <Route
                  path="/reports-sales"
                  element={
                    <PermissionGuard permission={PERMISSIONS.REPORTS_SALES}>
                      <ReportPage />
                    </PermissionGuard>
                  }
                />

                {/* ============================================ */}
                {/* USER MANAGEMENT (Super Admin only) */}
                {/* ============================================ */}
                <Route
                  path="/pending-users"
                  element={
                    <PermissionGuard permission={PERMISSIONS.USERS_MANAGE}>
                      <PendingUsersPage />
                    </PermissionGuard>
                  }
                />

              </Route>
            </Route>
          </Route>

          {/* ============================================ */}
          {/* ERROR PAGES */}
          {/* ============================================ */}
          <Route path="/error" element={<ErrorPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </AuthInitializer>
    </Router>
  );
};

export default App;