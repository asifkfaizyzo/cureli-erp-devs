import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Outlet, useLocation } from "react-router-dom";

import Sidebar from "./Sidebar";
import TopHeader from "./TopHeader";
import Breadcrumb from "../common/Breadcrumb";
import { useMenuStore } from "../../store/useMenuStore";
import { useSubscriptionStore } from "../../store/useSubscriptionStore";
import { useAuthStore } from "../../store/useAuthStore";

const AppLayout = () => {
  const location = useLocation();

  // ⚠️ NEW: Load subscription status for super admin
  const user = useAuthStore((state) => state.user);
  const loadSubscriptionStatus = useSubscriptionStore((s) => s.loadSubscriptionStatus);

  const pageVariants = {
    initial: { opacity: 0, x: 60 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.35, ease: "easeOut" } },
    exit: { opacity: 0, x: -40, transition: { duration: 0.25, ease: "easeIn" } },
  };

  // ⚠️ NEW: Load subscription status on mount
  useEffect(() => {
    if (user?.role === "super_admin") {
      loadSubscriptionStatus();
    }
  }, [user?.role, loadSubscriptionStatus]);

  return (
    <div className="h-screen w-full flex bg-gray-50 overflow-hidden">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden w-full">
        <TopHeader />

        <main className="flex-1 pt-20 px-2 sm:px-4 md:px-6 lg:px-8 pb-4 overflow-y-auto">
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