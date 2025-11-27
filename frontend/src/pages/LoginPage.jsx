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
      {/* Whole page container */}
      <div className="relative flex flex-col md:flex-row min-h-screen w-full overflow-hidden bg-white">
        {/* LEFT SIDE (Hero with image) */}
        <div className="relative w-full md:w-3/5 h-56 md:h-auto">
          {/* Background image */}
          <div className="absolute inset-0 w-full h-full overflow-hidden">
            <img
              src={bgImage}
              alt="Background"
              className="w-full h-full object-cover md:scale-145 md:-translate-x-[25%]"
            />
          </div>

          {/* Dark overlay */}
          <div className="absolute inset-0 bg-[#000060A3]" />

          {/* Logo on top of image */}
          <img
            src={logo}
            alt="Cureli Logo"
            className="absolute top-4 left-4 w-28 md:w-32 z-20"
          />

          {/* Hero text – show only on md+ to keep mobile clean */}
          <div className="hidden md:block absolute z-10 text-white px-8 lg:px-12 mt-24 font-poppins">
            <h1 className="text-3xl lg:text-5xl mt-6 mb-6 font-semibold">
              Welcome to Cureli
            </h1>
            <p className="mt-6 text-lg lg:text-2xl font-light leading-relaxed">
              “Smarter stock, billing, and expiry control.
              <br />
              Your pharmacy starts here.”
            </p>
          </div>
        </div>

        {/* RIGHT SIDE (Form) */}
        <div className="relative w-full md:w-2/5 bg-white px-6 py-8 sm:px-10 sm:py-10 flex items-center justify-center font-poppins">
          {/* Skewed white strip only on md+ so it doesn’t mess mobile layout */}
          <div className="hidden md:block absolute left-[-85px] top-0 h-full w-[220px] bg-white transform -skew-x-[12deg]" />

          <div className="relative z-10 w-full max-w-sm sm:max-w-md">
            {/* Extra logo only for very small screens if you want it;
                you can remove this since logo is on the hero now */}
            {/* <div className="mb-6 md:hidden flex justify-center">
              <img src={logo} alt="Cureli Logo" className="h-10" />
            </div> */}

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