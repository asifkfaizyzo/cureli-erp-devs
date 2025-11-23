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
    }),

    {
      name: "menu-storage",         // key in localStorage
      partialize: (state) => ({
        activeMenu: state.activeMenu,  // Only save this
      }),
    }
  )
);
