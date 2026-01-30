// src/components/layout/TopHeader.jsx

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  ChevronDown,
  LogOut,
  Clock,
  Calendar,
  User,
  Ticket,
  Shield,
  Building2,
  Store,
  Loader2,
  Check,
  CreditCard,
  ChevronRight,
  Layers,
} from "lucide-react";
import logo from "../../assets/icons/cureli.svg";

import { 
  useAuthStore, 
  selectBranchContext, 
  selectIsSuperAdmin,
  selectIsGlobalMode,
  BRANCH_MODE 
} from "../../store/useAuthStore";
import { usePermission } from "../../hooks/usePermission";
import { PERMISSIONS } from "../../config/permissions";
import { logoutUser } from "../../api/auth";
import { fetchBranchesDropdown, switchBranch } from "../../api/branches";
import ConfirmDialog from "../common/ConfirmDialog";
import { useSubscriptionStore, selectNeedsRenewal, selectDaysRemaining, selectIsInGrace } from "../../store/useSubscriptionStore";
import { useToast } from "../common/Toast";

// NEW: Import NotificationDropdown
import { NotificationDropdown } from "../common/notifications";

// Define write routes that require BRANCH mode
const WRITE_ROUTES = [
  "/Salesbilling",
  "/purchase-billing",
];

const TopHeader = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  
  const profileRef = useRef(null);
  const branchRef = useRef(null);

  // ============================================
  // AUTH STORE (Single Source of Truth)
  // ============================================
  const user = useAuthStore((state) => state.user);
  const shopName = useAuthStore((state) => state.shopName);
  const logout = useAuthStore((state) => state.logout);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  
  // Branch context from store
  const branchContext = useAuthStore(selectBranchContext);
  const isSuperAdmin = useAuthStore(selectIsSuperAdmin);
  const isGlobalMode = useAuthStore(selectIsGlobalMode);
  const setGlobalBranch = useAuthStore((state) => state.setGlobalBranch);
  const setBranch = useAuthStore((state) => state.setBranch);

  // Subscription status
  const needsRenewal = useSubscriptionStore(selectNeedsRenewal);
  const daysRemaining = useSubscriptionStore(selectDaysRemaining);
  const isInGrace = useSubscriptionStore(selectIsInGrace);
  const loadSubscriptionStatus = useSubscriptionStore((s) => s.loadSubscriptionStatus);

  const shopId = user?.shop_id || null;
  const userRole = user?.role || null;

  const { hasPermission } = usePermission();

  // ============================================
  // LOCAL STATE (UI only)
  // ============================================
  const [dateTime, setDateTime] = useState({
    time: "",
    date: "",
    day: "",
  });

  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showBranchSelector, setShowBranchSelector] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [isBranchesLoading, setIsBranchesLoading] = useState(false);
  const [isSwitchingBranch, setIsSwitchingBranch] = useState(false);

  const [branches, setBranches] = useState([]);

  // ============================================
  // DERIVED VALUES
  // ============================================
  const canSwitchBranches = hasPermission(PERMISSIONS.BRANCHES_SWITCH);

  const isOnWriteRoute = useMemo(() => {
    return WRITE_ROUTES.includes(location.pathname);
  }, [location.pathname]);

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

  const sortedBranches = useMemo(() => {
    if (!branches.length) return [];
    return [...branches].sort((a, b) => {
      if (a.is_main && !b.is_main) return -1;
      if (!a.is_main && b.is_main) return 1;
      return a.branch_name.localeCompare(b.branch_name);
    });
  }, [branches]);

  const selectedBranchId = branchContext.mode === BRANCH_MODE.BRANCH 
    ? branchContext.branch_id 
    : null;

  const selectedBranch = selectedBranchId
    ? branches.find((b) => b.branch_id === selectedBranchId)
    : null;

  const isAllBranches = isSuperAdmin && isGlobalMode;

  const displayBranchName = useMemo(() => {
    if (isSuperAdmin) {
      if (isAllBranches) {
        return "All Branches";
      }
      return selectedBranch?.branch_name || branchContext.branch_name || "Select Branch";
    } else {
      return branchContext.branch_name || "My Branch";
    }
  }, [isSuperAdmin, isAllBranches, selectedBranch, branchContext.branch_name]);

  const displayShopName = shopName || "My Business";

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

  useEffect(() => {
    if (isSuperAdmin && shopId) {
      loadSubscriptionStatus();
    }
  }, [isSuperAdmin, shopId, loadSubscriptionStatus]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setShowProfileMenu(false);
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
    setShowBranchSelector(false);
    
    if (isOnWriteRoute) {
      navigate("/dashboard");
      setGlobalBranch();
      toast.info(
        "Switched to All Branches",
        "Select a specific branch to create bills or purchases"
      );
    } else {
      setGlobalBranch();
    }
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
        setBranch(branch.branch_id, response.data.branch_name);
        setShowBranchSelector(false);
      }
    } catch (error) {
      console.error("Failed to switch branch:", error);
    } finally {
      setIsSwitchingBranch(false);
    }
  };

  const handleLogoutClick = () => {
    setShowProfileMenu(false);
    setShowLogoutConfirm(true);
  };

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

  const handleLogoutCancel = () => {
    setShowLogoutConfirm(false);
  };

  // Renewal Pill Component
  const RenewalPill = () => {
    if (!isSuperAdmin || !needsRenewal) return null;

    const isUrgent = daysRemaining <= 7 || isInGrace;

    return (
      <button
        onClick={() => navigate("/settings/upgrade")}
        className={`
          flex items-center gap-2 h-10 px-3 rounded-lg
          border transition-all duration-150 font-medium text-sm
          ${isUrgent
            ? "bg-red-50 border-red-300 text-red-700 hover:bg-red-100"
            : "bg-amber-50 border-amber-300 text-amber-700 hover:bg-amber-100"
          }
        `}
      >
        <CreditCard size={15} />
        <span className="hidden sm:block">
          {isInGrace
            ? "Grace Period"
            : `Plan: ${daysRemaining} day${daysRemaining !== 1 ? "s" : ""} left`}
        </span>
        {isUrgent && (
          <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
        )}
      </button>
    );
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

            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100">
              <Store size={14} className="text-[#000060]" />
              <span className="text-sm font-medium text-gray-700 max-w-[150px] truncate">
                {displayShopName}
              </span>
            </div>

            <div className="hidden lg:block w-px h-8 bg-gray-200" />

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
            {/* Branch Selector */}
            {canSwitchBranches && (
              <div className="relative" ref={branchRef}>
                <button
                  onClick={() => setShowBranchSelector(!showBranchSelector)}
                  disabled={isSwitchingBranch}
                  className={`
                    flex items-center gap-2.5 h-10 px-3 rounded-lg
                    border transition-all duration-150
                    ${showBranchSelector
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

                {showBranchSelector && (
                  <div className="absolute right-0 top-full mt-1.5 w-64 bg-white rounded-lg border border-gray-200 shadow-lg overflow-hidden z-50">
                    <div className="px-3 py-2.5 bg-gray-50/80 border-b border-gray-100">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                          Select Branch
                        </span>
                        {isBranchesLoading && (
                          <Loader2 size={12} className="animate-spin text-gray-400" />
                        )}
                      </div>
                    </div>

                    <div className="max-h-64 overflow-y-auto py-1">
                      {isBranchesLoading && branches.length === 0 ? (
                        <div className="px-3 py-6 text-center">
                          <Loader2 size={20} className="animate-spin text-gray-300 mx-auto mb-2" />
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
                              ${isAllBranches ? "bg-[#000060]/[0.04]" : "hover:bg-gray-50"}
                              disabled:opacity-50
                            `}
                          >
                            <div className={`
                              w-8 h-8 rounded-md flex items-center justify-center
                              ${isAllBranches ? "bg-[#000060]/10" : "bg-gray-100"}
                            `}>
                              <Layers
                                size={14}
                                className={isAllBranches ? "text-[#000060]" : "text-gray-500"}
                              />
                            </div>

                            <div className="flex-1 text-left">
                              <span className={`text-sm font-medium ${
                                isAllBranches ? "text-[#000060]" : "text-gray-700"
                              }`}>
                                All Branches
                              </span>
                              <p className="text-[10px] text-gray-400 mt-0.5">
                                View combined data (read-only)
                              </p>
                            </div>

                            {isAllBranches && (
                              <Check size={14} className="text-[#000060]" />
                            )}
                          </button>

                          {sortedBranches.length > 0 && (
                            <div className="my-1 mx-3 border-t border-gray-100" />
                          )}

                          {/* Individual Branches */}
                          {sortedBranches.map((branch) => {
                            const isSelected = selectedBranchId === branch.branch_id;
                            const isMain = branch.is_main;

                            return (
                              <button
                                key={branch.branch_id}
                                onClick={() => handleBranchChange(branch)}
                                disabled={isSwitchingBranch}
                                className={`
                                  w-full px-3 py-2.5 flex items-center gap-3
                                  transition-colors duration-100
                                  ${isSelected ? "bg-[#000060]/[0.04]" : "hover:bg-gray-50"}
                                  disabled:opacity-50
                                `}
                              >
                                <div className={`
                                  w-8 h-8 rounded-md flex items-center justify-center relative
                                  ${isMain ? "bg-[#000060]/10" : isSelected ? "bg-[#000060]/10" : "bg-gray-100"}
                                `}>
                                  <Building2
                                    size={14}
                                    className={isMain || isSelected ? "text-[#000060]" : "text-gray-500"}
                                  />
                                  {isMain && (
                                    <div className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-[#000060] rounded-full" />
                                  )}
                                </div>

                                <div className="flex-1 text-left min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span className={`text-sm font-medium truncate ${
                                      isSelected ? "text-[#000060]" : "text-gray-700"
                                    }`}>
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
                                  <Check size={14} className="text-[#000060] flex-shrink-0" />
                                )}
                              </button>
                            );
                          })}

                          {sortedBranches.length === 0 && !isBranchesLoading && (
                            <div className="px-3 py-4 text-center">
                              <p className="text-xs text-gray-400">No branches found</p>
                            </div>
                          )}
                        </>
                      )}
                    </div>

                    <div className="px-3 py-2 bg-gray-50/50 border-t border-gray-100">
                      <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          isAllBranches ? "bg-blue-500" : "bg-green-500"
                        }`} />
                        <span>
                          Mode:{" "}
                          <span className="text-gray-600 font-medium">
                            {isAllBranches ? "Global (Read-only)" : displayBranchName}
                          </span>
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {!canSwitchBranches && (
              <div className="hidden sm:flex items-center gap-2 h-10 px-3 rounded-lg bg-gray-50 border border-gray-100">
                <Building2 size={14} className="text-[#000060]" />
                <span className="text-sm font-medium text-gray-600 max-w-[120px] truncate">
                  {displayBranchName}
                </span>
              </div>
            )}

            <div className="w-px h-8 bg-gray-200" />

            {/* Renewal Pill (Super Admin Only) */}
            <RenewalPill />

            {needsRenewal && isSuperAdmin && (
              <div className="w-px h-8 bg-gray-200" />
            )}

            {/* ==================== NOTIFICATIONS ==================== */}
            <NotificationDropdown />

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
                  <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${currentRole.color}`}>
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
                        <p className="font-semibold text-gray-800 truncate">{userName}</p>
                        <p className="text-xs text-gray-500 truncate">@{user?.username || "user"}</p>
                        <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded mt-1 ${currentRole.color}`}>
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
                      {isAllBranches ? <Layers size={12} /> : <Building2 size={12} />}
                      <span className="truncate">{displayBranchName}</span>
                      {isAllBranches && (
                        <span className="text-[9px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-medium">
                          READ-ONLY
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="py-2">
                    <button
                      onClick={() => {
                        navigate("/tickets");
                        setShowProfileMenu(false);
                      }}
                      className="w-full px-4 py-2.5 text-left text-sm text-gray-700 hover:bg-gray-50 
                                 flex items-center gap-3 transition-colors"
                    >
                      <Ticket size={16} className="text-gray-500" />
                      <span>Tickets</span>
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