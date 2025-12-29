// Q:\PROJECTS\YourZeroesAndOnes\cureli\curely_erp\frontend\src\pages\LoginPage.jsx

import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";

import bgImage from "../assets/images/login-background.jpg";
import logo from "../assets/icons/cureli-white.svg";

import LoginForm from "../components/onboarding/phase1/LoginForm";
import CreateAccount from "../components/onboarding/phase1/CreateAccount";
import OtpVerify from "../components/onboarding/phase1/OtpVerify";
import ReCaptchaWrapper from "../components/common/ReCaptchaWrapper";

const LoginPage = () => {
  const [showOtp, setShowOtp] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [sessionMessage, setSessionMessage] = useState(null);

  const [searchParams] = useSearchParams();

  // ✅ Check for session-related URL params
  useEffect(() => {
    const reason = searchParams.get("reason");

    if (reason === "session_replaced") {
      setSessionMessage({
        type: "warning",
        text: "You were logged out because your account was accessed from another device.",
      });
    } else if (reason === "session_expired") {
      setSessionMessage({
        type: "info",
        text: "Your session has expired. Please log in again.",
      });
    }

    // Clear the URL param after reading
    if (reason) {
      window.history.replaceState({}, "", "/login");
    }
  }, [searchParams]);

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
          <div className="absolute top-3 left-1/2 -translate-x-1/2 md:left-6 lg:left-8 md:translate-x-0 z-20 transition-all">
            <div className="flex items-center gap-2">
              <img
                src={logo}
                alt="Cureli ERP"
                className="h-8 sm:h-10 md:h-12 w-auto"
              />
              <span className="hidden sm:inline-block text-lg md:text-xl lg:text-2xl font-bold text-white font-manrope drop-shadow-md">
                Cureli
              </span>
            </div>
          </div>

          {/* Hero text */}
          <div className="absolute inset-0 z-10 text-white px-6 sm:px-8 md:px-12 flex flex-col justify-center items-center md:items-start text-center md:text-left font-poppins">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-semibold mb-4 sm:mb-6 md:mt-24 lg:mt-0 transition-all">
              Welcome to Cureli
            </h1>
            <p className="text-sm sm:text-lg md:text-xl lg:text-2xl font-light leading-relaxed transition-all">
              "Smarter stock, billing, and expiry control.{" "}
              <br className="hidden sm:block" />
              Your pharmacy starts here."
            </p>
          </div>
        </div>

        {/* RIGHT SIDE (Form) */}
        <div className="relative w-full md:w-2/5 bg-white px-6 py-10 sm:px-10 sm:py-12 flex items-center justify-center font-poppins">
          {/* Skewed white strip only for medium+ screens */}
          <div className="hidden md:block absolute left-[-115px] top-0 h-full w-[200px] lg:w-[220px] bg-white transform -skew-x-[12deg]" />

          {/* Form container */}
          <div className="relative z-10 w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-sm bg-white rounded-xl p-6 sm:p-8 transition-all">
            {/* ✅ Session Message Alert */}
            {sessionMessage && (
              <div
                className={`mb-4 p-3 rounded-lg text-sm ${
                  sessionMessage.type === "warning"
                    ? "bg-orange-50 border border-orange-200 text-orange-800"
                    : "bg-blue-50 border border-blue-200 text-blue-800"
                }`}
              >
                <div className="flex items-start gap-2">
                  {sessionMessage.type === "warning" ? (
                    <svg
                      className="w-5 h-5 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg
                      className="w-5 h-5 flex-shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                  <span>{sessionMessage.text}</span>
                </div>
                <button
                  onClick={() => setSessionMessage(null)}
                  className="mt-2 text-xs underline hover:no-underline"
                >
                  Dismiss
                </button>
              </div>
            )}

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
