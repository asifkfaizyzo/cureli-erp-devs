// src/components/layout/AdminSidebar.jsx

import { useState, useCallback, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import {
  LayoutGrid,
  Users,
  HousePlus,
  Podcast,
  ListChecks,
  Settings,
  ShieldCheck,
  UserStar,
  MessageSquare,
} from "lucide-react";

import { useMenuStore } from "../../store/useMenuStore";

/* ───────────────── constants ───────────────── */
const COLLAPSED_WIDTH = 72;
const EXPANDED_WIDTH = 260;

const SIDEBAR_TRANSITION = {
  type: "spring",
  stiffness: 300,
  damping: 30,
  mass: 0.8,
};

/* ───────────────── Menu Items ───────────────── */
const MENU_ITEMS = [
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
  },
  {
    id: "shops",
    label: "Shops",
    icon: HousePlus,
    path: "/shops",
    breadcrumbs: ["Shops"],
  },
  {
    id: "verification",
    label: "Verification",
    icon: ShieldCheck,
    path: "/verification",
    breadcrumbs: ["Verification"],
  },
  {
    id: "subscriptions",
    label: "Subscriptions",
    icon: Podcast,
    path: "/subscriptions",
    breadcrumbs: ["Subscriptions"],
  },
  {
    id: "audits",
    label: "Audits",
    icon: ListChecks,
    path: "/audits",
    breadcrumbs: ["Audits"],
  },
  {
    id: "admins",
    label: "Admins",
    icon: UserStar,
    path: "/admins",
    breadcrumbs: ["Admins"],
  },
  {
    id: "communications",
    label: "Communications",
    icon: MessageSquare,
    path: "/communications",
    breadcrumbs: ["Communications"],
  },
  {
    id: "settings",
    label: "Settings",
    icon: Settings,
    path: "/settings",
    breadcrumbs: ["Settings"],
  },
];

/* ───────────────── Child routes mapping ───────────────── */
const CHILD_ROUTES = {
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
};

/* ───────────────── Menu Item Component ───────────────── */
const MenuItem = ({ item, activeMenu, isExpanded, onNavigate }) => {
  const Icon = item.icon;
  const isActive = activeMenu === item.id;

  const handleClick = (e) => {
    e.preventDefault();
    onNavigate(item);
  };

  return (
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
    </motion.button>
  );
};

/* ───────────────── Main Sidebar ───────────────── */
const AdminSidebar = ({ expanded, onExpandChange }) => {
  const activeMenu = useMenuStore((s) => s.activeMenu);
  const setActiveMenu = useMenuStore((s) => s.setActiveMenu);
  const setBreadcrumbs = useMenuStore((s) => s.setBreadcrumbs);

  const navigate = useNavigate();
  const location = useLocation();

  const isExpanded = expanded;

  /* ───────────── navigation handler ───────────── */
  const handleNavigation = useCallback(
    (item) => {
      navigate(item.path);
      setActiveMenu(item.id);
      setBreadcrumbs(item.breadcrumbs);
    },
    [navigate, setActiveMenu, setBreadcrumbs]
  );

  const handleMouseEnter = useCallback(() => {
    onExpandChange(true);
  }, [onExpandChange]);

  const handleMouseLeave = useCallback(() => {
    onExpandChange(false);
  }, [onExpandChange]);

  /* 1️⃣ ROUTE → SIDEBAR SYNC */
  useEffect(() => {
    const currentPath = location.pathname;

    // Check child routes first
    const childRoute = CHILD_ROUTES[currentPath];
    if (childRoute) {
      setActiveMenu(childRoute.parentId);
      setBreadcrumbs(childRoute.breadcrumbs);
      return;
    }

    // Check main menu items
    for (const item of MENU_ITEMS) {
      if (item.path === currentPath) {
        setActiveMenu(item.id);
        setBreadcrumbs(item.breadcrumbs);
        return;
      }
    }
  }, [location.pathname, setActiveMenu, setBreadcrumbs]);

  /* 2️⃣ FALLBACK for invalid routes */
  useEffect(() => {
    const currentPath = location.pathname;

    const isValidMain = MENU_ITEMS.some((m) => m.path === currentPath);
    const isValidChild = Object.keys(CHILD_ROUTES).includes(currentPath);

    // Only redirect if path is completely invalid
    if (!isValidMain && !isValidChild) {
      const allValidPaths = [
        ...MENU_ITEMS.map((m) => m.path),
        ...Object.keys(CHILD_ROUTES),
      ];

      // Check if current path starts with any valid path
      const isPartialMatch = allValidPaths.some((p) =>
        currentPath.startsWith(p)
      );

      if (!isPartialMatch) {
        setActiveMenu("dashboard");
        setBreadcrumbs(["Dashboard"]);
        navigate("/dashboard");
      }
    }
  }, [location.pathname, navigate, setActiveMenu, setBreadcrumbs]);

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
      animate={{ width: isExpanded ? EXPANDED_WIDTH : COLLAPSED_WIDTH }}
      transition={SIDEBAR_TRANSITION}
    >
      <nav
        className="flex flex-col h-full pt-6 pb-4 px-2"
        style={{ gap: "clamp(4px, 1.5vh, 16px)" }}
      >
        <div className="flex flex-col" style={{ gap: "clamp(2px, 1vh, 12px)" }}>
          {MENU_ITEMS.map((item) => (
            <MenuItem
              key={item.id}
              item={item}
              activeMenu={activeMenu}
              isExpanded={isExpanded}
              onNavigate={handleNavigation}
            />
          ))}
        </div>
      </nav>

      <motion.div
        className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-8 bg-gray-300 rounded-full"
        animate={{ opacity: isExpanded ? 0 : 0.5 }}
        transition={{ duration: 0.2 }}
      />
    </motion.aside>
  );
};

export default AdminSidebar;