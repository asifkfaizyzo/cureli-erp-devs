// src/components/layout/AdminSidebar.jsx

import { useState, useCallback, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutGrid,
  Users,
  HousePlus,
  CreditCard,
  ListChecks,
  Settings,
  ShieldCheck,
  UserStar,
  MessageSquare,
  ClipboardList,
  Pill,  
  ShoppingBag, 

} from "lucide-react";

import { useMenuStore } from "../../store/useMenuStore";
import {
  useCAdminMenuPermissions,
  useCAdminPermission,
} from "../../hooks/useCAdminPermission";
import { useAdminMode } from "../../store/useAdminModeStore";

// ============================================
// SIDEBAR WIDTH CONFIG
// ============================================
const COLLAPSED_WIDTH = 72;

const EXPANDED_WIDTH_CONFIG = {
  "2xl": 280,
  xl: 220,
  lg: 200,
  md: 180,
  sm: 160,
  default: 200,
};

const getExpandedWidth = () => {
  if (typeof window === "undefined") return EXPANDED_WIDTH_CONFIG.default;
  const width = window.innerWidth;
  if (width >= 1536) return EXPANDED_WIDTH_CONFIG["2xl"];
  if (width >= 1280) return EXPANDED_WIDTH_CONFIG["xl"];
  if (width >= 1024) return EXPANDED_WIDTH_CONFIG["lg"];
  if (width >= 768) return EXPANDED_WIDTH_CONFIG["md"];
  return EXPANDED_WIDTH_CONFIG["sm"];
};

const SIDEBAR_TRANSITION = {
  type: "spring",
  stiffness: 300,
  damping: 30,
  mass: 0.8,
};

// ============================================
// ADMIN MENU ITEMS (existing)
// ============================================
const ADMIN_MENU_ITEMS = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutGrid,
    path: "/dashboard",
    breadcrumbs: ["Dashboard"],
  },
  {
    id: "users",
    label: "Users",
    icon: Users,
    path: "/users",
    breadcrumbs: ["Users"],
    permissionKey: "users",
  },
  {
    id: "shops",
    label: "Shops",
    icon: HousePlus,
    path: "/shops",
    breadcrumbs: ["Shops"],
    permissionKey: "shops",
  },
  {
    id: "orders",
    label: "Orders",
    icon: ClipboardList,
    path: "/orders",
    breadcrumbs: ["Orders"],
  },
  {
    id: "master-medicines",
    label: "Medicine Catalog",
    icon: Pill,
    path: "/master-medicines",
    breadcrumbs: ["Master Medicines"],
    permissionKey: "masterMedicines",
  },
  {
    id: "verification",
    label: "Verification",
    icon: ShieldCheck,
    path: "/verification",
    breadcrumbs: ["Verification"],
    permissionKey: "verifications",
  },
  {
    id: "subscriptions",
    label: "Subscriptions",
    icon: CreditCard,
    path: "/subscriptions",
    breadcrumbs: ["Subscriptions"],
    permissionKey: "subscriptions",
  },
  {
    id: "communications",
    label: "Communications",
    icon: MessageSquare,
    path: "/communications",
    breadcrumbs: ["Communications"],
    permissionKey: "communications",
  },
  {
    id: "admins",
    label: "Admins",
    icon: UserStar,
    path: "/admins",
    breadcrumbs: ["Admins"],
    permissionKey: "admins",
  },
  {
    id: "audits",
    label: "Audits",
    icon: ListChecks,
    path: "/audits",
    breadcrumbs: ["Audits"],
    permissionKey: "audit",
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    path: "/settings",
    breadcrumbs: ["Settings"],
    permissionKey: "settings",
  },
];

// ============================================
// MARKETPLACE MENU ITEMS
// ============================================

const MARKETPLACE_MENU_ITEMS = [
  {
    id: "mp-dashboard",
    label: "Dashboard",
    icon: LayoutGrid,
    path: "/marketplace/dashboard",
    breadcrumbs: ["Marketplace", "Dashboard"],
  },
  {
    id: "mp-users",
    label: "Users",
    icon: Users,
    path: "/marketplace/users",
    breadcrumbs: ["Marketplace", "Users"],
  },
  {
  id: "mp-shops",
  label: "Shops",
  icon: HousePlus,
  path: "/marketplace/shops",
  breadcrumbs: ["Marketplace", "Shops"],
},
  {
    id: "mp-orders",
    label: "Orders",
    icon: ShoppingBag,
    path: "/marketplace/orders",
    breadcrumbs: ["Marketplace", "Orders"],
  },
];

// ============================================
// ADMIN CHILD ROUTES
// ============================================
const ADMIN_CHILD_ROUTES = {
  "/communications/tickets": {
    parentId: "communications",
    breadcrumbs: ["Communications", "Tickets"],
  },
  "/communications/enquiries": {
    parentId: "communications",
    breadcrumbs: ["Communications", "Enquiries"],
  },
  "/communications/broadcast": {
    parentId: "communications",
    breadcrumbs: ["Communications", "Broadcast"],
  },
  "/communications/broadcast/in-app": {
    parentId: "communications",
    breadcrumbs: ["Communications", "Broadcast", "In-App"],
  },

  // ✅ ADD THIS ENTRY
  "/communications/broadcast/mobile": {
    parentId:    "communications",
    breadcrumbs: ["Communications", "Broadcast", "Mobile Push"],
  },

  "/subscriptions/manage": {
    parentId: "subscriptions",
    breadcrumbs: ["Subscriptions", "Plans"],
  },
  "/orders/sessions": {
    parentId: "orders",
    breadcrumbs: ["Orders", "Sessions"],
  },
  "/orders/pending": {
    parentId: "orders",
    breadcrumbs: ["Orders", "Pending"],
  },
  "/orders/completed": {
    parentId: "orders",
    breadcrumbs: ["Orders", "Completed"],
  },
  "/orders/details": {
    parentId: "orders",
    breadcrumbs: ["Orders", "Details"],
  },
};

// ============================================
// MARKETPLACE CHILD ROUTES
// ============================================
const MARKETPLACE_CHILD_ROUTES = {
  // Add child routes as marketplace grows
  // "/marketplace/users/:id": {
  //   parentId: "mp-users",
  //   breadcrumbs: ["Marketplace", "Users", "Details"],
  // },
};

// ============================================
// NON-SIDEBAR ROUTES (no active highlight)
// ============================================
const NON_SIDEBAR_ROUTES = ["/notifications"];

// ============================================
// MENU ITEM COMPONENT
// ============================================
const MenuItem = ({ item, activeMenu, isExpanded, onNavigate }) => {
  const Icon = item.icon;
  const isActive = activeMenu === item.id;

  return (
    <motion.button
      onClick={(e) => {
        e.preventDefault();
        onNavigate(item);
      }}
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
    </motion.button>
  );
};

// ============================================
// MAIN SIDEBAR COMPONENT
// ============================================
const AdminSidebar = ({ expanded, onExpandChange }) => {
  const activeMenu = useMenuStore((s) => s.activeMenu);
  const setActiveMenu = useMenuStore((s) => s.setActiveMenu);
  const setBreadcrumbs = useMenuStore((s) => s.setBreadcrumbs);

  const navigate = useNavigate();
  const location = useLocation();

  const permissions = useCAdminMenuPermissions();
  const { isSuperCAdmin } = useCAdminPermission();
  const { isMarketplace, isAdmin } = useAdminMode();

  const [expandedWidth, setExpandedWidth] = useState(getExpandedWidth);

  useEffect(() => {
    const handleResize = () => setExpandedWidth(getExpandedWidth());
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ============================================
  // PICK MENU + CHILD ROUTES based on active module
  // ============================================
  const currentMenuItems = isMarketplace
    ? MARKETPLACE_MENU_ITEMS
    : ADMIN_MENU_ITEMS;

  const currentChildRoutes = isMarketplace
    ? MARKETPLACE_CHILD_ROUTES
    : ADMIN_CHILD_ROUTES;

  const defaultMenuId = isMarketplace ? "mp-users" : "dashboard";
  const defaultPath = isMarketplace ? "/marketplace/users" : "/dashboard";
  const defaultBreadcrumbs = isMarketplace
    ? ["Marketplace", "Users"]
    : ["Dashboard"];

  // ============================================
  // VISIBLE MENU ITEMS (permission filtered)
  // ============================================
  const visibleMenuItems = useMemo(() => {
    return currentMenuItems.filter((item) => {
      if (item.superAdminOnly) return isSuperCAdmin;
      if (!item.permissionKey) return true;
      const permission = permissions[item.permissionKey];
      return permission === undefined ? true : permission.visible !== false;
    });
  }, [currentMenuItems, permissions, isSuperCAdmin]);

  // ============================================
  // NAVIGATION HANDLER
  // ============================================
  const handleNavigation = useCallback(
    (item) => {
      navigate(item.path);
      setActiveMenu(item.id);
      setBreadcrumbs(item.breadcrumbs);
    },
    [navigate, setActiveMenu, setBreadcrumbs]
  );

  const handleMouseEnter = useCallback(
    () => onExpandChange(true),
    [onExpandChange]
  );
  const handleMouseLeave = useCallback(
    () => onExpandChange(false),
    [onExpandChange]
  );

  // ============================================
  // ROUTE → SIDEBAR SYNC
  // ============================================
  useEffect(() => {
    const currentPath = location.pathname;

    if (NON_SIDEBAR_ROUTES.includes(currentPath)) return;

    // Check default path
    if (currentPath === defaultPath) {
      setActiveMenu(defaultMenuId);
      setBreadcrumbs(defaultBreadcrumbs);
      return;
    }

    // Check child routes
    const childRoute = currentChildRoutes[currentPath];
    if (childRoute) {
      setActiveMenu(childRoute.parentId);
      setBreadcrumbs(childRoute.breadcrumbs);
      return;
    }

    // Check main menu items
    for (const item of visibleMenuItems) {
      if (item.path === currentPath) {
        setActiveMenu(item.id);
        setBreadcrumbs(item.breadcrumbs);
        return;
      }
    }
  }, [
    location.pathname,
    setActiveMenu,
    setBreadcrumbs,
    visibleMenuItems,
    currentChildRoutes,
    defaultPath,
    defaultMenuId,
    defaultBreadcrumbs,
  ]);

  // ============================================
  // FALLBACK FOR INVALID / UNMATCHED ROUTES
  // ============================================
  useEffect(() => {
    const currentPath = location.pathname;

    if (currentPath === defaultPath) return;

    // Don't redirect if we're on the other module's routes
    // (the header switch handler will navigate us)
    if (isMarketplace && !currentPath.startsWith("/marketplace")) return;
    if (isAdmin && currentPath.startsWith("/marketplace")) return;

    const isValidMain = visibleMenuItems.some((m) => m.path === currentPath);
    const isValidChild = Object.keys(currentChildRoutes).includes(currentPath);
    const isNonSidebarRoute = NON_SIDEBAR_ROUTES.includes(currentPath);

    if (isValidMain || isValidChild || isNonSidebarRoute) return;

    const allValidPaths = [
      ...visibleMenuItems.map((m) => m.path),
      ...Object.keys(currentChildRoutes),
      ...NON_SIDEBAR_ROUTES,
    ];

    const isPartialMatch = allValidPaths.some((p) =>
      currentPath.startsWith(p)
    );

    if (!isPartialMatch) {
      setActiveMenu(defaultMenuId);
      setBreadcrumbs(defaultBreadcrumbs);
      navigate(defaultPath);
    }
  }, [
    location.pathname,
    navigate,
    setActiveMenu,
    setBreadcrumbs,
    visibleMenuItems,
    currentChildRoutes,
    defaultPath,
    defaultMenuId,
    defaultBreadcrumbs,
    isMarketplace,
    isAdmin,
  ]);

  // ============================================
  // RENDER
  // ============================================
  return (
    <motion.aside
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className="
        relative flex-shrink-0 h-full
        bg-white border-r border-gray-200
        will-change-[width]
        overflow-hidden
      "
      initial={false}
      animate={{ width: expanded ? expandedWidth : COLLAPSED_WIDTH }}
      transition={SIDEBAR_TRANSITION}
    >
      <nav
        className="flex flex-col h-full pt-2 pb-4 px-2 overflow-y-auto sidebar-nav"
        style={{ gap: "clamp(4px, 1.5vh, 16px)" }}
      >
        {/* Module label when expanded */}
        <motion.div
          className="px-2 pt-1 pb-2"
          animate={{
            opacity: expanded ? 1 : 0,
            height: expanded ? "auto" : 0,
          }}
          transition={SIDEBAR_TRANSITION}
        >
          {expanded && (
            <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              {isMarketplace ? "Marketplace" : "Administration"}
            </span>
          )}
        </motion.div>

        <div
          className="flex flex-col"
          style={{ gap: "clamp(2px, 1vh, 12px)" }}
        >
          {visibleMenuItems.map((item) => (
            <MenuItem
              key={item.id}
              item={item}
              activeMenu={activeMenu}
              isExpanded={expanded}
              onNavigate={handleNavigation}
            />
          ))}
        </div>
      </nav>
    </motion.aside>
  );
};

export default AdminSidebar;