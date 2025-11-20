import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Home from "./pages/HomePage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import OnboardingPage from "./pages/OnboardingPage.jsx";
import './index.css';

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/onboarding" element={<OnboardingPage />} />
      </Routes>
    </Router>
  );
};

export default App;
