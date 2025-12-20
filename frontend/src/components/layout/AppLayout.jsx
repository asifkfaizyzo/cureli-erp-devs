import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Outlet, useLocation } from "react-router-dom";

import Sidebar from "./Sidebar";
import TopHeader from "./TopHeader";
import Breadcrumb from "../common/Breadcrumb";
import { useMenuStore } from "../../store/useMenuStore";

const AppLayout = () => {
  const location = useLocation();

  const pageVariants = {
    initial: { opacity: 0, x: 60 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.35, ease: "easeOut" } },
    exit: { opacity: 0, x: -40, transition: { duration: 0.25, ease: "easeIn" } },
  };

  return (
    // ✅ Keep overflow-hidden here (prevents body scroll)
    <div className="h-screen w-full flex bg-gray-50 overflow-hidden">

      <Sidebar />

      {/* ✅ Change overflow-hidden to overflow-y-auto */}
      <div className="flex-1 flex flex-col overflow-hidden w-full">

        <TopHeader />

        {/* ✅ THIS IS THE KEY CHANGE - allow scroll here */}
        <main className="flex-1 mt-6 pt-16 px-2 sm:px-4 md:px-6 lg:px-8 pb-4 overflow-y-auto">

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
                min-h-full
              "
              // ✅ Removed h-full and overflow-hidden
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
