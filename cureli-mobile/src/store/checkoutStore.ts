// src/store/checkoutStore.ts

import { create } from 'zustand';
import type { CheckoutPatient } from '../types/auth';

export interface PriceBreakdown {
  subtotal:                 number;
  service_charge:           number;
  delivery_fee:             number;
  km_surcharge:             number;
  tip:                      number;
  coupon_code:              string | null;
  coupon_discount:          number;
  coupon_reason:            string | null;
  loyalty_points_redeemed:  number;
  loyalty_discount:         number;
  loyalty_reason:           string | null;
  grand_total:              number;
  delivery_available:       boolean;
  unavailable_reason:       string | null;
}

export interface PrescriptionRequestContext {
  prescription_request_id:   string;
  prescription_recipient_id: string;
}

interface CheckoutStore {
  breakdown:                    PriceBreakdown | null;
  isQuoteLoading:               boolean;
  tip:                          number;
  selectedPatient:              CheckoutPatient | null;
  prescriptionRequestContext:   PrescriptionRequestContext | null;

  // Promotions & Loyalty Selections
  couponCode:                   string | null;
  loyaltyPointsToRedeem:        number;

  setBreakdown:                    (b: PriceBreakdown | null) => void;
  setQuoteLoading:                 (v: boolean) => void;
  setTip:                          (amount: number) => void;
  setSelectedPatient:              (patient: CheckoutPatient | null) => void;
  setPrescriptionRequestContext:   (ctx: PrescriptionRequestContext | null) => void;
  setCouponCode:                   (code: string | null) => void;
  setLoyaltyPointsToRedeem:        (points: number) => void;
  reset:                           () => void;
}

export const useCheckoutStore = create<CheckoutStore>()((set) => ({
  breakdown:                  null,
  isQuoteLoading:             false,
  tip:                        0,
  selectedPatient:            null,
  prescriptionRequestContext: null,
  couponCode:                 null,
  loyaltyPointsToRedeem:      0,

  setBreakdown:                  (breakdown)                  => set({ breakdown }),
  setQuoteLoading:               (isQuoteLoading)             => set({ isQuoteLoading }),
  setTip:                        (tip)                        => set({ tip }),
  setSelectedPatient:            (selectedPatient)            => set({ selectedPatient }),
  setPrescriptionRequestContext: (prescriptionRequestContext) => set({ prescriptionRequestContext }),
  setCouponCode:                 (couponCode)                 => set({ couponCode }),
  setLoyaltyPointsToRedeem:      (loyaltyPointsToRedeem)      => set({ loyaltyPointsToRedeem }),

  reset: () =>
    set({
      breakdown:                  null,
      isQuoteLoading:             false,
      tip:                        0,
      selectedPatient:            null,
      prescriptionRequestContext: null,
      couponCode:                 null,
      loyaltyPointsToRedeem:      0,
    }),
}));