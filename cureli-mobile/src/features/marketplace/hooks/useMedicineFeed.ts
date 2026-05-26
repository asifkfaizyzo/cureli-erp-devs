// src/features/marketplace/hooks/useMedicineFeed.ts
//
// Paginated medicine feed via TanStack Query's useInfiniteQuery.
// (QueryClientProvider is set up in app/_layout.tsx with retry:2,
// staleTime: 5min.)
//
// Responsibilities:
//   • Fetch pages from GET /mobile/medicines
//   • Drive infinite scroll via getNextPageParam off the backend meta
//   • Flatten pages → a single array
//   • ENRICH each real variant with deterministic fake marketplace data,
//     memoised so enrichment is stable across renders
//
// The enrichment lives here (not in the component) so MedicineCard receives
// a ready EnrichedMedicine and stays purely presentational.

import { useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { marketplaceApi } from "../api/marketplace.api";
import { generateMarketplaceData } from "../utils/generateMarketplaceData";
import type {
  MedicineFeedParams,
  MedicineFeedResponse,
  EnrichedMedicine,
} from "../types/marketplace.types";

// Filters that affect the query (page is handled by the infinite cursor).
export interface MedicineFeedFilters {
  type?: MedicineFeedParams["type"];
  category?: string;
  search?: string;
  limit?: number;
}

const DEFAULT_LIMIT = 20;

export function medicineFeedKey(filters: MedicineFeedFilters) {
  return [
    "medicines",
    "feed",
    filters.type ?? null,
    filters.category ?? null,
    filters.search ?? null,
    filters.limit ?? DEFAULT_LIMIT,
  ] as const;
}

export function useMedicineFeed(filters: MedicineFeedFilters = {}) {
  const limit = filters.limit ?? DEFAULT_LIMIT;

  const query = useInfiniteQuery<MedicineFeedResponse>({
    queryKey: medicineFeedKey(filters),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      marketplaceApi.getMedicines({
        page: pageParam as number,
        limit,
        type: filters.type,
        category: filters.category,
        search: filters.search,
      }),
    getNextPageParam: (lastPage) =>
      lastPage.meta.hasNext ? lastPage.meta.page + 1 : undefined,
  });

  // Flatten all pages, then enrich. useMemo keyed on the raw pages so the
  // enriched array (and each item's marketplace data) is referentially stable
  // until new data actually arrives.
  const medicines: EnrichedMedicine[] = useMemo(() => {
    const pages = query.data?.pages ?? [];
    const flat = pages.flatMap((p) => p.medicines);
    return flat.map((variant) => ({
      ...variant,
      marketplace: generateMarketplaceData(variant.variantId),
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
    isRefetching: query.isRefetching,
    fetchNextPage: query.fetchNextPage,
    hasNextPage: query.hasNextPage,
    isFetchingNextPage: query.isFetchingNextPage,
  };
}