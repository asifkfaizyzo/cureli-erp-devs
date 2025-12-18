import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FaUser, FaLock } from "react-icons/fa";
import { IoEyeOffOutline, IoEyeOutline } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../api/auth";
import LoginOtpVerification from "./onboarding/LoginOtpVerification";

const LoginForm = ({ onRegisterClick }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // ✅ OTP Step
  const [showOtpScreen, setShowOtpScreen] = useState(false);
  const [tempToken, setTempToken] = useState("");
  const [phoneHint, setPhoneHint] = useState("");

  const passwordRef = useRef(null);
  const navigate = useNavigate();

  const validateForm = () => {
    const newErrors = {};

    if (!username.trim()) newErrors.username = "Username is required";
    if (!password.trim()) newErrors.password = "Password is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setErrors({});

    try {
      const res = await loginUser({ username, password });
      const { temp_token, phone_hint } = res.data.data;

      // ✅ Show OTP screen
      setTempToken(temp_token);
      setPhoneHint(phone_hint);
      setShowOtpScreen(true);
    } catch (err) {
      console.error(err);
      setErrors({
        general: err?.response?.data?.message || "Invalid username or password",
      });
    }

    setLoading(false);
  };

  const handleBackToLogin = () => {
    setShowOtpScreen(false);
    setTempToken("");
    setPhoneHint("");
    setPassword("");
  };

  // ✅ Show OTP screen if needed
  if (showOtpScreen) {
    return (
      <AnimatePresence mode="wait">
        <LoginOtpVerification
          tempToken={tempToken}
          phoneHint={phoneHint}
          onBack={handleBackToLogin}
        />
      </AnimatePresence>
    );
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        handleLogin();
      }}
    >
      <motion.div
        className="relative z-10 w-full max-w-sm font-poppins"
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <h2 className="text-3xl font-semibold mb-8 text-center text-[#000060]">
          Log in
        </h2>

        {/* GENERAL ERROR */}
        {errors.general && (
          <p className="text-red-600 text-center text-sm mb-4">
            {errors.general}
          </p>
        )}

        {/* USERNAME */}
        <div className="mb-6">
          <label className="text-sm font-medium text-[#000060]">Username</label>

          <div
            className={`flex items-center gap-4 mt-2 px-4 py-4 rounded-2xl shadow-md 
                        ${
                          errors.username
                            ? "bg-red-100 border-red-500 border"
                            : "bg-[#F7F7FF]"
                        }`}
          >
            <FaUser className="text-gray-500 text-lg" />

            <input
              type="text"
              placeholder="Enter your username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  passwordRef.current.focus();
                }
              }}
              className="w-full bg-transparent outline-none text-gray-700"
            />
          </div>

          {errors.username && (
            <p className="text-red-600 text-sm mt-1">{errors.username}</p>
          )}
        </div>

        {/* PASSWORD */}
        <div className="mb-4">
          <label className="text-sm font-medium text-[#000060]">Password</label>

          <div
            className={`flex items-center gap-4 mt-2 px-4 py-4 rounded-2xl shadow-md 
                        ${
                          errors.password
                            ? "bg-red-100 border-red-500 border"
                            : "bg-[#F7F7FF]"
                        }`}
          >
            <FaLock className="text-gray-500 text-lg" />

            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter your password"
              value={password}
              ref={passwordRef}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleLogin();
                }
              }}
              className="w-full bg-transparent outline-none text-gray-700"
            />

            {showPassword ? (
              <IoEyeOutline
                className="text-gray-600 cursor-pointer text-xl"
                onClick={() => setShowPassword(false)}
              />
            ) : (
              <IoEyeOffOutline
                className="text-gray-600 cursor-pointer text-xl"
                onClick={() => setShowPassword(true)}
              />
            )}
          </div>

          {errors.password && (
            <p className="text-red-600 text-sm mt-1">{errors.password}</p>
          )}
        </div>

        {/* STAY LOGGED IN + FORGOT */}
        <div className="flex items-center justify-between text-sm my-4">
          <label className="flex items-center gap-2 text-gray-600">
            <input type="checkbox" className="w-4 h-4" />
            Stay logged in
          </label>

          <span
            onClick={() => navigate("/forgot-password")}
            className="text-[#000060] font-medium hover:underline cursor-pointer"
          >
            Forgot Password?
          </span>
        </div>

        {/* LOGIN BUTTON */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-[#000060] text-white py-3 rounded-xl font-semibold mt-4 
                    hover:bg-[#000060d1] transition disabled:bg-gray-400"
        >
          {loading ? "Logging in..." : "Log in"}
        </button>

        {/* SIGN UP LINK */}
        <p className="text-center mt-5 text-sm text-gray-600">
          Don't have an account?
          <span
            className="text-[#000060] font-semibold ml-1 cursor-pointer hover:underline"
            onClick={onRegisterClick}
          >
            Sign up
          </span>
        </p>

        {/* FOOTER */}
        <p className="text-center text-[13px] text-gray-400 mt-8">
          This site is protected by reCAPTCHA and the <br />
          <span
            onClick={() => navigate("/privacy")}
            className="text-[#000060] underline cursor-pointer hover:font-semibold"
          >
            Google Privacy
          </span>{" "}
          policy and{" "}
          <span
            onClick={() => navigate("/terms")}
            className="text-[#000060] underline cursor-pointer hover:font-semibold"
          >
            Terms of Service
          </span>{" "}
          apply.
        </p>
      </motion.div>
    </form>
  );
};

export default LoginForm;