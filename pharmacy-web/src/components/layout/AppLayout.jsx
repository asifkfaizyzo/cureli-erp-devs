// src/components/layout/AppLayout.jsx

import React, { useEffect, useRef } from "react";
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

// ─── Page content transition (within same mode) ─────────────────
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

// ─── Mode switch overlay (cross-fade between ERP ↔ Marketplace) ─
const modeOverlayVariants = {
  initial: { opacity: 1 },
  animate: { opacity: 0, transition: { duration: 0.5, ease: "easeOut" } },
  exit: { opacity: 0 },
};

const AppLayout = () => {
  const location = useLocation();
  const { isMarketplace } = useAppMode();

  // Track previous mode to detect actual mode switches
  const prevModeRef = useRef(isMarketplace);
  const isModeSwitch = prevModeRef.current !== isMarketplace;

  // Update ref after render — we need the stale value during this render
  useEffect(() => {
    prevModeRef.current = isMarketplace;
  });

  const user = useAuthStore((state) => state.user);
  const loadSubscriptionStatus = useSubscriptionStore(
    (s) => s.loadSubscriptionStatus,
  );
  const setBreadcrumbs = useMenuStore((s) => s.setBreadcrumbs);
  const setActiveMenu = useMenuStore((s) => s.setActiveMenu);

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
    <motion.div
      data-theme={isMarketplace ? "marketplace" : "erp"}
      // Animate the background color on mode switch
      animate={{
        backgroundColor: isMarketplace ? "#010015" : "#f9fafb",
      }}
      transition={{ duration: 0.4, ease: "easeInOut" }}
      className="group h-screen w-full flex overflow-hidden"
    >
      {/* ── Mode switch flash overlay ──────────────────────────────
          Renders a full-screen cover that immediately appears opaque
          on mode switch then fades out — hides the jarring mid-state
          where old sidebar content is visible against new background.
      ─────────────────────────────────────────────────────────── */}
      <AnimatePresence>
        {isModeSwitch && (
          <motion.div
            key={isMarketplace ? "to-marketplace" : "to-erp"}
            variants={modeOverlayVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            className="fixed inset-0 z-[100] pointer-events-none"
            style={{
              backgroundColor: isMarketplace ? "#010015" : "#f9fafb",
            }}
          />
        )}
      </AnimatePresence>

      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden w-full">
        <TopHeader />

        <motion.main
          // Animate main content area background too
          animate={{
            backgroundColor: isMarketplace ? "#010015" : "transparent",
          }}
          transition={{ duration: 0.4, ease: "easeInOut" }}
          className="flex-1 pt-20 px-2 sm:px-4 md:px-6 lg:px-8 pb-4 overflow-y-auto"
        >
          <Breadcrumb />

          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="mt-2 w-[96%] sm:w-[100%] mx-auto"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </motion.main>
      </div>
    </motion.div>
  );
};

export default AppLayout;