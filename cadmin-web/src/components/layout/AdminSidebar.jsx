// cadmin-web/src/components/layout/AdminSidebar.jsx

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
  SlidersHorizontal,
  BadgeIndianRupee,
} from "lucide-react";

import { useMenuStore } from "../../store/useMenuStore";
import {
  useCAdminMenuPermissions,
  useCAdminPermission,
} from "../../hooks/useCAdminPermission";
import { useAdminMode } from "../../store/useAdminModeStore";
import { useCommunicationBadgeStore } from "../../store/useCommunicationBadgeStore";

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
  {
    id: "mp-pricing",
    label: "Pricing",
    icon: BadgeIndianRupee,
    path: "/marketplace/pricing",
    breadcrumbs: ["Marketplace", "Pricing"],
  },
  {
    id: "app-config",
    label: "App Config",
    icon: SlidersHorizontal,
    path: "/app-config/categories",
    breadcrumbs: ["App Config", "Categories"],
    permissionKey: "appConfig",
  },
];

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
  "/communications/broadcast/mobile": {
    parentId: "communications",
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
  "/app-config/categories": {
    parentId: "app-config",
    breadcrumbs: ["App Config", "Categories"],
  },
};

const MARKETPLACE_CHILD_ROUTES = {};

const NON_SIDEBAR_ROUTES = ["/notifications"];

const RedDot = () => (
  <span
    className="
      absolute top-2 right-2
      w-2 h-2 rounded-full bg-red-500
      ring-2 ring-white
    "
  />
);

const MenuItem = ({ item, activeMenu, isExpanded, onNavigate, showBadge }) => {
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

      {showBadge && <RedDot />}
    </motion.button>
  );
};

const AdminSidebar = ({ expanded, onExpandChange }) => {
  const activeMenu = useMenuStore((s) => s.activeMenu);
  const setActiveMenu = useMenuStore((s) => s.setActiveMenu);
  const setBreadcrumbs = useMenuStore((s) => s.setBreadcrumbs);

  const navigate = useNavigate();
  const location = useLocation();

  const permissions = useCAdminMenuPermissions();
  const { isSuperCAdmin } = useCAdminPermission();
  const { isMarketplace, isAdmin } = useAdminMode();

  const pendingTickets = useCommunicationBadgeStore((s) => s.pendingTickets);
  const pendingEnquiries = useCommunicationBadgeStore(
    (s) => s.pendingEnquiries,
  );
  const hasPendingComms = pendingTickets > 0 || pendingEnquiries > 0;

  const [expandedWidth, setExpandedWidth] = useState(getExpandedWidth);

  useEffect(() => {
    const handleResize = () => setExpandedWidth(getExpandedWidth());
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

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

  const visibleMenuItems = useMemo(() => {
    return currentMenuItems.filter((item) => {
      if (item.superAdminOnly) return isSuperCAdmin;
      if (!item.permissionKey) return true;
      const permission = permissions[item.permissionKey];
      return permission === undefined ? true : permission.visible !== false;
    });
  }, [currentMenuItems, permissions, isSuperCAdmin]);

  const handleNavigation = useCallback(
    (item) => {
      navigate(item.path);
      setActiveMenu(item.id);
      setBreadcrumbs(item.breadcrumbs);
    },
    [navigate, setActiveMenu, setBreadcrumbs],
  );

  const handleMouseEnter = useCallback(
    () => onExpandChange(true),
    [onExpandChange],
  );
  const handleMouseLeave = useCallback(
    () => onExpandChange(false),
    [onExpandChange],
  );

  useEffect(() => {
    const currentPath = location.pathname;
    if (NON_SIDEBAR_ROUTES.includes(currentPath)) return;
    if (currentPath === defaultPath) {
      setActiveMenu(defaultMenuId);
      setBreadcrumbs(defaultBreadcrumbs);
      return;
    }
    const childRoute = currentChildRoutes[currentPath];
    if (childRoute) {
      setActiveMenu(childRoute.parentId);
      setBreadcrumbs(childRoute.breadcrumbs);
      return;
    }
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

  useEffect(() => {
    const currentPath = location.pathname;
    if (currentPath === defaultPath) return;
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

    const isPartialMatch = allValidPaths.some((p) => currentPath.startsWith(p));
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

        <div className="flex flex-col" style={{ gap: "clamp(2px, 1vh, 12px)" }}>
          {visibleMenuItems.map((item) => (
            <MenuItem
              key={item.id}
              item={item}
              activeMenu={activeMenu}
              isExpanded={expanded}
              onNavigate={handleNavigation}
              showBadge={item.id === "communications" && hasPendingComms}
            />
          ))}
        </div>
      </nav>
    </motion.aside>
  );
};

export default AdminSidebar;
