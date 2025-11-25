import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

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

// Protected Pages (ERP)
import AppLayout from "./components/layout/AppLayout.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import BillingPage from "./pages/BillingPage.jsx";
import InvoicePage from "./pages/InvoicePage.jsx";

import "./index.css";

const App = () => {
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
        </Route>

        {/* ERROR PAGE */}
        <Route path="/error" element={<ErrorPage />} />
      </Routes>
    </Router>
  );
};

export default App;
