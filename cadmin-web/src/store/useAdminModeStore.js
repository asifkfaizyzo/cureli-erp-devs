// src/store/useAdminModeStore.js

import { create } from "zustand";
import { persist } from "zustand/middleware";

const useAdminModeStore = create(
  persist(
    (set, get) => ({
      activeModule: "admin", // "admin" | "marketplace"

      setActiveModule: (moduleId) => set({ activeModule: moduleId }),
    }),
    {
      name: "cadmin-active-module",
    }
  )
);

export const useAdminMode = () => {
  const activeModule = useAdminModeStore((s) => s.activeModule);
  const setActiveModule = useAdminModeStore((s) => s.setActiveModule);

  return {
    activeModule,
    setActiveModule,
    isAdmin: activeModule === "admin",
    isMarketplace: activeModule === "marketplace",
  };
};

export default useAdminModeStore;