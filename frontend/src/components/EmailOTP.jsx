import { useState, useRef, useEffect } from "react";
import { sendSignupOtp, verifySignupOtp } from "../api/otp";

const EmailOTP = ({ pending_id, email, onContinue }) => {
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [timer, setTimer] = useState(30);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const inputsRef = useRef([]);

  // Auto-focus
  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  // Timer
  useEffect(() => {
    if (timer <= 0) return;
    const id = setInterval(() => setTimer(t => t - 1), 1000);
    return () => clearInterval(id);
  }, [timer]);

  const handleChange = (value, index) => {
    if (!/^[0-9]?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 3) inputsRef.current[index + 1]?.focus();
  };

  // RESEND OTP
  const handleResend = async () => {
    try {
      setOtp(["", "", "", ""]);
      setTimer(30);
      setError("");

      await sendSignupOtp({ pending_id });

      inputsRef.current[0]?.focus();
    } catch (err) {
      setError(err?.response?.data?.message || "Failed to resend OTP.");
    }
  };

  // VERIFY OTP
  const handleSubmit = async () => {
    const fullOtp = otp.join("");

    if (fullOtp.length !== 4) {
      setError("Please enter a 4-digit code.");
      return;
    }

    setLoading(true);

    try {
      await verifySignupOtp({ pending_id, otp: fullOtp });
      setError("");
      onContinue(); // move to next step
    } catch (err) {
      setError(err?.response?.data?.message || "Invalid OTP.");
    }

    setLoading(false);
  };

  return (
    <div
      className="w-full max-w-sm font-poppins px-3 mt-10"
      style={{ marginLeft: "-25%" }}
    >
      <h2 className="text-[26px] font-bold text-[#000006]">Verify Your Email</h2>

      <p className="text-gray-500 text-sm leading-relaxed mt-1 mb-4">
        We sent a verification code to <b>{email}</b>.
      </p>

      <div className="w-full h-[1px] bg-gray-300 mb-5" />

      <p className="text-sm font-medium text-[#000060] mb-2">
        Verification Code
      </p>

      <div className="flex gap-3 mb-1">
        {otp.map((digit, i) => (
          <input
            key={i}
            ref={(el) => (inputsRef.current[i] = el)}
            type="text"
            maxLength="1"
            value={digit}
            onChange={(e) => handleChange(e.target.value, i)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            className={`w-11 h-11 border rounded-lg text-center text-xl 
              ${error ? "border-red-500" : "border-gray-300"}
              focus:ring-2 focus:ring-[#000060] transition`}
          />
        ))}
      </div>

      <p className="text-center text-sm text-[#7A3AFF] mt-3">
        <span
          className={`cursor-pointer hover:underline ${
            timer !== 0 ? "opacity-50 pointer-events-none" : ""
          }`}
          onClick={handleResend}
        >
          Resend Code
        </span>{" "}
        : {timer}
      </p>

      {error && <p className="text-red-600 text-sm mt-2">{error}</p>}

      <button
        onClick={handleSubmit}
        disabled={loading}
        className="w-full bg-[#000060] text-white py-3 rounded-xl mt-6 
          hover:bg-[#000060d1] transition disabled:bg-gray-400"
      >
        {loading ? "Verifying..." : "Continue"}
      </button>
    </div>
  );
};

export default EmailOTP;
