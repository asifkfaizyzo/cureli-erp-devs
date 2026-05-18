// src/components/layout/AppLayout.jsx

import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Outlet, useLocation } from "react-router-dom";

import Sidebar from "./Sidebar";
import TopHeader from "./TopHeader";
import Breadcrumb from "../common/Breadcrumb";
import { useMenuStore } from "../../store/useMenuStore";
import { useSubscriptionStore } from "../../store/useSubscriptionStore";
import { useAuthStore } from "../../store/useAuthStore";
import { useAppMode } from "../../store/useAppModeStore";

const NON_SIDEBAR_ROUTES = {
  "/erp/notifications": {
    breadcrumbs: ["Dashboard", "Notifications"],
    menuId: null,
  },
  "/erp/tickets": {
    breadcrumbs: ["Dashboard", "Support Tickets"],
    menuId: null,
  },
  "/erp/settings/upgrade": {
    breadcrumbs: ["Settings", "Profile", "Plans"],
    menuId: "settings-profile",
  },
};

const AppLayout = () => {
  const location = useLocation();
  const { isMarketplace } = useAppMode();

  const user = useAuthStore((state) => state.user);
  const loadSubscriptionStatus = useSubscriptionStore(
    (s) => s.loadSubscriptionStatus,
  );
  const setBreadcrumbs = useMenuStore((s) => s.setBreadcrumbs);
  const setActiveMenu = useMenuStore((s) => s.setActiveMenu);

  const pageVariants = {
    initial: { opacity: 0, x: 60 },
    animate: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.35, ease: "easeOut" },
    },
    exit: {
      opacity: 0,
      x: -40,
      transition: { duration: 0.25, ease: "easeIn" },
    },
  };

  useEffect(() => {
    if (user?.role === "super_admin") {
      loadSubscriptionStatus();
    }
  }, [user?.role, loadSubscriptionStatus]);

  useEffect(() => {
    const routeConfig = NON_SIDEBAR_ROUTES[location.pathname];
    if (routeConfig) {
      setBreadcrumbs(routeConfig.breadcrumbs);
      if (routeConfig.menuId !== null) {
        setActiveMenu(routeConfig.menuId);
      }
    }
  }, [location.pathname, setBreadcrumbs, setActiveMenu]);

  return (
    // ↓ "group" enables group-data-* variants on all descendants
    <div
      data-theme={isMarketplace ? "marketplace" : "erp"}
      className={`group h-screen w-full flex overflow-hidden ${
        isMarketplace ? "bg-[#010015]" : "bg-gray-50"
      }`}
    >
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden w-full">
        <TopHeader />

        <main
          className={`flex-1 pt-20 px-2 sm:px-4 md:px-6 lg:px-8 pb-4 overflow-y-auto ${
            isMarketplace ? "bg-[#010015]" : ""
          }`}
        >
          <Breadcrumb />

          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="
                mt-2
                w-[96%] sm:w-[100%] md:w-[100%] lg:w-[100%] xl:w-[100%] 2xl:w-[100%]
                mx-auto
              "
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;
