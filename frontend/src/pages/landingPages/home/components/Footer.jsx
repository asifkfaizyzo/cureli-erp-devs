import { useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import AOS from "aos";
import { Facebook, Twitter, Instagram, Linkedin } from "lucide-react";

const Footer = () => {
  const navigate = useNavigate();

  useEffect(() => {
    AOS.init({ duration: 1000, once: true });
  }, []);

  // Information links data
  const informationLinks = [
    { name: "Privacy Policy", path: "/privacy" },
    { name: "Terms & Conditions", path: "/terms" },
  ];

  // Quick links data
  const quickLinks = [
    { name: "Home", path: "/" },
    { name: "About", path: "/about" },
    { name: "Pricing", path: "/pricing" },
    { name: "Contact", path: "/contact" },
  ];

  // Handle link click manually if needed
  const handleLinkClick = (path) => {
    navigate(path);
  };

  return (
    <footer className="text-white bg-[#000060] relative z-10">
      
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
            <Link 
              to="/contact"
              className="inline-block px-6 py-2.5 bg-white text-[#1E0B5C] font-manrope font-semibold text-sm rounded-lg hover:bg-gray-100 transition-colors duration-200"
            >
              Connect with us
            </Link>
          </div>

          {/* Quick Links */}
          <div data-aos="fade-up" data-aos-delay="100">
            <h4 className="font-manrope text-xs uppercase tracking-wider text-white/60 mb-4">
              QUICK LINKS
            </h4>
            <ul className="space-y-2.5">
              {quickLinks.map((item) => (
                <li key={item.name}>
                  <Link
                    to={item.path}
                    className="font-manrope text-sm text-white/80 hover:text-white transition-colors duration-200 inline-block"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Informations - FULLY FIXED */}
          <div data-aos="fade-up" data-aos-delay="200" className="relative z-20">
            <h4 className="font-manrope text-xs uppercase tracking-wider text-white/60 mb-4">
              INFORMATIONS
            </h4>
            <ul className="space-y-2.5">
              {informationLinks.map((item, index) => (
                <li key={`info-${index}-${item.name}`} className="relative">
                  <Link
                    to={item.path}
                    onClick={(e) => {
                      e.stopPropagation();
                      // Optional: use navigate if Link doesn't work
                      // e.preventDefault();
                      // handleLinkClick(item.path);
                    }}
                    className="font-manrope text-sm text-white/80 hover:text-white transition-colors duration-200 inline-block py-1 cursor-pointer"
                  >
                    {item.name}
                  </Link>
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
            <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="Your Email Address"
                className="flex-1 px-4 py-2.5 rounded-lg text-sm bg-white/10 border border-white/20 text-white placeholder:text-white/50 focus:outline-none focus:border-white/40 transition-colors"
              />
              <button 
                type="submit"
                className="px-5 py-2.5 bg-white text-[#1E0B5C] font-manrope font-semibold text-sm rounded-lg hover:bg-gray-100 transition-colors duration-200"
              >
                Share
              </button>
            </form>
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
            {[
              { icon: Facebook, href: "https://facebook.com", label: "Facebook" },
              { icon: Twitter, href: "https://twitter.com", label: "Twitter" },
              { icon: Instagram, href: "https://instagram.com", label: "Instagram" },
              { icon: Linkedin, href: "https://linkedin.com", label: "LinkedIn" },
            ].map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white/70 hover:text-white transition-colors duration-200"
                aria-label={social.label}
              >
                <social.icon size={20} />
              </a>
            ))}
          </div>

        </div>
      </div>

    </footer>
  );
};

export default Footer;