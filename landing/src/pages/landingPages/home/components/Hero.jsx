// src/components/Hero.jsx
import { useEffect } from "react";
import AOS from "aos";
import heroBg from "../../../../assets/images/hero-bg.png";
import dashboardMockup from "../../../../assets/images/dashboard-mockup.png"; // Add your dashboard image
import dashboardMockup2 from "../../../../assets/images/dashboard-mockup2.png"; // Add your dashboard image

const Hero = () => {
  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
  }, []);

  return (
    <section
      id="home"
      className="relative w-full min-h-screen flex items-center justify-center text-white overflow-hidden pt-20"
    >
      {/* Background Image */}
     <div
  className="absolute inset-0 bg-cover bg-center bg-no-repeat scale-150"
  style={{ backgroundImage: `url(${heroBg})` }}
></div>

     

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center py-12">
        
        {/* Heading */}
        <h1
          className="mt-[-3%] text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-medium leading-tight mb-3 sm:mb-4"
          data-aos="fade-up"
        >
          Reliable Process Management for Confident <br className="hidden sm:block" /> 
          Business Growth.
        </h1>

        {/* Subtext */}
        <p
          className="text-base sm:text-lg md:text-xl max-w-4xl mx-auto mb-4 sm:mb-5 opacity-90 px-4"
          data-aos="fade-up"
          data-aos-delay="150"
        >
          Empowering Healthcare Stakeholders with Cutting Edge and Innovative Software Products
        </p>

        {/* CTA Buttons */}
        <div
          className="flex flex-col sm:flex-row justify-center gap-3 sm:gap-4 mt-4 px-4"
          data-aos="fade-up"
          data-aos-delay="300"
        >
          <a
            href="/contact"
            className="px-6 sm:px-8 py-3 bg-white text-[#05015A] font-semibold rounded-lg shadow-md hover:bg-gray-100 transition-all duration-200"
          >
            Book a Demo
          </a>

          <a
            href="#contact"
            className="px-6 sm:px-8 py-3 bg-transparent border-2 border-white font-semibold rounded-lg shadow-md hover:bg-white/10 transition-all duration-200"
          >
            Contact Us
          </a>
        </div>

        {/* Dashboard Mockup */}
       <div
  className="mt-5 sm:mt-8 md:mt-10 w-full flex justify-center px-4"
  data-aos="fade-up"
  data-aos-delay="450"
>
  <div className="relative w-full max-w-[95%] sm:max-w-[80%] md:max-w-[70%] lg:max-w-[800px] xl:max-w-[900px] 2xl:max-w-[1100px]">
    
    {/* Glow Effect Behind Mockup */}
    {/* <div className="absolute inset-0 bg-gradient-to-t from-purple-500/30 to-transparent blur-2xl rounded-3xl transform scale-105"></div>
     */}
    {/* Main Large Dashboard Image Container (Base Layer) */}
    <div className="relative bg-white/5 backdrop-blur-sm rounded-2xl sm:rounded-3xl p-2 sm:p-3 md:p-4 border border-white/20 shadow-2xl z-10">
      <img
        src={dashboardMockup}
        alt="Cureli Dashboard"
        className="w-full h-auto rounded-xl sm:rounded-2xl shadow-lg"
      />
    </div>

    {/* Small Dashboard Image - Positioned on top, centered, bottom aligned */}
    <div 
      className="absolute bottom-2 sm:bottom-3 md:bottom-4 left-1/2 -translate-x-1/2 w-[55%] sm:w-[50%] md:w-[45%] lg:w-[75%] z-20"
      data-aos="fade-up"
      data-aos-delay="300"
    >
      <div className="relative bg-white/10 backdrop-blur-md rounded-xl sm:rounded-2xl p-2 sm:p-2.5 md:p-3 border border-white/30 shadow-2xl transform hover:scale-[1.02] transition-transform duration-300">
        <img
          src={dashboardMockup2}
          alt="Cureli Billing System"
          className="w-full h-auto rounded-lg sm:rounded-xl shadow-2xl"
        />
      </div>
    </div>

    {/* Optional: Floating Elements */}
    {/* <div className="absolute -top-4 -left-4 w-16 h-16 sm:w-20 sm:h-20 bg-purple-500/30 rounded-full blur-xl animate-pulse"></div>
    <div className="absolute -bottom-4 -right-4 w-20 h-20 sm:w-24 sm:h-24 bg-blue-500/30 rounded-full blur-xl animate-pulse"></div> */}
  </div>
</div>


      </div>
    </section>
  );
};

export default Hero;
