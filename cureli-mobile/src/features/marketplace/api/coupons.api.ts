// src/features/marketplace/api/coupons.api.ts

import { api } from "../../../services/api";

export const couponsApi = {
  validateCoupon: (data: { code: string; subtotal: number }) =>
    api.post<{
      success: boolean;
      message: string;
      data: {
        valid: boolean;
        discount: number;
        reason: string | null;
        coupon: {
          coupon_id: string;
          code: string;
          type: "FLAT" | "PERCENTAGE";
        };
      };
    }>("/mobile/coupons/validate", data),
};