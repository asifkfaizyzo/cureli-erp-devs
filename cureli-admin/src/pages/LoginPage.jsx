import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import ReCaptchaWrapper from "../components/ReCaptchaWrapper";
import AdminLogin from "../components/AdminLogin";
import PhoneOtp from "../components/PhnoOtpverification";

import bgImage from "../assets/images/login-background.jpg";
import logo from "../assets/icons/logo.png";

const LoginPage = () => {
  const [showOtp, setShowOtp] = useState(false);
  const navigate = useNavigate();

  const handleOtpSuccess = () => {
    // ✅ after OTP verify, redirect where you want
    navigate("/admin-dashboard");
  };

  return (
    <ReCaptchaWrapper>
      <div className="relative flex h-screen w-full overflow-hidden font-poppins">

        {/* LEFT SIDE UI */}
        <div className="relative w-[70%] h-full">
          <img
            src={bgImage}
            alt="Background"
            className="absolute inset-0 w-full h-full object-cover scale-145 -translate-x-[25%]"
          />
          <div className="absolute inset-0 bg-[#000060A3]" />

          <img
            src={logo}
            alt="Logo"
            className="absolute top-10 left-6 w-40 z-20"
          />

          <div className="absolute z-10 text-white px-12 mt-28">
            <h1 className="text-5xl mt-10 mb-10 font-semibold">Welcome to Cureli</h1>
            <p className="mt-10 text-2xl font-light leading-relaxed">
              “Smarter stock, billing, and expiry control.<br/>Your pharmacy starts here.”
            </p>
          </div>
        </div>

        {/* RIGHT SIDE (Login or OTP swap) */}
        <div className="relative w-[50%] h-full bg-white p-10 flex items-center justify-center">
          <div className="absolute left-[-85px] top-0 h-full w-[220px] bg-white -skew-x-[12deg]" />

          <div className="relative z-10 w-full max-w-sm">

            <AnimatePresence mode="wait">
              {showOtp ? (
                <motion.div
                  key="otp"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                >
                  <PhoneOtp
                    pending_id="demo123"
                    phone="9898989898"
                    onContinue={handleOtpSuccess} // ✅ Redirect after verify
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="login"
                  initial={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <AdminLogin onSuccess={() => setShowOtp(true)} /> {/* ✅ Login → OTP */}
                </motion.div>
              )}
            </AnimatePresence>

          </div>
        </div>

      </div>
    </ReCaptchaWrapper>
  );
};

export default LoginPage;
