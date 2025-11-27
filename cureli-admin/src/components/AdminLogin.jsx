import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaUser, FaLock } from "react-icons/fa";
import { IoEyeOffOutline, IoEyeOutline } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import PhoneOtp from "./PhnoOtpverification"; // ✅ still inside same component file

// ✅ DEMO ADMIN LOGIN API
const demoAdminLogin = async ({ username, password }) => {
  await new Promise((resolve) => setTimeout(resolve, 800));

  if (username === "admin" && password === "admin123") {
    return { data: { message: "Login successful", user: { id: 1, name: "Demo Admin" } } };
  }

  const error = new Error("Invalid credentials");
  error.response = { data: { message: "Invalid admin credentials" } };
  throw error;
};

const AdminLogin = () => {
  const [form, setForm] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false); // ✅ controls form → OTP switch

  const passwordRef = useRef(null);
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAdminLogin = async (e) => {
    e?.preventDefault?.();
    if (!form.username.trim() || !form.password.trim()) {
      setError("All fields are required");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await demoAdminLogin(form);
      setShowOtp(true); // ✅ swap UI to OTP screen
    } catch (err) {
      setError(err?.response?.data?.message || "Invalid admin credentials");
    }

    setLoading(false);
  };

  return (
    <div className="relative z-10 w-full max-w-sm">
      <AnimatePresence mode="wait">

        {/* ✅ OTP replaces form UI */}
        {showOtp ? (
          <motion.div
            key="otp"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            <PhoneOtp onBack={() => setShowOtp(false)} />
          </motion.div>
        ) : (
          <motion.div
            key="login"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.4 }}
          >

            {/* TITLE */}
            <h2 className="text-[36px] font-extrabold mb-5 text-center text-[#000032]">
              Log in
            </h2>

            {/* ERROR */}
            {error && (
              <p className="text-red-600 text-center text-sm mb-3">
                {error}
              </p>
            )}

            {/* USERNAME */}
            <div className="mb-4">
              <label className="block text-xs font-semibold mb-1 text-[#000032]">
                Username
              </label>
              <div className="flex items-center gap-3 px-4 py-3 bg-[#F7F7FF] shadow-md rounded-xl">
                <FaUser className="text-gray-500 text-sm" />
                <input
                  name="username"
                  type="text"
                  placeholder="Enter admin username"
                  value={form.username} // ✅ fully controlled (no warnings)
                  onChange={handleInputChange}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      passwordRef.current?.focus();
                    }
                  }}
                  className="w-full bg-transparent text-gray-800 text-sm outline-none"
                />
              </div>
            </div>

            {/* PASSWORD */}
            <div className="mb-3">
              <label className="block text-xs font-semibold mb-1 text-[#000032]">
                Password
              </label>
              <div className="flex items-center gap-3 px-4 py-3 bg-[#F7F7FF] shadow-md rounded-xl relative">
                <FaLock className="text-gray-500 text-sm" />
                <input
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter admin password"
                  ref={passwordRef}
                  value={form.password} // ✅ controlled permanently
                  onChange={handleInputChange}
                  onKeyDown={(e) => {
                    if (e.key === "-") e.preventDefault();
                    if (e.key === "Enter") handleAdminLogin(e);
                  }}
                  className="w-full bg-transparent text-gray-800 text-sm outline-none pr-8"
                />

                {/* EYE TOGGLE */}
                <div
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 text-base text-gray-600 cursor-pointer hover:text-gray-800"
                >
                  {showPassword ? <IoEyeOutline /> : <IoEyeOffOutline />}
                </div>
              </div>
            </div>

            {/* STAY LOGGED + FORGOT */}
            <div className="flex items-center justify-between text-xs mt-4 mb-3">
              <label className="flex items-center gap-2 text-gray-800">
                <input type="checkbox" className="w-3.5 h-3.5 rounded border border-gray-400" />
                <span>Stay logged in</span>
              </label>

              <span
                onClick={() => navigate("/forgot-password")}
                className="text-[#000032] font-semibold hover:underline cursor-pointer"
              >
                Forgot Password?
              </span>
            </div>

            {/* LOGIN BUTTON */}
            <button
              onClick={handleAdminLogin}
              disabled={loading}
              className="w-full bg-[#000032] text-white py-3 rounded-[28px] font-bold shadow-lg hover:brightness-110 transition disabled:bg-gray-400 text-sm"
            >
              {loading ? "Logging in..." : "Log in"}
            </button>

            {/* DEMO HINT */}
            <p className="text-center text-[10px] text-gray-400 mt-5">
              Demo credentials: <span className="font-mono">admin / admin123</span>
            </p>

          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
};

export default AdminLogin;
