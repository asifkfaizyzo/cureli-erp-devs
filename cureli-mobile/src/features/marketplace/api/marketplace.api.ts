// src/features/marketplace/api/marketplace.api.ts
//
// All marketplace medicine API calls.
// Goes through src/services/api.ts (shared Axios instance) — never axios
// directly — mirroring features/profile/api/profile.api.ts.
//
// NOTE: these endpoints are PUBLIC. The shared instance still auto-attaches
// the mobile token when present (harmless), and works fine when absent.

import { api } from "../../../services/api";
import type {
  MedicineFeedParams,
  MedicineFeedResponse,
  MedicineDetailResponse,
  CategoriesResponse,
} from "../types/marketplace.types";
import type { AxiosError } from "axios";

// ── Shared response wrapper ───────────────────────────────────

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// ── Error message extractor ───────────────────────────────────
// The interceptor throws raw AxiosError. Mirrors profile.api.ts.

export function extractErrorMessage(error: unknown): string {
  const axiosError = error as AxiosError<{ message: string }>;
  return (
    axiosError.response?.data?.message ??
    "Something went wrong. Please try again."
  );
}

// ── Query string builder ──────────────────────────────────────
// Only appends defined params; keeps URLs clean.

function buildFeedQuery(params: MedicineFeedParams): string {
  const sp = new URLSearchParams();
  if (params.page !== undefined) sp.set("page", String(params.page));
  if (params.limit !== undefined) sp.set("limit", String(params.limit));
  if (params.type) sp.set("type", params.type);
  if (params.category) sp.set("category", params.category);
  if (params.search) sp.set("search", params.search);
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

// ── API methods ───────────────────────────────────────────────

export const marketplaceApi = {
  /**
   * GET /mobile/medicines
   * Paginated per-variant feed. Returns real catalog data (no pricing).
   */
  getMedicines: async (
    params: MedicineFeedParams = {},
  ): Promise<MedicineFeedResponse> => {
    const response = await api.get<ApiResponse<MedicineFeedResponse>>(
      `/mobile/medicines${buildFeedQuery(params)}`,
    );
    return response.data.data;
  },

  /**
   * GET /mobile/medicines/categories
   * Curated category list for the Quick Categories rail.
   */
  getCategories: async (): Promise<CategoriesResponse> => {
    const response = await api.get<ApiResponse<CategoriesResponse>>(
      "/mobile/medicines/categories",
    );
    return response.data.data;
  },

  /**
   * GET /mobile/medicines/:variantId
   * Single variant (by skuId or variant UUID) + sibling variants.
   */
  getMedicine: async (
    variantIdOrSku: string,
  ): Promise<MedicineDetailResponse> => {
    const response = await api.get<ApiResponse<MedicineDetailResponse>>(
      `/mobile/medicines/${encodeURIComponent(variantIdOrSku)}`,
    );
    return response.data.data;
  },
};