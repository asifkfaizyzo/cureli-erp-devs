// src/features/marketplace/hooks/useCategories.ts
//
// Fetches the curated Quick Categories list (GET /mobile/medicines/categories).
// Categories are effectively static, so a long staleTime avoids refetching.

import { useQuery } from "@tanstack/react-query";
import { marketplaceApi } from "../api/marketplace.api";
import type { MedicineCategory } from "../types/marketplace.types";

export const categoriesKey = ["medicines", "categories"] as const;

export function useCategories() {
  const query = useQuery({
    queryKey: categoriesKey,
    queryFn: () => marketplaceApi.getCategories(),
    // Curated + backend-static: no need to refetch within a session.
    staleTime: 1000 * 60 * 60, // 1 hour
  });

  const categories: MedicineCategory[] = query.data?.categories ?? [];

  return {
    categories,
    isLoading: query.isLoading,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
  };
}