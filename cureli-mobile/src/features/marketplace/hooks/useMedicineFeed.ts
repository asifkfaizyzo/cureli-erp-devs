// src/features/marketplace/hooks/useMedicineFeed.ts
//
// Paginated medicine feed via TanStack Query's useInfiniteQuery.
//
// Responsibilities:
//   • Fetch pages from GET /mobile/medicines
//   • Drive infinite scroll via getNextPageParam off the backend meta
//   • Flatten pages → a single array
//   • ENRICH each real variant with deterministic fake marketplace data,
//     memoised so enrichment is stable across renders
//
// categories filter (new):
//   Accepts string[] of primary_category values for multi-category
//   browsing. Serialised to ?categories= by marketplace.api.ts.
//   Used by the English Medicine top-level card which bundles all
//   DRUG-type primary_category keys. Cannot be combined with category.
//
// The enrichment lives here (not in the component) so MedicineCard
// receives a ready EnrichedMedicine and stays purely presentational.

import { useMemo } from "react";
import { useInfiniteQuery } from "@tanstack/react-query";
import { marketplaceApi } from "../api/marketplace.api";
import { generateMarketplaceData } from "../utils/generateMarketplaceData";
import type {
  MedicineFeedParams,
  MedicineFeedResponse,
  EnrichedMedicine,
} from "../types/marketplace.types";

// ── Filters ───────────────────────────────────────────────────
//
// category and categories are mutually exclusive.
// Pass category for a single primary_category filter.
// Pass categories for a multi-category IN filter (English Medicine).
// Passing both is a programming error — categories takes precedence
// and category is ignored as a safety fallback.

export interface MedicineFeedFilters {
  type?: MedicineFeedParams["type"];
  category?: string;
  categories?: string[];
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
    // Stable key for categories array — join to string so TanStack Query
    // can do referential equality on the primitive key segments.
    filters.categories ? filters.categories.join(",") : null,
    filters.search ?? null,
    filters.limit ?? DEFAULT_LIMIT,
  ] as const;
}

export function useMedicineFeed(filters: MedicineFeedFilters = {}) {
  const limit = filters.limit ?? DEFAULT_LIMIT;

  // Resolve which filter mode to use.
  // categories takes precedence if both are somehow provided.
  const hasCategories =
    filters.categories !== undefined && filters.categories.length > 0;

  const query = useInfiniteQuery<MedicineFeedResponse>({
    queryKey: medicineFeedKey(filters),
    initialPageParam: 1,
    queryFn: ({ pageParam }) =>
      marketplaceApi.getMedicines({
        page: pageParam as number,
        limit,
        type: filters.type,
        // Pass categories or category — never both.
        ...(hasCategories
          ? { categories: filters.categories }
          : { category: filters.category }),
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