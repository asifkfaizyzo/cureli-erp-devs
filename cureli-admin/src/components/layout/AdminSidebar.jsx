import { memo, useCallback } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  LayoutGrid,
  Users,
  HousePlus,
  Podcast,
  ListChecks,
  Settings,
} from "lucide-react";
import { useMenuStore } from "../../store/useMenuStore";

// ═══════════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════════
const COLLAPSED_WIDTH = 72;
const EXPANDED_WIDTH = 260;

// Unified transition for ALL animated properties
const SIDEBAR_TRANSITION = {
  type: "spring",
  stiffness: 300,
  damping: 30,
  mass: 0.8,
};

// Alternative: Use tween for more predictable timing
// const SIDEBAR_TRANSITION = {
//   duration: 0.28,
//   ease: [0.25, 0.1, 0.25, 1.0],
// };

// ═══════════════════════════════════════════════════════════════════
// MENU ITEMS - Easily extendable
// ═══════════════════════════════════════════════════════════════════
const MENU_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutGrid, path: "/dashboard" },
  { id: "users", label: "Users", icon: Users, path: "/users" },
  { id: "shops", label: "Shops", icon: HousePlus, path: "/shops" },
  { id: "subscriptions", label: "Subscriptions", icon: Podcast, path: "/subscriptions" },
  { id: "audits", label: "Audits", icon: ListChecks, path: "/audits" },
  { id: "settings", label: "Settings", icon: Settings, path: "/settings" },
];

// ═══════════════════════════════════════════════════════════════════
// MENU ITEM COMPONENT - Memoized for performance
// ═══════════════════════════════════════════════════════════════════
const MenuItem = memo(({ item, isActive, isExpanded, onClick }) => {
  const Icon = item.icon;

  return (
    <motion.button
      onClick={onClick}
      className={`
        relative flex items-center
        w-full h-11 rounded-xl
        transition-colors duration-200 ease-out
        focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2
        ${isActive 
          ? "bg-[#05015A] text-white shadow-lg shadow-blue-900/20" 
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
        }
      `}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ duration: 0.15 }}
    >
      {/* 
        ICON CONTAINER 
        - Fixed position from left edge
        - Never moves regardless of expanded state
      */}
      <div 
        className="absolute left-0 w-[56px] h-full flex items-center justify-center"
      >
        <Icon 
          size={20} 
          strokeWidth={2} 
          className="flex-shrink-0"
        />
      </div>

      {/* 
        LABEL 
        - Animates opacity + translateX in sync with sidebar width
        - Uses same transition as sidebar for perfect synchronization
      */}
      <motion.span
        className="absolute left-[44px] text-sm font-medium whitespace-nowrap"
        initial={false}
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
});

MenuItem.displayName = "MenuItem";

// ═══════════════════════════════════════════════════════════════════
// MAIN SIDEBAR COMPONENT
// ═══════════════════════════════════════════════════════════════════
const AdminSidebar = ({ expanded, onExpandChange }) => {
  const activeMenu = useMenuStore((s) => s.activeMenu);
  const setActiveMenu = useMenuStore((s) => s.setActiveMenu);
  const navigate = useNavigate();

  const handleNavigation = useCallback((item) => {
    navigate(item.path);
    setActiveMenu(item.id);
  }, [navigate, setActiveMenu]);

  const handleMouseEnter = useCallback(() => {
    onExpandChange(true);
  }, [onExpandChange]);

  const handleMouseLeave = useCallback(() => {
    onExpandChange(false);
  }, [onExpandChange]);

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
      animate={{ width: expanded ? EXPANDED_WIDTH : COLLAPSED_WIDTH }}
      transition={SIDEBAR_TRANSITION}
    >
      {/* 
        NAVIGATION CONTAINER
        - Uses clamp for responsive gap
        - Max gap prevents explosion on tall screens
      */}
      <nav
        className="flex flex-col h-full pt-6 pb-4 px-2"
        style={{
          gap: "clamp(4px, 1.5vh, 16px)",
        }}
      >
        {/* Menu Items */}
        <div 
          className="flex flex-col"
          style={{ gap: "clamp(2px, 1vh, 12px)" }}
        >
          {MENU_ITEMS.map((item) => (
            <MenuItem
              key={item.id}
              item={item}
              isActive={activeMenu === item.id}
              isExpanded={expanded}
              onClick={() => handleNavigation(item)}
            />
          ))}
        </div>

        {/* Spacer - pushes settings to bottom if needed */}
        {/* <div className="flex-1" /> */}
      </nav>

      {/* 
        Optional: Collapse indicator line 
        Shows a subtle line when collapsed to indicate expandability
      */}
      <motion.div
        className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-8 bg-gray-300 rounded-full"
        initial={false}
        animate={{ opacity: expanded ? 0 : 0.5 }}
        transition={{ duration: 0.2 }}
      />
    </motion.aside>
  );
};

export default memo(AdminSidebar);