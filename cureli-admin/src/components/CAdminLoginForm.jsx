import { useState, useRef } from "react";
import { FaUser, FaLock } from "react-icons/fa";
import { IoEyeOffOutline, IoEyeOutline } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import { loginCAdmin } from "../api/auth";

const CAdminLoginForm = ({ onSuccess }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const passwordRef = useRef(null);
  const navigate = useNavigate();

  const validate = () => {
    const e = {};
    if (!username.trim()) e.username = "Username required";
    if (!password.trim()) e.password = "Password required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      const res = await loginCAdmin({ username, password });
      const phone_hint = res.data.data.phone_hint;

      onSuccess(username, phone_hint);
    } catch (err) {
      setErrors({
        general:
          err?.response?.data?.message ||
          "Invalid username or password",
      });
    }
    setLoading(false);
  };

  return (
    <div className="w-full font-poppins">
      <h2 className="text-3xl font-semibold text-center text-[#000060] mb-8">
        Admin Login
      </h2>

      {errors.general && (
        <p className="text-red-600 text-center mb-4 text-sm">
          {errors.general}
        </p>
      )}

      {/* USERNAME */}
      <div className="mb-6">
        <label className="text-sm font-medium text-[#000060]">Username</label>

        <div
          className={`flex items-center gap-4 mt-2 px-4 py-4 rounded-2xl shadow-md ${
            errors.username
              ? "bg-red-100 border-red-500 border"
              : "bg-[#F7F7FF]"
          }`}
        >
          <FaUser className="text-gray-500 text-lg" />

          <input
            type="text"
            placeholder="Enter admin username"
            className="w-full bg-transparent outline-none text-gray-700"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            ref={passwordRef}
          />
        </div>
        {errors.username && (
          <p className="text-red-600 text-sm mt-1">{errors.username}</p>
        )}
      </div>

      {/* PASSWORD */}
      <div className="mb-3">
        <label className="text-sm font-medium text-[#000060]">Password</label>

        <div
          className={`flex items-center gap-4 mt-2 px-4 py-4 rounded-2xl shadow-md ${
            errors.password
              ? "bg-red-100 border-red-500 border"
              : "bg-[#F7F7FF]"
          }`}
        >
          <FaLock className="text-gray-500 text-lg" />

          <input
            type={showPassword ? "text" : "password"}
            placeholder="Enter password"
            className="w-full bg-transparent outline-none text-gray-700"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

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

      <div className="text-right text-sm mb-6">
        <span
          onClick={() => navigate("/admin-forgot-password")}
          className="text-[#000060] hover:underline cursor-pointer"
        >
          Forgot Password?
        </span>
      </div>

      <button
        disabled={loading}
        onClick={handleSubmit}
        className="w-full bg-[#000060] text-white py-3 rounded-xl font-semibold
                   hover:bg-[#000060d1] transition disabled:bg-gray-400"
      >
        {loading ? "Logging in..." : "Login"}
      </button>
    </div>
  );
};

export default CAdminLoginForm;
