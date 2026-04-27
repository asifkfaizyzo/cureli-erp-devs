// cureli-admin/src/components/layout/AppLayout.jsx

import React, { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Outlet, useLocation } from "react-router-dom";
import { useSSENotifications } from "../../hooks/useSSENotifications";

import Sidebar from "./AdminSidebar";
import TopHeader from "./AdminHeader";
import Breadcrumb from "../common/Breadcrumb";
import { useMenuStore } from "../../store/useMenuStore";

/**
 * Route-to-breadcrumb mapping for pages NOT in the sidebar
 * Add any page that isn't navigated to via sidebar here
 */
const NON_SIDEBAR_ROUTES = {
  "/notifications": {
    breadcrumbs: ["Dashboard", "Notifications"],
    menuId: null,
  },
};

const AppLayout = () => {
  useSSENotifications();
  const location = useLocation();
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  const setBreadcrumbs = useMenuStore((s) => s.setBreadcrumbs);
  const setActiveMenu = useMenuStore((s) => s.setActiveMenu);

  const handleSidebarExpand = useCallback((value) => {
    setSidebarExpanded(value);
  }, []);

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.3, ease: "easeOut" },
    },
    exit: {
      opacity: 0,
      y: -10,
      transition: { duration: 0.15 },
    },
  };

  // Auto-set breadcrumbs for non-sidebar routes
  useEffect(() => {
    const routeConfig = NON_SIDEBAR_ROUTES[location.pathname];

    if (routeConfig) {
      // Set breadcrumbs for non-sidebar routes
      setBreadcrumbs(routeConfig.breadcrumbs);

      // Only update active menu if explicitly set (not null)
      // If menuId is null, we don't highlight any sidebar item
      if (routeConfig.menuId !== null) {
        setActiveMenu(routeConfig.menuId);
      }
    }
  }, [location.pathname, setBreadcrumbs, setActiveMenu]);

  return (
    <div className="h-screen w-full flex flex-col bg-gray-50">
      {/* Header */}
      <header className="h-16 flex-shrink-0 z-50">
        <TopHeader />
      </header>

      {/* Body */}
      <div className="flex-1 flex overflow-hidden">
        <Sidebar
          expanded={sidebarExpanded}
          onExpandChange={handleSidebarExpand}
        />

        {/* Main Content - Scrollable */}
        <main className="flex-1 overflow-y-auto">
          <div className="px-2 sm:px-6 lg:px-8 pt-2">
            {/* Breadcrumb */}
            <div className="mb-4">
              <Breadcrumb />
            </div>

            {/* Page Content */}
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={location.pathname}
                variants={pageVariants}
                initial="initial"
                animate="animate"
                exit="exit"
              >
                <Outlet />
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;