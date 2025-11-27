import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { IoArrowBackOutline } from "react-icons/io5";
import { verifyOtpCAdmin } from "../api/auth";
import { useNavigate } from "react-router-dom";

const CAdminOtpForm = ({ username, phoneHint, onBack }) => {
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [timer, setTimer] = useState(30);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const refs = useRef([]);
  const navigate = useNavigate();

  useEffect(() => refs.current[0]?.focus(), []);

  useEffect(() => {
    if (timer > 0) {
      const t = setInterval(() => setTimer((v) => v - 1), 1000);
      return () => clearInterval(t);
    }
  }, [timer]);

  const updateOtp = (value, idx) => {
    if (!/^\d?$/.test(value)) return;

    const updated = [...otp];
    updated[idx] = value;
    setOtp(updated);

    if (value && idx < 3) refs.current[idx + 1].focus();
  };

  const handleVerify = async () => {
    const code = otp.join("");
    if (code.length !== 4) return;

    setLoading(true);

    try {
      const res = await verifyOtpCAdmin({ username, otp: code });
      localStorage.setItem("cadmin_access_token", res.data.data.access_token);
      navigate("/admin-dashboard");
    } catch (err) {
      setError("Invalid OTP");
      setOtp(["", "", "", ""]);
      refs.current[0]?.focus();
    }

    setLoading(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full"
    >
      {/* BACK */}
      <div className="flex items-center gap-2 text-[#000060] mb-6 cursor-pointer" onClick={onBack}>
        <IoArrowBackOutline className="text-xl" />
        <span className="text-sm">Back</span>
      </div>

      <h2 className="text-3xl font-semibold text-[#000060] mb-4">
        Verify OTP
      </h2>

      <p className="text-gray-500 text-sm mb-8">
        Sent to <span className="font-medium">{phoneHint}</span>
      </p>

      <div className="flex gap-4 mb-4">
        {otp.map((digit, idx) => (
          <input
            key={idx}
            ref={(el) => (refs.current[idx] = el)}
            type="text"
            maxLength="1"
            className="
              w-14 h-16 text-center text-xl border rounded-xl
              border-gray-300 focus:ring-2 focus:ring-[#000060]
              outline-none transition bg-[#F7F7FF]
            "
            value={digit}
            onChange={(e) => updateOtp(e.target.value, idx)}
          />
        ))}
      </div>

      {error && <p className="text-red-600 text-sm mb-4">{error}</p>}

      <button
        disabled={loading}
        onClick={handleVerify}
        className="w-full bg-[#000060] text-white py-3 rounded-xl mb-4 disabled:bg-gray-400"
      >
        {loading ? "Verifying..." : "Continue"}
      </button>

      <p className="text-sm text-gray-600 text-center">
        {timer > 0
          ? `Resend in 00:${timer < 10 ? "0" + timer : timer}`
          : "Resend OTP by restarting login"}
      </p>
    </motion.div>
  );
};

export default CAdminOtpForm;
