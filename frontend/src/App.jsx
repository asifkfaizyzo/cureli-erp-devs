import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/HomePage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import OnboardingPage from "./pages/OnboardingPage.jsx";
import BillingPage from "./pages/BillingPage.jsx";
import ErrorPage from "./pages/ErrorPage.jsx";

import "./index.css";
import OnboardSuccess from "./components/OnboardSuccess.jsx";
import VerificationPending from "./components/VerificationPending.jsx";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/billing" element={<BillingPage />} />
        <Route path="/error" element={<ErrorPage />} />
        <Route path="/verify" element={<VerificationPending />} />
        <Route path="/onboarding-success" element={<OnboardSuccess />} />
        <Route path="/dashboard" element={<LoginPage />} />
      </Routes>
    </Router>
  );
};

export default App;
