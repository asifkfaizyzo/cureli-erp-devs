import { useEffect } from "react";
import AOS from "aos";
import "aos/dist/aos.css";
import { Mail, Phone, MapPin, Facebook, Twitter, Instagram, Linkedin } from "lucide-react";

const ContactFormCard = () => {
  useEffect(() => {
    AOS.init({ duration: 900, once: true });
  }, []);

  return (
    <section className="w-full px-4 sm:px-6 lg:px-8">
      <div
        className="
          max-w-6xl mx-auto 
          bg-white 
          rounded-2xl sm:rounded-3xl 
          shadow-xl sm:shadow-2xl 
          overflow-hidden 
          grid grid-cols-1 md:grid-cols-5
        "
        data-aos="fade-up"
      >
        {/* Left: Form Section - 60% width on desktop */}
        <div className="
          md:col-span-3 
          bg-white 
          p-5 xs:p-6 sm:p-8 md:p-10 lg:p-12 
          rounded-2xl sm:rounded-3xl 
          md:rounded-r-none
        ">
          <form className="space-y-5 xs:space-y-6 sm:space-y-7">
            
            {/* Name */}
            <div>
              <label className="
                block 
                font-manrope 
                text-xs xs:text-sm 
                font-semibold 
                text-gray-800 
                mb-1.5 sm:mb-2
              ">
                Your Name
              </label>
              <input
                type="text"
                placeholder="Enter your name"
                className="
                  w-full 
                  border-b-2 border-gray-300 
                  px-1 py-2 sm:py-2.5 
                  font-manrope 
                  text-xs xs:text-sm 
                  placeholder:text-gray-400 
                  focus:outline-none 
                  focus:border-[#000060] 
                  transition-colors 
                  bg-transparent
                "
              />
            </div>

            {/* Email & Phone */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 xs:gap-6 sm:gap-8">
              <div>
                <label className="
                  block 
                  font-manrope 
                  text-xs xs:text-sm 
                  font-semibold 
                  text-gray-800 
                  mb-1.5 sm:mb-2
                ">
                  Your Email
                </label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="
                    w-full 
                    border-b-2 border-gray-300 
                    px-1 py-2 sm:py-2.5 
                    font-manrope 
                    text-xs xs:text-sm 
                    placeholder:text-gray-400 
                    focus:outline-none 
                    focus:border-[#000060] 
                    transition-colors 
                    bg-transparent
                  "
                />
              </div>

              <div>
                <label className="
                  block 
                  font-manrope 
                  text-xs xs:text-sm 
                  font-semibold 
                  text-gray-800 
                  mb-1.5 sm:mb-2
                ">
                  Your Phone
                </label>
                <input
                  type="tel"
                  placeholder="Enter your number"
                  className="
                    w-full 
                    border-b-2 border-gray-300 
                    px-1 py-2 sm:py-2.5 
                    font-manrope 
                    text-xs xs:text-sm 
                    placeholder:text-gray-400 
                    focus:outline-none 
                    focus:border-[#000060] 
                    transition-colors 
                    bg-transparent
                  "
                />
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="
                block 
                font-manrope 
                text-xs xs:text-sm 
                font-semibold 
                text-gray-800 
                mb-1.5 sm:mb-2
              ">
                Your Message
              </label>
              <textarea
                rows="3"
                placeholder="Enter your message"
                className="
                  w-full 
                  border-b-2 border-gray-300 
                  px-1 py-2 sm:py-2.5 
                  font-manrope 
                  text-xs xs:text-sm 
                  placeholder:text-gray-400 
                  focus:outline-none 
                  focus:border-[#000060] 
                  transition-colors 
                  resize-none 
                  bg-transparent
                "
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="
                w-full sm:w-auto
                px-6 xs:px-8 
                py-2.5 xs:py-3 
                bg-[#000060] 
                text-white 
                rounded-lg 
                font-manrope 
                font-semibold 
                text-xs xs:text-sm 
                hover:bg-[#000050] 
                transition-all 
                duration-300 
                shadow-md 
                hover:shadow-lg
              "
            >
              SEND MESSAGE
            </button>
          </form>
        </div>

        {/* Right: Contact Information - 40% width on desktop */}
        <div
          className="
            md:col-span-2 
            relative 
            bg-gradient-to-br from-[#000060] via-[#1a1a8f] to-[#000060] 
            text-white 
            p-5 xs:p-6 sm:p-7 md:p-8 
            rounded-2xl sm:rounded-3xl 
            md:rounded-l-[2rem] lg:rounded-l-[3rem] 
            md:rounded-r-3xl 
            shadow-xl sm:shadow-2xl  
            m-4 xs:m-5 
            md:my-5 md:mr-5 md:ml-0
          "
          data-aos="fade-up"
          data-aos-delay="200"
        >
          <h3 className="
            font-manrope 
            text-lg xs:text-xl sm:text-2xl 
            font-bold 
            mb-2 xs:mb-2.5 sm:mb-3
          ">
            Contact Information
          </h3>

          <p className="
            font-manrope 
            text-xs sm:text-sm 
            text-white/70 
            mb-5 xs:mb-6 sm:mb-8 
            leading-relaxed
          ">
            Fill up the form and our team will get back you within 24 hours
          </p>

          <div className="space-y-4 xs:space-y-5 sm:space-y-6">
            
            {/* Location */}
            <div className="flex items-start gap-2.5 xs:gap-3">
              <div className="
                flex-shrink-0 
                w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10 
                bg-white 
                rounded-full 
                flex items-center justify-center
              ">
                <MapPin className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5 text-[#000060]" />
              </div>
              <div>
                <h4 className="
                  font-manrope 
                  font-semibold 
                  text-xs xs:text-sm sm:text-base 
                  mb-0.5
                ">
                  Our Location :
                </h4>
                <p className="
                  font-manrope 
                  text-xs sm:text-sm 
                  text-white/80 
                  leading-relaxed
                ">
                  Jl. Raya Puputan No 142, Denpasar
                </p>
              </div>
            </div>

            {/* Email */}
            <div className="flex items-start gap-2.5 xs:gap-3">
              <div className="
                flex-shrink-0 
                w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10 
                bg-white 
                rounded-full 
                flex items-center justify-center
              ">
                <Mail className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5 text-[#000060]" />
              </div>
              <div>
                <h4 className="
                  font-manrope 
                  font-semibold 
                  text-xs xs:text-sm sm:text-base 
                  mb-0.5
                ">
                  Email Us :
                </h4>
                <p className="
                  font-manrope 
                  text-xs sm:text-sm 
                  text-white/80
                ">
                  support@domain.com
                </p>
              </div>
            </div>

            {/* Phone */}
            <div className="flex items-start gap-2.5 xs:gap-3">
              <div className="
                flex-shrink-0 
                w-8 h-8 xs:w-9 xs:h-9 sm:w-10 sm:h-10 
                bg-white 
                rounded-full 
                flex items-center justify-center
              ">
                <Phone className="w-3.5 h-3.5 xs:w-4 xs:h-4 sm:w-5 sm:h-5 text-[#000060]" />
              </div>
              <div>
                <h4 className="
                  font-manrope 
                  font-semibold 
                  text-xs xs:text-sm sm:text-base 
                  mb-0.5
                ">
                  Phone Number :
                </h4>
                <p className="
                  font-manrope 
                  text-xs sm:text-sm 
                  text-white/80
                ">
                  (+021) 117 671
                </p>
              </div>
            </div>

          </div>

          {/* Social Media */}
          <div className="
            mt-6 xs:mt-8 sm:mt-10 
            pt-5 xs:pt-6 sm:pt-7 
            border-t border-white/20
          ">
            <p className="
              font-manrope 
              text-xs sm:text-sm 
              font-medium 
              mb-2.5 xs:mb-3 sm:mb-4
            ">
              Follow our social media:
            </p>
            <div className="flex gap-2 xs:gap-2.5 sm:gap-3">
              <a 
                href="#" 
                className="
                  w-8 h-8 xs:w-9 xs:h-9 
                  bg-white/20 
                  hover:bg-white/30 
                  rounded-full 
                  flex items-center justify-center 
                  transition-all duration-300
                "
                aria-label="Facebook"
              >
                <Facebook className="w-3.5 h-3.5 xs:w-4 xs:h-4" />
              </a>
              <a 
                href="#" 
                className="
                  w-8 h-8 xs:w-9 xs:h-9 
                  bg-white/20 
                  hover:bg-white/30 
                  rounded-full 
                  flex items-center justify-center 
                  transition-all duration-300
                "
                aria-label="Twitter"
              >
                <Twitter className="w-3.5 h-3.5 xs:w-4 xs:h-4" />
              </a>
              <a 
                href="#" 
                className="
                  w-8 h-8 xs:w-9 xs:h-9 
                  bg-white/20 
                  hover:bg-white/30 
                  rounded-full 
                  flex items-center justify-center 
                  transition-all duration-300
                "
                aria-label="Instagram"
              >
                <Instagram className="w-3.5 h-3.5 xs:w-4 xs:h-4" />
              </a>
              <a 
                href="#" 
                className="
                  w-8 h-8 xs:w-9 xs:h-9 
                  bg-white/20 
                  hover:bg-white/30 
                  rounded-full 
                  flex items-center justify-center 
                  transition-all duration-300
                "
                aria-label="LinkedIn"
              >
                <Linkedin className="w-3.5 h-3.5 xs:w-4 xs:h-4" />
              </a>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default ContactFormCard;
