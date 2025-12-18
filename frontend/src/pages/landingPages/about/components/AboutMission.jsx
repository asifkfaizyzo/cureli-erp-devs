import React, { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";

const AboutMission = () => {
  useEffect(() => {
    AOS.init({ duration: 900, once: true });
  }, []);

  const mission = [
    {
      title: "Empower Healthcare Providers",
      desc: "Equip clinics, hospitals, diagnostic centers, and pharmacies with advanced tools to manage their operations efficiently and provide top-notch patient care.",
    },
    {
      title: "Improve Patient Experiences",
      desc: "Enhance patient satisfaction by simplifying processes and ensuring timely, accurate medical services.",
    },
    {
      title: "Ensure Quality and Compliance",
      desc: "Maintain the highest standards of quality and compliance in all our offerings, ensuring the safety and security of patient data.",
    },
    {
      title: "Drive Efficiency",
      desc: "Streamline administrative and clinical processes to reduce costs and improve operational efficiency for healthcare providers.",
    },
    {
      title: "Foster Innovation",
      desc: "Continuously innovate and integrate new technologies to stay ahead in the healthcare industry.",
    },
  ];

  return (
    <section className="py-16 sm:py-20 md:py-24 bg-[#EDF2F9]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center mb-12 sm:mb-16 md:mb-20">
          <h2 
            className="font-manrope text-3xl sm:text-4xl md:text-5xl font-bold text-[#05015A] mb-3 sm:mb-4" 
            data-aos="fade-up"
          >
            Our Mission
          </h2>
          <p 
            className="font-manrope text-sm sm:text-base md:text-lg text-gray-500 max-w-3xl mx-auto px-4" 
            data-aos="fade-up" 
            data-aos-delay="100"
          >
            Our mission is to continuously innovate and enhance our platform to meet the evolving needs of the healthcare industry. We aim to:
          </p>
        </div>

        {/* Mission Items - Center Stepper Layout */}
        <div className="relative">
          
          {/* Center Vertical Line - Desktop */}
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-0.5 -translate-x-1/2">
            <div className="h-full border-l-2 border-dashed border-[#05015A]/30" />
          </div>

          {/* Center Vertical Line - Mobile */}
          <div className="md:hidden absolute left-6 sm:left-7 top-0 bottom-0 w-0.5">
            <div className="h-full border-l-2 border-dashed border-[#05015A]/30" />
          </div>

          <div className="space-y-8 sm:space-y-12 md:space-y-0">
            {mission.map((item, index) => {
              const isEven = index % 2 === 0;
              const isLast = index === mission.length - 1;

              return (
                <div key={index} className="relative">
                  
                  {/* Desktop Layout - Centered Stepper */}
                  <div className="hidden md:block pb-16">
                    <div className="flex items-center">
                      
                      {/* Left Content Area */}
                      <div className="flex-1 pr-8">
                        {isEven && (
                          <div 
                            className="ml-auto max-w-md"
                            data-aos="fade-right"
                            data-aos-delay={index * 100}
                          >
                            <div className="bg-white border-2 border-dashed border-[#05015A]/20 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-x-1">
                              <h3 className="font-manrope font-bold text-lg md:text-xl text-[#05015A] mb-2">
                                {item.title}
                              </h3>
                              <p className="font-manrope text-sm md:text-base text-gray-600 leading-relaxed">
                                {item.desc}
                              </p>
                            </div>
                            {/* Connector Line to Center */}
                            <div className="absolute top-1/2 right-1/2 w-8 h-0.5 -translate-y-1/2 mr-8">
                              <div className="w-full border-t-2 border-dashed border-[#05015A]/30" />
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Center Number Circle */}
                      <div 
                        className="flex-shrink-0 z-10"
                        data-aos="zoom-in"
                        data-aos-delay={index * 100 + 50}
                      >
                        <div className="relative">
                          <div className="h-16 w-16 rounded-full bg-[#05015A] text-white flex items-center justify-center font-bold text-2xl shadow-lg ring-4 ring-[#EDF2F9]">
                            {index + 1}
                          </div>
                        </div>
                      </div>

                      {/* Right Content Area */}
                      <div className="flex-1 pl-8">
                        {!isEven && (
                          <div 
                            className="mr-auto max-w-md"
                            data-aos="fade-left"
                            data-aos-delay={index * 100}
                          >
                            <div className="bg-white border-2 border-dashed border-[#05015A]/20 rounded-2xl p-6 shadow-sm hover:shadow-md transition-all duration-300 hover:translate-x-1">
                              <h3 className="font-manrope font-bold text-lg md:text-xl text-[#05015A] mb-2">
                                {item.title}
                              </h3>
                              <p className="font-manrope text-sm md:text-base text-gray-600 leading-relaxed">
                                {item.desc}
                              </p>
                            </div>
                            {/* Connector Line to Center */}
                            <div className="absolute top-1/2 left-1/2 w-8 h-0.5 -translate-y-1/2 ml-8">
                              <div className="w-full border-t-2 border-dashed border-[#05015A]/30" />
                            </div>
                          </div>
                        )}
                      </div>

                    </div>
                  </div>

                  {/* Mobile/Tablet Layout - Left Aligned Stepper */}
                  <div className="md:hidden">
                    <div className="flex items-start gap-4">
                      
                      {/* Number Circle */}
                      <div 
                        className="flex-shrink-0 z-10"
                        data-aos="fade-right"
                        data-aos-delay={index * 100}
                      >
                        <div className="h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-[#05015A] text-white flex items-center justify-center font-bold text-lg sm:text-xl shadow-lg ring-4 ring-[#EDF2F9]">
                          {index + 1}
                        </div>
                      </div>

                      {/* Content Box */}
                      <div 
                        className="flex-1 pb-8"
                        data-aos="fade-left"
                        data-aos-delay={index * 100 + 100}
                      >
                        <div className="bg-white border-2 border-dashed border-[#05015A]/20 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm">
                          <h3 className="font-manrope font-bold text-base sm:text-lg text-[#05015A] mb-2">
                            {item.title}
                          </h3>
                          <p className="font-manrope text-xs sm:text-sm text-gray-600 leading-relaxed">
                            {item.desc}
                          </p>
                        </div>
                      </div>

                    </div>
                  </div>

                </div>
              );
            })}
          </div>

          {/* End Marker - Desktop */}
          <div className="hidden md:flex justify-center mt-8">
            <div 
              className="h-4 w-4 rounded-full bg-[#05015A]/50"
              data-aos="zoom-in"
              data-aos-delay="600"
            />
          </div>

        </div>

      </div>
    </section>
  );
};

export default AboutMission;