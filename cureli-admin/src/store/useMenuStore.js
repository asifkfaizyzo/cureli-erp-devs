// src/store/useMenuStore.js

import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useMenuStore = create(
  persist(
    (set) => ({
      activeMenu: "dashboard",
      sidebarExpanded: true,

      setActiveMenu: (menu) => set({ activeMenu: menu }),

      toggleSidebar: () =>
        set((state) => ({ sidebarExpanded: !state.sidebarExpanded })),

      // Breadcrumbs
      breadcrumbs: ["Dashboard"],
      setBreadcrumbs: (crumbs) => set({ breadcrumbs: crumbs }),
    }),
    {
      name: "menu-storage",
      partialize: (state) => ({
        activeMenu: state.activeMenu,
        // Note: breadcrumbs are NOT persisted (they reset on refresh based on URL)
      }),
    }
  )
);