import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  LayoutGrid,
  Layers,
  FileText,
  ShoppingCart,
  Box,
  Users,
  BarChart2,
  Settings,
  ChevronDown, // Switched to Lucide for consistency
} from "lucide-react";
import { useMenuStore } from "../../store/useMenuStore";

// ═══════════════════════════════════════════════════════════════════
// CONSTANTS & ANIMATION CONFIG (From Source)
// ═══════════════════════════════════════════════════════════════════
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
    transition: { duration: 0.3, ease: "easeInOut" } 
  },
};

// ═══════════════════════════════════════════════════════════════════
// MENU ITEM COMPONENT
// ═══════════════════════════════════════════════════════════════════
const MenuItem = ({ item, activeMenu, isExpanded, openMenuId, onToggle, onNavigate }) => {
  const Icon = item.icon;
  const isParent = item.submenu?.length > 0;
  
  // Check if this item or any of its children are active
  const isSelfActive = activeMenu === item.id;
  const isChildActive = item.submenu?.some((sub) => sub.id === activeMenu);
  const isActive = isSelfActive || isChildActive;
  
  const isOpen = openMenuId === item.id;

  return (
    <div className="flex flex-col">
      <motion.button
        onClick={() => isParent ? onToggle(item.id) : onNavigate(item)}
        className={`
          relative flex items-center
          w-full h-11 rounded-xl
          transition-colors duration-200 ease-out
          focus:outline-none
          ${isActive 
            ? "bg-[#05015A] text-white shadow-lg shadow-blue-900/20" 
            : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
          }
        `}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        transition={{ duration: 0.15 }}
      >
        {/* ICON CONTAINER - Fixed Position */}
        <div className="absolute left-0 w-[56px] h-full flex items-center justify-center">
          <Icon size={20} strokeWidth={2} className="flex-shrink-0" />
        </div>

        {/* LABEL - Animated Opacity/Translate */}
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

        {/* CHEVRON - Only visible when expanded & is parent */}
        {isParent && (
          <motion.div
            className="absolute right-3"
            initial={false}
            animate={{ 
              opacity: isExpanded ? 1 : 0,
              rotate: isOpen ? 180 : 0 
            }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown size={16} />
          </motion.div>
        )}
      </motion.button>

      {/* SUBMENU LIST */}
      <AnimatePresence>
        {isExpanded && isParent && isOpen && (
          <motion.div
            variants={SUBMENU_VARIANTS}
            initial="hidden"
            animate="visible"
            exit="hidden"
            className="flex flex-col gap-1 ml-4 mt-1 pl-4 border-l border-gray-200"
          >
            {item.submenu.map((sub) => {
              const isSubActive = activeMenu === sub.id;
              const SubIcon = sub.icon;
              
              return (
                <motion.button
                  key={sub.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onNavigate(sub);
                  }}
                  className={`
                    flex items-center h-9 w-full px-3 rounded-lg text-sm font-medium
                    transition-colors duration-200
                    ${isSubActive 
                      ? "text-[#05015A] bg-blue-50" 
                      : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"
                    }
                  `}
                  whileHover={{ x: 4 }}
                >
                  <SubIcon size={16} className="mr-2 opacity-70" />
                  <span className="whitespace-nowrap">{sub.label}</span>
                </motion.button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════
// MAIN SIDEBAR
// ═══════════════════════════════════════════════════════════════════
const Sidebar = () => {
  const [hovered, setHovered] = useState(false);
  const [openMenuId, setOpenMenuId] = useState("");
  
  // Store integration
  const activeMenu = useMenuStore((s) => s.activeMenu);
  const setActiveMenu = useMenuStore((s) => s.setActiveMenu);
  const setBreadcrumbs = useMenuStore((s) => s.setBreadcrumbs);
  
  const navigate = useNavigate();
  const isExpanded = hovered;

  // ---------------- DATA ----------------
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutGrid, path: "/dashboard", breadcrumbs: ["Dashboard"], submenu: null },
    {
      id: "sales", label: "Sales", icon: Layers, path: null, breadcrumbs: ["Sales"],
      submenu: [
        { id: "sales-billing", label: "Billing", icon: FileText, path: "/Salesbilling", breadcrumbs: ["Sales", "Billing"] },
        { id: "sales-invoices", label: "Invoices", icon: BarChart2, path: "/Salesinvoice", breadcrumbs: ["Sales", "Invoices"] },
      ],
    },
    {
      id: "purchase", label: "Purchase", icon: ShoppingCart, path: null, breadcrumbs: ["Purchase"],
      submenu: [
        { id: "purchase-billing", label: "Billing", icon: FileText, path: "/purchase-billing", breadcrumbs: ["Purchase", "Billing"] },
        { id: "purchase-invoices", label: "Invoices", icon: BarChart2, path: "/purchase-invoices", breadcrumbs: ["Purchase", "Invoices"] },
      ],
    },
    { id: "inventory", label: "Inventory", icon: Box, path: "/inventory", breadcrumbs: ["Inventory"], submenu: null },
    { id: "suppliers", label: "Suppliers", icon: Users, path: "/suppliers", breadcrumbs: ["Suppliers"], submenu: null },
    { id: "reports", label: "Report", icon: BarChart2, path: "/reports", breadcrumbs: ["Reports"], submenu: null },
    { id: "orders", label: "Orders", icon: ShoppingCart, path: "/orders", breadcrumbs: ["Orders"], submenu: null },
    { id: "settings", label: "Settings", icon: Settings, path: "/settings", breadcrumbs: ["Settings"], submenu: null },
  ];

  // ---------------- HANDLERS ----------------
  const handleNavigation = useCallback((item) => {
    if (item.path) {
      navigate(item.path);
      setActiveMenu(item.id);
      setBreadcrumbs(item.breadcrumbs);
      // Optional: Close parents if clicking a root item
      if (!item.submenu) setOpenMenuId(""); 
    }
  }, [navigate, setActiveMenu, setBreadcrumbs]);

  const handleToggleSubmenu = useCallback((id) => {
    setOpenMenuId(prev => prev === id ? "" : id);
  }, []);

  return (
    <motion.aside
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => {
        setHovered(false);
        // Optional: Collapse submenus when mouse leaves sidebar?
        // setOpenMenuId(""); 
      }}
      className="
        relative flex-shrink-0 h-screen mt-16
        bg-white border-r border-gray-200
        will-change-[width]
        overflow-hidden z-40
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
          {menuItems.map((item) => (
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

      {/* Optional: Collapse indicator line from Source */}
      <motion.div
        className="absolute right-0 top-1/2 -translate-y-1/2 w-0.5 h-8 bg-gray-300 rounded-full"
        initial={false}
        animate={{ opacity: isExpanded ? 0 : 0.5 }}
        transition={{ duration: 0.2 }}
      />
    </motion.aside>
  );
};

export default Sidebar;