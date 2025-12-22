// src/components/onboarding/LoginOtpVerification.jsx
import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { IoArrowBackOutline } from "react-icons/io5";
import { verifyLoginOtp } from "../../api/auth";
import { getMySubscription } from "../../api/subscription";
import { getSetupStatus } from "../../api/setup";
import { useNavigate } from "react-router-dom";
import { Loader2, CheckCircle2 } from "lucide-react";

const LoginOtpVerification = ({ tempToken, phoneHint, onBack }) => {
  const navigate = useNavigate();
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(30);
  const [shake, setShake] = useState(false);
  const [success, setSuccess] = useState(false);

  const inputsRef = useRef([]);

  // Auto focus first input
  useEffect(() => {
    const t = setTimeout(() => inputsRef.current[0]?.focus(), 100);
    return () => clearTimeout(t);
  }, []);

  // Countdown timer
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  // Auto-submit when 4 digits filled
  useEffect(() => {
    const code = otp.join("");
    if (
      code.length === 4 &&
      otp.every((d) => d !== "") &&
      !loading &&
      !success
    ) {
      handleVerify(code);
    }
  }, [otp]);

  const handleChange = (value, index) => {
    if (!/^\d?$/.test(value)) return;
    if (loading || success) return;

    const updated = [...otp];
    updated[index] = value;
    setOtp(updated);
    setError("");

    if (value && index < 3) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (loading || success) return;

    // Backspace navigation
    if (e.key === "Backspace" && index > 0 && !otp[index]) {
      inputsRef.current[index - 1]?.focus();
    }

    // Enter to submit
    if (e.key === "Enter") {
      const code = otp.join("");
      if (code.length === 4) {
        handleVerify(code);
      }
    }
  };

  // Paste 4-digit OTP
  const handlePaste = (e) => {
    e.preventDefault();
    if (loading || success) return;

    const data = e.clipboardData.getData("text").trim();
    if (/^\d{4}$/.test(data)) {
      const digits = data.split("");
      setOtp(digits);
      inputsRef.current[3]?.focus();
    }
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  /**
   * Determine navigation destination for fully verified users
   * Priority:
   * 1. No subscription → /plan-selection
   * 2. Has subscription but setup incomplete → /setup
   * 3. Has subscription and setup complete → /dashboard
   */
  const determineDestination = async () => {
    try {
      // Check subscription
      const subRes = await getMySubscription();
      const hasActive = subRes.data?.data?.has_active_subscription === true;

      if (!hasActive) {
        console.log("📍 No active subscription → /plan-selection");
        return "/plan-selection";
      }

      // Check setup status
      try {
        const setupRes = await getSetupStatus();
        const setupData = setupRes.data?.data;

        if (setupData?.is_complete) {
          console.log("📍 Setup complete → /dashboard");
          return "/dashboard";
        } else {
          console.log("📍 Setup incomplete → /setup");
          return "/setup";
        }
      } catch (setupErr) {
        console.warn("Setup status check failed, defaulting to /setup", setupErr);
        return "/setup";
      }
    } catch (err) {
      console.warn("Subscription check failed, defaulting to /plan-selection", err);
      return "/plan-selection";
    }
  };

  // Verify OTP
  const handleVerify = async (otpCode = null) => {
    const code = otpCode || otp.join("");
    if (code.length !== 4 || loading || success) return;

    setLoading(true);
    setError("");

    try {
      const res = await verifyLoginOtp({
        temp_token: tempToken,
        otp: code,
      });

      const { access_token, next_step, shop_id, user_id, user_name } = res.data.data;

      // Show success state
      setSuccess(true);

      // Store tokens
      localStorage.setItem("access_token", access_token);
      localStorage.setItem("shop_id", shop_id);
      localStorage.setItem("user_id", user_id);
      if (user_name) {
        localStorage.setItem("user_name", user_name);
      }

      // Brief delay to show success animation
      setTimeout(async () => {
        // CASE 1 — Fully verified user (next_step === -1)
        if (next_step === -1) {
          const destination = await determineDestination();
          navigate(destination, { replace: true });
          return;
        }

        // CASE 2 — Verification Flow (document verification)
        if ([12, 14, 15].includes(next_step)) {
          navigate("/verification", { 
            state: { resume_step: next_step },
            replace: true 
          });
          return;
        }

        // CASE 3 — Normal Onboarding Flow
        navigate("/onboarding", { 
          state: { resume_step: next_step },
          replace: true 
        });
      }, 600);

    } catch (err) {
      console.error("OTP verification error:", err);
      const msg =
        err?.response?.data?.message || "Invalid OTP. Please try again.";

      setError(msg);
      triggerShake();

      setTimeout(() => {
        setOtp(["", "", "", ""]);
        inputsRef.current[0]?.focus();
      }, 300);
      
      setLoading(false);
    }
  };

  const handleResend = () => {
    if (timer > 0) return;
    alert("Please go back and login again to receive a new OTP");
  };

  const getInputClassName = (idx) => {
    const base = `w-14 h-16 text-center text-2xl font-semibold border-2 rounded-xl
                  outline-none transition-all duration-200`;

    if (success) {
      return `${base} border-green-500 bg-green-50 text-green-600`;
    }
    if (error) {
      return `${base} border-red-500 bg-red-50`;
    }
    if (otp[idx]) {
      return `${base} border-[#000060] bg-[#F7F7FF] text-[#000060]`;
    }
    return `${base} border-gray-300 focus:border-[#000060] focus:ring-2 focus:ring-[#000060]/20`;
  };

  return (
    <motion.div
      className="w-full h-screen flex flex-col items-center justify-start pt-20 font-poppins"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* Back button */}
      <div
        className="absolute top-8 left-6 flex items-center gap-2 text-[#000060] cursor-pointer hover:opacity-70 transition"
        onClick={onBack}
      >
        <IoArrowBackOutline className="text-xl" />
        <span className="text-lg font-medium">Back</span>
      </div>

      <h1 className="text-3xl font-semibold text-[#000060] mt-10">
        Verify Your Identity
      </h1>

      <p className="mt-4 text-gray-600 text-center">
        Enter 4-digit code sent to <br />
        <span className="font-medium">{phoneHint || "+91 ******0000"}</span>
      </p>

      {/* OTP Inputs */}
      <div
        className={`flex gap-4 mt-10 ${shake ? "animate-shake" : ""}`}
        onPaste={handlePaste}
      >
        {otp.map((digit, index) => (
          <input
            key={index}
            ref={(el) => (inputsRef.current[index] = el)}
            type="text"
            inputMode="numeric"
            maxLength="1"
            value={digit}
            onChange={(e) => handleChange(e.target.value, index)}
            onKeyDown={(e) => handleKeyDown(e, index)}
            disabled={loading || success}
            className={`${getInputClassName(
              index
            )} disabled:cursor-not-allowed`}
          />
        ))}

        {/* Success indicator */}
        {success && (
          <div className="flex items-center ml-2 animate-scale-in">
            <CheckCircle2 className="w-10 h-10 text-green-500" />
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p className="text-red-600 text-sm mt-4 text-center animate-slide-down">
          {error}
        </p>
      )}

      {/* Submit button */}
      <button
        onClick={() => handleVerify()}
        disabled={loading || otp.join("").length !== 4 || success}
        className={`w-[300px] py-3 rounded-xl font-semibold mt-10 transition-all duration-300
          ${
            success
              ? "bg-green-500 text-white"
              : "bg-[#000060] text-white hover:bg-[#000060d1] disabled:bg-gray-400"
          } disabled:cursor-not-allowed`}
      >
        {loading ? (
          <div className="flex items-center justify-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Verifying...
          </div>
        ) : success ? (
          <div className="flex items-center justify-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            Success!
          </div>
        ) : (
          "Continue"
        )}
      </button>

      {/* Timer / Resend */}
      <p className="mt-4 text-sm text-gray-600">
        {timer > 0 ? (
          <>
            Re-send code in{" "}
            <span className="font-medium text-[#000060]">
              00:{timer < 10 ? `0${timer}` : timer}
            </span>
          </>
        ) : (
          <span
            onClick={handleResend}
            className="text-[#000060] font-medium cursor-pointer hover:underline"
          >
            Resend OTP
          </span>
        )}
      </p>

      {/* Animations */}
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-8px); }
          80% { transform: translateX(8px); }
        }
        
        @keyframes scale-in {
          0% { transform: scale(0); opacity: 0; }
          50% { transform: scale(1.2); }
          100% { transform: scale(1); opacity: 1; }
        }
        
        @keyframes slide-down {
          0% { transform: translateY(-10px); opacity: 0; }
          100% { transform: translateY(0); opacity: 1; }
        }
        
        .animate-shake { animation: shake 0.4s ease-in-out; }
        .animate-scale-in { animation: scale-in 0.3s ease-out forwards; }
        .animate-slide-down { animation: slide-down 0.2s ease-out forwards; }
      `}</style>
    </motion.div>
  );
};

export default LoginOtpVerification;