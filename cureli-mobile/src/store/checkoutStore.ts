// src/store/checkoutStore.ts
//
// CHANGE: Added prescriptionRequestContext field + setPrescriptionRequestContext.
// Set by PrescriptionRequestDetailScreen when a quote is accepted.
// Read by useCheckout to pass prescription_request_id and
// prescription_recipient_id to createSession.
// Cleared by useCheckoutStore.reset() after order success.

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

// Set when the cart was populated from a prescription quote.
// Both null for normal cart checkouts.
export interface PrescriptionRequestContext {
  prescription_request_id:   string;
  prescription_recipient_id: string;
}

interface CheckoutStore {
  breakdown:                    PriceBreakdown | null;
  isQuoteLoading:               boolean;
  tip:                          number;
  selectedPatient:              CheckoutPatient | null;
  // null = normal cart checkout
  // non-null = cart was populated from a prescription quote
  prescriptionRequestContext:   PrescriptionRequestContext | null;

  setBreakdown:                    (b: PriceBreakdown | null) => void;
  setQuoteLoading:                 (v: boolean) => void;
  setTip:                          (amount: number) => void;
  setSelectedPatient:              (patient: CheckoutPatient | null) => void;
  setPrescriptionRequestContext:   (ctx: PrescriptionRequestContext | null) => void;
  reset:                           () => void;
}

export const useCheckoutStore = create<CheckoutStore>()((set) => ({
  breakdown:                  null,
  isQuoteLoading:             false,
  tip:                        0,
  selectedPatient:            null,
  prescriptionRequestContext: null,

  setBreakdown:       (breakdown)       => set({ breakdown }),
  setQuoteLoading:    (isQuoteLoading)  => set({ isQuoteLoading }),
  setTip:             (tip)             => set({ tip }),
  setSelectedPatient: (selectedPatient) => set({ selectedPatient }),

  setPrescriptionRequestContext: (prescriptionRequestContext) =>
    set({ prescriptionRequestContext }),

  reset: () =>
    set({
      breakdown:                  null,
      isQuoteLoading:             false,
      tip:                        0,
      selectedPatient:            null,
      prescriptionRequestContext: null,  // ← cleared on reset
    }),
}));