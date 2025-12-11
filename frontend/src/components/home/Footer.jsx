// src/components/Footer.jsx
import { useEffect } from "react";
import AOS from "aos";
import { Facebook, Twitter, Instagram, Linkedin } from "lucide-react";

const Footer = () => {
  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
  }, []);

  return (
    <footer className="text-white bg-[#000060]">
    {/* <footer className="text-white"
    style={{ 
        background: "linear-gradient(135deg, #3B1C8C 0%, #1A0B4E 100%)"
      }}> */}
      
      {/* Main Footer Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">

          {/* Contact Us Section */}
          <div data-aos="fade-up">
            <h3 className="font-manrope text-xs uppercase tracking-wider text-white/60 mb-4">
              CONTACT US
            </h3>
            <h2 className="font-manrope text-2xl sm:text-3xl font-bold mb-4 leading-tight">
              Let's Discuss with<br />Your Vision. With Us
            </h2>
            <button className="px-6 py-2.5 bg-white text-[#1E0B5C] font-manrope font-semibold text-sm rounded-lg hover:bg-gray-100 transition-colors duration-200">
              Connect with us
            </button>
          </div>

          {/* Quick Links */}
          <div data-aos="fade-up" data-aos-delay="100">
            <h4 className="font-manrope text-xs uppercase tracking-wider text-white/60 mb-4">
              QUICK LINKS
            </h4>
            <ul className="space-y-2.5">
              {["Home", "About", "Pricing", "Contact"].map((item) => (
                <li key={item}>
                  <a
                    href={`#${item.toLowerCase()}`}
                    className="font-manrope text-sm text-white/80 hover:text-white transition-colors duration-200"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Informations */}
          <div data-aos="fade-up" data-aos-delay="200">
            <h4 className="font-manrope text-xs uppercase tracking-wider text-white/60 mb-4">
              INFORMATIONS
            </h4>
            <ul className="space-y-2.5">
              {["Terms & Services", "Privacy Policy"].map((item) => (
                <li key={item}>
                  <a
                    href="#"
                    className="font-manrope text-sm text-white/80 hover:text-white transition-colors duration-200"
                  >
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div data-aos="fade-up" data-aos-delay="300">
            <h3 className="font-manrope text-lg font-bold mb-2">
              Subscribe Our Newsletter
            </h3>
            <p className="font-manrope text-xs text-white/70 mb-4">
              Subscribe our newsletter to get more updates
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Your Email Address"
                className="flex-1 px-4 py-2.5 rounded-lg text-sm bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:border-white/40 transition-colors"
              />
              <button className="px-5 py-2.5 bg-white text-[#1E0B5C] font-manrope font-semibold text-sm rounded-lg hover:bg-gray-100 transition-colors duration-200">
                Share
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* Bottom Border */}
      <div className="border-t border-white/10"></div>

      {/* Bottom Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          
          {/* Copyright */}
          <p className="font-manrope text-xs text-white/60">
            ©CURELI2025. ALL RIGHTS RESERVED.
          </p>

          {/* Social Icons */}
          <div className="flex gap-4">
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/70 hover:text-white transition-colors duration-200"
              aria-label="Facebook"
            >
              <Facebook size={20} />
            </a>
            <a
              href="https://twitter.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/70 hover:text-white transition-colors duration-200"
              aria-label="Twitter"
            >
              <Twitter size={20} />
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/70 hover:text-white transition-colors duration-200"
              aria-label="Instagram"
            >
              <Instagram size={20} />
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-white/70 hover:text-white transition-colors duration-200"
              aria-label="LinkedIn"
            >
              <Linkedin size={20} />
            </a>
          </div>

        </div>
      </div>

    </footer>
  );
};

export default Footer;
