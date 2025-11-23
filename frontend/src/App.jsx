import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Home from "./pages/HomePage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import OnboardingPage from "./pages/OnboardingPage.jsx";

import BillingPage from "./pages/BillingPage.jsx";
import InvoicePage from "./pages/InvoicePage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";

import ErrorPage from "./pages/ErrorPage.jsx";
import AppLayout from "./components/layout/AppLayout.jsx";

import "./index.css";

const App = () => {
  return (
    <Router>
      <Routes>

        {/* PUBLIC ROUTES */}
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />

        {/* PROTECTED ERP ROUTES */}
        <Route path="/" element={<AppLayout />}>
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="billing" element={<BillingPage />} />
          <Route path="invoice" element={<InvoicePage />} />
        </Route>

        {/* ERROR PAGE */}
        <Route path="/error" element={<ErrorPage />} />

      </Routes>
    </Router>
  );
};

export default App;
