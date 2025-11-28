import { useState } from "react";

import bgImage from "../assets/images/login-background.jpg";
import logo from "../assets/icons/logo.png";

import LoginForm from "../components/LoginForm";
import CreateAccount from "../components/CreateAccount";
import OtpVerify from "../components/OtpVerify";
import ReCaptchaWrapper from "../components/ReCaptchaWrapper";

const LoginPage = () => {
  const [showOtp, setShowOtp] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  return (
    <ReCaptchaWrapper>
  {/* Disable scroll globally */}
  <style>{`body { overflow: hidden; }`}</style>

  <div className="relative flex flex-col md:flex-row h-screen w-screen overflow-hidden bg-white">

        {/* LEFT SIDE (Hero with image) */}
        <div className="relative w-full md:w-3/5 h-64 sm:h-80 md:h-auto">
          {/* Background image */}
          <div className="absolute inset-0 w-full h-full overflow-hidden">
            <img
              src={bgImage}
              alt="Background"
              className="w-full h-full object-cover md:scale-125 lg:scale-145 md:-translate-x-[15%] lg:-translate-x-[25%] transition-all duration-500"
            />
          </div>

          {/* Dark overlay */}
          <div className="absolute inset-0 bg-[#000060A3]" />

          {/* Logo */}
          <img
            src={logo}
            alt="Cureli Logo"
            className="absolute top-4 left-1/2 -translate-x-1/2 md:left-4 md:translate-x-0 w-24 sm:w-28 md:w-32 z-20 transition-all"
          />

          {/* Hero text */}
          <div className="absolute inset-0 z-10 text-white px-6 sm:px-8 md:px-12 flex flex-col justify-center items-center md:items-start text-center md:text-left font-poppins">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold mb-4 sm:mb-6 md:mt-24 lg:mt-0 transition-all">
              Welcome to Cureli
            </h1>
            <p className="text-sm sm:text-lg md:text-xl lg:text-2xl font-light leading-relaxed transition-all">
              “Smarter stock, billing, and expiry control. <br className="hidden sm:block" />
              Your pharmacy starts here.”
            </p>
          </div>
        </div>

        {/* RIGHT SIDE (Form) */}
        <div className="relative w-full md:w-2/5 bg-white px-6 py-10 sm:px-10 sm:py-12 flex items-center justify-center font-poppins">
          
          {/* Skewed white strip only for medium+ screens */}
          <div className="hidden md:block absolute left-[-100px] top-0 h-full w-[200px] lg:w-[220px] bg-white transform -skew-x-[12deg]" />

          {/* Form container */}
          <div className="relative z-10 w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-sm bg-white rounded-xl p-6 sm:p-8 transition-all">

            {showOtp ? (
              <OtpVerify onBack={() => setShowOtp(false)} />
            ) : showRegister ? (
              <CreateAccount onLoginClick={() => setShowRegister(false)} />
            ) : (
              <LoginForm
                onSuccess={() => setShowOtp(true)}
                onRegisterClick={() => setShowRegister(true)}
              />
            )}

          </div>
        </div>

      </div>
    </ReCaptchaWrapper>
  );
};

export default LoginPage;
