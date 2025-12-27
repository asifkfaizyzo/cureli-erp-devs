// src/components/layout/TopHeader.jsx

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  ChevronDown,
  LogOut,
  Clock,
  Calendar,
  User,
  Ticket ,
  Shield,
  Building2,
  Store,
  Loader2,
  Check,
  AlertCircle,
  CreditCard,
  FileText,
  ChevronRight,
  Package,
  RefreshCw,
  Layers,
} from "lucide-react";
import logo from "../../assets/icons/cureli.svg";

import { useAuthStore } from "../../store/useAuthStore";
import { usePermission } from "../../hooks/usePermission";
import { PERMISSIONS } from "../../config/permissions";
import { logoutUser } from "../../api/auth";
import { fetchBranchesDropdown, switchBranch } from "../../api/branches";
import ConfirmDialog from "../common/ConfirmDialog";

const TopHeader = () => {
  const navigate = useNavigate();
  const profileRef = useRef(null);
  const notificationRef = useRef(null);
  const branchRef = useRef(null);

  // ============================================
  // AUTH STORE & PERMISSIONS
  // ============================================
  const user = useAuthStore((state) => state.user);
  const branchName = useAuthStore((state) => state.branchName);
  const shopName = useAuthStore((state) => state.shopName);
  const logout = useAuthStore((state) => state.logout);
  const setBranchContext = useAuthStore((state) => state.setBranchContext);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  const branchId = user?.branch_id || null;
  const shopId = user?.shop_id || null;
  const userRole = user?.role || null;

  const { hasPermission } = usePermission();

  // ============================================
  // LOCAL STATE
  // ============================================
  const [dateTime, setDateTime] = useState({
    time: "",
    date: "",
    day: "",
  });

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showBranchSelector, setShowBranchSelector] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isBranchesLoading, setIsBranchesLoading] = useState(false);
  const [isNotificationsLoading, setIsNotificationsLoading] = useState(false);
  const [isSwitchingBranch, setIsSwitchingBranch] = useState(false);

  const [branches, setBranches] = useState([]);
  const [selectedBranchId, setSelectedBranchId] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [notificationError, setNotificationError] = useState(null);

  // ============================================
  // DERIVED VALUES
  // ============================================
  const canSwitchBranches = hasPermission(PERMISSIONS.BRANCHES_SWITCH);
  const canViewSettings = hasPermission(PERMISSIONS.SETTINGS_VIEW);
  const canManageSettings = hasPermission(PERMISSIONS.SETTINGS_MANAGE);
  const isSuperAdmin = userRole === "super_admin";

  const roleConfig = {
    super_admin: {
      label: "Super Admin",
      color: "bg-purple-100 text-purple-700",
      icon: Shield,
    },
    branch_admin: {
      label: "Branch Admin",
      color: "bg-blue-100 text-blue-700",
      icon: Building2,
    },
    staff: {
      label: "Staff",
      color: "bg-slate-100 text-slate-700",
      icon: User,
    },
  };

  const currentRole = roleConfig[userRole] || roleConfig.staff;
  const userName = user?.name || "User";
  const userInitials = userName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // ============================================
  // SORTED BRANCHES - Main branch first, then alphabetically
  // ============================================
  const sortedBranches = useMemo(() => {
    if (!branches.length) return [];

    return [...branches].sort((a, b) => {
      if (a.is_main && !b.is_main) return -1;
      if (!a.is_main && b.is_main) return 1;
      return a.branch_name.localeCompare(b.branch_name);
    });
  }, [branches]);

  // Find selected branch from list (for Super Admin)
  const selectedBranch = selectedBranchId
    ? branches.find((b) => b.branch_id === selectedBranchId)
    : null;

  // ============================================
  // FIXED: Display names based on role
  // ============================================
  
  // For Super Admin: Show "All Branches" or selected branch
  // For Branch Admin/Staff: Show their assigned branch from store
  const isAllBranches = isSuperAdmin && selectedBranchId === null;

  const displayBranchName = useMemo(() => {
    if (isSuperAdmin) {
      // Super Admin can see "All Branches" or a specific branch
      if (isAllBranches) {
        return "All Branches";
      }
      return selectedBranch?.branch_name || branchName || "Select Branch";
    } else {
      // Branch Admin / Staff - always show their assigned branch
      return branchName || "My Branch";
    }
  }, [isSuperAdmin, isAllBranches, selectedBranch, branchName]);

  const displayShopName = shopName || "My Business";

  const unreadCount = notifications.filter((n) => n.unread).length;

  const notificationIconMap = {
    invoice: { icon: FileText, color: "text-blue-500", bgColor: "bg-blue-50" },
    payment: {
      icon: CreditCard,
      color: "text-green-500",
      bgColor: "bg-green-50",
    },
    alert: {
      icon: AlertCircle,
      color: "text-orange-500",
      bgColor: "bg-orange-50",
    },
    stock: { icon: Package, color: "text-red-500", bgColor: "bg-red-50" },
    default: { icon: Bell, color: "text-gray-500", bgColor: "bg-gray-50" },
  };

  // ============================================
  // API FUNCTIONS
  // ============================================

  const fetchBranchesData = useCallback(async () => {
    if (!canSwitchBranches || !shopId) return;

    setIsBranchesLoading(true);
    try {
      const response = await fetchBranchesDropdown();
      const branchList = response?.data?.branches || [];
      setBranches(branchList);
    } catch (error) {
      console.error("Failed to fetch branches:", error);
      setBranches([]);
    } finally {
      setIsBranchesLoading(false);
    }
  }, [canSwitchBranches, shopId]);

  const fetchNotificationsData = useCallback(async () => {
    if (!user?.user_id) return;

    setIsNotificationsLoading(true);
    setNotificationError(null);
    try {
      await new Promise((resolve) => setTimeout(resolve, 300));
      setNotifications([
        {
          id: 1,
          type: "invoice",
          title: "New invoice generated",
          description: "Invoice #INV-2024-001 is ready",
          created_at: new Date(Date.now() - 5 * 60000).toISOString(),
          unread: true,
        },
        {
          id: 2,
          type: "payment",
          title: "Payment received",
          description: "Payment of ₹15,000 confirmed",
          created_at: new Date(Date.now() - 60 * 60000).toISOString(),
          unread: true,
        },
        {
          id: 3,
          type: "stock",
          title: "Low stock alert",
          description: "5 items are running low",
          created_at: new Date(Date.now() - 180 * 60000).toISOString(),
          unread: false,
        },
      ]);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      setNotificationError("Failed to load notifications");
    } finally {
      setIsNotificationsLoading(false);
    }
  }, [user?.user_id]);

  // ============================================
  // EFFECTS
  // ============================================

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

  useEffect(() => {
    if (canSwitchBranches && shopId) {
      fetchBranchesData();
    }
  }, [canSwitchBranches, shopId, fetchBranchesData]);

  // Initialize with "All Branches" (null) for Super Admin
  useEffect(() => {
    if (isSuperAdmin && branchId) {
      setSelectedBranchId(branchId);
    }
  }, [isSuperAdmin, branchId]);

  useEffect(() => {
    if (isAuthenticated && user?.user_id) {
      fetchNotificationsData();
      const pollInterval = setInterval(fetchNotificationsData, 60000);
      return () => clearInterval(pollInterval);
    }
  }, [isAuthenticated, user?.user_id, fetchNotificationsData]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileMenu(false);
      }
      if (
        notificationRef.current &&
        !notificationRef.current.contains(e.target)
      ) {
        setShowNotifications(false);
      }
      if (branchRef.current && !branchRef.current.contains(e.target)) {
        setShowBranchSelector(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        setShowProfileMenu(false);
        setShowNotifications(false);
        setShowBranchSelector(false);
        setShowLogoutConfirm(false);
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  // ============================================
  // HANDLERS
  // ============================================

  const handleSelectAllBranches = () => {
    setSelectedBranchId(null);
    setBranchContext(null, "All Branches");
    setShowBranchSelector(false);

    window.dispatchEvent(
      new CustomEvent("branchChanged", {
        detail: { branchId: null, branchName: "All Branches" },
      })
    );
  };

  const handleBranchChange = async (branch) => {
    if (branch.branch_id === selectedBranchId) {
      setShowBranchSelector(false);
      return;
    }

    setIsSwitchingBranch(true);
    try {
      const response = await switchBranch(branch.branch_id);

      if (response.success) {
        setSelectedBranchId(branch.branch_id);
        setBranchContext(branch.branch_id, response.data.branch_name);
        setShowBranchSelector(false);

        window.dispatchEvent(
          new CustomEvent("branchChanged", {
            detail: {
              branchId: branch.branch_id,
              branchName: response.data.branch_name,
            },
          })
        );

        fetchNotificationsData();
      }
    } catch (error) {
      console.error("Failed to switch branch:", error);
    } finally {
      setIsSwitchingBranch(false);
    }
  };

  const handleNotificationClick = async (notification) => {
    try {
      if (notification.unread) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notification.id ? { ...n, unread: false } : n
          )
        );
      }

      const navigationMap = {
        invoice: "/Salesinvoice",
        payment: "/reports-sales",
        stock: "/inventory",
        alert: "/dashboard",
      };

      const targetPath = navigationMap[notification.type] || "/dashboard";
      setShowNotifications(false);
      navigate(targetPath);
    } catch (error) {
      console.error("Failed to handle notification:", error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  // Open logout confirmation dialog
  const handleLogoutClick = () => {
    setShowProfileMenu(false);
    setShowLogoutConfirm(true);
  };

  // Confirm logout
  const handleLogoutConfirm = async () => {
    setIsLoggingOut(true);
    try {
      await logoutUser();
    } catch (err) {
      console.error("Logout API error:", err);
    } finally {
      setShowLogoutConfirm(false);
      logout();
      navigate("/login", { replace: true });
    }
  };

  // Cancel logout
  const handleLogoutCancel = () => {
    setShowLogoutConfirm(false);
  };

  const handleProfileNavigation = (path) => {
    setShowProfileMenu(false);
    navigate(path);
  };

  const getNotificationIcon = (type) => {
    return notificationIconMap[type] || notificationIconMap.default;
  };

  const formatNotificationTime = (createdAt) => {
    if (!createdAt) return "";

    const now = new Date();
    const notifDate = new Date(createdAt);
    const diffMs = now - notifDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24)
      return `${diffHours} hour${diffHours > 1 ? "s" : ""} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;

    return notifDate.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
    });
  };

  // ============================================
  // RENDER
  // ============================================

  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-white border-b border-gray-200/80 shadow-sm">
        <div className="h-full px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* ==================== LEFT SECTION ==================== */}
          <div className="flex items-center gap-3 md:gap-4">
            {/* Logo & Brand */}
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <img src={logo} alt="Cureli" className="h-9 w-auto sm:h-10" />
              </div>
              <div className="hidden sm:flex flex-col">
                <span className="text-xl font-bold text-[#000060] leading-tight">
                  Cureli
                </span>
                <span className="text-[10px] text-gray-400 font-medium -mt-0.5">
                  Business Suite
                </span>
              </div>
            </div>

            <div className="hidden md:block w-px h-8 bg-gray-200 ml-1" />

            {/* Shop Name Badge */}
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100">
              <Store size={14} className="text-[#000060]" />
              <span className="text-sm font-medium text-gray-700 max-w-[150px] truncate">
                {displayShopName}
              </span>
            </div>

            <div className="hidden lg:block w-px h-8 bg-gray-200" />

            {/* Date & Time */}
            <div className="hidden md:flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-gray-500">
                <Calendar size={14} />
                <span className="text-sm font-medium">{dateTime.date}</span>
              </div>
              <div className="flex items-center gap-1.5 text-gray-500">
                <Clock size={14} />
                <span className="text-sm font-medium tabular-nums">
                  {dateTime.time}
                </span>
              </div>
            </div>
          </div>

          {/* ==================== RIGHT SECTION ==================== */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* ==================== BRANCH SELECTOR (Super Admin Only) ==================== */}
            {canSwitchBranches && (
              <div className="relative" ref={branchRef}>
                <button
                  onClick={() => setShowBranchSelector(!showBranchSelector)}
                  disabled={isSwitchingBranch}
                  className={`
                    flex items-center gap-2.5 h-10 px-3 rounded-lg
                    border transition-all duration-150
                    ${
                      showBranchSelector
                        ? "border-[#000060]/30 bg-[#000060]/[0.03] shadow-sm"
                        : "border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50/50"
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                >
                  {isSwitchingBranch ? (
                    <Loader2 size={15} className="text-[#000060] animate-spin" />
                  ) : isAllBranches ? (
                    <Layers size={15} className="text-[#000060]" />
                  ) : (
                    <Building2 size={15} className="text-[#000060]" />
                  )}

                  <span className="hidden sm:block text-sm font-medium text-gray-700 max-w-[110px] truncate">
                    {displayBranchName}
                  </span>

                  <ChevronDown
                    size={14}
                    className={`text-gray-400 transition-transform duration-150 ${
                      showBranchSelector ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Branch Dropdown */}
                {showBranchSelector && (
                  <div className="absolute right-0 top-full mt-1.5 w-64 bg-white rounded-lg border border-gray-200 shadow-lg overflow-hidden z-50">
                    {/* Header */}
                    <div className="px-3 py-2.5 bg-gray-50/80 border-b border-gray-100">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Select Branch
                        </span>
                        {isBranchesLoading && (
                          <Loader2
                            size={12}
                            className="animate-spin text-gray-400"
                          />
                        )}
                      </div>
                    </div>

                    {/* Branch List */}
                    <div className="max-h-64 overflow-y-auto py-1">
                      {isBranchesLoading && branches.length === 0 ? (
                        <div className="px-3 py-6 text-center">
                          <Loader2
                            size={20}
                            className="animate-spin text-gray-300 mx-auto mb-2"
                          />
                          <p className="text-xs text-gray-400">Loading...</p>
                        </div>
                      ) : (
                        <>
                          {/* All Branches Option */}
                          <button
                            onClick={handleSelectAllBranches}
                            disabled={isSwitchingBranch}
                            className={`
                              w-full px-3 py-2.5 flex items-center gap-3
                              transition-colors duration-100
                              ${
                                isAllBranches
                                  ? "bg-[#000060]/[0.04]"
                                  : "hover:bg-gray-50"
                              }
                              disabled:opacity-50
                            `}
                          >
                            <div
                              className={`
                              w-8 h-8 rounded-md flex items-center justify-center
                              ${isAllBranches ? "bg-[#000060]/10" : "bg-gray-100"}
                            `}
                            >
                              <Layers
                                size={14}
                                className={
                                  isAllBranches
                                    ? "text-[#000060]"
                                    : "text-gray-500"
                                }
                              />
                            </div>

                            <div className="flex-1 text-left">
                              <span
                                className={`text-sm font-medium ${
                                  isAllBranches
                                    ? "text-[#000060]"
                                    : "text-gray-700"
                                }`}
                              >
                                All Branches
                              </span>
                              <p className="text-[10px] text-gray-400 mt-0.5">
                                View combined data
                              </p>
                            </div>

                            {isAllBranches && (
                              <Check size={14} className="text-[#000060]" />
                            )}
                          </button>

                          {/* Divider */}
                          {sortedBranches.length > 0 && (
                            <div className="my-1 mx-3 border-t border-gray-100" />
                          )}

                          {/* Individual Branches */}
                          {sortedBranches.map((branch) => {
                            const isSelected =
                              selectedBranchId === branch.branch_id;
                            const isMain = branch.is_main;

                            return (
                              <button
                                key={branch.branch_id}
                                onClick={() => handleBranchChange(branch)}
                                disabled={isSwitchingBranch}
                                className={`
                                  w-full px-3 py-2.5 flex items-center gap-3
                                  transition-colors duration-100
                                  ${
                                    isSelected
                                      ? "bg-[#000060]/[0.04]"
                                      : "hover:bg-gray-50"
                                  }
                                  disabled:opacity-50
                                `}
                              >
                                <div
                                  className={`
                                  w-8 h-8 rounded-md flex items-center justify-center relative
                                  ${
                                    isMain
                                      ? "bg-[#000060]/10"
                                      : isSelected
                                      ? "bg-[#000060]/10"
                                      : "bg-gray-100"
                                  }
                                `}
                                >
                                  <Building2
                                    size={14}
                                    className={
                                      isMain || isSelected
                                        ? "text-[#000060]"
                                        : "text-gray-500"
                                    }
                                  />
                                  {isMain && (
                                    <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-[#000060] rounded-full" />
                                  )}
                                </div>

                                <div className="flex-1 text-left min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span
                                      className={`text-sm font-medium truncate ${
                                        isSelected
                                          ? "text-[#000060]"
                                          : "text-gray-700"
                                      }`}
                                    >
                                      {branch.branch_name}
                                    </span>
                                    {isMain && (
                                      <span className="flex-shrink-0 text-[9px] font-semibold text-[#000060] bg-[#000060]/10 px-1.5 py-0.5 rounded">
                                        MAIN
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {isSelected && (
                                  <Check
                                    size={14}
                                    className="text-[#000060] flex-shrink-0"
                                  />
                                )}
                              </button>
                            );
                          })}

                          {sortedBranches.length === 0 && !isBranchesLoading && (
                            <div className="px-3 py-4 text-center">
                              <p className="text-xs text-gray-400">
                                No branches found
                              </p>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    {/* Footer */}
                    <div className="px-3 py-2 bg-gray-50/50 border-t border-gray-100">
                      <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
                        <span>
                          Viewing:{" "}
                          <span className="text-gray-600 font-medium">
                            {displayBranchName}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ==================== FIXED: Non-SA Branch Display ==================== */}
            {/* Branch Admin & Staff - Show their assigned branch (no dropdown) */}
            {!canSwitchBranches && (
              <div className="hidden sm:flex items-center gap-2 h-10 px-3 rounded-lg bg-gray-50 border border-gray-100">
                <Building2 size={14} className="text-[#000060]" />
                <span className="text-sm font-medium text-gray-600 max-w-[120px] truncate">
                  {displayBranchName}
                </span>
              </div>
            )}

            <div className="w-px h-8 bg-gray-200" />

            {/* ==================== NOTIFICATIONS ==================== */}
            <div className="relative" ref={notificationRef}>
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  if (!showNotifications) {
                    fetchNotificationsData();
                  }
                }}
                className="relative p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-all"
              >
                <Bell size={20} />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1 ring-2 ring-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden z-50">
                  <div className="px-4 py-3 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-semibold text-gray-800">Notifications</h3>
                    <div className="flex items-center gap-2">
                      {unreadCount > 0 && (
                        <button
                          onClick={handleMarkAllRead}
                          className="text-xs text-[#000060] hover:text-[#000080] font-medium"
                        >
                          Mark all read
                        </button>
                      )}
                      <button
                        onClick={fetchNotificationsData}
                        disabled={isNotificationsLoading}
                        className="p-1 hover:bg-gray-200 rounded transition-colors"
                      >
                        <RefreshCw
                          size={14}
                          className={`text-gray-400 ${
                            isNotificationsLoading ? "animate-spin" : ""
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  <div className="max-h-80 overflow-y-auto divide-y divide-gray-50">
                    {isNotificationsLoading && notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center">
                        <Loader2
                          size={24}
                          className="animate-spin text-gray-400 mx-auto mb-2"
                        />
                        <p className="text-sm text-gray-500">
                          Loading notifications...
                        </p>
                      </div>
                    ) : notificationError ? (
                      <div className="px-4 py-8 text-center">
                        <AlertCircle
                          size={24}
                          className="text-red-400 mx-auto mb-2"
                        />
                        <p className="text-sm text-gray-500">
                          {notificationError}
                        </p>
                        <button
                          onClick={fetchNotificationsData}
                          className="mt-2 text-sm text-[#000060] hover:underline"
                        >
                          Try again
                        </button>
                      </div>
                    ) : notifications.length === 0 ? (
                      <div className="px-4 py-8 text-center">
                        <Bell size={24} className="text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">
                          No notifications yet
                        </p>
                      </div>
                    ) : (
                      notifications.map((notification) => {
                        const iconConfig = getNotificationIcon(notification.type);
                        const IconComponent = iconConfig.icon;

                        return (
                          <button
                            key={notification.id}
                            onClick={() => handleNotificationClick(notification)}
                            className={`w-full px-4 py-3 flex items-start gap-3 hover:bg-gray-50 transition-colors text-left ${
                              notification.unread ? "bg-blue-50/30" : ""
                            }`}
                          >
                            <div
                              className={`p-2 rounded-lg ${iconConfig.bgColor} flex-shrink-0`}
                            >
                              <IconComponent
                                size={16}
                                className={iconConfig.color}
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-medium text-gray-800 truncate">
                                  {notification.title}
                                </p>
                                {notification.unread && (
                                  <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                                )}
                              </div>
                              <p className="text-xs text-gray-500 mt-0.5 truncate">
                                {notification.description}
                              </p>
                              <p className="text-[10px] text-gray-400 mt-1">
                                {formatNotificationTime(notification.created_at)}
                              </p>
                            </div>
                            <ChevronRight
                              size={14}
                              className="text-gray-300 flex-shrink-0 mt-1"
                            />
                          </button>
                        );
                      })
                    )}
                  </div>

                  <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
                    <button
                      onClick={() => {
                        setShowNotifications(false);
                        navigate("/notifications");
                      }}
                      className="w-full text-center text-sm font-medium text-[#000060] hover:text-[#000080] transition-colors"
                    >
                      View all notifications
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="w-px h-8 bg-gray-200" />

            {/* ==================== PROFILE SECTION ==================== */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center gap-2 sm:gap-3 p-1.5 rounded-xl hover:bg-gray-50 transition-all"
              >
                <div className="relative w-9 h-9 rounded-full bg-gradient-to-br from-[#000060] to-[#0a0280] flex items-center justify-center text-white font-semibold text-sm ring-2 ring-white shadow-sm">
                  {userInitials}
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full ring-2 ring-white" />
                </div>

                <div className="hidden md:flex flex-col items-start">
                  <span className="text-sm font-semibold text-gray-800 leading-tight">
                    {userName}
                  </span>
                  <span
                    className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${currentRole.color}`}
                  >
                    {currentRole.label}
                  </span>
                </div>

                <ChevronDown
                  size={16}
                  className={`hidden md:block text-gray-400 transition-transform ${
                    showProfileMenu ? "rotate-180" : ""
                  }`}
                />
              </button>

              {showProfileMenu && (
                <div className="absolute right-0 top-full mt-2 w-72 bg-white rounded-xl border border-gray-200 shadow-xl overflow-hidden z-50">
                  <div className="px-4 py-4 bg-gradient-to-br from-gray-50 to-white border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#000060] to-[#0a0280] flex items-center justify-center text-white font-bold text-lg">
                        {userInitials}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 truncate">
                          {userName}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          @{user?.username || "user"}
                        </p>
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded mt-1 ${currentRole.color}`}
                        >
                          <currentRole.icon size={10} />
                          {currentRole.label}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="px-4 py-3 bg-gray-50/50 border-b border-gray-100">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Store size={12} />
                      <span className="truncate">{displayShopName}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                      <Building2 size={12} />
                      <span className="truncate">{displayBranchName}</span>
                    </div>
                  </div>

                  <div className="py-2">
                    {/* <button
                      onClick={() => handleProfileNavigation("/profile")}
                      className="w-full px-4 py-2.5 flex items-center gap-3 text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      <User size={16} className="text-gray-400" />
                      <span className="text-sm">My Profile</span>
                    </button> */}

                    {/* {canViewSettings && (
                      <button
                        onClick={() => handleProfileNavigation("/settings")}
                        className="w-full px-4 py-2.5 flex items-center gap-3 text-gray-700 hover:bg-gray-50 transition-colors"
                      >
                        <Settings size={16} className="text-gray-400" />
                        <span className="text-sm">Settings</span>
                        {!canManageSettings && (
                          <span className="ml-auto text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                            View only
                          </span>
                        )}
                      </button>
                    )} */}

                    <button
  onClick={() => {
    navigate("/tickets");
    setShowProfileMenu(false); // Close dropdown
  }}
  className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 
             flex items-center gap-3 transition-colors"
>
  <Ticket size={16} className="text-gray-500" />
  <span>Support Tickets</span>
</button>

                  </div>

                  <div className="border-t border-gray-100 p-2">
                    <button
                      onClick={handleLogoutClick}
                      className="w-full px-4 py-2.5 flex items-center justify-center gap-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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

      {/* ==================== LOGOUT CONFIRMATION DIALOG ==================== */}
      <ConfirmDialog
        isOpen={showLogoutConfirm}
        onClose={handleLogoutCancel}
        onConfirm={handleLogoutConfirm}
        title="Confirm Logout"
        message={
          <p>
            Are you sure you want to logout from your account?
            <br />
            <span className="text-gray-500 text-sm">
              You will need to login again to access your dashboard.
            </span>
          </p>
        }
        confirmText="Logout"
        cancelText="Cancel"
        type="warning"
        loading={isLoggingOut}
      />
    </>
  );
};

export default TopHeader;