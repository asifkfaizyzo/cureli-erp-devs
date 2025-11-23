import { useState, useRef } from "react";
import { IoEyeOffOutline, IoEyeOutline } from "react-icons/io5";
import api from "../api/axios";

const CreatePassword = ({ pending_id, onContinue }) => {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  // ---------------------------
  // VALIDATION RULES
  // ---------------------------
  const validatePassword = () => {
    if (!password.trim()) return "Password required";
    if (password.length < 8) return "Min 8 characters";
    if (!/[A-Z]/.test(password)) return "Missing uppercase letter";
    if (!/[a-z]/.test(password)) return "Missing lowercase letter";
    if (!/[0-9]/.test(password)) return "Missing number";
    if (!/[!@#$%^&*]/.test(password)) return "Missing special character";
    return null;
  };

  const handleSubmit = async () => {
    const validationError = validatePassword();
    if (validationError) {
      setError(validationError);
      return;
    }

    try {
      await api.post("/pending/signup/google/set-password", {
        pending_id,
        password,
      });

      onContinue();
    } catch (err) {
      console.error(err);
      alert("Failed to set password");
    }
  };

  return (
    <div className="w-full max-w-md mt-6 px-3" style={{ marginLeft: "-20%" }}>
      <h2 className="text-2xl font-bold text-[#000006]">Create Your Password</h2>

      <label className="text-xs font-bold text-[#000060] mt-3">Password *</label>

      {/* INPUT WRAPPER */}
      <div
        className={`flex items-center gap-2 mt-1 px-3 py-2 rounded-xl bg-[#F7F7FF] border text-sm ${
          error ? "border-red-500" : "border-gray-300"
        }`}
      >
        <input
          ref={inputRef}
          type={showPassword ? "text" : "password"}
          value={password}
          placeholder="Create Password"
          onChange={(e) => {
            setPassword(e.target.value);
            setError("");
          }}
          className="w-full bg-transparent outline-none text-sm"
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

      {/* INLINE PASSWORD RULES */}
      <div className="mt-2 flex flex-wrap gap-2 text-[11px]">
        <PasswordRuleInline valid={password.length >= 8} text="8+ chars" />
        <PasswordRuleInline valid={/[A-Z]/.test(password)} text="uppercase" />
        <PasswordRuleInline valid={/[a-z]/.test(password)} text="lowercase" />
        <PasswordRuleInline valid={/[0-9]/.test(password)} text="number" />
        <PasswordRuleInline valid={/[!@#$%^&*]/.test(password)} text="special" />
      </div>

      {error && <p className="text-red-500 text-xs mt-1 mb-3">{error}</p>}

      <button
        onClick={handleSubmit}
        className="w-full bg-[#000060] text-white py-2 rounded-xl mt-4 hover:bg-[#000060d1]"
      >
        Continue
      </button>
    </div>
  );
};

export default CreatePassword;


// ---------------------------
// INLINE RULE COMPONENT
// ---------------------------

const PasswordRuleInline = ({ valid, text }) => (
  <span
    className={`px-2 py-[3px] rounded-full border text-[10px] flex items-center gap-1
      ${valid ? "border-green-500 text-green-600" : "border-gray-400 text-gray-500"}`}
  >
    {valid ? "✔" : "•"} {text}
  </span>
);
