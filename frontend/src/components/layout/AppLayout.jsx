// /src/components/layout/AppLayout.jsx
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Outlet, useLocation } from "react-router-dom";

import Sidebar from "./Sidebar";
import TopHeader from "./TopHeader";
import Breadcrumb from "../common/Breadcrumb";
import { useMenuStore } from "../../store/useMenuStore";

const AppLayout = () => {
  const sidebarExpanded = useMenuStore((s) => s.sidebarExpanded);
  const location = useLocation();

  // ⭐ SLIDE FROM RIGHT ANIMATION
  const pageVariants = {
    initial: {
      opacity: 0,
      x: 60,           // slide-in from right
    },
    animate: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.35, ease: "easeOut" },
    },
    exit: {
      opacity: 0,
      x: -40,          // slide-out to left
      transition: { duration: 0.25, ease: "easeIn" },
    },
  };

  return (
    <div className="min-h-screen w-full flex bg-gray-50 overflow-hidden">

      <Sidebar />

      <div className="flex-1 flex flex-col">
        <TopHeader />

        <main className="pt-20 px-8 pb-6 overflow-hidden">
          <Breadcrumb />

          <AnimatePresence mode="wait">
            <motion.div
              key={location.key}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="mt-2 h-full w-full"
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
