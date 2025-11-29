import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Outlet, useLocation } from "react-router-dom";

import Sidebar from "./AdminSidebar";
import TopHeader from "./AdminHeader";
import Breadcrumb from "../common/Breadcrumb";

const AppLayout = () => {
  const location = useLocation();
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  const handleSidebarExpand = useCallback((value) => {
    setSidebarExpanded(value);
  }, []);

  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.3, ease: "easeOut" } 
    },
    exit: { 
      opacity: 0, 
      y: -10, 
      transition: { duration: 0.15 } 
    },
  };

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
          <div className="px-2 sm:px-6 lg:px-8 py-4">
            
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