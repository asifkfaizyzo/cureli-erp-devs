//Q:\YourZeroesAndOnes\cureli\curely_erp\frontend\src\store\useMenuStore.js
import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useMenuStore = create(
  persist(
    (set) => ({
      // ------------------------
      // STATE
      // ------------------------
      activeMenu: "dashboard",
      sidebarExpanded: true,

      breadcrumbs: ["Dashboard"],

      // ------------------------
      // ACTIONS
      // ------------------------
      setActiveMenu: (menu) => set({ activeMenu: menu }),

      toggleSidebar: () =>
        set((state) => ({ sidebarExpanded: !state.sidebarExpanded })),

      setBreadcrumbs: (crumbs) => set({ breadcrumbs: crumbs }),
    }),
    {
      name: "menu-storage",

      // 🔒 Persist only what is needed
      partialize: (state) => ({
        activeMenu: state.activeMenu,
      }),

      // 🔑 IMPORTANT: Dashboard-first safeguard
      onRehydrateStorage: () => (state) => {
        if (!state?.activeMenu) {
          state.setActiveMenu("dashboard");
          state.setBreadcrumbs(["Dashboard"]);
        }
      },
    }
  )
);
