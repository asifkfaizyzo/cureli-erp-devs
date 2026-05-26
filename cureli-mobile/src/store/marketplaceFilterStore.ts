// src/store/marketplaceFilterStore.ts
//
// Shared category filter state for marketplace screens.
// HomeScreen and AllCategoriesScreen both read/write this store so
// the selected category persists when navigating back from "View all".

import { create } from "zustand";

interface MarketplaceFilterStore {
  selectedCategory: string | null;
  setSelectedCategory: (key: string | null) => void;
  clearSelectedCategory: () => void;
}

export const useMarketplaceFilterStore = create<MarketplaceFilterStore>()(
  (set) => ({
    selectedCategory: null,
    setSelectedCategory: (key) => set({ selectedCategory: key }),
    clearSelectedCategory: () => set({ selectedCategory: null }),
  }),
);