// src/features/marketplace/api/loyalty.api.ts

import { api } from "../../../services/api";

export interface LoyaltySummary {
  balance: number;
  config: {
    isEnabled: boolean;
    earnRateAmount: number;
    redemptionValue: number;
    minRedeemPoints: number;
    minOrderAmount: number;
    maxRedeemPoints: number | null;
    maxRedeemPercent: number | null;
  };
}

export interface LoyaltyTransaction {
  transaction_id: string;
  type: "EARNED" | "REDEEMED" | "EXPIRED" | "ADMIN_ADJUST";
  points: number;
  description: string;
  balance_after: number;
  created_at: string;
  expires_at: string | null;
  is_expired: boolean;
  order?: {
    order_number: string;
  } | null;
}

export interface LoyaltyHistoryResponse {
  transactions: LoyaltyTransaction[];
  meta: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
}

export const loyaltyApi = {
  getSummary: () => api.get<{ data: LoyaltySummary }>("/mobile/loyalty/summary"),
  getHistory: (page = 1, limit = 20) =>
    api.get<{ data: LoyaltyHistoryResponse }>(`/mobile/loyalty/history?page=${page}&limit=${limit}`),
};