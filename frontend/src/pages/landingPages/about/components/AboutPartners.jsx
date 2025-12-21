import React, { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";

import Netmeds from "../../../../assets/images/netmeds.png";
import Apollo from "../../../../assets/images/apollo.png";
import CureliLogo from "../../../../assets/images/cureli.png";
import MedicalCross from "../../../../assets/images/medical-cross.png";
import SastaSundar from "../../../../assets/images/sasta-sundar.png";
import HealthcareIllustration from "../../../../assets/images/About-layout.png";

const AboutPartners = () => {
  useEffect(() => {
    AOS.init({ duration: 900, once: true });
  }, []);

  const logos = [
    { src: Netmeds, name: "Netmeds" },
    { src: MedicalCross, name: "Medical Cross" },
    { src: SastaSundar, name: "Sasta Sundar" },
    { src: Apollo, name: "Apollo" },
    { src: CureliLogo, name: "Cureli" },
    { src: Netmeds, name: "Netmeds" },
    { src: MedicalCross, name: "Medical Cross" },
    { src: SastaSundar, name: "Sasta Sundar" },
  ];

  return (
    <>
      {/* SECTION 1: Auto-Scrolling Logo Carousel */}
      <section className="py-10 sm:py-12 md:py-16 bg-white overflow-hidden">
        <div className="px-4 sm:px-6 lg:px-8">
          <h2
            className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-[#05015A] text-center mb-6 sm:mb-8 md:mb-12 font-manrope px-4"
            data-aos="fade-up"
          >
            Our Trusted leading healthcare partners.
          </h2>

          {/* Infinite Scrolling Container */}
          <div className="relative">
            <div className="logo-scroll-container">
              <div className="logo-scroll-track">
                {/* First set of logos */}
                {logos.map((logo, i) => (
                  <div
                    key={`logo-1-${i}`}
                    className="logo-item flex flex-col items-center justify-center px-4 sm:px-6 md:px-8 lg:px-10"
                  >
                    <img
                      src={logo.src}
                      alt={logo.name}
                      className="h-8 sm:h-10 md:h-12 lg:h-14 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity duration-300"
                    />
                    <span className="text-[10px] sm:text-xs md:text-sm text-[#05015A] mt-1.5 sm:mt-2 font-medium">
                      {logo.name}
                    </span>
                  </div>
                ))}
                {/* Duplicate set for seamless loop */}
                {logos.map((logo, i) => (
                  <div
                    key={`logo-2-${i}`}
                    className="logo-item flex flex-col items-center justify-center px-4 sm:px-6 md:px-8 lg:px-10"
                  >
                    <img
                      src={logo.src}
                      alt={logo.name}
                      className="h-8 sm:h-10 md:h-12 lg:h-14 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity duration-300"
                    />
                    <span className="text-[10px] sm:text-xs md:text-sm text-[#05015A] mt-1.5 sm:mt-2 font-medium">
                      {logo.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 2: Image + Text Layout (40:60 ratio) */}
      <section className="py-12 sm:py-16 md:py-20 lg:py-24 bg-white">
        <div className="max-w-8xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col lg:flex-row gap-6 sm:gap-8 lg:gap-10 xl:gap-12 items-center">
            
            {/* Left: Illustration - 40% width */}
            <div 
              data-aos="fade-right" 
              className="w-full lg:w-[40%] order-2 lg:order-1"
            >
              <div className="flex justify-center lg:justify-start">
                <img
                  src={HealthcareIllustration}
                  alt="Healthcare Solution"
                  className="w-full max-w-sm sm:max-w-md lg:max-w-full h-auto max-h-[250px] sm:max-h-[350px] md:max-h-[400px] lg:max-h-[450px] xl:max-h-[500px] object-contain"
                />
              </div>
            </div>

            {/* Right: Content - 60% width */}
            <div 
              data-aos="fade-left" 
              className="w-full lg:w-[60%] order-1 lg:order-2"
            >
              <h2 className="font-manrope text-xl sm:text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold text-[#05015A] mb-3 sm:mb-4 md:mb-6 leading-tight">
                Complete HealthCare Solution
              </h2>
              <p className="font-manrope text-xs sm:text-sm md:text-base lg:text-lg text-gray-600 leading-relaxed">
                At Cureli, our vision is to empower every pharmacy or small- intelligent,
                seamless, and connected technology that transforms the way care is delivered. We aim
                to create a fully integrated ecosystem where pharmacists can operate with unmatched
                efficiency, real-time insight, and uncompromised accuracy. By simplifying workflows,
                automating operational burdens, and enabling data-driven decisions, we strive to
                elevate the quality of patient care, strengthen pharmacy performance, and contribute
                to healthier communities.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* CSS for Infinite Scroll Animation */}
      <style jsx>{`
        .logo-scroll-container {
          width: 100%;
          overflow: hidden;
          position: relative;
        }

        .logo-scroll-track {
          display: flex;
          animation: scroll 30s linear infinite;
          width: fit-content;
        }

        .logo-scroll-track:hover {
          animation-play-state: paused;
        }

        .logo-item {
          flex-shrink: 0;
          min-width: 100px;
        }

        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        /* Responsive logo item widths */
        @media (min-width: 640px) {
          .logo-item {
            min-width: 130px;
          }
        }

        @media (min-width: 768px) {
          .logo-item {
            min-width: 150px;
          }
        }

        @media (min-width: 1024px) {
          .logo-item {
            min-width: 160px;
          }
        }
      `}</style>
    </>
  );
};

export default AboutPartners;
