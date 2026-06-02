// src/store/deliveryLocationStore.ts

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { mmkvStorage } from '../lib/mmkvStorage';

export interface DeliveryLocation {
  /** "gps" = auto-detected, "saved" = from saved addresses, "fallback" = default */
  source: 'gps' | 'saved' | 'fallback';
  /** Short area name — e.g. "Kakkanad", "Edappally" */
  area: string;
  /** Full address line — e.g. "Kochi, Kerala 682030" */
  addressLine: string;
  /** Coordinates — null for fallback */
  latitude: number | null;
  longitude: number | null;
  /** Saved address ID if source is "saved" */
  addressId?: string;
}

const FALLBACK_LOCATION: DeliveryLocation = {
  source: 'fallback',
  area: 'Set delivery location',
  addressLine: 'Tap here to set your address',
  latitude: null,
  longitude: null,
};

interface DeliveryLocationState {
  location: DeliveryLocation;
  isResolving: boolean;
  hasResolved: boolean;
  /** True when user has manually picked an address from the dropdown */
  isManualSelection: boolean;
  setLocation: (location: DeliveryLocation) => void;
  setResolving: (resolving: boolean) => void;
  setResolved: () => void;
  /** Set location via manual user selection — persists and overrides GPS */
  selectAddress: (location: DeliveryLocation) => void;
  reset: () => void;
  /** Full reset including manual selection — used for logout etc. */
  hardReset: () => void;
}

export const useDeliveryLocationStore = create<DeliveryLocationState>()(
  persist(
    (set) => ({
      location: FALLBACK_LOCATION,
      isResolving: false,
      hasResolved: false,
      isManualSelection: false,

      setLocation: (location) => set({ location }),
      setResolving: (isResolving) => set({ isResolving }),
      setResolved: () => set({ hasResolved: true, isResolving: false }),

      selectAddress: (location) =>
        set({
          location,
          isManualSelection: true,
          hasResolved: true,
          isResolving: false,
        }),

      reset: () =>
        set({
          location: FALLBACK_LOCATION,
          isResolving: false,
          hasResolved: false,
          // NOTE: does NOT clear isManualSelection — use hardReset for that
        }),

      hardReset: () =>
        set({
          location: FALLBACK_LOCATION,
          isResolving: false,
          hasResolved: false,
          isManualSelection: false,
        }),
    }),
    {
      name: 'delivery-location',
      storage: createJSONStorage(() => mmkvStorage),
      // Only persist these fields — isResolving is transient
      partialize: (state) => ({
        location: state.location,
        hasResolved: state.hasResolved,
        isManualSelection: state.isManualSelection,
      }),
    },
  ),
);

export { FALLBACK_LOCATION };