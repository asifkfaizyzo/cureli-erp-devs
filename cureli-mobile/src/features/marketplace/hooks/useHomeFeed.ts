// src/features/marketplace/hooks/useHomeFeed.ts
//
// Fetches the complete home feed from GET /mobile/medicines/feed.
// One network request replaces the previous pattern of one request
// per category section on the home screen.
//
// Enrichment:
//   Each MedicineVariant returned by the backend is enriched with
//   deterministic fake marketplace data (generateMarketplaceData).
//   The enrichment is memoised — it only re-runs when the raw server
//   data changes, not on every render.
//
// staleTime: 0
//   The home feed should feel live on every app foreground / tab focus.
//   staleTime: 0 means TanStack Query will always revalidate in the
//   background when the component mounts, while showing cached data
//   instantly if available (standard stale-while-revalidate behaviour).
//   This is intentionally different from useCategories (1 hour) because
//   the category list is static but the feed content is not.
//
// The hook is intentionally unaware of demo vs production mode.
// That decision lives entirely on the backend.

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { marketplaceApi } from "../api/marketplace.api";
import { generateMarketplaceData } from "../utils/generateMarketplaceData";
import type { EnrichedFeedSection } from "../types/marketplace.types";

// ── Query key ─────────────────────────────────────────────────
// Stable key — the home feed takes no client-side params.
// Exported so HomeScreen can call queryClient.invalidateQueries
// if needed in future (e.g. after location change).

export const homeFeedKey = ["medicines", "feed", "home"] as const;

// ── Hook ──────────────────────────────────────────────────────

export function useHomeFeed() {
  const query = useQuery({
    queryKey: homeFeedKey,
    queryFn: () => marketplaceApi.getFeed(),
    // Always revalidate on mount — home screen should feel live.
    // Cached data is shown immediately while the revalidation runs.
    staleTime: 0,
  });

  // Enrich each section's medicines with deterministic fake marketplace
  // data. useMemo is keyed on query.data so enrichment is stable across
  // re-renders and only re-runs when fresh data arrives from the server.
  const sections: EnrichedFeedSection[] = useMemo(() => {
    const raw = query.data?.sections ?? [];

    return raw.map((section) => ({
      key: section.key,
      title: section.title,
      icon: section.icon,
      medicines: section.medicines.map((variant) => ({
        ...variant,
        marketplace: generateMarketplaceData(variant.variantId),
      })),
    }));
  }, [query.data?.sections]);

  return {
    sections,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    isRefetching: query.isRefetching,
  };
}