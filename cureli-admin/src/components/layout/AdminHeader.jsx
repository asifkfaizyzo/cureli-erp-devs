import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  ChevronDown,
  Settings,
  LogOut,
  Clock,
  Calendar,
  FileText,
  Store,
  CreditCard,
  AlertCircle,
  RefreshCw,
  Loader2,
} from "lucide-react";
import logo from "../../assets/icons/cureli.svg";
import { useAuth } from "../../context/AuthContext";

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
  const [showNotifications, setShowNotifications] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Refs for click outside
  const profileRef = useRef(null);
  const notificationRef = useRef(null);

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
      if (notificationRef.current && !notificationRef.current.contains(e.target)) {
        setShowNotifications(false);
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
      case "Super Admin":
        return "bg-purple-100 text-purple-700";
      case "Analyst":
        return "bg-blue-100 text-blue-700";
      case "Accounting":
        return "bg-amber-100 text-amber-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // Build notification items
  const notificationItems = [
    {
      id: "pending-docs",
      icon: FileText,
      label: "Documents pending review",
      count: pendingCounts?.documents?.pending || 0,
      color: "text-blue-500",
      bgColor: "bg-blue-50",
      link: "/documents",
    },
    {
      id: "pending-shops",
      icon: Store,
      label: "Shops awaiting verification",
      count: pendingCounts?.shops?.pendingVerification || 0,
      color: "text-emerald-500",
      bgColor: "bg-emerald-50",
      link: "/shops",
    },
    {
      id: "expiring-subs",
      icon: CreditCard,
      label: "Subscriptions expiring soon",
      count: pendingCounts?.subscriptions?.expiringSoon || 0,
      color: "text-orange-500",
      bgColor: "bg-orange-50",
      link: "/subscriptions",
    },
    {
      id: "rejected-docs",
      icon: AlertCircle,
      label: "Rejected documents",
      count: pendingCounts?.documents?.rejected || 0,
      color: "text-red-500",
      bgColor: "bg-red-50",
      link: "/documents?status=rejected",
    },
  ].filter((item) => item.count > 0);

  const totalNotifications = pendingCounts?.total || 0;

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

          {/* Notifications */}
          <div className="relative" ref={notificationRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-all"
            >
              <Bell size={20} />
              {totalNotifications > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1">
                  {totalNotifications > 99 ? "99+" : totalNotifications}
                </span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden z-50">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-800">Notifications</h3>
                    <span className="text-xs text-gray-500">
                      {totalNotifications} pending
                    </span>
                  </div>
                </div>

                <div className="max-h-80 overflow-y-auto">
                  {notificationItems.length > 0 ? (
                    notificationItems.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          setShowNotifications(false);
                          navigate(item.link);
                        }}
                        className="w-full px-4 py-3 flex items-center gap-3 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0"
                      >
                        <div className={`p-2 rounded-lg ${item.bgColor}`}>
                          <item.icon size={16} className={item.color} />
                        </div>
                        <div className="flex-1 text-left">
                          <p className="text-sm text-gray-800">{item.label}</p>
                        </div>
                        <span className={`text-sm font-bold ${item.color}`}>
                          {item.count}
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="px-4 py-8 text-center">
                      <Bell size={32} className="mx-auto text-gray-300 mb-2" />
                      <p className="text-gray-500 text-sm">All caught up!</p>
                      <p className="text-gray-400 text-xs">No pending items</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

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
                      {admin?.role || "Admin"}
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