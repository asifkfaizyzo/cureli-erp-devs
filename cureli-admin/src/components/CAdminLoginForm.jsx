import { useState, useRef } from "react";
import { FaUser, FaLock } from "react-icons/fa";
import { IoEyeOffOutline, IoEyeOutline } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import { loginCAdmin, loginCAdminDirect } from "../api/auth";
import { Loader2, CheckCircle2, Shield, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const CAdminLoginForm = ({ onSuccess, enableOtp = false }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const passwordRef = useRef(null);
  const navigate = useNavigate();

  const validate = () => {
    const e = {};
    if (!username.trim()) e.username = "Username required";
    if (!password.trim()) e.password = "Password required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    setErrors({});

    try {
      if (enableOtp) {
        // OTP Flow - just validate credentials and send OTP
        const res = await loginCAdmin({ username, password });
        const phone_hint = res.data.data.phone_hint;
        setLoading(false);
        onSuccess(username, phone_hint);
      } else {
        // Direct Login Flow - get tokens immediately
        const res = await loginCAdminDirect({ username, password });
        const accessToken = res.data.data.access_token;
        
        setLoading(false);
        // Show success state
        setSuccess(true);
        
        // Store token and navigate after animation
        setTimeout(() => {
          localStorage.setItem("cadmin_access_token", accessToken);
          navigate("/dashboard");
        }, 2000);
      }
    } catch (err) {
      setErrors({
        general:
          err?.response?.data?.message ||
          "Invalid username or password",
      });
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  return (
    <div className="w-full font-poppins relative">
      <AnimatePresence mode="wait">
        {success ? (
          // SUCCESS ANIMATION OVERLAY
          <motion.div
            key="success"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex flex-col items-center justify-center z-10"
          >
            {/* Background Glow */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="absolute inset-0 bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50 rounded-3xl"
            />
            
            {/* Animated Rings */}
            <div className="relative">
              {[...Array(3)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ 
                    scale: [0.8, 1.5, 2],
                    opacity: [0.6, 0.3, 0],
                  }}
                  transition={{
                    duration: 1.5,
                    delay: i * 0.2,
                    repeat: Infinity,
                    ease: "easeOut",
                  }}
                  className="absolute inset-0 rounded-full border-2 border-emerald-400"
                  style={{
                    width: 120,
                    height: 120,
                    left: -60,
                    top: -60,
                  }}
                />
              ))}
              
              {/* Main Success Icon */}
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ 
                  type: "spring", 
                  stiffness: 200, 
                  damping: 15,
                  delay: 0.1 
                }}
                className="relative z-10 w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 
                           flex items-center justify-center shadow-lg shadow-emerald-200"
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4, type: "spring", stiffness: 300 }}
                >
                  <CheckCircle2 className="w-12 h-12 text-white" strokeWidth={2.5} />
                </motion.div>
              </motion.div>

              {/* Floating Particles */}
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={`particle-${i}`}
                  initial={{ 
                    scale: 0, 
                    x: 0, 
                    y: 0,
                    opacity: 1 
                  }}
                  animate={{ 
                    scale: [0, 1, 0.5],
                    x: Math.cos(i * 45 * Math.PI / 180) * 80,
                    y: Math.sin(i * 45 * Math.PI / 180) * 80,
                    opacity: [1, 1, 0],
                  }}
                  transition={{
                    duration: 1,
                    delay: 0.3 + i * 0.05,
                    ease: "easeOut",
                  }}
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2"
                >
                  <Sparkles className="w-4 h-4 text-emerald-400" />
                </motion.div>
              ))}
            </div>

            {/* Success Text */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="relative z-10 text-center mt-8"
            >
              <motion.h3 
                className="text-2xl font-bold text-emerald-600 mb-2"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
              >
                Welcome Back!
              </motion.h3>
              <motion.p 
                className="text-gray-500 text-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                Redirecting to dashboard...
              </motion.p>
            </motion.div>

            {/* Loading Bar */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="relative z-10 w-48 h-1.5 bg-gray-200 rounded-full mt-6 overflow-hidden"
            >
              <motion.div
                initial={{ width: "0%" }}
                animate={{ width: "100%" }}
                transition={{ duration: 1.5, delay: 1, ease: "easeInOut" }}
                className="h-full bg-gradient-to-r from-emerald-400 to-green-500 rounded-full"
              />
            </motion.div>
          </motion.div>
        ) : (
          // LOGIN FORM
          <motion.div
            key="form"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3 }}
          >
            <h2 className="text-3xl font-semibold text-center text-[#000060] mb-8">
              Admin Login
            </h2>

            {errors.general && (
              <motion.p 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-red-600 text-center mb-4 text-sm bg-red-50 py-2 px-4 rounded-lg"
              >
                {errors.general}
              </motion.p>
            )}

            {/* USERNAME */}
            <div className="mb-6">
              <label className="text-sm font-medium text-[#000060]">Username</label>

              <div
                className={`flex items-center gap-4 mt-2 px-4 py-4 rounded-2xl shadow-md transition-all duration-300 ${
                  errors.username
                    ? "bg-red-100 border-red-500 border"
                    : "bg-[#F7F7FF] hover:shadow-lg focus-within:shadow-lg focus-within:ring-2 focus-within:ring-[#000060]/20"
                }`}
              >
                <FaUser className="text-lg text-gray-500" />

                <input
                  type="text"
                  placeholder="Enter admin username"
                  className="w-full bg-transparent outline-none text-gray-700"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={loading}
                />
              </div>
              {errors.username && (
                <motion.p 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-red-600 text-sm mt-1"
                >
                  {errors.username}
                </motion.p>
              )}
            </div>

            {/* PASSWORD */}
            <div className="mb-3">
              <label className="text-sm font-medium text-[#000060]">Password</label>

              <div
                className={`flex items-center gap-4 mt-2 px-4 py-4 rounded-2xl shadow-md transition-all duration-300 ${
                  errors.password
                    ? "bg-red-100 border-red-500 border"
                    : "bg-[#F7F7FF] hover:shadow-lg focus-within:shadow-lg focus-within:ring-2 focus-within:ring-[#000060]/20"
                }`}
              >
                <FaLock className="text-lg text-gray-500" />

                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  className="w-full bg-transparent outline-none text-gray-700"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyPress={handleKeyPress}
                  ref={passwordRef}
                  disabled={loading}
                />

                {showPassword ? (
                  <IoEyeOutline
                    className="text-gray-600 cursor-pointer text-xl hover:text-[#000060] transition-colors"
                    onClick={() => setShowPassword(false)}
                  />
                ) : (
                  <IoEyeOffOutline
                    className="text-gray-600 cursor-pointer text-xl hover:text-[#000060] transition-colors"
                    onClick={() => setShowPassword(true)}
                  />
                )}
              </div>
              {errors.password && (
                <motion.p 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-red-600 text-sm mt-1"
                >
                  {errors.password}
                </motion.p>
              )}
            </div>

            <div className="text-right text-sm mb-6">
              <span
                onClick={() => navigate("/admin-forgot-password")}
                className="text-[#000060] hover:underline cursor-pointer"
              >
                Forgot Password?
              </span>
            </div>

            <motion.button
              disabled={loading}
              onClick={handleSubmit}
              whileHover={{ scale: loading ? 1 : 1.02 }}
              whileTap={{ scale: loading ? 1 : 0.98 }}
              className={`w-full py-3.5 rounded-xl font-semibold transition-all duration-300 
                         bg-[#000060] text-white hover:bg-[#000060d1] 
                         disabled:bg-gray-400 disabled:cursor-not-allowed
                         shadow-lg shadow-[#000060]/20 hover:shadow-xl hover:shadow-[#000060]/30`}
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  {enableOtp ? "Sending OTP..." : "Authenticating..."}
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2">
                  <Shield className="h-5 w-5" />
                  Login
                </div>
              )}
            </motion.button>

            {/* Security Badge */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="flex items-center justify-center gap-2 mt-6 text-xs text-gray-400"
            >
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span>Secure encrypted connection</span>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Inline styles for min-height to prevent layout shift */}
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

export default CAdminLoginForm;