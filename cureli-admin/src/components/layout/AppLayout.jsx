import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Outlet, useLocation } from "react-router-dom";

import Sidebar from "./AdminSidebar";
import TopHeader from "./AdminHeader";
import Breadcrumb from "../common/Breadcrumb";

const AppLayout = () => {
  const location = useLocation();

  const pageVariants = {
    initial: { opacity: 0, x: 60 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.35, ease: "easeOut" } },
    exit: { opacity: 0, x: -40, transition: { duration: 0.25, ease: "easeIn" } },
  };

  return (
    <div className="h-screen w-full flex bg-gray-50 overflow-hidden">

      {/* Sidebar (hover-expandable) */}
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden w-full">

        {/* Fixed header */}
        <TopHeader />

        {/* Page Body */}
        <main className="flex-1 mt-1 pt-16 px-3 sm:px-4 md:px-6 lg:px-8 pb-6 overflow-hidden">

          {/* Breadcrumb */}
          <Breadcrumb />

          {/* Routed Page */}
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              className="
                mt-3
                w-[96%] sm:w-full md:w-full lg:w-full
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
