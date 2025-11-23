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
import { FiChevronDown, FiChevronUp } from "react-icons/fi";
import { useMenuStore } from "../../store/useMenuStore";

const Sidebar = () => {
  const [hovered, setHovered] = useState(false);
  const [openMenu, setOpenMenu] = useState("sales");

  const activeMenu = useMenuStore((s) => s.activeMenu);
  const setActiveMenu = useMenuStore((s) => s.setActiveMenu);
  const setBreadcrumbs = useMenuStore((s) => s.setBreadcrumbs);

  const navigate = useNavigate();

  const expanded = hovered;

  // Full menu config with breadcrumb support
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
          id: "billing",
          label: "Billing",
          icon: FileText,
          path: "/billing",
          breadcrumbs: ["Sales", "Billing"],
        },
        {
          id: "invoices",
          label: "Invoices",
          icon: BarChart2,
          path: "/invoice",
          breadcrumbs: ["Sales", "Invoices"],
        },
      ],
    },
    { id: "purchase", label: "Purchase", icon: ShoppingCart, path: "/purchase", breadcrumbs: ["Purchase"], submenu: null },
    { id: "inventory", label: "Inventory", icon: Box, path: "/inventory", breadcrumbs: ["Inventory"], submenu: null },
    { id: "suppliers", label: "Suppliers", icon: Users, path: "/suppliers", breadcrumbs: ["Suppliers"], submenu: null },
    { id: "reports", label: "Report", icon: BarChart2, path: "/reports", breadcrumbs: ["Reports"], submenu: null },
    { id: "orders", label: "Orders", icon: ShoppingCart, path: "/orders", breadcrumbs: ["Orders"], submenu: null },
    { id: "settings", label: "Settings", icon: Settings, path: "/settings", breadcrumbs: ["Settings"], submenu: null },
  ];

  const renderIcon = (Icon, size = 20, color = "black") => (
    <Icon size={size} color={color} strokeWidth={2} />
  );

  const handleNavigation = (item) => {
    if (item.path) {
      navigate(item.path);
      setActiveMenu(item.id);
      setBreadcrumbs(item.breadcrumbs);
    }
  };

  const handleSubNavigation = (sub) => {
    navigate(sub.path);
    setActiveMenu(sub.id);
    setBreadcrumbs(sub.breadcrumbs);
  };

  return (
    <aside
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`
        border-b border-gray-200 mt-16 bg-white border-r transition-all duration-300
        ${expanded ? "w-64" : "w-20"}
      `}
    >
      <nav className="mt-3 flex-1 space-y-1">
        {menuItems.map((item) => {
          const isActive =
            item.id === activeMenu ||
            item.submenu?.some((sub) => sub.id === activeMenu);

          const isSales = item.id === "sales";
          const isOpen = openMenu === "sales";

          return (
            <div key={item.id} className="mb-1">
              {/* MAIN ITEM */}
              <div className="w-full px-3 mt-5">
                <button
                  onClick={() => {
                    if (isSales) {
                      setOpenMenu(isOpen ? "" : "sales");
                    } else {
                      handleNavigation(item);
                    }
                  }}
                  className="w-full"
                >
                  <div
                    className={`
                      flex items-center px-3 py-2 rounded-lg transition-all duration-200
                      ${
                        isActive
                          ? "bg-[#05015A] text-white w-[85%]"
                          : "text-black hover:bg-[#05015A] hover:text-white hover:w-[85%]"
                      }
                    `}
                    style={{
                      width: expanded ? "100%" : "85%",
                    }}
                  >
                    <span className={`${expanded ? "mr-3" : "mx-auto"} w-6 flex-shrink-0`}>
                      {renderIcon(item.icon, 20, isActive ? "white" : "black")}
                    </span>

                    {expanded && (
                      <span className="flex-1 text-left text-sm font-medium">
                        {item.label}
                      </span>
                    )}

                    {expanded && isSales && (isOpen ? <FiChevronUp /> : <FiChevronDown />)}
                  </div>
                </button>
              </div>

              {/* SUBMENU */}
              {expanded && isSales && isOpen && (
                <div className="ml-10 mt-2 space-y-1">
                  {item.submenu.map((sub) => {
                    const subActive = sub.id === activeMenu;

                    return (
                      <button
                        key={sub.id}
                        onClick={() => handleSubNavigation(sub)}
                        className={`
                          flex items-center w-full text-sm py-1 px-2 rounded transition
                          ${
                            subActive
                              ? "text-[#05015A] font-semibold"
                              : "text-black hover:text-[#05015A]"
                          }
                        `}
                      >
                        {renderIcon(sub.icon, 16, subActive ? "#05015A" : "black")}
                        <span className="ml-2">{sub.label}</span>
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
