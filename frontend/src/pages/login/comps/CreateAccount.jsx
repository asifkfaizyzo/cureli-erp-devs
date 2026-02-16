import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { IoEyeOffOutline, IoEyeOutline } from "react-icons/io5";
import { googleSignup, signupUser } from "../../../api/auth";
import { useNavigate } from "react-router-dom";
import { GoogleLogin } from "@react-oauth/google";
import { useGoogleReCaptcha } from "react-google-recaptcha-v3";


const CreateAccount = ({ onLoginClick }) => {
  const navigate = useNavigate();
  const { executeRecaptcha } = useGoogleReCaptcha();

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    agree: false,
  });

  const [errors, setErrors] = useState({});

  const lastNameRef = useRef(null);
  const emailRef = useRef(null);
  const passwordRef = useRef(null);

  // ---------------------------
  // CLEAR PREVIOUS SESSION
  // ---------------------------
  const clearPreviousSession = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("shop_id");
    localStorage.removeItem("user_id");
    localStorage.removeItem("user_name");
    localStorage.removeItem("onboarding_step");

    // Clear refresh_token cookie
    document.cookie = "refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
  };

  // ---------------------------
  // VALIDATION
  // ---------------------------
  const validate = () => {
    const err = {};

    if (!form.first_name.trim()) err.first_name = "First name required";
    if (!form.last_name.trim()) err.last_name = "Last name required";

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

  // ---------------------------
  // SIGNUP API
  // ---------------------------

  const handleGoogleSignup = async (response) => {
    try {
      // ✅ Clear any existing session before new signup
      clearPreviousSession();

      const credential = response.credential;
      const res = await googleSignup({ credential });

      navigate("/onboarding", {
        state: {
          pending_id: res.data.data.pending_id,
          email: res.data.data.email,
          first_name: res.data.data.first_name,
          last_name: res.data.data.last_name,
          provider: "google",
        },
      });
    } catch (err) {
      console.error("GOOGLE SIGNUP ERROR:", err);
      alert("Google sign-up failed");
    }
  };

 const handleCreateAccount = async () => {
  if (!validate()) return;

  // ✅ CHECK IF RECAPTCHA IS READY
  if (!executeRecaptcha) {
    console.error("❌ executeRecaptcha is not available");
    alert("reCAPTCHA not ready. Please try again.");
    return;
  }

  setLoading(true);

  try {
    clearPreviousSession();

    // ✅ GET RECAPTCHA TOKEN
    const recaptchaToken = await executeRecaptcha("signup");
    
    // ✅ ADD LOGGING TO VERIFY TOKEN
    console.log("✅ reCAPTCHA Token generated:", recaptchaToken);

    const payload = {
      first_name: form.first_name,
      last_name: form.last_name,
      email: form.email,
      password: form.password,
      recaptchaToken,
    };

    // ✅ LOG THE FULL PAYLOAD
    console.log("📤 Sending payload:", payload);

    const res = await signupUser(payload);
    const pending_id = res.data.data.pending_id;

    navigate("/onboarding", {
      state: {
        pending_id,
        email: form.email,
        first_name: form.first_name,
        last_name: form.last_name,
      },
    });
  } catch (err) {
    console.error("❌ Signup failed:", err);
    console.error("📥 Response data:", err?.response?.data);
    console.error("📊 Response status:", err?.response?.status);
    alert(err?.response?.data?.message || "Signup failed");
  }

  setLoading(false);
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

      <div className="flex gap-3 mb-3">
        <div className="w-1/2">
          <label className="text-xs font-bold text-[#000060]">First Name</label>
          <input
            type="text"
            placeholder="First Name"
            className={`w-full mt-1 px-2 py-2 rounded-xl bg-[#F7F7FF] border text-sm ${
              errors.first_name ? "border-red-500" : "border-gray-300"
            } placeholder-xs sm:placeholder-sm md:placeholder-sm`}
            value={form.first_name}
            onChange={(e) => setForm({ ...form, first_name: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && lastNameRef.current.focus()}
          />

          {errors.first_name && (
            <p className="text-xs text-red-500 mt-1">{errors.first_name}</p>
          )}
        </div>

        <div className="w-1/2">
          <label className="text-xs font-bold text-[#000060]">Last Name</label>
          <input
            ref={lastNameRef}
            type="text"
            placeholder="Last Name"
            className={`w-full mt-1 px-2 py-2 rounded-xl bg-[#F7F7FF] border text-sm ${
              errors.last_name ? "border-red-500" : "border-gray-300"
            }`}
            value={form.last_name}
            onChange={(e) => setForm({ ...form, last_name: e.target.value })}
            onKeyDown={(e) => e.key === "Enter" && emailRef.current.focus()}
          />
          {errors.last_name && (
            <p className="text-xs text-red-500 mt-1">{errors.last_name}</p>
          )}
        </div>
      </div>

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
          onKeyDown={(e) => e.key === "Enter" && passwordRef.current.focus()}
        />
        {errors.email && (
          <p className="text-xs text-red-500 mt-1">{errors.email}</p>
        )}
      </div>

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
            onChange={(e) => setForm({ ...form, password: e.target.value })}
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

        <div className="mt-2 flex flex-wrap gap-2 text-[10px]">
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

      <label className="flex items-center gap-2 text-gray-600 text-xs mb-2">
        <input
          type="checkbox"
          className="w-3 h-3"
          checked={form.agree}
          onChange={(e) => setForm({ ...form, agree: e.target.checked })}
        />
        I agree with{" "}
        <span
          onClick={(e) => {
            e.preventDefault();
            navigate("/terms");
          }}
          className="text-[#000060] font-semibold cursor-pointer hover:underline"
        >
          Terms
        </span>{" "}
        and{" "}
        <span
          onClick={(e) => {
            e.preventDefault();
            navigate("/privacy");
          }}
          className="text-[#000060] font-semibold cursor-pointer hover:underline"
        >
          Privacy Policies
        </span>
      </label>
      {errors.agree && <p className="text-xs text-red-500">{errors.agree}</p>}

      <button
        onClick={handleCreateAccount}
        disabled={loading}
        className="w-full bg-[#000060] text-white py-2 rounded-xl font-semibold mt-3 text-sm 
        hover:bg-[#000060d1] transition disabled:bg-gray-400"
      >
        {loading ? "Creating..." : "Create Account"}
      </button>

      <div className="flex items-center my-4">
        <div className="flex-grow h-[1px] bg-gray-300"></div>
        <span className="mx-2 text-gray-500 text-xs">or</span>
        <div className="flex-grow h-[1px] bg-gray-300"></div>
      </div>

      <GoogleLogin
        onSuccess={handleGoogleSignup}
        onError={() => alert("Google sign-in failed")}
      />

      <p className="text-center mt-4 text-xs text-gray-600">
        Already have an account?{" "}
        <span
          className="text-[#000060] font-semibold ml-1 cursor-pointer hover:underline"
          onClick={onLoginClick}
        >
          Log in
        </span>
      </p>

      <p className="text-center text-[13px] text-gray-400 mt-4">
        This site is protected by reCAPTCHA and the <br />
        <span
          onClick={() => navigate("/privacy")}
          className="text-[#000060] underline cursor-pointer hover:font-semibold"
        >
          Google Privacy
        </span>{" "}
        policy and{" "}
        <span
          onClick={() => navigate("/terms")}
          className="text-[#000060] underline cursor-pointer hover:font-semibold"
        >
          Terms of Service
        </span>{" "}
        apply.
      </p>
    </motion.div>
  );
};

export default CreateAccount;

const PasswordRuleInline = ({ valid, text }) => (
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