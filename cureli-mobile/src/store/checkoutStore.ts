// src/store/checkoutStore.ts

import { create } from 'zustand';
import type { CheckoutPatient } from '../types/auth';

export interface PriceBreakdown {
  subtotal:            number;
  service_charge:      number;
  delivery_fee:        number;
  km_surcharge:        number;
  tip:                 number;
  grand_total:         number;
  delivery_available:  boolean;
  unavailable_reason:  string | null;
}

interface CheckoutStore {
  breakdown:        PriceBreakdown | null;
  isQuoteLoading:   boolean;
  tip:              number;
  selectedPatient:  CheckoutPatient | null;

  setBreakdown:       (b: PriceBreakdown | null) => void;
  setQuoteLoading:    (v: boolean) => void;
  setTip:             (amount: number) => void;
  setSelectedPatient: (patient: CheckoutPatient | null) => void;
  reset:              () => void;
}

export const useCheckoutStore = create<CheckoutStore>()((set) => ({
  breakdown:       null,
  isQuoteLoading:  false,
  tip:             0,
  selectedPatient: null,

  setBreakdown:       (breakdown)       => set({ breakdown }),
  setQuoteLoading:    (isQuoteLoading)  => set({ isQuoteLoading }),
  setTip:             (tip)             => set({ tip }),
  setSelectedPatient: (selectedPatient) => set({ selectedPatient }),
  reset: () =>
    set({
      breakdown:       null,
      isQuoteLoading:  false,
      tip:             0,
      selectedPatient: null,
    }),
}));