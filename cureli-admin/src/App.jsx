import { BrowserRouter, Routes, Route } from "react-router-dom";
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminDashboard from "./pages/AdminDashboard";
import CAdminForgotPassword from "./pages/CAdminForgotPassword";
import CAdminResetPassword from "./pages/CAdminResetPassword";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AdminLoginPage />} />
        <Route path="/admin-dashboard" element={<AdminDashboard />} />
        <Route
          path="/admin-forgot-password"
          element={<CAdminForgotPassword />}
        />
        <Route
          path="/admin-reset-password"
          element={<CAdminResetPassword />}
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
