import { useState, useRef, useEffect } from "react";
import { verifySmsOtp, sendSmsOtp } from "../api/otp";
import { Loader2 } from "lucide-react";

const PhoneOtp = ({ pending_id, phone, onContinue }) => {
    const [otp, setOtp] = useState(["", "", "", ""]);
    const [timer, setTimer] = useState(30);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const inputsRef = useRef([]);

    useEffect(() => {
        inputsRef.current[0]?.focus();
    }, []);

    useEffect(() => {
        if (timer <= 0) return;
        const id = setInterval(() => setTimer((t) => t - 1), 1000);
        return () => clearInterval(id);
    }, [timer]);

    const handleChange = (value, index) => {
        if (!/^[0-9]?$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        if (value && index < 3) inputsRef.current[index + 1].focus();
    };

    const handleSubmit = async () => {
        const fullOtp = otp.join("");

        if (fullOtp.length !== 4) {
            setError("Please enter a 4-digit code.");
            return;
        }

        setLoading(true);

        try {
            await verifySmsOtp({ pending_id, code: fullOtp });
            setError("");
            onContinue();
        } catch (err) {
            setError(err?.response?.data?.message || "Invalid OTP. Try again.");
        }

        setLoading(false);
    };

    const handleResend = async () => {
        if (timer !== 0) return;

        try {
            setOtp(["", "", "", ""]);
            setTimer(30);
            setError("");

            await sendSmsOtp({ pending_id, phone });

            inputsRef.current[0]?.focus();
        } catch (err) {
            setError(err?.response?.data?.message || "Failed to resend OTP.");
        }
    };

    return (
        <div className="w-full max-w-sm font-poppins px-3 mt-10" style={{ marginLeft: "-25%" }}>
            <h2 className="text-[26px] font-bold text-[#000006]">Verify Your Phone</h2>

            <p className="text-gray-500 text-sm leading-relaxed mt-1 mb-4">
                Enter the 4-digit code we sent to your phone.
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
                                inputsRef.current[i - 1].focus();
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

            {/* LOADER BUTTON */}
            <button
                onClick={handleSubmit}
                disabled={loading}
                className="w-full bg-[#000060] text-white py-3 rounded-xl mt-6 
                           hover:bg-[#000060d1] transition disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
                {loading ? (
                    <div className="flex items-center justify-center gap-2">
                        <Loader2 className="h-5 w-5 animate-spin" />
                        Verifying...
                    </div>
                ) : (
                    "Continue"
                )}
            </button>
        </div>
    );
};

export default PhoneOtp;
