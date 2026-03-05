// src/pages/landingPages/services/components/AppInsight.jsx

import phones from "../../../../assets/images/appinsight.svg";
import appleLogo from "../../../../assets/icons/APPLE.svg";
import googlePlayLogo from "../../../../assets/icons/PLAYSTORE.PNG";

const AppInsight = () => {
  return (
    <section className="py-12 xs:py-16 sm:py-20 md:py-24 lg:py-28 bg-transparent">

      <div className="max-w-7xl mx-auto px-4 xs:px-5 sm:px-6 md:px-8 lg:px-10">

        {/* Title */}
        <div className="text-center mb-10 xs:mb-12 sm:mb-14 md:mb-16">

          <h2 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl font-semibold text-white mb-2 xs:mb-3 sm:mb-4 px-2">
            An Insight Of Our Cureli
          </h2>

          <p className="text-sm xs:text-base sm:text-lg text-white/70 max-w-xs xs:max-w-sm sm:max-w-xl md:max-w-2xl mx-auto px-4 xs:px-0 leading-relaxed">
            Experience seamless medicine shopping with Cureli Pulse, a multi-pharmacy
            delivery app built using advanced, reliable technologies.
          </p>

        </div>


        {/* Main Card */}
        <div className="bg-white rounded-2xl xs:rounded-3xl sm:rounded-[32px] md:rounded-[40px] p-5 xs:p-6 sm:p-8 md:p-12 lg:p-16 flex flex-col lg:flex-row items-center justify-between gap-6 xs:gap-8 sm:gap-10 md:gap-12 lg:gap-16">

          {/* LEFT PHONES */}
          <div className="flex justify-center w-full lg:w-1/2 order-2 lg:order-1">

            <img
              src={phones}
              alt="Cureli App"
              className="w-full max-w-[200px] xs:max-w-[240px] sm:max-w-[280px] md:max-w-[300px] lg:max-w-[320px] h-auto object-contain"
            />

          </div>


          {/* RIGHT CONTENT */}
          <div className="w-full lg:w-1/2 text-center lg:text-left order-1 lg:order-2">

            <h3 className="text-xl xs:text-2xl sm:text-3xl md:text-3xl font-semibold text-gray-900 mb-2 xs:mb-3 sm:mb-4">
              Download the App now!
            </h3>

            <p className="text-sm xs:text-base sm:text-base text-gray-600 mb-5 xs:mb-6 sm:mb-8 max-w-md mx-auto lg:mx-0 leading-relaxed">
              Experience seamless and secure online medicine ordering with Cureli.
            </p>


            {/* Store Buttons - Stacked on phone, Row on tablet/desktop */}
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center lg:justify-start">

              {/* Apple Store */}
              <a 
                href="https://apps.apple.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center sm:justify-start gap-3 bg-black text-white px-5 py-3 rounded-lg hover:scale-105 hover:bg-gray-900 transition-all duration-300"
              >

                <img 
                  src={appleLogo} 
                  alt="Apple Logo" 
                  className="w-6 h-6"
                />

                <div className="text-left leading-tight">
                  <p className="text-xs text-white/70">Download on the</p>
                  <p className="text-sm font-semibold">App Store</p>
                </div>

              </a>


              {/* Google Play */}
              <a 
                href="https://play.google.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center sm:justify-start gap-3 bg-black text-white px-5 py-3 rounded-lg hover:scale-105 hover:bg-gray-900 transition-all duration-300"
              >

                <img 
                  src={googlePlayLogo} 
                  alt="Google Play Logo" 
                  className="w-6 h-6"
                />

                <div className="text-left leading-tight">
                  <p className="text-xs text-white/70">GET IT ON</p>
                  <p className="text-sm font-semibold">Google Play</p>
                </div>

              </a>

            </div>

          </div>

        </div>

      </div>

    </section>
  );
};

export default AppInsight;