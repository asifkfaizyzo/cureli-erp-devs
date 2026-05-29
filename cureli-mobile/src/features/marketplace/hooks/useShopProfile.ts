// src/features/marketplace/hooks/useShopProfile.ts
//
// Fetches the full shop profile for the shop detail screen.
// Includes all marketplace-onboarded branches (enabled + disabled).
//
// shopId comes from route params (/shop/[id]).
// location is optional — enables distance computation on branches.
//
// staleTime: 2 min — shop profile data is relatively stable but
// open/closed status changes throughout the day, so we don't cache
// indefinitely.

import { useQuery } from "@tanstack/react-query";
import { marketplaceApi } from "../api/marketplace.api";
import type { ShopProfileResponse } from "../../../types/shop";

export interface ShopProfileLocation {
  lat: number;
  lng: number;
}

export function shopProfileKey(
  shopId: string,
  location: ShopProfileLocation | null | undefined,
) {
  return [
    "shops",
    "profile",
    shopId,
    location?.lat ?? null,
    location?.lng ?? null,
  ] as const;
}

export function useShopProfile(
  shopId: string,
  location?: ShopProfileLocation | null,
) {
  const query = useQuery({
    queryKey: shopProfileKey(shopId, location),
    queryFn: () =>
      marketplaceApi.getShopProfile(shopId, {
        lat: location?.lat ?? null,
        lng: location?.lng ?? null,
      }),
    enabled: !!shopId,
    staleTime: 1000 * 60 * 2,
  });

  const profile: ShopProfileResponse | null = query.data ?? null;

  return {
    profile,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}