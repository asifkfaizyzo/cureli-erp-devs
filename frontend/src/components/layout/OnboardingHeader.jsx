// src/components/layout/OnboardingHeader.jsx

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Loader2 } from "lucide-react";
import logo from "../../assets/icons/cureli.svg";

const OnboardingHeader = ({ userName }) => {
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogoClick = () => {
    // Refresh the current page
    window.location.reload();
  };

  const handleLogout = async () => {
    setLoggingOut(true);
    
    // Clear all stored data
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("shop_id");
    localStorage.removeItem("user_id");
    localStorage.removeItem("onboarding_step");
    
    // Small delay for UX
    await new Promise((resolve) => setTimeout(resolve, 300));
    
    // Redirect to home/login
    navigate("/", { replace: true });
  };

  // Get display name - either from prop or localStorage or default
  const displayName = userName || localStorage.getItem("user_name") || "User";
  
  // Get first letter for avatar
  const avatarLetter = displayName.charAt(0).toUpperCase();

  return (
    <header className="flex-shrink-0 w-full bg-white border-b border-gray-200 px-4 sm:px-6 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Left - Logo */}
        <div 
          className="flex items-center gap-2 cursor-pointer group"
          onClick={handleLogoClick}
          title="Refresh page"
        >
          <img
            src={logo}
            alt="Cureli"
            className="w-8 h-7 sm:w-10 sm:h-9 object-contain group-hover:scale-105 transition-transform"
          />
          <span className="font-bold text-[#000060] text-xl sm:text-2xl group-hover:text-[#000060]/80 transition-colors">
            Cureli
          </span>
        </div>

        {/* Right - User info + Logout */}
        <div className="flex items-center gap-3 sm:gap-4">
          {/* User Avatar & Name */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-[#000060] flex items-center justify-center text-white font-semibold text-sm sm:text-base">
              {avatarLetter}
            </div>
            <span className="hidden sm:block text-sm font-medium text-gray-700 max-w-[120px] truncate">
              {displayName}
            </span>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            title="Logout"
          >
            {loggingOut ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <LogOut size={16} />
            )}
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default OnboardingHeader;