import { useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import AdminLogin from "./components/AdminLogin";
import LoginPage from "./pages/LoginPage";
import "./index.css"; // Tailwind entry

function App() {
  // Optional global rows state example if needed later
  const [rows, setRows] = useState([]);

  return (
    <BrowserRouter>
      <div className="min-h-screen">
        <Routes>
          //

          {/* Admin login route */}
          <Route path="/" element={<LoginPage />} />
          <Route path="/admin-login" element={<AdminLogin />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
