// src/features/marketplace/hooks/useMedicineDetail.ts
//
// Fetches a single variant (+ siblings) for the product detail screen.
// Accepts a skuId or variant UUID — the service handles dual lookup.
//
// The variant is no longer enriched with generateMarketplaceData on the
// detail screen — real shop data is fetched separately via useMedicineShops.
// The marketplace field is still attached (via generateMarketplaceData) so
// the type EnrichedMedicineDetail is satisfied, but the detail screen
// does NOT render any value from it. Siblings keep their enrichment for
// the sibling rail (price is hidden per Q7).

import { useQuery } from "@tanstack/react-query";
import { marketplaceApi } from "../api/marketplace.api";
import { generateMarketplaceData } from "../utils/generateMarketplaceData";
import type {
  EnrichedMedicine,
  EnrichedMedicineDetail,
  MedicineVariant,
} from "../types/marketplace.types";

export function medicineDetailKey(idOrSku: string) {
  return ["medicines", "detail", idOrSku] as const;
}

export function useMedicineDetail(idOrSku: string) {
  const query = useQuery({
    queryKey: medicineDetailKey(idOrSku),
    queryFn: () => marketplaceApi.getMedicine(idOrSku),
    enabled: !!idOrSku,
    staleTime: 1000 * 60 * 5,
  });

  // marketplace field is attached to satisfy EnrichedMedicineDetail type.
  // The detail screen uses real shop data from useMedicineShops instead.
  const variant: EnrichedMedicineDetail | null = query.data?.variant
    ? {
        ...query.data.variant,
        marketplace: generateMarketplaceData(query.data.variant.variantId),
      }
    : null;

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