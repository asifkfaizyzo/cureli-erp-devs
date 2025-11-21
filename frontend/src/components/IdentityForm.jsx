// components/IdentityForm.jsx
import { useState, useRef } from "react";

const IdentityForm = ({ onContinue }) => {
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [errors, setErrors] = useState({});

    const emailRef = useRef(null);

    const validate = () => {
        const err = {};

        if (!fullName.trim()) err.fullName = "Full name required";

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email.trim()) err.email = "Email required";
        else if (!emailRegex.test(email)) err.email = "Invalid email";

        setErrors(err);
        return Object.keys(err).length === 0;
    };

    const handleSubmit = () => {
        if (!validate()) return;
        onContinue();
    };

    return (
        <div
    className="w-full max-w-md mt-6 px-3"
    style={{ marginLeft: "-20%" }}
    onKeyDown={(e) => {
        if (e.key === "Enter") {
            e.preventDefault();
            handleSubmit();
        }
    }}
>
            <h2 className="text-2xl font-bold text-[#000006]">
                Add Your Name and Email
            </h2>
            <p className="text-gray-500 text-sm mt-1">
                Let us know the name of the person who'll be completing the onboarding.
            </p>

            <hr className="my-4 border-gray-300" />

            {/* Full Name */}
            <label className="text-xs font-medium text-[#000060]">Full Name *</label>
            <input
                type="text"
                placeholder="Enter owner's full name"
                className={`w-full mt-1 px-3 py-2 rounded-lg bg-white border text-gray-700 text-sm
                    ${errors.fullName ? "border-red-500" : "border-gray-300"}`}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        e.preventDefault();
                        emailRef.current?.focus();
                    }
                }}
            />
            {errors.fullName && (
                <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>
            )}

            {/* Email */}
            <label className="text-xs font-medium text-[#000060] mt-4 block">
                Email Address *
            </label>
            <input
                ref={emailRef}
                type="email"
                placeholder="Enter email"
                className={`w-full mt-1 px-3 py-2 rounded-lg bg-white border text-gray-700 text-sm
                    ${errors.email ? "border-red-500" : "border-gray-300"}`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === "Enter") {
                        e.preventDefault();
                        handleSubmit();
                    }
                }}
            />
            {errors.email && (
                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
            )}

            {/* Continue Button */}
            <button
                onClick={handleSubmit}
                className="w-full bg-[#000060] text-white py-2.5 rounded-lg mt-6 text-sm hover:bg-[#000060d1] transition"
            >
                Continue
            </button>
        </div>
    );
};

export default IdentityForm;
