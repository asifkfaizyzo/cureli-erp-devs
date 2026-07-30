// src/features/marketplace/hooks/useMarketplaceDisplay.ts
//
// Fetches top-level category display overrides from the backend.
//
// Used by:
//   - TopLevelCategoryGrid (home screen hero cards)
//   - AllCategoriesScreen top row (same 3 hero cards)
//
// Returns a stable overrides map keyed by category key.
// All 3 top-level keys are always present in the API response.
// On fetch failure: returns empty map, UI falls back to local
// icon/color defaults silently — no error shown to the user.
//
// staleTime: 30 minutes
//   These are prominent UI elements (first thing users see).
//   Shorter than curated categories (1 hour) but still not live data.

import { useQuery } from "@tanstack/react-query";
import { marketplaceApi } from "../api/marketplace.api";
import type { CategoryDisplayOverride } from "../types/marketplace.types";

export const marketplaceDisplayKey = ["marketplace", "display-config"] as const;

export function useMarketplaceDisplay() {
  const query = useQuery({
    queryKey: marketplaceDisplayKey,
    queryFn:  () => marketplaceApi.getMarketplaceDisplay(),
    staleTime: 1000 * 60 * 30,  // 30 minutes
    // Silent failure — do not surface errors to the UI.
    // Missing overrides mean the UI uses local fallbacks.
    throwOnError: false,
  });

  // Always a stable Record — never undefined.
  // Absent keys = no override = use local defaults.
  const overrides: Record<string, CategoryDisplayOverride> =
    query.data?.overrides ?? {};

  return {
    overrides,
    isLoading: query.isLoading,
  };
}