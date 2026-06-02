// src/features/marketplace/api/marketplace.api.ts
//
// All marketplace medicine and shop API calls.
// Goes through src/services/api.ts (shared Axios instance).
//
// getMedicineShops (new):
//   GET /mobile/medicines/:variantId/shops?lat=X&lng=Y
//   Returns branches stocking a specific variant, sorted by distance
//   when coordinates are provided. Used by the product detail screen's
//   "Available at" bottom sheet.

import { api } from "../../../services/api";
import type {
  MedicineFeedParams,
  MedicineFeedResponse,
  MedicineDetailResponse,
  CategoriesResponse,
  MedicineShopsResponse,
} from "../types/marketplace.types";
import type { HomeFeedResponse } from "../types/marketplace.types";
import type {
  ShopSearchResponse,
  ShopProfileResponse,
  BranchMedicinesResponse,
} from "../../../types/shop";
import type { AxiosError } from "axios";

// ── Shared response wrapper ───────────────────────────────────

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// ── Error message extractor ───────────────────────────────────

export function extractErrorMessage(error: unknown): string {
  const axiosError = error as AxiosError<{ message: string }>;
  return (
    axiosError.response?.data?.message ??
    "Something went wrong. Please try again."
  );
}

// ── Query string builder ──────────────────────────────────────

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

// ── Location params helper ────────────────────────────────────

interface LocationParams {
  lat?: number | null;
  lng?: number | null;
}

function buildLocationQuery(location: LocationParams): string {
  const sp = new URLSearchParams();
  if (location.lat != null) sp.set("lat", String(location.lat));
  if (location.lng != null) sp.set("lng", String(location.lng));
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

// ── API methods ───────────────────────────────────────────────

export const marketplaceApi = {
  // ── Medicine endpoints ───────────────────────────────────────

  getFeed: async (): Promise<HomeFeedResponse> => {
    const response = await api.get<ApiResponse<HomeFeedResponse>>(
      "/mobile/medicines/feed",
    );
    return response.data.data;
  },

  getMedicines: async (
    params: MedicineFeedParams = {},
  ): Promise<MedicineFeedResponse> => {
    const response = await api.get<ApiResponse<MedicineFeedResponse>>(
      `/mobile/medicines${buildFeedQuery(params)}`,
    );
    return response.data.data;
  },

  getCategories: async (): Promise<CategoriesResponse> => {
    const response = await api.get<ApiResponse<CategoriesResponse>>(
      "/mobile/medicines/categories",
    );
    return response.data.data;
  },

  getMedicine: async (
    variantIdOrSku: string,
  ): Promise<MedicineDetailResponse> => {
    const response = await api.get<ApiResponse<MedicineDetailResponse>>(
      `/mobile/medicines/${encodeURIComponent(variantIdOrSku)}`,
    );
    return response.data.data;
  },

  /**
   * GET /mobile/medicines/:variantId/shops?lat=X&lng=Y
   * Returns branches stocking this variant.
   * lat/lng are optional — omit for unsorted results.
   */
  getMedicineShops: async (
    variantIdOrSku: string,
    location: LocationParams = {},
  ): Promise<MedicineShopsResponse> => {
    const qs = buildLocationQuery(location);
    const response = await api.get<ApiResponse<MedicineShopsResponse>>(
      `/mobile/medicines/${encodeURIComponent(variantIdOrSku)}/shops${qs}`,
    );
    return response.data.data;
  },

  // ── Shop endpoints ───────────────────────────────────────────

  searchShops: async (params: {
    q?: string;
    lat?: number | null;
    lng?: number | null;
    page?: number;
    limit?: number;
  }): Promise<ShopSearchResponse> => {
    const sp = new URLSearchParams();
    if (params.q && params.q.trim().length >= 2) sp.set("q", params.q.trim());
    if (params.lat != null) sp.set("lat", String(params.lat));
    if (params.lng != null) sp.set("lng", String(params.lng));
    if (params.page !== undefined) sp.set("page", String(params.page));
    if (params.limit !== undefined) sp.set("limit", String(params.limit));
    const qs = sp.toString();

    const response = await api.get<ApiResponse<ShopSearchResponse>>(
      `/mobile/shops/search${qs ? `?${qs}` : ""}`,
    );
    return response.data.data;
  },

  getShopProfile: async (
    shopId: string,
    location: LocationParams = {},
  ): Promise<ShopProfileResponse> => {
    const qs = buildLocationQuery(location);
    const response = await api.get<ApiResponse<ShopProfileResponse>>(
      `/mobile/shops/${encodeURIComponent(shopId)}${qs}`,
    );
    return response.data.data;
  },

  getShopBranchMedicines: async (
    shopId: string,
    branchId: string,
    params: { search?: string; page?: number; limit?: number } = {},
  ): Promise<BranchMedicinesResponse> => {
    const sp = new URLSearchParams();
    if (params.search && params.search.trim().length >= 1) {
      sp.set("search", params.search.trim());
    }
    if (params.page !== undefined) sp.set("page", String(params.page));
    if (params.limit !== undefined) sp.set("limit", String(params.limit));
    const qs = sp.toString();

    const response = await api.get<ApiResponse<BranchMedicinesResponse>>(
      `/mobile/shops/${encodeURIComponent(shopId)}/branches/${encodeURIComponent(branchId)}/medicines${qs ? `?${qs}` : ""}`,
    );
    return response.data.data;
  },
};