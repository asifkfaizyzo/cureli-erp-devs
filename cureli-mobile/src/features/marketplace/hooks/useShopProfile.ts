// cureli-mobile/src/features/marketplace/hooks/useShopProfile.ts
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
//
// SSE integration: listens to branchStatusStore for real-time
// branch_status_changed events pushed by the marketplace scheduler.
// When a matching branch update arrives, the React Query cache is
// patched in-place — no network refetch needed.

import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { marketplaceApi } from '../api/marketplace.api';
import type { ShopProfileResponse } from '../../../types/shop';
import { useBranchStatusStore } from '../../../store/branchStatusStore';

export interface ShopProfileLocation {
  lat: number;
  lng: number;
}

export function shopProfileKey(
  shopId: string,
  location: ShopProfileLocation | null | undefined,
) {
  return [
    'shops',
    'profile',
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

  // ── SSE: patch cache on branch_status_changed ─────────────────────────
  // When the marketplace scheduler auto-opens or auto-closes a branch,
  // useMobileSSE writes the update to branchStatusStore. We pick it up
  // here and apply it directly to the React Query cache so the UI
  // reflects the new open/closed state without a full refetch.
  const queryClient       = useQueryClient();
  const lastBranchUpdate  = useBranchStatusStore((s) => s.lastBranchUpdate);
  const clearBranchUpdate = useBranchStatusStore((s) => s.clearBranchStatusUpdate);

  useEffect(() => {
    if (!lastBranchUpdate || !shopId) return;

    // Only process if this update is relevant to the currently viewed shop
    // (profile.branches contains this branch_id)
    const cached = queryClient.getQueryData<ShopProfileResponse>(
      shopProfileKey(shopId, location),
    );

    if (!cached) return;

    const branchExists = cached.branches?.some(
      (b: any) => b.branchId === lastBranchUpdate.branch_id,
    );

    if (!branchExists) return;

    // Patch the cached profile — update isOpen + marketplaceEnabled for
    // this branch. marketplaceEnabled mirrors isOpen because a branch that
    // auto-closes is effectively unavailable for ordering.
    queryClient.setQueryData(
      shopProfileKey(shopId, location),
      {
        ...cached,
        branches: cached.branches.map((b: any) =>
          b.branchId === lastBranchUpdate.branch_id
            ? {
                ...b,
                isOpen:             lastBranchUpdate.is_open,
                marketplaceEnabled: lastBranchUpdate.is_open,
              }
            : b,
        ),
      },
    );

    clearBranchUpdate();
  }, [lastBranchUpdate, shopId, location, queryClient, clearBranchUpdate]);

  return {
    profile,
    isLoading: query.isLoading,
    isError:   query.isError,
    error:     query.error,
    refetch:   query.refetch,
  };
}