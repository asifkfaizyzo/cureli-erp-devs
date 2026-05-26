// src/features/marketplace/hooks/useMedicineDetail.ts
//
// Fetches a single variant (+ siblings) for the product detail screen.
// Accepts a skuId or variant UUID — the service handles dual lookup.
//
// The variant itself is enriched with deterministic fake marketplace data
// (same generator as the feed) so price/ETA/pharmacy count are stable and
// consistent with what the user saw on the card.

import { useQuery } from "@tanstack/react-query";
import { marketplaceApi } from "../api/marketplace.api";
import { generateMarketplaceData } from "../utils/generateMarketplaceData";
import type { EnrichedMedicine, MedicineVariant } from "../types/marketplace.types";

export function medicineDetailKey(idOrSku: string) {
  return ["medicines", "detail", idOrSku] as const;
}

export function useMedicineDetail(idOrSku: string) {
  const query = useQuery({
    queryKey: medicineDetailKey(idOrSku),
    queryFn: () => marketplaceApi.getMedicine(idOrSku),
    enabled: !!idOrSku,
    staleTime: 1000 * 60 * 5, // 5 min — matches root QueryClient default
  });

  // Enrich the main variant with fake marketplace data.
  const variant: EnrichedMedicine | null = query.data?.variant
    ? {
        ...query.data.variant,
        marketplace: generateMarketplaceData(query.data.variant.variantId),
      }
    : null;

  // Siblings are enriched too so the sibling rail is consistent.
  const siblings: EnrichedMedicine[] =
    query.data?.siblings.map((s: MedicineVariant) => ({
      ...s,
      marketplace: generateMarketplaceData(s.variantId),
    })) ?? [];

  return {
    variant,
    siblings,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}