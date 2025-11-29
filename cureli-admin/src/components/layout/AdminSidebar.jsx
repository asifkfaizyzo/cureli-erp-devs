// src/components/layout/AdminSidebar.jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutGrid,
  Users,
  HousePlus ,
  Podcast,
  ListChecks,
  Settings,
} from "lucide-react";

import { useMenuStore } from "../../store/useMenuStore";

const AdminSidebar = () => {
  const [hovered, setHovered] = useState(false);
  const activeMenu = useMenuStore((s) => s.activeMenu);
  const setActiveMenu = useMenuStore((s) => s.setActiveMenu);
  const navigate = useNavigate();

  const expanded = hovered;

  // ---------------- MENU CONFIG ----------------
  const menuItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutGrid, path: "/dashboard" },
    { id: "users", label: "Users", icon: Users, path: "/users" },
    { id: "shops", label: "Shops", icon: HousePlus , path: "/shops" },
    { id: "subscriptions", label: "Subscriptions", icon: Podcast, path: "/subscriptions" },
    { id: "audits", label: "Audits", icon: ListChecks, path: "/audits" },
    { id: "settings", label: "Settings", icon: Settings, path: "/settings" },
  ];

  const go = (item) => {
    navigate(item.path);
    setActiveMenu(item.id);
  };

  return (
    <aside
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className={`
        bg-white border-r border-gray-200 mt-16 h-screen
        transition-[width] duration-700
        ease-[cubic-bezier(0.34,1.2,0.64,1)]
        ${expanded ? "w-64 xl:w-50" : "w-[65px] sm:w-[70px] md:w-[80px]"}
        overflow-hidden
      `}
    >
      <nav className="flex flex-col gap-2 px-2 pt-4">

        {menuItems.map((item) => {
          const isActive = activeMenu === item.id;

          return (
            <button
              key={item.id}
              onClick={() => go(item)}
              className="
                w-full group flex justify-center
                focus:outline-none focus:ring-0
                mb-1 min-[1366px]:mb-1 min-[1440px]:mb-2 min-[1920px]:mb-7 min-[2560px]:mb-6
              "
            >
              <div
                className={`
                  flex items-center h-[44px] px-3 py-2 rounded-lg
                  w-full transition-all duration-300
                  ${isActive
                    ? "bg-[#05015A] text-white"
                    : "hover:bg-[#05015A] hover:text-white text-black"}
                `}
                style={{ width: expanded ? "100%" : "85%" }}
              >
                {/* ICON */}
                <item.icon
                  size={20}
                  strokeWidth={2}
                  className={`
                    ${isActive ? "text-white" : "text-black group-hover:text-white"}
                    ${expanded ? "mr-3" : "mx-auto"}
                  `}
                />

                {/* LABEL */}
                {expanded && (
                  <span className="text-sm font-medium whitespace-nowrap">
                    {item.label}
                  </span>
                )}
              </div>
            </button>
          );
        })}

      </nav>
    </aside>
  );
};

export default AdminSidebar;
