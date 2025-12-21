import React from 'react';
import { useNavigate } from 'react-router-dom';

const NotFoundPage = () => {
  const navigate = useNavigate();

  const goHome = () => {
    navigate('/');
  };

  const goBack = () => {
    navigate(-1);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#000060] via-[#000040] to-black 
                    flex flex-col items-center justify-center px-4 py-8 relative overflow-hidden">
      
      {/* Animated Stars Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="stars absolute w-full h-full animate-pulse"></div>
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-twinkle"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 3}s`,
            }}
          ></div>
        ))}
      </div>

      {/* Decorative Elements */}
      <div className="absolute top-10 right-10 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
      <div className="absolute bottom-10 left-10 w-48 h-48 bg-white/5 rounded-full blur-2xl"></div>

      {/* Main Content */}
      <div className="text-center z-10 max-w-2xl">

        {/* 404 Error Code */}
        <div className="relative">
          <h1 className="text-[120px] md:text-[180px] font-black text-transparent leading-none
                         bg-clip-text bg-gradient-to-b from-white to-white/50
                         drop-shadow-[0_0_30px_rgba(255,255,255,0.3)]">
            404
          </h1>
          <div className="absolute inset-0 text-[120px] md:text-[180px] font-black text-transparent leading-none
                          [-webkit-text-stroke:2px_rgba(255,255,255,0.3)]">
            404
          </div>
        </div>

        {/* Title */}
        <h2 className="text-2xl md:text-4xl font-light text-white mt-6 tracking-[0.3em] uppercase">
          Lost in Space
        </h2>

        {/* Divider */}
        <div className="w-24 h-1 bg-white/30 mx-auto mt-6 rounded-full"></div>

        {/* Description */}
        <p className="text-base md:text-lg text-white/60 mt-6 mb-10 max-w-md mx-auto leading-relaxed">
          Houston, we have a problem! The page you're searching for has drifted into a black hole 
          and cannot be found.
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          
          {/* Primary Button - Back to Home */}
          <button
            onClick={goHome}
            className="group bg-white text-[#000060] px-8 py-4 rounded-full font-bold text-lg 
                       shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:shadow-[0_0_50px_rgba(255,255,255,0.5)]
                       hover:-translate-y-1 transition-all duration-300 active:scale-95
                       flex items-center gap-3"
          >
            <span className="group-hover:-translate-x-1 transition-transform">🏠</span>
            Back to Home
            <span className="group-hover:translate-x-1 transition-transform">→</span>
          </button>

          {/* Secondary Button - Go Back */}
          <button
            onClick={goBack}
            className="bg-transparent text-white px-8 py-4 rounded-full font-bold text-lg 
                       border-2 border-white/50 hover:border-white hover:bg-white/10
                       transition-all duration-300 active:scale-95"
          >
            ← Go Back
          </button>
        </div>

        {/* Additional Links */}
        <div className="mt-10 flex flex-wrap justify-center gap-6 text-white/50">
          <a href="/contact" className="hover:text-white transition-colors underline underline-offset-4">
            Contact Support
          </a>
          <a href="/sitemap" className="hover:text-white transition-colors underline underline-offset-4">
            Sitemap
          </a>
          <a href="/help" className="hover:text-white transition-colors underline underline-offset-4">
            Help Center
          </a>
        </div>
      </div>

      {/* Footer */}
      <div className="absolute bottom-6 text-white/30 text-sm">
        © 2024 Your Zeros And Ones. All rights reserved.
      </div>
    </div>
  );
};

export default NotFoundPage;