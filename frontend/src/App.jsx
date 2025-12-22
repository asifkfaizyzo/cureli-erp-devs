<<<<<<< HEAD
// import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// import { useEffect } from "react";

// // Public Pages
// import NotFoundPage from "./components/common/NotFoundPage .jsx"
// import LoginPage from "./pages/LoginPage.jsx";
// import OnboardingPage from "./pages/OnboardingPage.jsx";
// import ErrorPage from "./pages/ErrorPage.jsx";
// import TermsPage from "./pages/TermsPage.jsx";
// import PrivacyPage from "./pages/PrivacyPage.jsx";
// import ForgotPasswordPage from "./pages/ForgotPasswordPage.jsx";
// import ResetPasswordPage from "./pages/ResetPasswordPage.jsx";
// import PlanSelectionPage from "./pages/PlanSelectionPage.jsx";
// import PendingUsersPage from "./pages/PendingUsersPage.jsx";
// import SupplierPage from "./pages/suppliers/SupplierPage.jsx";

// // Protected Pages (ERP)
// import AppLayout from "./components/layout/AppLayout.jsx";
// import DashboardPage from "./pages/DashboardPage.jsx";
// import BillingPage from "./pages/sales/billing/BillingPage.jsx";
// import InvoicePage from "./pages/sales/invoice/InvoicePage.jsx";
// import PurchaseInvoicePage from "./pages/purchase/invoice/PurchaseInvoicePage.jsx";
// import PurchasePage from "./pages/purchase/billing/PurchasePage.jsx";
// import ReportPage from "./pages/report/sales/SalesReportPage.jsx"

// //landing pages
// import Home from "./pages/landingPages/home/Home.jsx";
// import About from "./pages/landingPages/about/About.jsx";
// import Contact from "./pages/landingPages/contact/Contact.jsx";
// import Pricing from "./pages/landingPages/pricing/Pricing.jsx";
// import VerificationPage from "./pages/VerificationPage.jsx";

// import "./index.css";


// const App = () => {
//   useEffect(() => {
//     // Disable Ctrl + Scroll Zoom
//     const disableZoomScroll = (e) => {
//       if (e.ctrlKey) e.preventDefault();
//     };

//     // Disable Ctrl + (+, -, 0) keys
//     const disableKeyZoom = (e) => {
//       if (
//         e.ctrlKey &&
//         (e.key === "+" || e.key === "-" || e.key === "=" || e.key === "0")
//       ) {
//         e.preventDefault();
//       }
//     };

//     // Disable touchpad pinch zoom
//     const disablePinch = (e) => {
//       e.preventDefault();
//     };

//     window.addEventListener("wheel", disableZoomScroll, { passive: false });
//     window.addEventListener("keydown", disableKeyZoom);
//     window.addEventListener("gesturestart", disablePinch);
//     window.addEventListener("gesturechange", disablePinch);
//     window.addEventListener("gestureend", disablePinch);

//     return () => {
//       window.removeEventListener("wheel", disableZoomScroll);
//       window.removeEventListener("keydown", disableKeyZoom);
//       window.removeEventListener("gesturestart", disablePinch);
//       window.removeEventListener("gesturechange", disablePinch);
//       window.removeEventListener("gestureend", disablePinch);
//     };
//   }, []);

//   return (
//     <Router>
//       <Routes>
//         {/* landing pages */}
//         <Route path="/" element={<Home />} />
//         <Route path="/about" element={<About />} />
//         <Route path="/contact" element={<Contact />} />
//         <Route path="/pricing" element={<Pricing />} />

//         {/* PUBLIC ROUTES */}

//         <Route path="plan-selection" element={<PlanSelectionPage />} />
//         <Route path="/login" element={<LoginPage />} />
//         <Route path="/onboarding" element={<OnboardingPage />} />
//         <Route path="/verification" element={<VerificationPage />} />
//         <Route path="/terms" element={<TermsPage />} />
//         <Route path="/privacy" element={<PrivacyPage />} />
//         <Route path="/forgot-password" element={<ForgotPasswordPage />} />
//         <Route path="/reset-password" element={<ResetPasswordPage />} />

//         {/* PROTECTED ERP ROUTES (with layout) */}
//         <Route path="/" element={<AppLayout />}>
//           <Route path="dashboard" element={<DashboardPage />} />
//           <Route path="Salesbilling" element={<BillingPage />} />
//           <Route path="Salesinvoice" element={<InvoicePage />} />
//           <Route path="purchase-invoices" element={<PurchaseInvoicePage />} />
//           <Route path="pending-users" element={<PendingUsersPage />} />
//           <Route path="purchase-billing" element={<PurchasePage />} />
//           <Route path="suppliers" element={<SupplierPage />} />
//           <Route path="reports-sales" element={<ReportPage />} />

//         </Route>

//         {/* ERROR PAGE */}
//         <Route path="/error" element={<ErrorPage />} />
//         <Route path="*" element={<NotFoundPage />} />
//       </Routes>
//     </Router>
//   );
// };

// export default App;

=======
// src/App.jsx
>>>>>>> 7ea48650a7da54f4d1e1bd3da382e59ee9a698aa
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { useEffect } from "react";

// ✅ ADD THIS
import ScrollToTop from "./pages/landingPages/component/ScrollToTop.jsx";

// Public Pages
import NotFoundPage from "./components/common/NotFoundPage .jsx";
import LoginPage from "./pages/LoginPage.jsx";
import OnboardingPage from "./pages/OnboardingPage.jsx";
import ErrorPage from "./pages/ErrorPage.jsx";
import TermsPage from "./pages/TermsPage.jsx";
import PrivacyPage from "./pages/PrivacyPage.jsx";
import ForgotPasswordPage from "./pages/ForgotPasswordPage.jsx";
import ResetPasswordPage from "./pages/ResetPasswordPage.jsx";
import PlanSelectionPage from "./pages/PlanSelectionPage.jsx";
import PendingUsersPage from "./pages/PendingUsersPage.jsx";
import SupplierPage from "./pages/suppliers/SupplierPage.jsx";

// Protected Pages (ERP)
import AppLayout from "./components/layout/AppLayout.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import BillingPage from "./pages/sales/billing/BillingPage.jsx";
import InvoicePage from "./pages/sales/invoice/InvoicePage.jsx";
import PurchaseInvoicePage from "./pages/purchase/invoice/PurchaseInvoicePage.jsx";
import PurchasePage from "./pages/purchase/billing/PurchasePage.jsx";
import ReportPage from "./pages/report/sales/SalesReportPage.jsx";

<<<<<<< HEAD
// Landing Pages
=======
// Setup Pages (NEW)
import SetupLayout from "./components/setup/SetupLayout.jsx";
import SetupRouter from "./pages/setup/SetupRouter.jsx";
import SetupBranchesPage from "./pages/setup/SetupBranchesPage.jsx";
import SetupUsersPage from "./pages/setup/SetupUsersPage.jsx";
import SetupOperatorsPage from "./pages/setup/SetupOperatorsPage.jsx";
import SetupReviewPage from "./pages/setup/SetupReviewPage.jsx";

// Landing pages
>>>>>>> 7ea48650a7da54f4d1e1bd3da382e59ee9a698aa
import Home from "./pages/landingPages/home/Home.jsx";
import About from "./pages/landingPages/about/About.jsx";
import Contact from "./pages/landingPages/contact/Contact.jsx";
import Pricing from "./pages/landingPages/pricing/Pricing.jsx";
import VerificationPage from "./pages/VerificationPage.jsx";

import "./index.css";

const App = () => {
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

    // Disable touchpad pinch zoom
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
      {/* ✅ SCROLL FIX — MUST BE HERE */}
      <ScrollToTop />

      <Routes>
<<<<<<< HEAD
        {/* LANDING PAGES */}
=======
        {/* ============================================ */}
        {/* LANDING PAGES */}
        {/* ============================================ */}
>>>>>>> 7ea48650a7da54f4d1e1bd3da382e59ee9a698aa
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/pricing" element={<Pricing />} />

        {/* ============================================ */}
        {/* PUBLIC ROUTES */}
<<<<<<< HEAD
=======
        {/* ============================================ */}
>>>>>>> 7ea48650a7da54f4d1e1bd3da382e59ee9a698aa
        <Route path="/plan-selection" element={<PlanSelectionPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/verification" element={<VerificationPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />

<<<<<<< HEAD
        {/* PROTECTED ERP ROUTES */}
=======
        {/* ============================================ */}
        {/* SETUP ROUTES (NEW) */}
        {/* Post-plan setup wizard with its own layout */}
        {/* ============================================ */}
        <Route path="/setup" element={<SetupRouter />} />
        <Route element={<SetupLayout />}>
          <Route path="/setup/branches" element={<SetupBranchesPage />} />
          <Route path="/setup/users" element={<SetupUsersPage />} />
          <Route path="/setup/branch-operator" element={<SetupOperatorsPage />} />
          <Route path="/setup/review" element={<SetupReviewPage />} />
        </Route>

        {/* ============================================ */}
        {/* PROTECTED ERP ROUTES (with AppLayout) */}
        {/* ============================================ */}
>>>>>>> 7ea48650a7da54f4d1e1bd3da382e59ee9a698aa
        <Route path="/" element={<AppLayout />}>
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="Salesbilling" element={<BillingPage />} />
          <Route path="Salesinvoice" element={<InvoicePage />} />
          <Route path="purchase-invoices" element={<PurchaseInvoicePage />} />
          <Route path="purchase-billing" element={<PurchasePage />} />
          <Route path="pending-users" element={<PendingUsersPage />} />
          <Route path="suppliers" element={<SupplierPage />} />
          <Route path="reports-sales" element={<ReportPage />} />
        </Route>

<<<<<<< HEAD
        {/* ERROR */}
=======
        {/* ============================================ */}
        {/* ERROR PAGES */}
        {/* ============================================ */}
>>>>>>> 7ea48650a7da54f4d1e1bd3da382e59ee9a698aa
        <Route path="/error" element={<ErrorPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
};

<<<<<<< HEAD
export default App;


=======
export default App;
>>>>>>> 7ea48650a7da54f4d1e1bd3da382e59ee9a698aa
