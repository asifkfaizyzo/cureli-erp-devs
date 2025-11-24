import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/HomePage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import OnboardingPage from "./pages/OnboardingPage.jsx";
import BillingPage from "./pages/BillingPage.jsx";
import ErrorPage from "./pages/ErrorPage.jsx";
import TermsPage from "./pages/TermsPage.jsx";       
import PrivacyPage from "./pages/PrivacyPage.jsx";   
import "./index.css";
import ForgotPasswordPage from "./pages/ForgotPasswordPage.jsx";
import ResetPasswordPage from "./pages/ResetPasswordPage.jsx";

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
        <Route path="/billing" element={<BillingPage />} />
        <Route path="/error" element={<ErrorPage />} />
        <Route path="/dashboard" element={<LoginPage />} />
         <Route path="/terms" element={<TermsPage />} />         
        <Route path="/privacy" element={<PrivacyPage />} />  
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />  
        <Route path="/reset-password" element={<ResetPasswordPage />} />       
      </Routes>
    </Router>
  );
};

export default App;
