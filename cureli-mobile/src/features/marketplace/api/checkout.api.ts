// src/features/marketplace/api/checkout.api.ts

import { api } from "../../../services/api";
import type { CheckoutPatient } from "../../../types/auth";

export const checkoutApi = {
  getQuote: (data: {
    branch_id: string;
    items: { variantId: string; quantity: number }[];
    distance_km: number;
    tip?: number;
  }) => api.post("/mobile/checkout/quote", data),

  createSession: (data: {
    branch_id: string;
    delivery_address_id: string;
    items: { variantId: string; quantity: number }[];
    distance_km: number;
    tip?: number;
    prescription_files?: {
      prescription_key: string;
      original_name: string;
      mime_type: string;
      file_size: number;
    }[];
    patient: CheckoutPatient;

    prescription_request_id?: string | null;
    prescription_recipient_id?: string | null;
  }) => api.post("/mobile/checkout/create-session", data),

  confirm: (data: {
    session_id: string;
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }) => api.post("/mobile/checkout/confirm", data),
};
