// src/components/layout/Sidebar.jsx

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
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
          <Icon size={20} />
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

              return (
                <motion.button
                  key={sub.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigate(sub);
                  }}
                  className={`
                    flex items-center h-9 px-3 rounded-lg text-sm
                    ${
                      isSubActive
                        ? "bg-blue-50 text-[#05015A]"
                        : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
                    }
                  `}
                  whileHover={{ x: 4 }}
                >
                  <SubIcon size={16} className="mr-2 opacity-70" />
                  <span>{sub.label}</span>
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

  const isExpanded = hovered;

  /* ───────────── menu data with permission keys ───────────── */
  const menuItems = useMemo(() => [
    // ════════════════════════════════════════════════════════════
    // DASHBOARD
    // ════════════════════════════════════════════════════════════
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutGrid,
      path: "/dashboard",
      breadcrumbs: ["Dashboard"],
      permissionKey: "dashboard",
    },

    // ════════════════════════════════════════════════════════════
    // SALES
    // ════════════════════════════════════════════════════════════
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

    // ════════════════════════════════════════════════════════════
    // PURCHASE
    // ════════════════════════════════════════════════════════════
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

    // ════════════════════════════════════════════════════════════
    // INVENTORY
    // ════════════════════════════════════════════════════════════
    {
      id: "inventory",
      label: "Inventory",
      icon: Box,
      path: "/inventory",
      breadcrumbs: ["Inventory"],
      permissionKey: "inventory",
    },

    // ════════════════════════════════════════════════════════════
    // SUPPLIERS
    // ════════════════════════════════════════════════════════════
    {
      id: "suppliers",
      label: "Suppliers",
      icon: Users,
      path: "/suppliers",
      breadcrumbs: ["Suppliers"],
      permissionKey: "suppliers",
    },

    // ════════════════════════════════════════════════════════════
    // REPORTS
    // ════════════════════════════════════════════════════════════
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

    // ════════════════════════════════════════════════════════════
    // SETTINGS (with submenu)
    // ════════════════════════════════════════════════════════════
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
      label: "Upgrade Plan",
      icon: CreditCard,
      path: "/settings/upgrade",
      breadcrumbs: ["Settings", "Upgrade Plan"],
      permissionKey: "settingsUpgrade",
    },
  ],
},
  ], []);

  /* ───────────── Filter menu items based on permissions ───────────── */
  const accessibleMenuItems = useMemo(() => {
    return menuItems
      .map((item) => {
        // Handle items with submenu
        if (item.submenu?.length > 0) {
          const accessibleSubmenu = item.submenu.filter((sub) => {
            const subPermission = permissions[sub.permissionKey];
            // Show if visible and not disabled
            return subPermission?.visible !== false && !subPermission?.disabled;
          });

          // If no accessible submenu items, hide the parent
          if (accessibleSubmenu.length === 0) {
            return null;
          }

          return {
            ...item,
            submenu: accessibleSubmenu,
          };
        }

        // Handle single items
        const itemPermission = permissions[item.permissionKey];

        // Hide if not visible or disabled
        if (itemPermission?.visible === false || itemPermission?.disabled) {
          return null;
        }

        return item;
      })
      .filter(Boolean);
  }, [menuItems, permissions]);

  /* ───────────── navigation handler ───────────── */
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

  /* 1️⃣ ROUTE → SIDEBAR SYNC + AUTO-OPEN PARENT */
  useEffect(() => {
    const currentPath = location.pathname;

    for (const item of accessibleMenuItems) {
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
  }, [location.pathname, accessibleMenuItems, setActiveMenu, setBreadcrumbs]);

  /* 2️⃣ AUTO-OPEN PARENT WHEN CHILD ACTIVE */
  useEffect(() => {
    if (isManualToggle.current) {
      return;
    }

    const parent = accessibleMenuItems.find((m) =>
      m.submenu?.some((s) => s.id === activeMenu)
    );

    if (parent && openMenuId !== parent.id) {
      setOpenMenuId(parent.id);
    }
  }, [activeMenu, accessibleMenuItems, openMenuId]);

  /* 3️⃣ DASHBOARD FALLBACK */
  useEffect(() => {
    const isValid =
      accessibleMenuItems.some((m) => m.id === activeMenu) ||
      accessibleMenuItems.some((m) =>
        m.submenu?.some((s) => s.id === activeMenu)
      );

    if (!isValid && accessibleMenuItems.length > 0) {
      const dashboard = accessibleMenuItems.find((m) => m.id === "dashboard");
      const fallbackItem = dashboard || accessibleMenuItems[0];

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
  }, [activeMenu, accessibleMenuItems, navigate, setActiveMenu, setBreadcrumbs]);

  return (
    <motion.aside
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="h-screen mt-16 bg-white border-r border-gray-200 overflow-hidden"
      animate={{ width: isExpanded ? EXPANDED_WIDTH : COLLAPSED_WIDTH }}
      transition={SIDEBAR_TRANSITION}
    >
      <nav className="pt-6 px-2 flex flex-col gap-2">
        {accessibleMenuItems.map((item) => (
          <MenuItem
            key={item.id}
            item={item}
            activeMenu={activeMenu}
            isExpanded={isExpanded}
            openMenuId={openMenuId}
            onToggle={handleToggleSubmenu}
            onNavigate={handleNavigation}
          />
        ))}
      </nav>
    </motion.aside>
  );
};

export default Sidebar;