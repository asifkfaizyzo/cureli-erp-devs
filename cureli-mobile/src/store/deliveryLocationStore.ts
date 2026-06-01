// src/store/deliveryLocationStore.ts

import { create } from 'zustand';

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
  setLocation: (location: DeliveryLocation) => void;
  setResolving: (resolving: boolean) => void;
  setResolved: () => void;
  reset: () => void;
}

export const useDeliveryLocationStore = create<DeliveryLocationState>((set) => ({
  location: FALLBACK_LOCATION,
  isResolving: false,
  hasResolved: false,
  setLocation: (location) => set({ location }),
  setResolving: (isResolving) => set({ isResolving }),
  setResolved: () => set({ hasResolved: true, isResolving: false }),
  reset: () => set({ location: FALLBACK_LOCATION, isResolving: false, hasResolved: false }),
}));

export { FALLBACK_LOCATION };