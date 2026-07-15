// src/store/checkoutStore.ts

import { create } from 'zustand';

export interface PriceBreakdown {
  subtotal:        number;
  service_charge:  number;
  delivery_fee:    number;
  km_surcharge:    number;
  tip:             number;
  grand_total:     number;
  delivery_available:  boolean;
  unavailable_reason:  string | null;
}

interface CheckoutStore {
  breakdown:       PriceBreakdown | null;
  isQuoteLoading:  boolean;
  tip:             number;

  setBreakdown:    (b: PriceBreakdown | null) => void;
  setQuoteLoading: (v: boolean) => void;
  setTip:          (amount: number) => void;
  reset:           () => void;
}

export const useCheckoutStore = create<CheckoutStore>()((set) => ({
  breakdown:       null,
  isQuoteLoading:  false,
  tip:             0,

  setBreakdown:    (breakdown) => set({ breakdown }),
  setQuoteLoading: (isQuoteLoading) => set({ isQuoteLoading }),
  setTip:          (tip) => set({ tip }),
  reset:           () => set({ breakdown: null, isQuoteLoading: false, tip: 0 }),
}));