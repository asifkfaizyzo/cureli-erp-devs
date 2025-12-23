import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom"; // ✅ added useLocation
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

  return (
    <div className="flex flex-col">
      <motion.button
        onClick={(e) => {
          e.preventDefault();
          if (isParent) onToggle(item.id);
          else onNavigate(item);
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
                  {sub.label}
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

  const activeMenu = useMenuStore((s) => s.activeMenu);
  const setActiveMenu = useMenuStore((s) => s.setActiveMenu);
  const setBreadcrumbs = useMenuStore((s) => s.setBreadcrumbs);

  const navigate = useNavigate();
  const location = useLocation(); // ✅ added

  const isExpanded = hovered;

  /* ───────────── menu data ───────────── */
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutGrid, path: "/dashboard", breadcrumbs: ["Dashboard"] },

    {
      id: "sales",
      label: "Sales",
      icon: Layers,
      submenu: [
        { id: "sales-billing", label: "Billing", icon: FileText, path: "/Salesbilling", breadcrumbs: ["Sales", "Billing"] },
        { id: "sales-invoices", label: "Invoices", icon: BarChart2, path: "/Salesinvoice", breadcrumbs: ["Sales", "Invoices"] },
      ],
    },

    {
      id: "purchase",
      label: "Purchase",
      icon: ShoppingCart,
      submenu: [
        { id: "purchase-billing", label: "Billing", icon: FileText, path: "/purchase-billing", breadcrumbs: ["Purchase", "Billing"] },
        { id: "purchase-invoices", label: "Invoices", icon: BarChart2, path: "/purchase-invoices", breadcrumbs: ["Purchase", "Invoices"] },
      ],
    },

    { id: "inventory", label: "Inventory", icon: Box, path: "/inventory", breadcrumbs: ["Inventory"] },
    { id: "suppliers", label: "Suppliers", icon: Users, path: "/suppliers", breadcrumbs: ["Suppliers"] },

    {
      id: "reports",
      label: "Report",
      icon: BarChart2,
      submenu: [
        { id: "sales-report", label: "Sales Report", icon: Layers, path: "/reports-sales", breadcrumbs: ["Reports", "Sales Report"] },
        { id: "purchase-report", label: "Purchase Report", icon: ShoppingCart, path: "/reports-purchase", breadcrumbs: ["Reports", "Purchase Report"] },
        { id: "inventory-report", label: "Inventory Report", icon: Box, path: "/reports-inventory", breadcrumbs: ["Reports", "Inventory Report"] },
        { id: "finance-report", label: "Finance Report", icon: FileText, path: "/reports-finance", breadcrumbs: ["Reports", "Finance Report"] },
      ],
    },

    { id: "orders", label: "Orders", icon: ShoppingCart, path: "/orders", breadcrumbs: ["Orders"] },
    { id: "settings", label: "Settings", icon: Settings, path: "/settings", breadcrumbs: ["Settings"] },
  ];

  /* ───────────── navigation handler ───────────── */
  const handleNavigation = useCallback(
    (item) => {
      navigate(item.path);
      setActiveMenu(item.id);
      setBreadcrumbs(item.breadcrumbs);
    },
    [navigate, setActiveMenu, setBreadcrumbs]
  );

  const handleToggleSubmenu = (id) => {
    setOpenMenuId((prev) => (prev === id ? "" : id));
  };

  /* 1️⃣ ROUTE → SIDEBAR SYNC (manual URL typing fix) */
  useEffect(() => {
    const currentPath = location.pathname;

    for (const item of menuItems) {
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
          return;
        }
      }
    }
  }, [location.pathname]);

  /* 2️⃣ AUTO-OPEN PARENT WHEN CHILD ACTIVE */
  useEffect(() => {
    const parent = menuItems.find((m) =>
      m.submenu?.some((s) => s.id === activeMenu)
    );
    if (parent) setOpenMenuId(parent.id);
  }, [activeMenu]);

  /* 3️⃣ DASHBOARD FALLBACK (primary focus rule) */
  useEffect(() => {
    const isValid =
      menuItems.some((m) => m.id === activeMenu) ||
      menuItems.some((m) =>
        m.submenu?.some((s) => s.id === activeMenu)
      );

    if (!isValid) {
      const dashboard = menuItems.find((m) => m.id === "dashboard");
      setActiveMenu(dashboard.id);
      setBreadcrumbs(dashboard.breadcrumbs);
      navigate(dashboard.path);
    }
  }, [activeMenu]);

  return (
    <motion.aside
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="h-screen mt-16 bg-white border-r border-gray-200 overflow-hidden"
      animate={{ width: isExpanded ? EXPANDED_WIDTH : COLLAPSED_WIDTH }}
      transition={SIDEBAR_TRANSITION}
    >
      <nav className="pt-6 px-2 flex flex-col gap-2">
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
      </nav>
    </motion.aside>
  );
};

export default Sidebar;
