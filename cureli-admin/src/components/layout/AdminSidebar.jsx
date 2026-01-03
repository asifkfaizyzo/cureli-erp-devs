import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  MoreHorizontal,
  Ticket,
  Mail,
  ChevronDown,
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

const SUBMENU_VARIANTS = {
  hidden: { height: 0, opacity: 0, overflow: "hidden" },
  visible: {
    height: "auto",
    opacity: 1,
    transition: { duration: 0.25, ease: "easeInOut" },
  },
};

/* ───────────────── Menu Items ───────────────── */
const MENU_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutGrid, path: "/dashboard" },
  { id: "users", label: "Users", icon: Users, path: "/users" },
  { id: "shops", label: "Shops", icon: HousePlus, path: "/shops" },
  { id: "verification", label: "Verification", icon: ShieldCheck, path: "/verification" },
  { id: "subscriptions", label: "Subscriptions", icon: Podcast, path: "/subscriptions" },
  { id: "audits", label: "Audits", icon: ListChecks, path: "/audits" },
  { id: "admins", label: "Admins", icon: UserStar, path: "/admins" },
  { id: "settings", label: "Settings", icon: Settings, path: "/settings" },
  {
    id: "communication",
    label: "communication",
    icon: MoreHorizontal,
    submenu: [
      { id: "tickets", label: "Tickets", icon: Ticket, path: "/tickets" },
      { id: "enquiry", label: "Enquiry", icon: Mail, path: "/enquires" },
    ],
  },
];

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

/* ───────────────── Main Sidebar ───────────────── */
const AdminSidebar = ({ expanded, onExpandChange }) => {
  const [openMenuId, setOpenMenuId] = useState("");

  const isManualToggle = useRef(false);

  const activeMenu = useMenuStore((s) => s.activeMenu);
  const setActiveMenu = useMenuStore((s) => s.setActiveMenu);

  const navigate = useNavigate();
  const location = useLocation();

  const isExpanded = expanded;

  /* ───────────── navigation handler ───────────── */
  const handleNavigation = useCallback(
    (item) => {
      navigate(item.path);
      setActiveMenu(item.id);
    },
    [navigate, setActiveMenu]
  );

  const handleToggleSubmenu = useCallback((id) => {
    isManualToggle.current = true;
    setOpenMenuId((prev) => (prev === id ? "" : id));

    setTimeout(() => {
      isManualToggle.current = false;
    }, 100);
  }, []);

  const handleMouseEnter = useCallback(() => {
    onExpandChange(true);
  }, [onExpandChange]);

  const handleMouseLeave = useCallback(() => {
    onExpandChange(false);
    setOpenMenuId("");
  }, [onExpandChange]);

  /* 1️⃣ ROUTE → SIDEBAR SYNC + AUTO-OPEN PARENT */
  useEffect(() => {
    const currentPath = location.pathname;

    for (const item of MENU_ITEMS) {
      if (item.path === currentPath) {
        setActiveMenu(item.id);
        return;
      }

      if (item.submenu) {
        const sub = item.submenu.find((s) => s.path === currentPath);
        if (sub) {
          setActiveMenu(sub.id);
          setOpenMenuId(item.id);
          return;
        }
      }
    }
  }, [location.pathname, setActiveMenu]);

  /* 2️⃣ AUTO-OPEN PARENT WHEN CHILD ACTIVE */
  useEffect(() => {
    if (isManualToggle.current) {
      return;
    }

    const parent = MENU_ITEMS.find((m) =>
      m.submenu?.some((s) => s.id === activeMenu)
    );

    if (parent && openMenuId !== parent.id) {
      setOpenMenuId(parent.id);
    }
  }, [activeMenu, openMenuId]);

  /* 3️⃣ DASHBOARD FALLBACK */
  useEffect(() => {
    const isValid =
      MENU_ITEMS.some((m) => m.id === activeMenu) ||
      MENU_ITEMS.some((m) => m.submenu?.some((s) => s.id === activeMenu));

    if (!isValid) {
      setActiveMenu("dashboard");
      navigate("/dashboard");
    }
  }, [activeMenu, navigate, setActiveMenu]);

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
        <div
          className="flex flex-col"
          style={{ gap: "clamp(2px, 1vh, 12px)" }}
        >
          {MENU_ITEMS.map((item) => (
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
