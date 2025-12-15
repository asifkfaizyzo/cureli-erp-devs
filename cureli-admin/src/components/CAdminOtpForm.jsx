import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { IoArrowBackOutline } from "react-icons/io5";
import { verifyOtpCAdmin } from "../api/auth";
import { useNavigate } from "react-router-dom";
import { Loader2, CheckCircle2 } from "lucide-react";

const CAdminOtpForm = ({ username, phoneHint, onBack }) => {
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [timer, setTimer] = useState(30);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const [success, setSuccess] = useState(false);

  const refs = useRef([]);
  const navigate = useNavigate();

  // Auto-focus first input
  useEffect(() => {
    const timer = setTimeout(() => refs.current[0]?.focus(), 100);
    return () => clearTimeout(timer);
  }, []);

  // Countdown timer
  useEffect(() => {
    if (timer > 0) {
      const t = setInterval(() => setTimer((v) => v - 1), 1000);
      return () => clearInterval(t);
    }
  }, [timer]);

  // Auto-submit when 4 digits filled
  useEffect(() => {
    const code = otp.join("");
    if (code.length === 4 && otp.every((d) => d !== "") && !loading && !success) {
      handleVerify(code);
    }
  }, [otp]);

  const updateOtp = (value, idx) => {
    if (!/^\d?$/.test(value)) return;
    if (loading || success) return;

    const updated = [...otp];
    updated[idx] = value;
    setOtp(updated);
    setError("");

    if (value && idx < 3) {
      refs.current[idx + 1]?.focus();
    }
  };

  // Handle paste full OTP
  const handlePaste = (e) => {
    e.preventDefault();
    if (loading || success) return;

    const pasted = e.clipboardData.getData("text").trim();
    if (/^\d{4}$/.test(pasted)) {
      const digits = pasted.split("");
      setOtp(digits);
      refs.current[3]?.focus();
    }
  };

  const handleKeyDown = (e, idx) => {
    if (loading || success) return;

    // Backspace navigation
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      refs.current[idx - 1]?.focus();
    }

    // Enter to submit
    if (e.key === "Enter") {
      const code = otp.join("");
      if (code.length === 4) {
        handleVerify(code);
      }
    }
  };

  const triggerShake = () => {
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleVerify = async (otpCode = null) => {
    const code = otpCode || otp.join("");
    if (code.length !== 4 || loading || success) return;

    setLoading(true);
    setError("");

    try {
      const res = await verifyOtpCAdmin({ username, otp: code });
      
      // Success state
      setSuccess(true);
      
      // Brief delay to show success before navigating
      setTimeout(() => {
        localStorage.setItem("cadmin_access_token", res.data.data.access_token);
        navigate("/dashboard");
      }, 600);
      
    } catch (err) {
      setError(err?.response?.data?.message || "Invalid OTP");
      triggerShake();
      
      // Reset OTP after shake
      setTimeout(() => {
        setOtp(["", "", "", ""]);
        refs.current[0]?.focus();
      }, 300);
    }

    setLoading(false);
  };

  const getInputClassName = (idx) => {
    const base = `w-14 h-16 text-center text-xl font-semibold border-2 rounded-xl
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
    return `${base} border-gray-300 bg-[#F7F7FF] focus:border-[#000060] focus:ring-2 focus:ring-[#000060]/20`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      {/* BACK */}
      <div
        className="flex items-center gap-2 text-[#000060] mb-6 cursor-pointer hover:opacity-70 transition"
        onClick={onBack}
      >
        <IoArrowBackOutline className="text-xl" />
        <span className="text-sm font-medium">Back</span>
      </div>

      <h2 className="text-3xl font-semibold text-[#000060] mb-4">
        Verify OTP
      </h2>

      <p className="text-gray-500 text-sm mb-8">
        Sent to <span className="font-medium">{phoneHint}</span>
      </p>

      {/* OTP INPUTS */}
      <div
        className={`flex gap-4 mb-4 ${shake ? "animate-shake" : ""}`}
        onPaste={handlePaste}
      >
        {otp.map((digit, idx) => (
          <input
            key={idx}
            ref={(el) => (refs.current[idx] = el)}
            type="text"
            inputMode="numeric"
            maxLength="1"
            disabled={loading || success}
            className={`${getInputClassName(idx)} disabled:cursor-not-allowed`}
            value={digit}
            onChange={(e) => updateOtp(e.target.value, idx)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
          />
        ))}
        
        {/* Success checkmark */}
        {success && (
          <div className="flex items-center ml-2 animate-scale-in">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p className="text-red-600 text-sm mb-4 animate-slide-down">{error}</p>
      )}

      {/* Submit button */}
      <button
        disabled={loading || otp.some((v) => v === "") || success}
        onClick={() => handleVerify()}
        className={`w-full py-3 rounded-xl mb-4 font-medium transition-all duration-300
          ${success 
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
            Verified!
          </div>
        ) : (
          "Continue"
        )}
      </button>

      {/* Timer / Resend */}
      <p className="text-sm text-gray-600 text-center">
        {timer > 0 ? (
          <>
            Resend in{" "}
            <span className="font-medium text-[#000060]">
              00:{timer < 10 ? "0" + timer : timer}
            </span>
          </>
        ) : (
          <span className="text-[#000060] font-medium">
            Resend OTP by restarting login
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

export default CAdminOtpForm;