// src/store/tabBadgeStore.ts
//
// Lightweight store for the Orders tab badge indicators.
// Not persisted — recomputed from live data on every OrdersScreen fetch.
//
// hasActiveOrders        → red dot  (PLACED / ACCEPTED / READY_FOR_PICKUP)
// hasActivePrescriptions → brand dot (PENDING / PARTIALLY_RESPONDED / FULLY_RESPONDED)

import { create } from 'zustand';

interface TabBadgeStore {
  hasActiveOrders:           boolean;
  hasActivePrescriptions:    boolean;
  setHasActiveOrders:        (v: boolean) => void;
  setHasActivePrescriptions: (v: boolean) => void;
}

export const useTabBadgeStore = create<TabBadgeStore>((set) => ({
  hasActiveOrders:           false,
  hasActivePrescriptions:    false,
  setHasActiveOrders:        (v) => set({ hasActiveOrders: v }),
  setHasActivePrescriptions: (v) => set({ hasActivePrescriptions: v }),
}));