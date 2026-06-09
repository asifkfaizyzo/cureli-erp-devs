// src/features/cart/components/RecommendationSection.tsx

import React, { useCallback, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { router } from "expo-router";
import { useTheme } from "../../../theme/ThemeContext";
import { useCartStore } from "../../../store/cartStore";
import { useShopMedicines } from "../../marketplace/hooks/useShopMedicines";
import { ProductCard } from "../../marketplace/components/ProductCard";
import { RECOMMENDATIONS_LIMIT } from "../../../constants/config";

// EnrichedBranchMedicine extends EnrichedMedicine with listing fields.
// ProductCard expects EnrichedMedicine for its onPress prop.
// We widen the handler to accept EnrichedBranchMedicine (a subtype)
// and cast to satisfy ProductCard's narrower prop type.
import type { EnrichedBranchMedicine } from "../../marketplace/hooks/useShopMedicines";
import type { EnrichedMedicine } from "../../../types/medicine";

export function RecommendationSection() {
  const { colors } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const items = useCartStore((s) => s.items);
  const cartPharmacy = useCartStore((s) => s.cartPharmacy);

  const pharmacy = cartPharmacy();

  const cartVariantIds = useMemo(
    () => new Set(items.map((i) => i.variantId)),
    [items],
  );

  // Primary category from first cart item that has one
  const primaryCategory = useMemo(() => {
    for (const item of items) {
      if (item.category) return item.category;
    }
    return null;
  }, [items]);

  // ── Fetch 1: same branch, any medicines ──────────────────
  // useShopMedicines does not support category filtering via its
  // current API (search param is free-text, not category).
  // We fetch the branch medicines and filter by category client-side.
  // This is acceptable at limit=6 — no extra network cost.
  const branchFetch = useShopMedicines(
    pharmacy?.shopId ?? "",
    pharmacy?.branchId ?? "",
    "",
    // Fetch more than we need so client-side category filter has enough
    // candidates to find 6 matches without a second request.
    RECOMMENDATIONS_LIMIT * 4,
  );

  // ── Derive final list ─────────────────────────────────────
  // Priority:
  //   1. Same branch + same category (client-side filtered)
  //   2. Same branch + any category  (fallback when category yields nothing)
  //   3. Empty → section hidden
  //
  // Cart items are always excluded from recommendations.
  const recommendations = useMemo(() => {
    const all = branchFetch.medicines.filter(
      (m) => !cartVariantIds.has(m.variantId),
    );

    if (primaryCategory) {
      const sameCategory = all.filter(
        (m) => m.category?.toLowerCase() === primaryCategory.toLowerCase(),
      );
      if (sameCategory.length > 0) {
        return sameCategory.slice(0, RECOMMENDATIONS_LIMIT);
      }
    }

    // Fallback: any medicine from same branch
    return all.slice(0, RECOMMENDATIONS_LIMIT);
  }, [branchFetch.medicines, cartVariantIds, primaryCategory]);

  const cardWidth = Math.floor((screenWidth - 48) / 2.4);

  // ProductCard.onPress expects (medicine: EnrichedMedicine) => void.
  // EnrichedBranchMedicine extends EnrichedMedicine, so the cast is safe.
  const handlePress = useCallback((medicine: EnrichedMedicine) => {
    router.push(`/product/${medicine.skuId}` as any);
  }, []);

  const keyExtractor = useCallback(
    (item: EnrichedBranchMedicine) => item.variantId,
    [],
  );

  const renderItem = useCallback(
    ({ item }: { item: EnrichedBranchMedicine }) => (
      <ProductCard
        medicine={item as EnrichedMedicine}
        width={cardWidth}
        onPress={handlePress}
      />
    ),
    [cardWidth, handlePress],
  );

  // Hide if no pharmacy context, still loading, or no results
   if (!pharmacy || branchFetch.isLoading || recommendations.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <Text
        style={[styles.title, { color: colors.text.primary }]}
        numberOfLines={1}
      >
        Also available at {pharmacy.shopName}
      </Text>

      <FlatList
        data={recommendations}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.rail}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 20,
  },
  title: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 12,
    paddingHorizontal: 16,
  },
  rail: {
    paddingHorizontal: 16,
    gap: 10,
    paddingBottom: 4,
  },
});
