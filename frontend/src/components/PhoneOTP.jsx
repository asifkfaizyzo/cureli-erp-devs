import { useState, useRef, useEffect } from "react";

const PhoneOtp = ({ onContinue }) => {
    const [otp, setOtp] = useState(["", "", "", ""]);   // <-- 4 boxes
    const [timer, setTimer] = useState(30);
    const [error, setError] = useState("");

    const inputsRef = useRef([]);
    const DUMMY_OTP = "1234"; // <-- Updated dummy OTP

    // Auto-focus first box
    useEffect(() => {
        if (inputsRef.current[0]) inputsRef.current[0].focus();
    }, []);

    // TIMER
    useEffect(() => {
        if (timer <= 0) return;
        const id = setInterval(() => setTimer((t) => t - 1), 1000);
        return () => clearInterval(id);
    }, [timer]);

    // On change input
    const handleChange = (value, index) => {
        if (!/^[0-9]?$/.test(value)) return;

        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);

        if (value && index < 3) inputsRef.current[index + 1].focus();
    };

    // Submit
    const handleSubmit = () => {
        const fullOtp = otp.join("");

        if (fullOtp.length !== 4) {
            setError("Please enter a 4-digit code.");
            return;
        }

        if (fullOtp !== DUMMY_OTP) {
            setError("Invalid OTP. Try again.");
            return;
        }

        setError("");
        onContinue();
    };

    // Resend
    const handleResend = () => {
        setOtp(["", "", "", ""]);
        setTimer(30);
        setError("");
        inputsRef.current[0].focus();
    };

    return (
        <div
            className="w-full max-w-sm font-poppins px-3 mt-10"
            style={{ marginLeft: "-25%" }}
        >
            {/* TITLE */}
            <h2 className="text-[26px] font-bold text-[#000006]">
                Verify Your Phone
            </h2>

            {/* SUBTEXT */}
            <p className="text-gray-500 text-sm leading-relaxed mt-1 mb-4">
                We require this to verify your identity. Your details remain safe.
            </p>

            {/* DIVIDER */}
            <div className="w-full h-[1px] bg-gray-300 mb-5" />

            {/* LABEL */}
            <p className="text-sm font-medium text-[#000060] mb-2">
                Verification Code
            </p>

            {/* OTP BOXES */}
            <div className="flex gap-3 mb-1">
                {otp.map((digit, i) => (
                    <input
                        key={i}
                        ref={(el) => (inputsRef.current[i] = el)}
                        type="text"
                        maxLength="1"
                        value={digit}
                        onChange={(e) => handleChange(e.target.value, i)}
                        onFocus={() => inputsRef.current[i].select()}
                        onKeyDown={(e) => {
                            if (e.key === "Backspace" && !otp[i] && i > 0) {
                                inputsRef.current[i - 1].focus();
                            }
                            if (e.key === "Enter") handleSubmit();
                        }}
                        className={`w-11 h-11 border rounded-lg text-center text-xl 
                            ${error ? "border-red-500" : "border-gray-300"} 
                            focus:ring-2 focus:ring-[#000060] transition`}
                    />
                ))}
            </div>

            {/* TIMER */}
            <p className="text-center text-sm text-[#7A3AFF] mt-3">
                <span className="cursor-pointer hover:underline" onClick={handleResend}>
                    Resend Code
                </span>{" "}
                : {timer}
            </p>

            {/* ERROR */}
            {error && <p className="text-red-600 text-sm mt-2">{error}</p>}

            {/* CONTINUE */}
            <button
                onClick={handleSubmit}
                className="w-full bg-[#000060] text-white py-3 rounded-xl mt-6
                           hover:bg-[#000060d1] transition"
            >
                Continue
            </button>
        </div>
    );
};

export default PhoneOtp;
