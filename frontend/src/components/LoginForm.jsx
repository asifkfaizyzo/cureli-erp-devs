import { useState } from "react";
import { motion } from "framer-motion";
import { FaUser, FaLock } from "react-icons/fa";
import { IoEyeOffOutline, IoEyeOutline } from "react-icons/io5";

const LoginForm = () => {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);

    const [errors, setErrors] = useState({});

    const validateForm = () => {
        const newErrors = {};

        if (!username.trim()) newErrors.username = "Username is required";
        if (!password.trim()) newErrors.password = "Password is required";

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleLogin = () => {
        if (!validateForm()) return;
        alert("Login Successful! (Backend coming next)");
    };

    return (
        <motion.div 
            className="relative z-10 w-full max-w-sm font-poppins"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
        >
            {/* Heading */}
            <h2 className="text-3xl font-semibold mb-10 text-center text-[#000060]">
                Log in
            </h2>

            {/* USERNAME */}
            <div className="mb-6">
                <label className="text-sm font-medium text-[#000060]">Username</label>

                <div className={`flex items-center gap-4 mt-2 px-4 py-4 rounded-2xl shadow-md 
                    ${errors.username ? "bg-red-100 border-red-500 border" : "bg-[#F7F7FF]"}`}>

                    <FaUser className="text-gray-500 text-lg" />

                    <input
                        type="text"
                        placeholder="Enter your username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full bg-transparent outline-none text-gray-700"
                    />
                </div>

                {errors.username && (
                    <p className="text-red-600 text-sm mt-1">{errors.username}</p>
                )}
            </div>

            {/* PASSWORD */}
            <div className="mb-4">
                <label className="text-sm font-medium text-[#000060]">Password</label>

                <div className={`flex items-center gap-4 mt-2 px-4 py-4 rounded-2xl shadow-md 
                    ${errors.password ? "bg-red-100 border-red-500 border" : "bg-[#F7F7FF]"}`}>

                    <FaLock className="text-gray-500 text-lg" />

                    <input
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full bg-transparent outline-none text-gray-700"
                    />

                    {/* Eye Toggle */}
                    {showPassword ? (
                        <IoEyeOutline 
                            className="text-gray-600 cursor-pointer text-xl"
                            onClick={() => setShowPassword(false)}
                        />
                    ) : (
                        <IoEyeOffOutline 
                            className="text-gray-600 cursor-pointer text-xl"
                            onClick={() => setShowPassword(true)}
                        />
                    )}
                </div>

                {errors.password && (
                    <p className="text-red-600 text-sm mt-1">{errors.password}</p>
                )}
            </div>

            {/* Stay logged in + Forgot Password */}
            <div className="flex items-center justify-between text-sm my-4">
                <label className="flex items-center gap-2 text-gray-600">
                    <input type="checkbox" className="w-4 h-4" />
                    Stay logged in
                </label>

                <a href="#" className="text-[#000060] font-medium hover:underline">
                    Forget Password?
                </a>
            </div>

            {/* LOGIN BUTTON */}
            <button
                onClick={handleLogin}
                className="w-full bg-[#000060] text-white py-3 rounded-xl font-semibold mt-4
                hover:bg-[#000060d1] transition"
            >
                Log in
            </button>

            {/* SIGN UP */}
            <p className="text-center mt-6 text-sm text-gray-600">
                Don’t have an account?
                <a href="#" className="text-[#000060] font-semibold ml-1 hover:underline">
                    Sign Up
                </a>
            </p>
        </motion.div>
    );
};

export default LoginForm;

