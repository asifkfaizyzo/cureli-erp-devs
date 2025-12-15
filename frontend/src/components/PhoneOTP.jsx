import { useState, useRef, useEffect } from "react";
import { verifySmsOtp, sendSmsOtp } from "../api/otp";
import { Loader2, CheckCircle2 } from "lucide-react";

const PhoneOtp = ({ pending_id, phone, onContinue }) => {
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [timer, setTimer] = useState(30);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [shake, setShake] = useState(false);
  const [success, setSuccess] = useState(false);

  const inputsRef = useRef([]);

  // Auto-focus first input
  useEffect(() => {
    const t = setTimeout(() => inputsRef.current[0]?.focus(), 100);
    return () => clearTimeout(t);
  }, []);

  // Countdown timer
  useEffect(() => {
    if (timer <= 0) return;
    const id = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [timer]);

  // Auto-submit when 4 digits filled
  useEffect(() => {
    const code = otp.join("");
    if (code.length === 4 && otp.every((d) => d !== "") && !loading && !success) {
      handleSubmit(code);
    }
  }, [otp]);

  const handleChange = (value, index) => {
    if (!/^\d?$/.test(value)) return;
    if (loading || success) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError("");

    if (value && index < 3) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (loading || success) return;

    // Backspace navigation
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }

    // Enter to submit
    if (e.key === "Enter") {
      const code = otp.join("");
      if (code.length === 4) {
        handleSubmit(code);
      }
    }
  };

  // Paste support
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

  const handleSubmit = async (otpCode = null) => {
    const fullOtp = otpCode || otp.join("");
    if (fullOtp.length !== 4 || loading || success) return;

    setLoading(true);
    setError("");

    try {
      await verifySmsOtp({ pending_id, code: fullOtp });

      setSuccess(true);

      // Brief delay to show success
      setTimeout(() => {
        onContinue();
      }, 600);

    } catch (err) {
      setError(err?.response?.data?.message || "Invalid OTP. Try again.");
      triggerShake();

      setTimeout(() => {
        setOtp(["", "", "", ""]);
        inputsRef.current[0]?.focus();
      }, 300);
    }

    setLoading(false);
  };

  const handleResend = async () => {
    if (timer !== 0) return;

    try {
      setOtp(["", "", "", ""]);
      setTimer(30);
      setError("");
      setSuccess(false);

      await sendSmsOtp({ pending_id, phone });

      inputsRef.current[0]?.focus();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to resend OTP.");
    }
  };

  const getInputClassName = (idx) => {
    const base = `w-12 h-14 text-center text-xl font-semibold border-2 rounded-lg
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
    <div
      className="w-full max-w-sm font-poppins px-3 mt-10"
      style={{ marginLeft: "-25%" }}
    >
      <h2 className="text-[26px] font-bold text-[#000006]">Verify Your Phone</h2>

      <p className="text-gray-500 text-sm leading-relaxed mt-1 mb-4">
        Enter the 4-digit code we sent to <b>{phone}</b>
      </p>

      <div className="w-full h-[1px] bg-gray-300 mb-5" />

      <p className="text-sm font-medium text-[#000060] mb-2">Verification Code</p>

      {/* OTP Inputs */}
      <div
        className={`flex gap-3 mb-1 ${shake ? "animate-shake" : ""}`}
        onPaste={handlePaste}
      >
        {otp.map((digit, i) => (
          <input
            key={i}
            ref={(el) => (inputsRef.current[i] = el)}
            type="text"
            inputMode="numeric"
            maxLength="1"
            value={digit}
            onChange={(e) => handleChange(e.target.value, i)}
            onKeyDown={(e) => handleKeyDown(e, i)}
            disabled={loading || success}
            className={`${getInputClassName(i)} disabled:cursor-not-allowed`}
          />
        ))}

        {/* Success indicator */}
        {success && (
          <div className="flex items-center ml-1 animate-scale-in">
            <CheckCircle2 className="w-8 h-8 text-green-500" />
          </div>
        )}
      </div>

      {/* Timer / Resend */}
      <p className="text-center text-sm text-[#7A3AFF] mt-3">
        <span
          className={`cursor-pointer hover:underline transition ${
            timer !== 0 ? "opacity-50 pointer-events-none" : ""
          }`}
          onClick={handleResend}
        >
          Resend Code
        </span>{" "}
        {timer > 0 && (
          <span className="text-gray-500">
            : 00:{timer < 10 ? `0${timer}` : timer}
          </span>
        )}
      </p>

      {/* Error message */}
      {error && (
        <p className="text-red-600 text-sm mt-2 animate-slide-down">{error}</p>
      )}

      {/* Success message */}
      {success && (
        <p className="text-green-600 text-sm mt-2 font-medium animate-slide-down flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          Phone verified successfully!
        </p>
      )}

      {/* Submit button */}
      <button
        onClick={() => handleSubmit()}
        disabled={loading || otp.some((v) => v === "") || success}
        className={`w-full py-3 rounded-xl mt-6 font-medium transition-all duration-300
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
    </div>
  );
};

export default PhoneOtp;