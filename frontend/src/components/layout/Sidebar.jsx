// src/components/layout/Sidebar.jsx
import { useState } from "react";
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
} from "lucide-react";

import { FiChevronDown } from "react-icons/fi";
import { useMenuStore } from "../../store/useMenuStore";

/**
 * Sidebar.jsx
 * - Option B behavior: only one submenu open at a time (ERP standard)
 * - Spring-like easing using a cubic-bezier for a nicer "bounce"
 * - Submenu fade + slide with smooth transitions
 * - Arrow rotates when open
 * - Focus rings removed on buttons (keeps visual clean, still accessible)
 */

const Sidebar = () => {
  const [hovered, setHovered] = useState(false);
  // openMenu stores the id of the currently open parent menu, or "" for none.
  const [openMenu, setOpenMenu] = useState("");

  const activeMenu = useMenuStore((s) => s.activeMenu);
  const setActiveMenu = useMenuStore((s) => s.setActiveMenu);
  const setBreadcrumbs = useMenuStore((s) => s.setBreadcrumbs);

  const navigate = useNavigate();
  const expanded = hovered;

  // ---------------- MENU CONFIG ----------------
  const menuItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutGrid,
      path: "/dashboard",
      breadcrumbs: ["Dashboard"],
      submenu: null,
    },

    {
      id: "sales",
      label: "Sales",
      icon: Layers,
      path: null,
      breadcrumbs: ["Sales"],
      submenu: [
        {
          id: "sales-billing",
          label: "Billing",
          icon: FileText,
          path: "/Salesbilling",
          breadcrumbs: ["Sales", "Billing"],
        },
        {
          id: "sales-invoices",
          label: "Invoices",
          icon: BarChart2,
          path: "/Salesinvoice",
          breadcrumbs: ["Sales", "Invoices"],
        },
      ],
    },

    {
      id: "purchase",
      label: "Purchase",
      icon: ShoppingCart,
      path: null,
      breadcrumbs: ["Purchase"],
      submenu: [
        {
          id: "purchase-billing",
          label: "Billing",
          icon: FileText,
          path: "/purchase-billing",
          breadcrumbs: ["Purchase", "Billing"],
        },
        {
          id: "purchase-invoices",
          label: "Invoices",
          icon: BarChart2,
          path: "/purchase-invoices",
          breadcrumbs: ["Purchase", "Invoices"],
        },
      ],
    },

    { id: "inventory", label: "Inventory", icon: Box, path: "/inventory", breadcrumbs: ["Inventory"], submenu: null },
    { id: "suppliers", label: "Suppliers", icon: Users, path: "/suppliers", breadcrumbs: ["Suppliers"], submenu: null },
    { id: "reports", label: "Report", icon: BarChart2, path: "/reports", breadcrumbs: ["Reports"], submenu: null },
    { id: "orders", label: "Orders", icon: ShoppingCart, path: "/orders", breadcrumbs: ["Orders"], submenu: null },
    { id: "settings", label: "Settings", icon: Settings, path: "/settings", breadcrumbs: ["Settings"], submenu: null },
  ];

  const renderIcon = (Icon, size = 20, color = "black") => (
    <Icon size={size} color={color} strokeWidth={2} />
  );

  // ---------------- NAV HANDLERS ----------------
  const handleNavigation = (item) => {
    if (item.path) {
      navigate(item.path);
      setActiveMenu(item.id);
      setBreadcrumbs(item.breadcrumbs);
      // close any open parent when navigating to a top-level page
      setOpenMenu("");
    }
  };

  const handleSubNavigation = (sub) => {
    if (sub.path) {
      navigate(sub.path);
      setActiveMenu(sub.id);
      setBreadcrumbs(sub.breadcrumbs);
      // keep parent open (UX: user clicked inside it)
    }
  };

  // ---------------- RENDER ----------------
  return (
  <aside
    onMouseEnter={() => setHovered(true)}
    onMouseLeave={() => setHovered(false)}
    className={`
      bg-white border-r border-gray-200 mt-16
      transition-[width] duration-700
      ease-[cubic-bezier(0.34,1.2,0.64,1)]
      ${expanded ? "w-64 xl:w-72" : "w-[65px] sm:w-[70px] md:w-[80px]"}
      overflow-hidden h-screen
    `}
  >
    
    <nav className="flex flex-col justify-evenly gap-3 px-2">
      
      {menuItems.map((item) => {
        const isParent = item.submenu?.length > 0;
        const isOpen = openMenu === item.id;
        const isActive =
          item.id === activeMenu ||
          item.submenu?.some((sub) => sub.id === activeMenu);

        return (
          <div key={item.id}>
            {/* MAIN NAV LINK */} 
            <button
              onClick={() => {
                if (isParent) setOpenMenu(isOpen ? "" : item.id);
                else handleNavigation(item);
              }}
              className="w-full mb-1 min-[1366px]:mb-1 min-[1440px]:mb-2 min-[1920px]:mb-7 min-[2560px]:mb-6 flex justify-center focus:outline-none focus:ring-0"
            >
              <div
                className={`
                  flex  justify-around items-center h-[44px] px-3 py-2 rounded-lg
                  transition-all duration-500
                  ease-[cubic-bezier(0.34,1.56,0.64,1)]
                  ${isActive ? "bg-[#05015A] text-white w-[90%]" : "hover:bg-[#05015A] hover:text-white"}
                `}
                style={{ width: expanded ? "100%" : "85%" }}
                aria-current={isActive ? "page" : undefined}
              >
                <span
                  className={`
                    w-6 h-6 flex items-center justify-center
                    ${expanded ? "mr-3" : "mx-auto"}
                  `}
                >
                  {renderIcon(item.icon, 20, isActive ? "white" : "black")}
                </span>

                {expanded && <span className="flex-1 text-left text-sm font-medium">{item.label}</span>}

                {expanded && isParent && (
                  <FiChevronDown
                    className={`transition-transform duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)] ${isOpen ? "rotate-180" : ""}`}
                    size={18}
                  />
                )}
              </div>
            </button>

            {/* SUBMENU LINKS */}
            {expanded && isParent && isOpen && (
              <div className="ml-10 flex flex-col gap-3 mt-1">
                {item.submenu.map((sub) => {
                  const subActive = sub.id === activeMenu;
                  return (
                    <button
                      key={sub.id}
                      onClick={() => handleSubNavigation(sub)}
                      className={`
                        flex items-center h-[40px] w-full px-2 rounded
                        transition-all duration-300
                        ease-[cubic-bezier(0.22,1,0.36,1)]
                        ${subActive ? "text-[#05015A] font-semibold bg-gray-100" : "hover:bg-gray-100 hover:text-[#05015A]"}
                        focus:outline-none focus:ring-0
                      `}
                      aria-current={subActive ? "page" : undefined}
                    >
                      <span class="w-5 h-5 flex items-center justify-center">
                        {renderIcon(sub.icon, 16, subActive ? "#05015A" : "black")}
                      </span>
                      <span className="ml-2 text-left">{sub.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  </aside>
);

};

export default Sidebar;
