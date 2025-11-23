// /src/components/layout/AppLayout.jsx
import React from "react";
import { motion } from "framer-motion";
import { Outlet } from "react-router-dom";

import Sidebar from "./Sidebar";
import TopHeader from "./TopHeader";
import { useMenuStore } from "../../store/useMenuStore";

const AppLayout = () => {
  const sidebarExpanded = useMenuStore((s) => s.sidebarExpanded);

  const mainVariants = {
    collapsed: {
      marginLeft: 10,
      transition: { type: "spring", stiffness: 260, damping: 28 },
    },
    expanded: {
      marginLeft: 0,
      transition: { type: "spring", stiffness: 260, damping: 28 },
    },
  };

  return (
    <div className="h-screen w-screen overflow-hidden flex bg-gray-50">
      
      {/* Sidebar */}
      <Sidebar />

      {/* Right section */}
      <div className="flex-1 mt-10 flex flex-col">
        <TopHeader />

        {/* Page content rendered by React Router */}
        <motion.main
          className="flex-1 pt-4 px-8 pb-6 overflow-auto"
          variants={mainVariants}
          initial={sidebarExpanded ? "expanded" : "collapsed"}
          animate={sidebarExpanded ? "expanded" : "collapsed"}
        >
          <Outlet />
        </motion.main>
      </div>
    </div>
  );
};

export default AppLayout;
