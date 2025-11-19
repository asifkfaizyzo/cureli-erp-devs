import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { IoEyeOffOutline, IoEyeOutline } from "react-icons/io5";

const CreateAccount = ({ onLoginClick }) => {
    const [showPassword, setShowPassword] = useState(false);

    const [form, setForm] = useState({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        agree: false,
    });

    const [errors, setErrors] = useState({});

    const lastNameRef = useRef(null);
    const emailRef = useRef(null);
    const passwordRef = useRef(null);

    const validate = () => {
        const err = {};

        if (!form.firstName.trim()) err.firstName = "First name required";
        if (!form.lastName.trim()) err.lastName = "Last name required";

        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!form.email.trim()) err.email = "Email required";
        else if (!emailRegex.test(form.email)) err.email = "Invalid email";

        const pass = form.password;
        if (!pass.trim()) err.password = "Password required";
        else if (pass.length < 8) err.password = "Min 8 characters";
        else if (!/[A-Z]/.test(pass)) err.password = "Missing uppercase letter";
        else if (!/[a-z]/.test(pass)) err.password = "Missing lowercase letter";
        else if (!/[0-9]/.test(pass)) err.password = "Missing number";
        else if (!/[!@#$%^&*]/.test(pass))
            err.password = "Missing special character";

        if (!form.agree) err.agree = "You must agree";

        setErrors(err);
        return Object.keys(err).length === 0;
    };

    const handleCreateAccount = () => {
        if (!validate()) return;

        alert("Account created (dummy) ✔");
    };

    return (
        <motion.div
            className="w-full max-w-sm mx-auto font-poppins py-6"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <h1 className="text-2xl font-bold text-center text-[#000060] mb-6">
                Create Account
            </h1>

            {/* FIRST + LAST NAME */}
            <div className="flex gap-3 mb-3">
                <div className="w-1/2">
                    <label className="text-xs font-bold text-[#000060]">
                        First Name
                    </label>
                    <input
                        type="text"
                        placeholder="Enter your First Name"
                        className={`w-full mt-1 px-3 py-2 rounded-xl bg-[#F7F7FF] border text-sm ${
                            errors.firstName ? "border-red-500" : "border-gray-300"
                        }`}
                        value={form.firstName}
                        onChange={(e) =>
                            setForm({ ...form, firstName: e.target.value })
                        }
                        onKeyDown={(e) => {
                            if (e.key === "Enter") lastNameRef.current.focus();
                        }}
                    />
                    {errors.firstName && (
                        <p className="text-xs text-red-500 mt-1">
                            {errors.firstName}
                        </p>
                    )}
                </div>

                <div className="w-1/2">
                    <label className="text-xs font-bold text-[#000060]">
                        Last Name
                    </label>
                    <input
                        ref={lastNameRef}
                        type="text"
                        placeholder="Enter your Last Name"
                        className={`w-full mt-1 px-3 py-2 rounded-xl bg-[#F7F7FF] border text-sm ${
                            errors.lastName ? "border-red-500" : "border-gray-300"
                        }`}
                        value={form.lastName}
                        onChange={(e) =>
                            setForm({ ...form, lastName: e.target.value })
                        }
                        onKeyDown={(e) => {
                            if (e.key === "Enter") emailRef.current.focus();
                        }}
                    />
                    {errors.lastName && (
                        <p className="text-xs text-red-500 mt-1">
                            {errors.lastName}
                        </p>
                    )}
                </div>
            </div>

            {/* EMAIL */}
            <div className="mb-3">
                <label className="text-xs font-bold text-[#000060]">Email</label>
                <input
                    ref={emailRef}
                    type="email"
                    placeholder="Enter your email"
                    className={`w-full mt-1 px-3 py-2 rounded-xl bg-[#F7F7FF] border text-sm ${
                        errors.email ? "border-red-500" : "border-gray-300"
                    }`}
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    onKeyDown={(e) => {
                        if (e.key === "Enter") passwordRef.current.focus();
                    }}
                />
                {errors.email && (
                    <p className="text-xs text-red-500 mt-1">{errors.email}</p>
                )}
            </div>

            {/* PASSWORD */}
            <div className="mb-3">
                <label className="text-xs font-bold text-[#000060]">Password</label>

                <div
                    className={`flex items-center gap-2 mt-1 px-3 py-2 rounded-xl bg-[#F7F7FF] border text-sm ${
                        errors.password ? "border-red-500" : "border-gray-300"
                    }`}
                >
                    <input
                        ref={passwordRef}
                        type={showPassword ? "text" : "password"}
                        placeholder="Create Password"
                        className="w-full bg-transparent outline-none text-sm"
                        value={form.password}
                        onChange={(e) =>
                            setForm({ ...form, password: e.target.value })
                        }
                    />

                    {showPassword ? (
                        <IoEyeOutline
                            className="text-gray-600 text-lg cursor-pointer"
                            onClick={() => setShowPassword(false)}
                        />
                    ) : (
                        <IoEyeOffOutline
                            className="text-gray-600 text-lg cursor-pointer"
                            onClick={() => setShowPassword(true)}
                        />
                    )}
                </div>

                {/* INLINE LIVE RULES */}
                <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
                    <PasswordRuleInline
                        valid={form.password.length >= 8}
                        text="8+ chars"
                    />
                    <PasswordRuleInline
                        valid={/[A-Z]/.test(form.password)}
                        text="uppercase"
                    />
                    <PasswordRuleInline
                        valid={/[a-z]/.test(form.password)}
                        text="lowercase"
                    />
                    <PasswordRuleInline
                        valid={/[0-9]/.test(form.password)}
                        text="number"
                    />
                    <PasswordRuleInline
                        valid={/[!@#$%^&*]/.test(form.password)}
                        text="special"
                    />
                </div>

                {errors.password && (
                    <p className="text-xs text-red-500 mt-1">{errors.password}</p>
                )}
            </div>

            {/* TERMS */}
            <label className="flex items-center gap-2 text-gray-600 text-xs mb-2">
                <input
                    type="checkbox"
                    className="w-3 h-3"
                    checked={form.agree}
                    onChange={(e) =>
                        setForm({ ...form, agree: e.target.checked })
                    }
                />
                I agree with Terms and Privacy Policies
            </label>
            {errors.agree && (
                <p className="text-xs text-red-500">{errors.agree}</p>
            )}

            {/* CREATE ACCOUNT */}
            <button
                onClick={handleCreateAccount}
                className="w-full bg-[#000060] text-white py-2 rounded-xl font-semibold mt-3 hover:bg-[#000060d1] transition text-sm"
            >
                Create Account
            </button>

            {/* DIVIDER */}
            <div className="flex items-center my-4">
                <div className="flex-grow h-[1px] bg-gray-300"></div>
                <span className="mx-2 text-gray-500 text-xs">or</span>
                <div className="flex-grow h-[1px] bg-gray-300"></div>
            </div>

            {/* GOOGLE SIGNUP */}
            <button className="w-full flex items-center justify-center gap-2 py-2 border rounded-xl bg-white hover:bg-gray-100 shadow-sm text-sm">
                <img
                    src="https://cdn-icons-png.flaticon.com/512/300/300221.png"
                    className="w-4"
                />
                Sign Up with Google Account
            </button>

            {/* LOGIN LINK */}
            <p className="text-center mt-4 text-xs text-gray-600">
                Already have an account?
                <span
                    className="text-[#000060] font-semibold ml-1 cursor-pointer hover:underline"
                    onClick={onLoginClick}
                >
                    Log in
                </span>
            </p>
        </motion.div>
    );
};

export default CreateAccount;


/* INLINE PASSWORD RULE COMPONENT */
const PasswordRuleInline = ({ valid, text }) => {
    return (
        <span
            className={`px-2 py-[3px] rounded-full border text-[10px] flex items-center gap-1
            ${
                valid
                    ? "border-green-500 text-green-600"
                    : "border-gray-400 text-gray-500"
            }`}
        >
            {valid ? "✔" : "•"} {text}
        </span>
    );
};
