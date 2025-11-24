import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { IoArrowBackOutline } from "react-icons/io5";
import { verifyLoginOtp } from "../api/auth";
import { useNavigate } from "react-router-dom";

const LoginOtpVerification = ({ tempToken, phoneHint, onBack }) => {
  const navigate = useNavigate();
  const [otp, setOtp] = useState(["", "", "", ""]); // ✅ Changed to 4 digits
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState(30);

  const inputsRef = useRef([]);

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer(timer - 1), 1000);
      return () => clearInterval(interval);
    }
  }, [timer]);

  const handleChange = (value, index) => {
    if (/^[0-9]?$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      setError("");

      // Auto-advance
      if (value && index < 3) {
        inputsRef.current[index + 1].focus();
      }

      // Auto-submit when complete
      if (index === 3 && value) {
        const fullOtp = [...newOtp.slice(0, 3), value].join("");
        setTimeout(() => handleVerify(fullOtp), 100);
      }
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === "Backspace" && index > 0 && !otp[index]) {
      inputsRef.current[index - 1].focus();
    }
  };

  // ✅ Paste support
  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    
    if (/^\d{4}$/.test(pastedData)) {
      const digits = pastedData.split("");
      setOtp(digits);
      inputsRef.current[3]?.focus();
      setTimeout(() => handleVerify(pastedData), 100);
    }
  };

  const handleVerify = async (otpCode = null) => {
    const code = otpCode || otp.join("");

    if (code.length !== 4) {
      setError("Please enter complete OTP");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await verifyLoginOtp({
        temp_token: tempToken,
        otp: code,
      });

      const { access_token, next_step, shop_id, user_id } = res.data.data;

      localStorage.setItem("access_token", access_token);
      localStorage.setItem("shop_id", shop_id);
      localStorage.setItem("user_id", user_id);

      // Redirect based on next_step
      if (next_step === -1) {
        navigate("/dashboard");
      } else if (next_step === 13) {
        navigate("/onboarding-success");
      } else {
        navigate("/onboarding", { state: { resume_step: next_step } });
      }
    } catch (err) {
      console.error(err);
      const message = err?.response?.data?.message || "Invalid OTP. Please try again.";
      setError(message);
      setOtp(["", "", "", ""]);
      inputsRef.current[0]?.focus();
    }

    setLoading(false);
  };

  const handleResend = () => {
    // For now, just show message (implement backend later if needed)
    if (timer > 0) return;
    
    alert("Please go back and login again to receive a new OTP");
    // TODO: Add resend API endpoint if needed
  };

  return (
    <motion.div
      className="w-full h-screen flex flex-col items-center justify-start pt-20 font-poppins"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {/* BACK BUTTON */}
      <div
        className="absolute top-8 left-6 flex items-center gap-2 text-[#000060] cursor-pointer hover:underline"
        onClick={onBack}
      >
        <IoArrowBackOutline className="text-xl" />
        <span className="text-lg font-medium">Back</span>
      </div>

      <h1 className="text-3xl font-semibold text-[#000060] mt-10">Verify Your Identity</h1>

      <p className="mt-4 text-gray-600 text-center">
        Enter 4 digit code sent to <br />
        <span className="font-medium text-gray-700">{phoneHint || "+91 ******0000"}</span>
      </p>

      <div className="flex gap-4 mt-10" onPaste={handlePaste}>
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
            disabled={loading}
            className={`w-14 h-16 text-center text-2xl font-semibold border rounded-xl
                       ${error ? "border-red-500" : "border-gray-300"}
                       ${digit ? "border-[#000060] bg-[#F7F7FF]" : ""}
                       focus:ring-2 focus:ring-[#000060] outline-none transition
                       disabled:bg-gray-100 disabled:cursor-not-allowed`}
          />
        ))}
      </div>

      {error && (
        <p className="text-red-600 text-sm mt-4 text-center">{error}</p>
      )}

      <button
        onClick={() => handleVerify()}
        disabled={loading || otp.join("").length !== 4}
        className="w-[300px] bg-[#000060] text-white py-3 rounded-xl font-semibold mt-10 
                   hover:bg-[#000060d1] transition disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {loading ? "Verifying..." : "Continue"}
      </button>

      <p className="mt-4 text-sm text-gray-600">
        {timer > 0 ? (
          <>
            Re-send code in{" "}
            <span className="font-medium">00:{timer < 10 ? `0${timer}` : timer}</span>
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

      <p className="text-center text-[13px] text-gray-400 mt-10 w-[300px]">
        This site is protected by reCAPTCHA and the <br />
        <span
          onClick={() => navigate("/privacy")}
          className="text-[#000060] underline cursor-pointer"
        >
          Google Privacy
        </span>{" "}
        policy and{" "}
        <span
          onClick={() => navigate("/terms")}
          className="text-[#000060] underline cursor-pointer"
        >
          Terms of Service
        </span>{" "}
        apply.
      </p>
    </motion.div>
  );
};

export default LoginOtpVerification;