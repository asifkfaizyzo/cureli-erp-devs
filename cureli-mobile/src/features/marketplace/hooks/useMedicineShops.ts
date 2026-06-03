// src/features/marketplace/hooks/useMedicineShops.ts
//
// Fetches branches stocking a specific medicine variant.
// Separate query from useMedicineDetail so the detail screen renders
// immediately while the shop list loads independently.
//
// Takes the variant's skuId (used in the route) plus optional user
// coordinates for distance-sorted results.
//
// The query is disabled when idOrSku is empty or when the variant is
// known to be unavailable (availableNearYou = false) — no point hitting
// the endpoint if the detail screen already knows there are no listings.

import { useQuery } from "@tanstack/react-query";
import { marketplaceApi } from "../api/marketplace.api";
import type { MedicineShopListing } from "../types/marketplace.types";

interface UseMedicineShopsOptions {
  idOrSku: string;
  lat?: number | null;
  lng?: number | null;
  /** Pass false to skip the fetch when you already know none exist. */
  enabled?: boolean;
}

export function medicineShopsKey(
  idOrSku: string,
  lat?: number | null,
  lng?: number | null,
) {
  return ["medicines", "shops", idOrSku, lat ?? null, lng ?? null] as const;
}

export function useMedicineShops({
  idOrSku,
  lat,
  lng,
  enabled = true,
}: UseMedicineShopsOptions) {
  const query = useQuery({
    queryKey: medicineShopsKey(idOrSku, lat, lng),
    queryFn: () =>
      marketplaceApi.getMedicineShops(idOrSku, {
        lat: lat ?? null,
        lng: lng ?? null,
      }),
    enabled: !!idOrSku && enabled,
    staleTime: 1000 * 60 * 2, // 2 min — shop availability changes more often
  });

  const shops: MedicineShopListing[] = query.data?.shops ?? [];

  return {
    shops,
    isLoading: query.isLoading,
    isError: query.isError,
    refetch: query.refetch,
  };
}