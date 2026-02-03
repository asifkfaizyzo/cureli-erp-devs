// ============================================
// cureli-admin/src/components/layout/AdminHeader.jsx
// ============================================

import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronDown,
  Settings,
  LogOut,
  Clock,
  Calendar,
  Loader2,
  RefreshCw,
} from "lucide-react";
import logo from "../../assets/icons/cureli.svg";
import { useAuth } from "../../context/AuthContext";

// ✅ Import NotificationDropdown
import { NotificationDropdown } from "../common/notifications";

const AdminHeader = () => {
  const navigate = useNavigate();
  const { admin, pendingCounts, loading, logout, refreshProfile } = useAuth();

  // Time & Date
  const [dateTime, setDateTime] = useState({
    time: "",
    date: "",
    day: "",
  });

  // Dropdowns
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Refs for click outside
  const profileRef = useRef(null);

  // Update clock every second
  useEffect(() => {
    const updateDateTime = () => {
      const now = new Date();
      setDateTime({
        time: now.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: true,
        }),
        date: now.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
        }),
        day: now.toLocaleDateString("en-IN", { weekday: "long" }),
      });
    };

    updateDateTime();
    const interval = setInterval(updateDateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle refresh
  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshProfile();
    setTimeout(() => setRefreshing(false), 500);
  };

  // Get initials for avatar
  const getInitials = (name) => {
    if (!name) return "AD";
    const parts = name.split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Get role badge color
  const getRoleBadgeColor = (role) => {
    switch (role) {
      case "SUPER_ADMIN":
        return "bg-purple-100 text-purple-700";
      case "ANALYST":
        return "bg-blue-100 text-blue-700";
      case "ACCOUNTING":
        return "bg-amber-100 text-amber-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // Format role for display
  const formatRole = (role) => {
    const roleMap = {
      SUPER_ADMIN: "Super Admin",
      ANALYST: "Analyst",
      ACCOUNTING: "Accounting",
    };
    return roleMap[role] || role;
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-white border-b border-gray-200 shadow-sm">
      <div className="h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        
        {/* LEFT SECTION - Logo & Brand */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <img
              src={logo}
              alt="Cureli"
              className="h-9 w-auto"
            />
            <div className="hidden sm:flex flex-col">
              <span className="text-xl font-bold text-[#000060] leading-tight">
                Cureli
              </span>
              <span className="text-[10px] text-gray-400 font-medium -mt-0.5">
                Admin Panel
              </span>
            </div>
          </div>

          {/* Divider */}
          <div className="hidden md:block w-px h-8 bg-gray-200 ml-2" />

          {/* Date & Time */}
          <div className="hidden md:flex items-center gap-3 ml-2">
            <div className="flex items-center gap-1.5 text-gray-500">
              <Calendar size={14} />
              <span className="text-sm font-medium">{dateTime.date}</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-500">
              <Clock size={14} />
              <span className="text-sm font-medium tabular-nums">{dateTime.time}</span>
            </div>
          </div>
        </div>

        {/* RIGHT SECTION */}
        <div className="flex items-center gap-2 sm:gap-4">
          
          {/* Refresh Button */}
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-all disabled:opacity-50"
            title="Refresh data"
          >
            <RefreshCw
              size={18}
              className={refreshing ? "animate-spin" : ""}
            />
          </button>

          {/* ✅ NEW: Notifications Dropdown */}
          <NotificationDropdown />

          {/* Divider */}
          <div className="w-px h-8 bg-gray-200" />

          {/* Profile Section */}
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center gap-2 sm:gap-3 px-2 py-1.5 rounded-lg hover:bg-gray-100 transition-all"
            >
              {/* Avatar */}
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#000060] to-[#0a0280] flex items-center justify-center text-white font-semibold text-sm">
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  getInitials(admin?.name)
                )}
              </div>

              {/* Name & Role */}
              <div className="hidden sm:flex flex-col items-start">
                {loading ? (
                  <>
                    <div className="h-4 w-24 bg-gray-200 rounded animate-pulse" />
                    <div className="h-3 w-16 bg-gray-100 rounded animate-pulse mt-1" />
                  </>
                ) : (
                  <>
                    <span className="text-sm font-semibold text-gray-800 leading-tight">
                      {admin?.name || "Admin"}
                    </span>
                    <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${getRoleBadgeColor(admin?.role)}`}>
                      {formatRole(admin?.role) || "Admin"}
                    </span>
                  </>
                )}
              </div>

              <ChevronDown
                size={16}
                className={`text-gray-400 transition-transform ${
                  showProfileMenu ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Profile Dropdown */}
            {showProfileMenu && (
              <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden z-50">
                {/* Profile Info */}
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                  <p className="font-semibold text-gray-800">{admin?.name}</p>
                  <p className="text-xs text-gray-500">@{admin?.username}</p>
                </div>

                {/* Menu Items */}
                <div className="py-1">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      navigate("/settings");
                    }}
                    className="w-full px-4 py-2.5 flex items-center gap-3 text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    <Settings size={16} className="text-gray-400" />
                    <span className="text-sm">Settings</span>
                  </button>
                </div>

                {/* Logout */}
                <div className="border-t border-gray-100 py-1">
                  <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      logout();
                    }}
                    className="w-full px-4 py-2.5 flex items-center gap-3 text-red-600 hover:bg-red-50 transition-colors"
                  >
                    <LogOut size={16} />
                    <span className="text-sm font-medium">Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};

export default AdminHeader;