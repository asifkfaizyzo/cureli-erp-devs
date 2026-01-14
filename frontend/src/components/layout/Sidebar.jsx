// src/components/layout/Sidebar.jsx

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import { useSubscriptionStore, selectNeedsRenewal } from "../../store/useSubscriptionStore";
import { useAuthStore, selectIsSuperAdmin } from "../../store/useAuthStore";
import {
  LayoutGrid,
  Layers,
  FileText,
  ShoppingCart,
  Box,
  Users,
  BarChart2,
  Settings,
  ChevronDown,
  Building2,
  UserCircle,
  CreditCard,
} from "lucide-react";
import { useMenuStore } from "../../store/useMenuStore";
import { useMenuPermissions } from "../../hooks/usePermission";

/* ───────────────── constants ───────────────── */
const COLLAPSED_WIDTH = 72;
const EXPANDED_WIDTH = 260;

const SIDEBAR_TRANSITION = {
  type: "spring",
  stiffness: 300,
  damping: 30,
  mass: 0.8,
};

const SUBMENU_VARIANTS = {
  hidden: { height: 0, opacity: 0, overflow: "hidden" },
  visible: {
    height: "auto",
    opacity: 1,
    transition: { duration: 0.25, ease: "easeInOut" },
  },
};

/* ───────────────── Menu Item ───────────────── */
const MenuItem = ({
  item,
  activeMenu,
  isExpanded,
  openMenuId,
  onToggle,
  onNavigate,
  showBadge = false, // ⚠️ NEW: Badge prop
}) => {
  const Icon = item.icon;
  const isParent = item.submenu?.length > 0;

  const isChildActive = item.submenu?.some((sub) => sub.id === activeMenu);
  const isActive = activeMenu === item.id || isChildActive;
  const isOpen = openMenuId === item.id;

  const handleClick = (e) => {
    e.preventDefault();

    if (isParent) {
      onToggle(item.id);
    } else {
      onNavigate(item);
    }
  };

  // ⚠️ NEW: Super admin & renewal check for submenu items
  const isSuperAdmin = useAuthStore(selectIsSuperAdmin);
  const needsRenewal = useSubscriptionStore(selectNeedsRenewal);

  return (
    <div className="flex flex-col">
      <motion.button
        onClick={handleClick}
        className={`
          relative flex items-center w-full h-11 rounded-xl
          transition-colors duration-200
          ${
            isActive
              ? "bg-[#05015A] text-white shadow-lg shadow-blue-900/20"
              : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          }
        `}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <div className="absolute left-0 w-[56px] flex justify-center">
          <div className="relative">
            <Icon size={20} />
            {/* ⚠️ NEW: Red badge for renewal warning */}
            {showBadge && (
              <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
            )}
          </div>
        </div>

        <motion.span
          className="absolute left-[44px] text-sm font-medium whitespace-nowrap"
          animate={{
            opacity: isExpanded ? 1 : 0,
            x: isExpanded ? 0 : -12,
          }}
          transition={SIDEBAR_TRANSITION}
        >
          {item.label}
        </motion.span>

        {isParent && (
          <motion.div
            className="absolute right-3"
            animate={{
              opacity: isExpanded ? 1 : 0,
              rotate: isOpen ? 180 : 0,
            }}
          >
            <ChevronDown size={16} />
          </motion.div>
        )}

        {/* ⚠️ NEW: Expanded badge with text */}
        {showBadge && isExpanded && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute right-3 px-2 py-0.5 bg-red-500 text-white text-[10px] font-bold rounded-full"
          >
            !
          </motion.span>
        )}
      </motion.button>

      <AnimatePresence>
        {isExpanded && isParent && isOpen && (
          <motion.div
            variants={SUBMENU_VARIANTS}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="ml-4 mt-1 pl-4 border-l border-gray-200 flex flex-col gap-1"
          >
            {item.submenu.map((sub) => {
              const SubIcon = sub.icon;
              const isSubActive = activeMenu === sub.id;
              
              // ⚠️ NEW: Check if this submenu item needs badge
              const subShowBadge = isSuperAdmin && needsRenewal && sub.id === "settings-upgrade";

              return (
                <motion.button
                  key={sub.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigate(sub);
                  }}
                  className={`
                    flex items-center h-9 px-3 rounded-lg text-sm relative
                    ${
                      isSubActive
                        ? "bg-blue-50 text-[#05015A]"
                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                    }
                  `}
                  whileHover={{ x: 4 }}
                >
                  <div className="relative mr-2">
                    <SubIcon size={16} className="opacity-70" />
                    {subShowBadge && (
                      <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-red-500 rounded-full" />
                    )}
                  </div>
                  <span>{sub.label}</span>
                  {subShowBadge && (
                    <span className="ml-auto px-1.5 py-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full">
                      !
                    </span>
                  )}
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ───────────────── Sidebar ───────────────── */
const Sidebar = () => {
  const [hovered, setHovered] = useState(false);
  const [openMenuId, setOpenMenuId] = useState("");

  const isManualToggle = useRef(false);

  const activeMenu = useMenuStore((s) => s.activeMenu);
  const setActiveMenu = useMenuStore((s) => s.setActiveMenu);
  const setBreadcrumbs = useMenuStore((s) => s.setBreadcrumbs);

  const navigate = useNavigate();
  const location = useLocation();

  const permissions = useMenuPermissions();

  // ⚠️ NEW: Subscription status for renewal badge
  const isSuperAdmin = useAuthStore(selectIsSuperAdmin);
  const needsRenewal = useSubscriptionStore(selectNeedsRenewal);
  const loadSubscriptionStatus = useSubscriptionStore((s) => s.loadSubscriptionStatus);

  const isExpanded = hovered;

  // ⚠️ NEW: Load subscription status on mount (super admin only)
  useEffect(() => {
    if (isSuperAdmin) {
      loadSubscriptionStatus();
    }
  }, [isSuperAdmin, loadSubscriptionStatus]);

  /* ───────────── menu data with permission keys ───────────── */
  const allMenuItems = useMemo(() => [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutGrid,
      path: "/dashboard",
      breadcrumbs: ["Dashboard"],
      permissionKey: "dashboard",
    },
    {
      id: "sales",
      label: "Sales",
      icon: Layers,
      permissionKey: "salesBilling",
      submenu: [
        {
          id: "sales-billing",
          label: "Billing",
          icon: FileText,
          path: "/Salesbilling",
          breadcrumbs: ["Sales", "Billing"],
          permissionKey: "salesBilling",
        },
        {
          id: "sales-invoices",
          label: "Invoices",
          icon: BarChart2,
          path: "/Salesinvoice",
          breadcrumbs: ["Sales", "Invoices"],
          permissionKey: "salesInvoices",
        },
      ],
    },
    {
      id: "purchase",
      label: "Purchase",
      icon: ShoppingCart,
      permissionKey: "purchaseBilling",
      submenu: [
        {
          id: "purchase-billing",
          label: "Billing",
          icon: FileText,
          path: "/purchase-billing",
          breadcrumbs: ["Purchase", "Billing"],
          permissionKey: "purchaseBilling",
        },
        {
          id: "purchase-invoices",
          label: "Invoices",
          icon: BarChart2,
          path: "/purchase-invoices",
          breadcrumbs: ["Purchase", "Invoices"],
          permissionKey: "purchaseInvoices",
        },
      ],
    },
    {
      id: "inventory",
      label: "Inventory",
      icon: Box,
      path: "/inventory",
      breadcrumbs: ["Inventory"],
      permissionKey: "inventory",
    },
    {
      id: "suppliers",
      label: "Suppliers",
      icon: Users,
      path: "/suppliers",
      breadcrumbs: ["Suppliers"],
      permissionKey: "suppliers",
    },
    {
      id: "reports",
      label: "Report",
      icon: BarChart2,
      permissionKey: "salesReport",
      submenu: [
        {
          id: "sales-report",
          label: "Sales Report",
          icon: Layers,
          path: "/reports-sales",
          breadcrumbs: ["Reports", "Sales Report"],
          permissionKey: "salesReport",
        },
        {
          id: "purchase-report",
          label: "Purchase Report",
          icon: ShoppingCart,
          path: "/reports-purchase",
          breadcrumbs: ["Reports", "Purchase Report"],
          permissionKey: "purchaseReport",
        },
        {
          id: "inventory-report",
          label: "Inventory Report",
          icon: Box,
          path: "/reports-inventory",
          breadcrumbs: ["Reports", "Inventory Report"],
          permissionKey: "inventoryReport",
        },
        {
          id: "finance-report",
          label: "Finance Report",
          icon: FileText,
          path: "/reports-finance",
          breadcrumbs: ["Reports", "Finance Report"],
          permissionKey: "financeReport",
        },
      ],
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      permissionKey: "settings",
      submenu: [
        {
          id: "settings-users",
          label: "Users",
          icon: Users,
          path: "/settings/users",
          breadcrumbs: ["Settings", "Users"],
          permissionKey: "settingsUsers",
        },
        {
          id: "settings-branches",
          label: "Branches",
          icon: Building2,
          path: "/settings/branches",
          breadcrumbs: ["Settings", "Branches"],
          permissionKey: "settingsBranches",
        },
        {
          id: "settings-profile",
          label: "Profile",
          icon: UserCircle,
          path: "/settings/profile",
          breadcrumbs: ["Settings", "Profile"],
          permissionKey: "settingsProfile",
        },
        {
          id: "settings-upgrade",
          label: "Plans",
          icon: CreditCard,
          path: "/settings/upgrade",
          breadcrumbs: ["Settings", "Profile", "Plans"],
          permissionKey: "settingsUpgrade",
          hidden: true,
        },
      ],
    },
  ], []);

  const visibleMenuItems = useMemo(() => {
    return allMenuItems
      .map((item) => {
        if (item.submenu?.length > 0) {
          const visibleSubmenu = item.submenu.filter((sub) => {
            if (sub.hidden) return false;
            const subPermission = permissions[sub.permissionKey];
            return subPermission?.visible !== false && !subPermission?.disabled;
          });

          if (visibleSubmenu.length === 0) {
            return null;
          }

          return {
            ...item,
            submenu: visibleSubmenu,
          };
        }

        if (item.hidden) return false;

        const itemPermission = permissions[item.permissionKey];
        if (itemPermission?.visible === false || itemPermission?.disabled) {
          return null;
        }

        return item;
      })
      .filter(Boolean);
  }, [allMenuItems, permissions]);

  const allAccessibleItems = useMemo(() => {
    return allMenuItems
      .map((item) => {
        if (item.submenu?.length > 0) {
          const accessibleSubmenu = item.submenu.filter((sub) => {
            const subPermission = permissions[sub.permissionKey];
            return subPermission?.visible !== false && !subPermission?.disabled;
          });

          if (accessibleSubmenu.length === 0) {
            return null;
          }

          return {
            ...item,
            submenu: accessibleSubmenu,
          };
        }

        const itemPermission = permissions[item.permissionKey];
        if (itemPermission?.visible === false || itemPermission?.disabled) {
          return null;
        }

        return item;
      })
      .filter(Boolean);
  }, [allMenuItems, permissions]);

  const handleNavigation = useCallback(
    (item) => {
      navigate(item.path);
      setActiveMenu(item.id);
      setBreadcrumbs(item.breadcrumbs);
    },
    [navigate, setActiveMenu, setBreadcrumbs]
  );

  const handleToggleSubmenu = useCallback((id) => {
    isManualToggle.current = true;
    setOpenMenuId((prev) => (prev === id ? "" : id));

    setTimeout(() => {
      isManualToggle.current = false;
    }, 100);
  }, []);

  useEffect(() => {
    const currentPath = location.pathname;

    for (const item of allAccessibleItems) {
      if (item.path === currentPath) {
        setActiveMenu(item.id);
        setBreadcrumbs(item.breadcrumbs);
        return;
      }

      if (item.submenu) {
        const sub = item.submenu.find((s) => s.path === currentPath);
        if (sub) {
          setActiveMenu(sub.id);
          setBreadcrumbs(sub.breadcrumbs);
          setOpenMenuId(item.id);
          return;
        }
      }
    }
  }, [location.pathname, allAccessibleItems, setActiveMenu, setBreadcrumbs]);

  useEffect(() => {
    if (isManualToggle.current) {
      return;
    }

    const parent = allAccessibleItems.find((m) =>
      m.submenu?.some((s) => s.id === activeMenu)
    );

    if (parent && openMenuId !== parent.id) {
      setOpenMenuId(parent.id);
    }
  }, [activeMenu, allAccessibleItems, openMenuId]);

  useEffect(() => {
    const isValid =
      allAccessibleItems.some((m) => m.id === activeMenu) ||
      allAccessibleItems.some((m) =>
        m.submenu?.some((s) => s.id === activeMenu)
      );

    if (!isValid && allAccessibleItems.length > 0) {
      const dashboard = allAccessibleItems.find((m) => m.id === "dashboard");
      const fallbackItem = dashboard || allAccessibleItems[0];

      if (fallbackItem) {
        if (fallbackItem.submenu?.length > 0) {
          const firstSub = fallbackItem.submenu[0];
          setActiveMenu(firstSub.id);
          setBreadcrumbs(firstSub.breadcrumbs);
          navigate(firstSub.path);
        } else {
          setActiveMenu(fallbackItem.id);
          setBreadcrumbs(fallbackItem.breadcrumbs);
          navigate(fallbackItem.path);
        }
      }
    }
  }, [activeMenu, allAccessibleItems, navigate, setActiveMenu, setBreadcrumbs]);

  return (
    <motion.aside
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="h-screen mt-16 bg-white border-r border-gray-200 overflow-hidden"
      animate={{ width: isExpanded ? EXPANDED_WIDTH : COLLAPSED_WIDTH }}
      transition={SIDEBAR_TRANSITION}
    >
      <nav className="pt-6 px-2 flex flex-col gap-2">
        {visibleMenuItems.map((item) => {
          // ⚠️ NEW: Show badge on Settings parent if Plans submenu needs renewal
          const showBadge = 
            isSuperAdmin && 
            needsRenewal && 
            item.id === "settings";

          return (
            <MenuItem
              key={item.id}
              item={item}
              activeMenu={activeMenu}
              isExpanded={isExpanded}
              openMenuId={openMenuId}
              onToggle={handleToggleSubmenu}
              onNavigate={handleNavigation}
              showBadge={showBadge}
            />
          );
        })}
      </nav>
    </motion.aside>
  );
};

export default Sidebar;