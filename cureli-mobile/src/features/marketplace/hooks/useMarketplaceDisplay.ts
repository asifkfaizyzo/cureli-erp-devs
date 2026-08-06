// src/features/marketplace/hooks/useMarketplaceDisplay.ts

import { useQuery } from "@tanstack/react-query";
import { marketplaceApi } from "../api/marketplace.api";
import type { CategoryDisplayOverride } from "../types/marketplace.types";

export const marketplaceDisplayKey = ["marketplace", "display-config"] as const;

export function useMarketplaceDisplay() {
  const query = useQuery({
    queryKey: marketplaceDisplayKey,
    queryFn:  () => marketplaceApi.getMarketplaceDisplay(),
    staleTime: 1000 * 60 * 30,
    throwOnError: false,
  });

  const overrides: Record<string, CategoryDisplayOverride> =
    query.data?.overrides ?? {};

  return {
    overrides,
    isLoading: query.isLoading,
    refetch: query.refetch,  // ← added
  };
}