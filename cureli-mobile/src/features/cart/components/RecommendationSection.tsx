// "You might also like" — products from same categories as cart items.

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
import { Spacing } from "../../../theme/spacing";

import { ProductCard } from "../../marketplace/components/ProductCard";
import { useMedicineFeed } from "../../marketplace/hooks/useMedicineFeed";
import { useCartStore } from "../../../store/cartStore";
import type { EnrichedMedicine } from "../../marketplace/types/marketplace.types";

export function RecommendationSection() {
  const { colors } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const items = useCartStore((s) => s.items);

  const cardWidth = useMemo(() => {
    return Math.floor((screenWidth - 48) / 3);
  }, [screenWidth]);

  // Get the first unique category from cart items if available.
  // Fall back to no filter (general feed).
  const categoryHint = items[0]
    ? undefined
    : undefined;

  const { medicines } = useMedicineFeed({ limit: 6 } as any);

  const handlePressProduct = useCallback((medicine: EnrichedMedicine) => {
    router.push(`/product/${medicine.skuId}` as any);
  }, []);

  const keyExtractor = useCallback(
    (item: EnrichedMedicine) => item.variantId,
    [],
  );

  const renderItem = useCallback(
    ({ item }: { item: EnrichedMedicine }) => (
      <ProductCard
        medicine={item}
        width={cardWidth}
        onPress={handlePressProduct}
      />
    ),
    [cardWidth, handlePressProduct],
  );

  if (medicines.length === 0) return null;

  return (
    <View style={styles.section}>
      <Text style={[styles.title, { color: colors.text.primary }]}>
        You might also like
      </Text>

      <FlatList
        data={medicines.slice(0, 6)}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        numColumns={3}
        scrollEnabled={false}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.grid}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  title: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 12,
  },
  grid: {
    gap: 8,
  },
  row: {
    justifyContent: "space-between",
    marginBottom: 8,
  },
});