import { create } from "zustand";

interface LayoutStore {
  bottomTabBarHeight: number;
  setBottomTabBarHeight: (height: number) => void;
}

export const useLayoutStore = create<LayoutStore>()((set) => ({
  bottomTabBarHeight: 0,
  setBottomTabBarHeight: (height: number) => {
    if (height <= 0) return;
    set({ bottomTabBarHeight: height });
  },
}));