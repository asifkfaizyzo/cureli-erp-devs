// src/store/paymentStore.ts
//
// Selected payment method.
// Cart screen reads this to show the current payment method.
// PaymentSettingsScreen writes to it on selection.

import { create } from "zustand";

export interface PaymentMethod {
  id: string;
  label: string;
  type: "upi" | "card" | "cod" | "netbanking";
  icon: string;
}

interface PaymentStore {
  selectedMethod: PaymentMethod;
  setSelectedMethod: (method: PaymentMethod) => void;
}

// Default to Google Pay UPI
const DEFAULT_METHOD: PaymentMethod = {
  id: "gpay",
  label: "Google Pay UPI",
  type: "upi",
  icon: "logo-google",
};

export const usePaymentStore = create<PaymentStore>()((set) => ({
  selectedMethod: DEFAULT_METHOD,

  setSelectedMethod: (method) => set({ selectedMethod: method }),
}));