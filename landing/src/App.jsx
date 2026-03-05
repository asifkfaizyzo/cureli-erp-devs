// landing/src/App.jsx

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

// ============================================
// PUBLIC PAGES
// ============================================
import NotFoundPage from "./components/common/NotFoundPage.jsx";
import ErrorPage from "./pages/error/ErrorPage.jsx";
import TermsPage from "./pages/common/TermsPage.jsx";
import PrivacyPage from "./pages/common/PrivacyPage.jsx";
import MaintenancePage from "./pages/maintenance/MaintenancePage.jsx";

// ============================================
// LANDING PAGES
// ============================================
import Home from "./pages/landingPages/home/Home.jsx";
import About from "./pages/landingPages/about/About.jsx";
import Contact from "./pages/landingPages/contact/Contact.jsx";
import Services from "./pages/landingPages/Services/Services.jsx";
import ScrollToTop from "./pages/landingPages/component/ScrollToTop.jsx";

import "./index.css";

// ============================================
// MAIN APP COMPONENT
// ============================================
const App = () => {
  return (
    <Router>
      <ScrollToTop />
      <Routes>
        {/* ============================================ */}
        {/* LANDING PAGES (Public) */}
        {/* ============================================ */}
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/Services" element={<Services />} />

        {/* ============================================ */}
        {/* LEGAL PAGES */}
        {/* ============================================ */}
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />

        {/* ============================================ */}
        {/* SYSTEM PAGES */}
        {/* ============================================ */}
        <Route path="/maintenance" element={<MaintenancePage />} />
        <Route path="/error" element={<ErrorPage />} />

        {/* ============================================ */}
        {/* 404 NOT FOUND */}
        {/* ============================================ */}
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </Router>
  );
};

export default App;