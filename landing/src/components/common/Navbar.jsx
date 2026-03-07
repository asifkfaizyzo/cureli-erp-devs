// src/pages/landingPages/home/components/Navbar.jsx

import { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import logo from "../../assets/icons/cureli-white.svg";

const SIGN_IN_URL = import.meta.env.VITE_SIGN_IN_URL;

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();

  useEffect(() => setIsOpen(false), [location.pathname]);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [isOpen]);

  const toggleMenu = useCallback(() => setIsOpen((prev) => !prev), []);

  const navItems = [
    { path: "/", label: "Home" },
    { path: "/services", label: "Services" },
    { path: "/about", label: "About" },
    { path: "/contact", label: "Contact" },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      <nav 
        className={`fixed top-0 left-0 w-full z-50 transition-all duration-500 ${
          scrolled ? "px-4 sm:px-6 lg:px-8" : "px-0"
        }`}
      >
        <div
          className={`transition-all duration-500 ease-out ${
            scrolled ? "py-3" : "py-0"
          }`}
        >
          <div
            className={`relative mx-auto transition-all duration-500 ease-out ${
              scrolled
                ? "max-w-[90%] sm:max-w-[85%] md:max-w-[80%] lg:max-w-[70%]"
                : "max-w-full w-full"
            }`}
          >
            <div
              className={`absolute inset-0 transition-all duration-500
                          bg-[#0a0a20]/80 backdrop-blur-xl
                          ${scrolled 
                            ? "rounded-2xl shadow-2xl shadow-black/20" 
                            : "rounded-none shadow-none"
                          }`}
            />

            <div
              className={`relative z-10 flex items-center justify-between transition-all duration-500 ${
                scrolled
                  ? "px-4 sm:px-6 lg:px-8 py-3 sm:py-3.5"
                  : "px-4 sm:px-6 lg:px-8 py-4 sm:py-5"
              }`}
            >
              {/* LEFT — LOGO */}
              <Link
                to="/"
                className="flex items-center gap-2 sm:gap-3 flex-shrink-0 group"
              >
                <img
                  src={logo}
                  alt="Cureli ERP"
                  className={`w-auto transition-all duration-500 ${
                    scrolled ? "h-7 sm:h-9" : "h-8 sm:h-10 md:h-11"
                  }`}
                />
                <div className="flex items-center gap-1 sm:gap-2">
                  <span
                    className={`font-bold text-white font-manrope transition-all duration-500 ${
                      scrolled ? "text-base sm:text-lg" : "text-lg sm:text-xl md:text-2xl"
                    }`}
                  >
                    Cureli
                  </span>
                </div>
              </Link>

              {/* CENTER — NAV LINKS */}
              <div className="hidden md:flex items-center justify-center gap-1 lg:gap-2">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`relative px-4 lg:px-5 py-2 lg:py-2.5 rounded-full font-manrope text-sm lg:text-base font-medium transition-all duration-300 ${
                      isActive(item.path)
                        ? "text-white"
                        : "text-white/70 hover:text-white"
                    }`}
                  >
                    {isActive(item.path) && (
                      <span className="absolute inset-0 rounded-full bg-white/15" />
                    )}
                    <span className="relative z-10">{item.label}</span>
                  </Link>
                ))}
              </div>

              {/* RIGHT — BUTTONS & MENU */}
              <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
                {/* Desktop */}
                <div className="hidden lg:flex items-center gap-2 sm:gap-3">
                  <a
                    href={SIGN_IN_URL}
                    className="px-4 lg:px-5 py-2 lg:py-2.5 rounded-full font-manrope font-semibold text-sm
                               text-white hover:bg-white/10 transition-all duration-300"
                  >
                    Sign In
                  </a>
                  <Link
                    to="/contact"
                    className="px-4 lg:px-5 py-2 lg:py-2.5 rounded-full font-manrope font-semibold text-sm
                               bg-white text-[#0a0a20] hover:bg-white/90 transition-all duration-300"
                  >
                    Book a Demo
                  </Link>
                </div>

                {/* Tablet */}
                <div className="hidden md:flex lg:hidden items-center gap-2">
                  <a
                    href={SIGN_IN_URL}
                    className="px-3 py-2 text-white rounded-full font-manrope font-semibold text-sm
                               hover:bg-white/10 transition-all duration-300"
                  >
                    Sign In
                  </a>
                  <Link
                    to="/contact"
                    className="px-3 py-2 bg-white text-[#0a0a20] rounded-full font-manrope font-semibold text-sm
                               hover:bg-white/90 transition-all duration-300"
                  >
                    Demo
                  </Link>
                </div>

                {/* Mobile Menu Button */}
                <button
                  onClick={toggleMenu}
                  className="md:hidden relative p-2.5 rounded-full bg-white/10 hover:bg-white/15
                             transition-all duration-300"
                  aria-label="Toggle menu"
                  aria-expanded={isOpen}
                >
                  <span className="relative text-white block w-5 h-5">
                    <Menu
                      size={20}
                      className={`absolute inset-0 transition-all duration-300 ${
                        isOpen ? "opacity-0 rotate-90 scale-50" : "opacity-100 rotate-0 scale-100"
                      }`}
                    />
                    <X
                      size={20}
                      className={`absolute inset-0 transition-all duration-300 ${
                        isOpen ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-50"
                      }`}
                    />
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* MOBILE MENU - unchanged */}
      <div
        className={`fixed inset-0 z-40 md:hidden transition-all duration-500 ${
          isOpen ? "opacity-100 visible" : "opacity-0 invisible"
        }`}
      >
        <div
          className={`absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-500 ${
            isOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setIsOpen(false)}
        />

        <div
          className={`absolute top-0 right-0 h-full w-full sm:w-[70%] max-w-sm transition-transform duration-500 ease-out ${
            isOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="absolute inset-0 bg-[#0a0a20]/95 backdrop-blur-xl" />

          <div className="absolute top-20 -left-20 w-40 h-40 bg-purple-600/20 rounded-full blur-3xl" />
          <div className="absolute bottom-40 -right-10 w-32 h-32 bg-indigo-600/20 rounded-full blur-3xl" />

          <div className="relative z-10 flex flex-col h-full pt-24 px-6 sm:px-8">
            <div className="flex flex-col gap-2">
              {navItems.map((item, index) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`group flex items-center gap-4 py-4 px-4 rounded-xl transition-all duration-300 ${
                    isActive(item.path) ? "bg-white/10" : "hover:bg-white/5"
                  }`}
                  onClick={() => setIsOpen(false)}
                  style={{
                    animation: isOpen
                      ? `slideInRight 0.4s ease-out ${index * 0.08}s both`
                      : "none",
                  }}
                >
                  <span
                    className={`w-2 h-2 rounded-full transition-all duration-300 ${
                      isActive(item.path) ? "bg-white" : "bg-white/30 group-hover:bg-white/60"
                    }`}
                  />
                  <span
                    className={`font-manrope text-lg sm:text-xl font-medium transition-colors duration-300 ${
                      isActive(item.path) ? "text-white" : "text-white/70 group-hover:text-white"
                    }`}
                  >
                    {item.label}
                  </span>
                  <svg
                    className={`w-5 h-5 ml-auto transition-all duration-300 ${
                      isActive(item.path)
                        ? "text-white/70"
                        : "text-white/30 -translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-100"
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </Link>
              ))}
            </div>

            <div className="my-8 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            <div
              className="flex flex-col gap-3"
              style={{
                animation: isOpen
                  ? `slideInRight 0.4s ease-out ${navItems.length * 0.08 + 0.1}s both`
                  : "none",
              }}
            >
              <a
                href={SIGN_IN_URL}
                className="py-4 rounded-xl font-manrope font-semibold text-center text-white
                           hover:bg-white/10 transition-all duration-300"
                onClick={() => setIsOpen(false)}
              >
                Sign In
              </a>
              <Link
                to="/contact"
                className="py-4 rounded-xl font-manrope font-semibold text-center
                           bg-white text-[#0a0a20] hover:bg-white/90 transition-all duration-300"
                onClick={() => setIsOpen(false)}
              >
                Book a Demo
              </Link>
            </div>

            <div className="mt-auto pb-8">
              <p className="text-white/40 text-sm text-center font-manrope">
                © 2024 Cureli. All rights reserved.
              </p>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </>
  );
};

export default Navbar;