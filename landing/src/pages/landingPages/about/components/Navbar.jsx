// src/components/Navbar.jsx

import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import logo from "../../../../assets/icons/cureli.svg";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => setIsOpen(false), [location.pathname]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  const navItems = [
    { path: "/", label: "Home" },
    { path: "/about", label: "About" },
    { path: "/pricing", label: "Pricing" },
    { path: "/contact", label: "Contact" },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50
        backdrop-blur-lg bg-white
        transition-all duration-300 
        ${scrolled ? "shadow-lg" : "shadow-md"}`}
    >
      {/* MAIN NAVBAR CONTAINER - Changed to flexbox for better phone layout */}
      <div 
        className="
          flex items-center justify-between
          w-full 
          px-4 sm:px-6 lg:px-8
          py-3 xs:py-3.5 sm:py-5 md:py-6
          min-h-[56px] xs:min-h-[64px] sm:min-h-0
        "
      >

        {/* LEFT — LOGO + NAME */}
        <Link 
          to="/" 
          className="flex items-center gap-2 flex-shrink-0"
        >
          <img 
            src={logo} 
            alt="Cureli ERP" 
            className="h-8 sm:h-10 md:h-12 w-auto" 
          />
          <span className="hidden sm:inline-block text-lg md:text-xl lg:text-2xl font-bold text-[#000060] font-manrope">
            Cureli
          </span>
        </Link>

        {/* CENTER — NAV LINKS (Desktop Only) */}
        <div className="hidden md:flex items-center justify-center gap-6 lg:gap-10 flex-1">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`font-manrope text-[#000060] font-medium transition-all duration-200
                ${
                  location.pathname === item.path
                    ? "opacity-100 font-semibold"
                    : "opacity-70 hover:opacity-100"
                }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* RIGHT — BUTTONS & MENU */}
        <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
          
          {/* Desktop Buttons */}
          <div className="hidden lg:flex items-center gap-3">
            <Link
              to="/login"
              className="px-5 py-2 bg-[#000060] text-white rounded-md font-manrope font-semibold shadow hover:bg-[#000040] transition-colors duration-200"
            >
              Sign In
            </Link>

            <Link
              to="/book-demo"
              className="px-5 py-2 bg-white border border-[#000060] text-[#000060] rounded-md font-manrope font-semibold shadow hover:bg-gray-100 transition-colors duration-200"
            >
              Book a Demo
            </Link>
          </div>

          {/* Tablet Compact Buttons */}
          <div className="hidden md:flex lg:hidden items-center gap-2">
            <Link
              to="/login"
              className="px-3 py-2 bg-[#000060] text-white rounded-md font-manrope font-semibold text-sm hover:bg-[#000040] transition-colors duration-200"
            >
              Sign In
            </Link>

            <Link
              to="/book-demo"
              className="px-3 py-2 bg-white border border-[#000060] text-[#000060] rounded-md font-manrope font-semibold text-sm hover:bg-gray-100 transition-colors duration-200"
            >
              Demo
            </Link>
          </div>

          {/* Mobile Menu Button - Better touch target for phones */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="
              md:hidden text-[#000060] 
              p-2 xs:p-2.5 
              hover:bg-[#000060]/10 
              rounded-md transition-colors duration-200
            "
            aria-label="Toggle menu"
            aria-expanded={isOpen}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

      </div>

      {/* MOBILE MENU - Improved phone padding */}
      {isOpen && (
        <div className="md:hidden bg-[#000060]/95 backdrop-blur-xl border-t border-white/20">
          <div className="px-4 xs:px-5 sm:px-6 py-4 xs:py-5">
            <div className="flex flex-col gap-3 xs:gap-4">
              
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`
                    font-manrope text-white 
                    py-2.5 xs:py-3 px-3 xs:px-4 
                    rounded-md transition-all duration-200
                    ${
                      location.pathname === item.path
                        ? "bg-white/20 font-semibold"
                        : "hover:bg-white/10"
                    }
                  `}
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </Link>
              ))}

              <div className="border-t border-white/20 pt-4 mt-2 flex flex-col gap-3">
                <Link
                  to="/login"
                  className="bg-white text-[#000060] rounded-md text-center py-2.5 xs:py-3 font-manrope font-semibold hover:bg-gray-100 transition-colors duration-200"
                  onClick={() => setIsOpen(false)}
                >
                  Sign In
                </Link>

                <Link
                  to="/book-demo"
                  className="bg-white text-[#000060] rounded-md text-center py-2.5 xs:py-3 font-manrope font-semibold hover:bg-gray-100 transition-colors duration-200"
                  onClick={() => setIsOpen(false)}
                >
                  Book a Demo
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

    </nav>
  );
};

export default Navbar;