// src/features/marketplace/hooks/useShopSearch.ts
//
// Debounced shop search via TanStack Query.
//
// q is debounced at 400ms — same as medicine search in search.tsx.
// If q is empty or < 2 chars, returns all live shops (no query filter).
// This means the Shops tab always shows something, even before the user
// types — a good default for discovery.
//
// Location is optional. If provided, shops are sorted by distance.
// If absent, shops are sorted by listing count descending.

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { marketplaceApi } from "../api/marketplace.api";
import type { ShopSearchResult } from "../../../types/shop";

export interface ShopSearchLocation {
  lat: number;
  lng: number;
}

export interface UseShopSearchOptions {
  q: string;
  location?: ShopSearchLocation | null;
  limit?: number;
  enabled?: boolean;
}

export function shopSearchKey(
  q: string,
  location: ShopSearchLocation | null | undefined,
  limit: number,
) {
  return [
    "shops",
    "search",
    q.trim(),
    location?.lat ?? null,
    location?.lng ?? null,
    limit,
  ] as const;
}

export function useShopSearch({
  q,
  location,
  limit = 20,
  enabled = true,
}: UseShopSearchOptions) {
  const query = useQuery({
    queryKey: shopSearchKey(q, location, limit),
    queryFn: () =>
      marketplaceApi.searchShops({
        q: q.trim().length >= 2 ? q.trim() : undefined,
        lat: location?.lat ?? null,
        lng: location?.lng ?? null,
        page: 1,
        limit,
      }),
    enabled,
    staleTime: 1000 * 60 * 2, // 2 min — shops don't change often
  });

  const shops: ShopSearchResult[] = useMemo(
    () => query.data?.shops ?? [],
    [query.data?.shops],
  );

  const total = query.data?.meta.total ?? 0;

  return {
    shops,
    total,
    isLoading: query.isLoading && query.fetchStatus !== "idle",
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}