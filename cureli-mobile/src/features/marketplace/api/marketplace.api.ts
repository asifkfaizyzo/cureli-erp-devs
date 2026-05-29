// src/features/marketplace/api/marketplace.api.ts
//
// All marketplace medicine and shop API calls.
// Goes through src/services/api.ts (shared Axios instance).
//
// NOTE: all mobile endpoints are PUBLIC. The shared instance
// auto-attaches the mobile token when present (harmless), and
// works fine when absent.

import { api } from "../../../services/api";
import type {
  MedicineFeedParams,
  MedicineFeedResponse,
  MedicineDetailResponse,
  CategoriesResponse,
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
  // ── Medicine endpoints (unchanged) ──────────────────────────

  /**
   * GET /mobile/medicines/feed
   * Home feed — all curated sections in one request.
   */
  getFeed: async (): Promise<HomeFeedResponse> => {
    const response = await api.get<ApiResponse<HomeFeedResponse>>(
      "/mobile/medicines/feed",
    );
    return response.data.data;
  },

  /**
   * GET /mobile/medicines
   * Paginated catalog. Used by CategoryScreen and medicine search.
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
   * Single variant detail + siblings. Includes availableNearYou.
   */
  getMedicine: async (
    variantIdOrSku: string,
  ): Promise<MedicineDetailResponse> => {
    const response = await api.get<ApiResponse<MedicineDetailResponse>>(
      `/mobile/medicines/${encodeURIComponent(variantIdOrSku)}`,
    );
    return response.data.data;
  },

  // ── Shop endpoints (new) ─────────────────────────────────────

  /**
   * GET /mobile/shops/search?q=X&lat=Y&lng=Z&page=1&limit=20
   * Search live shops. q is optional — omitting returns all live shops.
   * lat/lng are optional — omitting skips distance computation.
   */
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

  /**
   * GET /mobile/shops/:shopId?lat=Y&lng=Z
   * Full shop profile with all onboarded branches.
   * lat/lng optional — enables distance on branches.
   */
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

  /**
   * GET /mobile/shops/:shopId/branches/:branchId/medicines
   * Paginated medicines for a specific branch.
   * search param enables in-shop search.
   */
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