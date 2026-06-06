// src/features/marketplace/hooks/useShopMedicines.ts
//
// Paginated medicines for a specific shop branch.
// Powers the medicine list inside the shop profile screen.
//
// Supports:
//   - Infinite scroll via useInfiniteQuery
//   - In-shop search via the search param
//   - Enrichment with generateMarketplaceData for demo price/ETA display
//     (same pattern as useMedicineFeed and useHomeFeed)
//
// listingPrice from the backend overrides the fake price when present.
// The frontend shows listingPrice if non-null, else marketplace.startsAt.
// This means real prices show when shops have set them, fake prices show
// for demo/unlisted medicine display.
//
// prescriptionRequired (UI field on EnrichedMedicine) is intentionally
// synced from requiresPrescription (branch-level listing field) here.
// This ensures that inside a shop context, the Rx badge and cart gate
// reflect what THIS branch has configured — not the scraped master value.
// The two fields are kept separate so callers can still distinguish the
// source if needed.

import { useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { marketplaceApi } from "../api/marketplace.api";
import { generateMarketplaceData } from "../utils/generateMarketplaceData";
import type {
  BranchMedicinesResponse,
  BranchMedicineItem,
} from "../../../types/shop";
import type { EnrichedMedicine } from "../../../types/medicine";

const DEFAULT_LIMIT = 20;

// ── Types ─────────────────────────────────────────────────────

/**
 * EnrichedBranchMedicine extends EnrichedMedicine with real listing fields.
 *
 * prescriptionRequired (inherited from EnrichedMedicine) is synced to
 * requiresPrescription so UI components that read prescriptionRequired
 * see the branch-specific value, not the global master value.
 *
 * requiresPrescription is kept as a separate field for callers that need
 * to know the raw branch-level value explicitly (e.g. cart enforcement).
 */
export interface EnrichedBranchMedicine extends EnrichedMedicine {
  /** Real price from MarketplaceListing. null if shop has not set one. */
  listingPrice: number | null;
  /**
   * Branch-level Rx requirement from MarketplaceListing.requires_prescription.
   * Also mirrored into prescriptionRequired for UI consistency.
   */
  requiresPrescription: boolean;
  stockStatus: string;
}

// ── Query key ─────────────────────────────────────────────────

export function shopMedicinesKey(
  shopId: string,
  branchId: string,
  search: string,
  limit: number,
) {
  return ["shops", "medicines", shopId, branchId, search.trim(), limit] as const;
}

// ── Hook ──────────────────────────────────────────────────────

export function useShopMedicines(
  shopId: string,
  branchId: string,
  search: string = "",
  limit: number = DEFAULT_LIMIT,
) {
  const query = useInfiniteQuery<BranchMedicinesResponse>({
    queryKey: shopMedicinesKey(shopId, branchId, search, limit),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      marketplaceApi.getShopBranchMedicines(shopId, branchId, {
        search: search.trim().length >= 1 ? search.trim() : undefined,
        page: pageParam as number,
        limit,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasNext ? lastPage.meta.page + 1 : undefined,
    enabled: !!shopId && !!branchId,
    staleTime: 1000 * 60 * 2,
  });

  // ── Enrich pages ──────────────────────────────────────────
  // Flatten pages and enrich with marketplace data.
  //
  // listingPrice and requiresPrescription come from the real listing row.
  // generateMarketplaceData provides fallback price/ETA/distance for
  // demo display when real data is absent.
  //
  // KEY SYNC: prescriptionRequired is set from item.requiresPrescription
  // (the branch listing value) rather than item.prescriptionRequired
  // (which would be the master/global value from the variant). This
  // ensures the Rx badge, cart gate, and any other UI reading
  // prescriptionRequired behaves consistently within a shop context.
  const medicines: EnrichedBranchMedicine[] = useMemo(() => {
    const pages = query.data?.pages ?? [];
    const flat: BranchMedicineItem[] = pages.flatMap((p) => p.medicines);

    return flat.map((item) => ({
      // ── Core variant fields ──────────────────────────────
      variantId: item.variantId,
      skuId: item.skuId,
      name: item.name,
      brand: item.brand,
      composition: item.composition,
      strength: item.strength,
      manufacturer: item.manufacturer,
      packSize: item.packSize,
      image: item.image,
      form: item.form,
      category: item.category,
      genericName: item.genericName,
      type: item.type,

      // ── THE FIX: Sync UI field with branch-specific value ─
      // prescriptionRequired drives all UI (badge, cart gate).
      // In a shop context it must reflect what THIS branch set,
      // not the scraped master flag.
      prescriptionRequired: item.requiresPrescription,

      // ── Fake marketplace decoration ──────────────────────
      // price/ETA/distance for demo display; real price below.
      marketplace: generateMarketplaceData(item.variantId),

      // ── Real listing fields ──────────────────────────────
      listingPrice: item.listingPrice,
      // Kept separately so callers can distinguish branch vs master source.
      requiresPrescription: item.requiresPrescription,
      stockStatus: item.stockStatus,
    }));
  }, [query.data?.pages]);

  // ── Derived meta ──────────────────────────────────────────
  const total = query.data?.pages?.[0]?.meta.total ?? 0;

  return {
    medicines,
    total,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
  };
}