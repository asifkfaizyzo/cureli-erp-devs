import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaUser, FaLock } from "react-icons/fa";
import { IoEyeOffOutline, IoEyeOutline } from "react-icons/io5";
import { useNavigate } from "react-router-dom";

import { adminLogin } from "../api/auth";
import PhoneOtp from "./PhnoOtpverification";

const AdminLogin = () => {
  const [form, setForm] = useState({ username: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showOtp, setShowOtp] = useState(false);

  const [tempToken, setTempToken] = useState(null);
  const [phoneHint, setPhoneHint] = useState(null);

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
      const res = await adminLogin({
        username: form.username,
        password: form.password,
      });

      const data = res.data?.data;

      setTempToken(data.temp_token);
      setPhoneHint(data.phone_hint);

      setShowOtp(true);
    } catch (err) {
      setError(err?.response?.data?.message || "Login failed");
    }

    setLoading(false);
  };

  return (
    <div className="relative z-10 w-full max-w-sm">
      <AnimatePresence mode="wait">
        {showOtp ? (
          <motion.div
            key="otp"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.4 }}
          >
            <PhoneOtp
              pending_id={tempToken}
              phone={phoneHint}
              onContinue={() => navigate("/admin-dashboard")}
              onBack={() => setShowOtp(false)}
            />
          </motion.div>
        ) : (
          <motion.div
            key="login"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ duration: 0.4 }}
          >
            <h2 className="text-[36px] font-extrabold mb-5 text-center text-[#000032]">
              Log in
            </h2>

            {error && (
              <p className="text-red-600 text-center text-sm mb-3">{error}</p>
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
                  value={form.username}
                  onChange={handleInputChange}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") passwordRef.current?.focus();
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
                  value={form.password}
                  ref={passwordRef}
                  onChange={handleInputChange}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAdminLogin(e);
                  }}
                  className="w-full bg-transparent text-gray-800 text-sm outline-none pr-8"
                />

                <div
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 text-base text-gray-600 cursor-pointer hover:text-gray-800"
                >
                  {showPassword ? <IoEyeOutline /> : <IoEyeOffOutline />}
                </div>
              </div>
            </div>

            <button
              onClick={handleAdminLogin}
              disabled={loading}
              className="w-full bg-[#000032] text-white py-3 rounded-[28px] font-bold shadow-lg hover:brightness-110 transition disabled:bg-gray-400 text-sm"
            >
              {loading ? "Logging in..." : "Log in"}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminLogin;
