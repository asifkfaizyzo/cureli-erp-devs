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

import { useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { marketplaceApi } from "../api/marketplace.api";
import { generateMarketplaceData } from "../utils/generateMarketplaceData";
import type { BranchMedicinesResponse, BranchMedicineItem } from "../../../types/shop";
import type { EnrichedMedicine } from "../../../types/medicine";

const DEFAULT_LIMIT = 20;

// EnrichedBranchMedicine extends EnrichedMedicine with real listing fields
export interface EnrichedBranchMedicine extends EnrichedMedicine {
  /** Real price from MarketplaceListing. null if shop has not set one. */
  listingPrice: number | null;
  requiresPrescription: boolean;
  stockStatus: string;
}

export function shopMedicinesKey(
  shopId: string,
  branchId: string,
  search: string,
  limit: number,
) {
  return [
    "shops",
    "medicines",
    shopId,
    branchId,
    search.trim(),
    limit,
  ] as const;
}

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

  // Flatten pages and enrich with marketplace data.
  // listingPrice and requiresPrescription come from the real listing.
  // generateMarketplaceData provides fallback price/ETA/distance for display.
  const medicines: EnrichedBranchMedicine[] = useMemo(() => {
    const pages = query.data?.pages ?? [];
    const flat: BranchMedicineItem[] = pages.flatMap((p) => p.medicines);

    return flat.map((item) => ({
      // Spread all MedicineVariant fields
      variantId: item.variantId,
      skuId: item.skuId,
      name: item.name,
      brand: item.brand,
      composition: item.composition,
      strength: item.strength,
      manufacturer: item.manufacturer,
      packSize: item.packSize,
      image: item.image,
      prescriptionRequired: item.prescriptionRequired,
      form: item.form,
      category: item.category,
      genericName: item.genericName,
      type: item.type,
      // Fake marketplace decoration (price/ETA/distance for demo display)
      marketplace: generateMarketplaceData(item.variantId),
      // Real listing fields
      listingPrice: item.listingPrice,
      requiresPrescription: item.requiresPrescription,
      stockStatus: item.stockStatus,
    }));
  }, [query.data?.pages]);

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