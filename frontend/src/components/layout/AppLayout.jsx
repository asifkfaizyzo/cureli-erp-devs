import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Outlet, useLocation } from "react-router-dom";

import Sidebar from "./Sidebar";
import TopHeader from "./TopHeader";
import Breadcrumb from "../common/Breadcrumb";
import { useMenuStore } from "../../store/useMenuStore";

const AppLayout = () => {
  const location = useLocation();

  // ⭐ SLIDE FROM RIGHT ANIMATION (unchanged)
  const pageVariants = {
    initial: { opacity: 0, x: 60 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.35, ease: "easeOut" } },
    exit: { opacity: 0, x: -40, transition: { duration: 0.25, ease: "easeIn" } },
  };

  return (
    /* ✅ lock full viewport & disable scrolling */
    <div className="h-screen w-full flex bg-gray-50 overflow-hidden">

      {/* Sidebar remains hover-expandable (unchanged behavior) */}
      <Sidebar />

      {/* RIGHT SIDE CONTENT — responsive but not stretched */}
      <div className="flex-1 flex flex-col overflow-hidden w-full">

        {/* Top header stays fixed (unchanged functionality) */}
        <TopHeader />

        <main className="flex-1 mt-5 pt-16 px-2 sm:px-4 md:px-6 lg:px-8 pb-4 overflow-hidden">

          {/* Breadcrumb unchanged */}
          <Breadcrumb />

          {/* ✅ ROUTED PAGE CONTAINER FIXED RESPONSIVE CENTERING (no stretch, no scroll) */}
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
                h-full
                overflow-hidden
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
