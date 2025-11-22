import { useState } from "react";
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

const Sidebar = ({ activeId = "billing", onChange }) => {
  const [hovered, setHovered] = useState(false);
  const [openMenu, setOpenMenu] = useState("sales");

  const expanded = hovered;

  const menuItems = [
    {
      id: "sales",
      label: "Sales",
      icon: Layers,
      submenu: [
        { id: "billing", label: "Billing", icon: FileText },
        { id: "invoices", label: "Invoices", icon: BarChart2 },
      ],
    },

    { id: "purchase", label: "Purchase", icon: ShoppingCart },
    { id: "inventory", label: "Inventory", icon: Box },
    { id: "suppliers", label: "Suppliers", icon: Users },
    { id: "reports", label: "Report", icon: BarChart2 },
    { id: "orders", label: "Orders", icon: ShoppingCart },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  const renderIcon = (Icon, size = 20, color = "black") => (
    <Icon size={size} color={color} strokeWidth={2} />
  );

  return (
    <aside
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`
        h-[calc(0vh-64px)] bg-white border-r transition-all duration-300 
        ${expanded ? "w-44" : "w-20"}
      `}
    >
      <nav className="mt-20 flex-1 space-y-1">
        {menuItems.map((item) => {
          const active =
            item.id === activeId ||
            item.submenu?.some((s) => s.id === activeId);

          const isSales = item.id === "sales";
          const isOpen = openMenu === "sales";

          // HEADER → same rule as other items (black default)
         if (item.type === "header") {
  return (
    <div
      key={item.id}
      className="flex items-center px-4 py-3 ml-8 mr-8 rounded-lg mb-2"
    >
      <span className={`${expanded ? "mr-3" : "mx-auto"}`}>
        {renderIcon(LayoutGrid, 20, "#05015A")}
      </span>

      {expanded && (
        <span className="text-sm font-bold text-[#05015A]">
          {item.label}
        </span>
      )}
    </div>
  );
}

          return (
            <div key={item.id}>
              {/* MAIN ITEM */}
              <button
                onClick={() => {
                  if (isSales) setOpenMenu(isOpen ? "" : "sales");
                  onChange(item.id);
                }}
                className={`
                  flex items-center w-full mt-6 ml-5 mr-5 px-4 py-2 rounded-lg transition
                  ${
                    active
                      ? "bg-[#05015A] text-white"
                      : "text-black hover:bg-[#05015A] hover:text-white"
                  }
                `}
              >
                <span className={`${expanded ? "mr-3" : "mx-auto"}`}>
                  {renderIcon(
                    item.icon,
                    20,
                    active ? "white" : "black"
                  )}
                </span>

                {expanded && (
                  <span className="flex-1 text-left text-sm font-medium">
                    {item.label}
                  </span>
                )}

                {expanded && isSales && (
                  isOpen ? <FiChevronUp /> : <FiChevronDown />
                )}
              </button>

              {/* SUBMENU */}
              {expanded && isSales && isOpen && (
                <div className="ml-12 mt-1 space-y-2">
                  {item.submenu.map((sub) => {
                    const subActive = sub.id === activeId;
                    return (
                      <button
                        key={sub.id}
                        onClick={() => onChange(sub.id)}
                        className={`
                          flex items-center w-full text-sm py-1 transition
                          ${
                            subActive
                              ? "text-[#05015A] font-semibold"
                              : "text-black hover:text-[#05015A]"
                          }
                        `}
                      >
                        {renderIcon(
                          sub.icon,
                          18,
                          subActive ? "#05015A" : "black"
                        )}
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
  