import { useState, useRef, useEffect } from "react";
import { verifyAdminOtp, resendAdminOtp } from "../api/auth";

const PhoneOtp = ({ pending_id, phone, onContinue, onBack }) => {
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [timer, setTimer] = useState(30);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const inputsRef = useRef([]);

  // auto focus
  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  // timer
  useEffect(() => {
    if (timer <= 0) return;
    const id = setInterval(() => setTimer((t) => t - 1), 1000);
    return () => clearInterval(id);
  }, [timer]);

  const handleChange = (value, index) => {
    if (!/^[0-9]?$/.test(value)) return;

    const arr = [...otp];
    arr[index] = value;
    setOtp(arr);

    if (value && index < 3) inputsRef.current[index + 1]?.focus();
  };

  // 🔥 VERIFY OTP using your API
  const handleSubmit = async () => {
    const code = otp.join("");

    if (code.length !== 4) {
      setError("Please enter a 4-digit code");
      return;
    }

    setLoading(true);

    try {
      const res = await verifyAdminOtp({
        temp_token: pending_id,
        otp: code,
      });

      const access = res.data?.data?.access_token;

      localStorage.setItem("access_token", access);

      setError("");
      onContinue();
    } catch (err) {
      setError(err?.response?.data?.message || "Invalid OTP");
    }

    setLoading(false);
  };

  // 🔥 RESEND OTP
  const handleResend = async () => {
    if (timer !== 0) return;

    try {
      setOtp(["", "", "", ""]);
      setTimer(30);
      setError("");

      await resendAdminOtp({
        temp_token: pending_id,
      });

      inputsRef.current[0]?.focus();
    } catch (err) {
      setError("Failed to resend OTP");
    }
  };

  return (
    <div className="w-full max-w-sm font-poppins px-3 mt-10" style={{ marginLeft: "-25%" }}>
      <h2 className="text-[26px] font-bold text-[#000006]">Verify Your Phone</h2>

      <p className="text-gray-500 text-sm leading-relaxed mt-1 mb-4">
        Enter the code sent to {phone}.
      </p>

      <div className="w-full h-[1px] bg-gray-300 mb-5" />

      <p className="text-sm font-medium text-[#000060] mb-2">Verification Code</p>

      <div className="flex gap-3 mb-1">
        {otp.map((digit, i) => (
          <input
            key={i}
            ref={(el) => (inputsRef.current[i] = el)}
            type="text"
            maxLength="1"
            value={digit}
            onChange={(e) => handleChange(e.target.value, i)}
            onKeyDown={(e) => {
              if (e.key === "Backspace" && !otp[i] && i > 0)
                inputsRef.current[i - 1]?.focus();
              if (e.key === "Enter") handleSubmit();
            }}
            className={`w-11 h-11 border rounded-lg text-center text-xl 
              ${error ? "border-red-500" : "border-gray-300"}
              focus:ring-2 focus:ring-[#000060] transition`}
          />
        ))}
      </div>

      <p className="text-center text-sm text-[#7A3AFF] mt-3">
        <span
          onClick={handleResend}
          className={`cursor-pointer hover:underline ${
            timer !== 0 ? "opacity-50 pointer-events-none" : ""
          }`}
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

      <p
        onClick={onBack}
        className="text-xs text-center mt-3 text-gray-600 cursor-pointer hover:underline"
      >
        Go Back
      </p>
    </div>
  );
};

export default PhoneOtp;
