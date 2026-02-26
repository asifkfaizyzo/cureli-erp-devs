// src/components/Navbar.jsx

import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import logo from "../../../../assets/icons/cureli-white.svg";

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

  const navItems = [
    { path: "/", label: "Home" },
    { path: "/about", label: "About" },
    { path: "/pricing", label: "Pricing" },
    { path: "/contact", label: "Contact" },
  ];

  return (
    <nav
      className={`fixed top-0 left-0 w-full z-50
      backdrop-blur-lg bg-[#000060]
      transition-all duration-300 
      ${scrolled ? "shadow-lg" : "shadow-md"}`}
    >
      <div className="relative w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-5 md:py-6">

        {/* LEFT — LOGO + NAME (Far Left) - Responsive */}
        <div className="absolute left-4 sm:left-6 lg:left-8 top-1/2 transform -translate-y-1/2">
          <Link to="/" className="flex items-center gap-2">
            {/* Logo - Responsive sizing */}
            <img 
              src={logo} 
              alt="Cureli ERP" 
              className="h-8 sm:h-10 md:h-12 w-auto" 
            />
            {/* Text - Hidden on small screens, visible from sm up */}
            <span className="hidden sm:inline-block text-lg md:text-xl lg:text-2xl font-bold text-white font-manrope">
              Cureli
            </span>
          </Link>
        </div>

        {/* CENTER — NAV LINKS (Desktop Only) */}
        <div className="hidden md:flex items-center justify-center gap-6 lg:gap-10 w-full">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`font-manrope text-white font-medium transition-all duration-200
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

        {/* RIGHT — BUTTONS (Far Right) */}
        <div className="absolute right-4 sm:right-6 lg:right-8 top-1/2 transform -translate-y-1/2 flex items-center gap-3 sm:gap-4">
          
          {/* Desktop Buttons */}
          <div className="hidden lg:flex items-center gap-3">
            <Link
              to="/login"
              className="px-5 py-2 bg-white text-[#000060] rounded-md font-manrope font-semibold shadow hover:bg-gray-100 transition-colors duration-200"
            >
              Sign In
            </Link>

            <Link
              to="/book-demo"
              className="px-5 py-2 bg-white border border-white text-[#000060] rounded-md font-manrope font-semibold shadow hover:bg-gray-100 transition-colors duration-200"
            >
              Book a Demo
            </Link>
          </div>

          {/* Tablet Compact Buttons */}
          <div className="hidden md:flex lg:hidden items-center gap-2">
            <Link
              to="/login"
              className="px-3 py-2 bg-white text-[#000060] rounded-md font-manrope font-semibold text-sm hover:bg-gray-100 transition-colors duration-200"
            >
              Sign In
            </Link>

            <Link
              to="/book-demo"
              className="px-3 py-2 bg-white border border-white text-[#000060] rounded-md font-manrope font-semibold text-sm hover:bg-gray-100 transition-colors duration-200"
            >
              Demo
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden text-white p-1 hover:bg-white/10 rounded-md transition-colors duration-200"
            aria-label="Toggle menu"
            aria-expanded={isOpen}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

      </div>

      {/* MOBILE MENU */}
      {isOpen && (
        <div className="md:hidden bg-[#000060]/95 backdrop-blur-xl border-t border-white/20">
          <div className="px-4 sm:px-6 py-4">
            <div className="flex flex-col gap-4">
              
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`font-manrope text-white py-2 px-3 rounded-md transition-all duration-200
                    ${
                      location.pathname === item.path
                        ? "bg-white/20 font-semibold"
                        : "hover:bg-white/10"
                    }`}
                  onClick={() => setIsOpen(false)}
                >
                  {item.label}
                </Link>
              ))}

              <div className="border-t border-white/20 pt-4 mt-2 flex flex-col gap-3">
                <Link
                  to="/login"
                  className="bg-white text-[#000060] rounded-md text-center py-2 font-manrope font-semibold hover:bg-gray-100 transition-colors duration-200"
                  onClick={() => setIsOpen(false)}
                >
                  Sign In
                </Link>

                <Link
                  to="/book-demo"
                  className="bg-white text-[#000060] rounded-md text-center py-2 font-manrope font-semibold hover:bg-gray-100 transition-colors duration-200"
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
