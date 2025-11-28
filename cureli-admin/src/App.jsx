import { BrowserRouter, Routes, Route } from "react-router-dom";
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminDashboard from "./pages/AdminDashboard";
import CAdminForgotPassword from "./pages/CAdminForgotPassword";
import CAdminResetPassword from "./pages/CAdminResetPassword";
import VerifyDocuments from "./pages/VerifyDocuments";

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
        <Route path="/verify-documents" element={<VerifyDocuments />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
