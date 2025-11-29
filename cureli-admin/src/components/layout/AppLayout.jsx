import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Outlet, useLocation } from "react-router-dom";

import Sidebar from "./AdminSidebar";
import TopHeader from "./AdminHeader";
import Breadcrumb from "../common/Breadcrumb";

const AppLayout = () => {
  const location = useLocation();
  const [sidebarExpanded, setSidebarExpanded] = useState(false);

  // Memoized to prevent unnecessary re-renders
  const handleSidebarExpand = useCallback((value) => {
    setSidebarExpanded(value);
  }, []);

  // Page transition variants - isolated from sidebar
  const pageVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { 
      opacity: 1, 
      y: 0, 
      transition: { duration: 0.35, ease: [0.25, 0.1, 0.25, 1] } 
    },
    exit: { 
      opacity: 0, 
      y: -10, 
      transition: { duration: 0.2, ease: "easeIn" } 
    },
  };

  return (
    <div className="h-screen w-full flex flex-col bg-gray-50 overflow-hidden">
      
      {/* ═══════════════════════════════════════════════════════════
          FIXED HEADER - Always on top, never covered by sidebar
      ═══════════════════════════════════════════════════════════ */}
      <header className="flex-shrink-0 h-16 z-50">
        <TopHeader />
      </header>

      {/* ═══════════════════════════════════════════════════════════
          MAIN BODY: Sidebar + Content (Flex Row)
          Sidebar pushes content - NO overlay
      ═══════════════════════════════════════════════════════════ */}
      <div className="flex-1 flex overflow-hidden">
        
        {/* Sidebar Component */}
        <Sidebar 
          expanded={sidebarExpanded} 
          onExpandChange={handleSidebarExpand} 
        />

        {/* ═══════════════════════════════════════════════════════
            MAIN CONTENT AREA
            - Flexibly resizes when sidebar expands
            - Fully scrollable
            - Page transitions happen ONLY here
        ═══════════════════════════════════════════════════════ */}
        <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
          
          {/* Scrollable Content Container */}
          <div className="flex-1 overflow-hidden overflow-x-hidden">
            <div className="px-4 sm:px-6 lg:px-8 py-6">
              
              {/* Breadcrumb - Sticky within scroll */}
              <div className="sticky top-0 z-10 bg-gray-50 pb-4">
                <Breadcrumb />
              </div>

              {/* Page Content with Transitions */}
              <AnimatePresence mode="wait" initial={false}>
                <motion.div
                  key={location.pathname}
                  variants={pageVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="w-full"
                >
                  <Outlet />
                </motion.div>
              </AnimatePresence>

            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AppLayout;