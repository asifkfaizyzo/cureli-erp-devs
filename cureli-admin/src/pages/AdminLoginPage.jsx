import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CAdminLoginForm from "../components/CAdminLoginForm";
import CAdminOtpForm from "../components/CAdminOtpForm";
import { AUTH_CONFIG } from "../config/modules/authConfig.js";

import bgImage from "../assets/images/login-background.jpg";
import logo from "../assets/icons/cureli.svg";

const AdminLoginPage = () => {
  const [step, setStep] = useState("login"); // login | otp
  const [username, setUsername] = useState("");
  const [phoneHint, setPhoneHint] = useState("");

  // Handle successful login - either go to OTP or complete login
  const handleLoginSuccess = (uname, hint, directLogin = false) => {
    if (directLogin || !AUTH_CONFIG.ENABLE_OTP) {
      // Direct login completed - navigation handled in the form
      return;
    }
    // OTP flow
    setUsername(uname);
    setPhoneHint(hint);
    setStep("otp");
  };

  return (
    <div className="relative flex flex-col md:flex-row min-h-screen w-full overflow-hidden font-poppins">
      {/* LEFT SIDE */}
      <div className="relative w-full md:w-3/5 h-56 md:h-auto">
        <img
          src={bgImage}
          className="absolute inset-0 w-full h-full object-cover md:scale-145 md:-translate-x-[25%]"
          alt="Background"
        />
        <div className="absolute inset-0 bg-[#000060A3]" />

        {/* Logo */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 md:left-6 lg:left-8 md:translate-x-0 z-20 transition-all">
          <div className="flex items-center gap-2">
            <img
              src={logo}
              alt="Cureli ERP"
              className="h-8 sm:h-10 md:h-12 w-auto"
            />
            <span className="hidden sm:inline-block text-lg md:text-xl lg:text-2xl font-bold text-white font-manrope drop-shadow-md">
              Cureli Admin Panel
            </span>
          </div>
        </div>

        <div className="hidden md:block absolute z-10 text-white px-12 mt-24">
        
          <p className="text-lg lg:text-2xl font-light leading-relaxed opacity-90">
            Secure access for
            <br />
            authorized Cureli administrators.
          </p>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="relative w-full md:w-2/5 bg-white px-6 py-10 flex items-center justify-center">
        <div className="hidden md:block absolute left-[-85px] top-0 h-full w-[220px] bg-white transform -skew-x-[12deg]"></div>

        <div className="relative z-10 w-full max-w-sm">
          <AnimatePresence mode="wait">
            {step === "login" ? (
              <motion.div
                key="login"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -40 }}
                transition={{ duration: 0.4 }}
              >
                <CAdminLoginForm
                  onSuccess={handleLoginSuccess}
                  enableOtp={AUTH_CONFIG.ENABLE_OTP}
                />
              </motion.div>
            ) : (
              <motion.div
                key="otp"
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -40 }}
                transition={{ duration: 0.4 }}
              >
                <CAdminOtpForm
                  username={username}
                  phoneHint={phoneHint}
                  onBack={() => setStep("login")}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
