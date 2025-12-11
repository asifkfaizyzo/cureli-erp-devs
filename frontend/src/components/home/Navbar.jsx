// src/components/Navbar.jsx

import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import logo from "../../assets/icons/cureli-logo.png";

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
      transition-all duration-300 ${scrolled ? "shadow-lg" : "shadow-md"}`}
    >
      {/* FULL-WIDTH NAV ROW */}
      <div className="w-full px-8 py-4 flex items-center justify-between">
        
        {/* LEFT — LOGO */}
        <div className="flex items-center">
          <Link to="/">
            <img src={logo} alt="Cureli ERP" className="h-10 w-auto" />
          </Link>
        </div>

        {/* CENTER — NAV LINKS (Desktop Only) */}
        <div className="hidden md:flex justify-center gap-10">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`text-white font-medium transition
                ${
                  location.pathname === item.path
                    ? "opacity-100"
                    : "opacity-70 hover:opacity-100"
                }`}
            >
              {item.label}
            </Link>
          ))}
        </div>

        {/* RIGHT — BUTTONS (Desktop) & HAMBURGER (Mobile) */}
        <div className="flex justify-end items-center gap-4">
          {/* Desktop Buttons */}
          <div className="hidden md:flex items-center gap-4">
            <Link
              to="/login"
              className="px-5 py-2 bg-white text-[#05015A] rounded-md font-semibold shadow hover:bg-gray-100"
            >
              Sign In
            </Link>

            <Link
              to="/book-demo"
              className="px-5 py-2 bg-white text-[#05015A] rounded-md font-semibold shadow hover:bg-gray-100"
            >
              Book a Demo
            </Link>
          </div>

          {/* Mobile Hamburger Button */}
          <button 
            onClick={() => setIsOpen(!isOpen)} 
            className="md:hidden text-white p-1"
          >
            {isOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

      </div>

      {/* MOBILE MENU DROPDOWN */}
      {isOpen && (
        <div className="md:hidden bg-[#000060]/95 backdrop-blur-xl px-8 pb-6 border-t border-white/20">
          <div className="flex flex-col gap-6 pt-4">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className="text-white text-lg opacity-80 hover:opacity-100"
                onClick={() => setIsOpen(false)}
              >
                {item.label}
              </Link>
            ))}

            <Link
              to="/signin"
              className="bg-white text-[#05015A] rounded-md text-center py-2 font-semibold"
              onClick={() => setIsOpen(false)}
            >
              Sign In
            </Link>

            <Link
              to="/book-demo"
              className="bg-white text-[#05015A] rounded-md text-center py-2 font-semibold"
              onClick={() => setIsOpen(false)}
            >
              Book a Demo
            </Link>
          </div>
        </div>
      )}

    </nav>
  );
};

export default Navbar;