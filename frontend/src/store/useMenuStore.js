// /src/store/useMenuStore.js
import { create } from "zustand";

export const useMenuStore = create((set) => ({
  // Sidebar expand/collapse
  sidebarExpanded: true,
  toggleSidebar: () =>
    set((state) => ({ sidebarExpanded: !state.sidebarExpanded })),

  // Active menu ID (for highlighting & breadcrumbs)
  activeMenu: "dashboard",
  setActiveMenu: (menu) => set({ activeMenu: menu }),

  // Breadcrumbs state
  breadcrumbs: [],

  // Update breadcrumbs based on menu structure
  setBreadcrumbs: (crumbs) => set({ breadcrumbs: crumbs }),
}));
