// src/features/marketplace/components/CategoryGrid.tsx

import React, { useCallback, useRef } from "react";
import {
  View,
  StyleSheet,
  useWindowDimensions,
  ScrollView,
} from "react-native";
import { router } from "expo-router";

import { Spacing } from "../../../theme/spacing";
import { CategoryCard, type GridItem } from "./CategoryCard";
import { CategoryGridSkeleton } from "./CategoryGridSkeleton";
import type { MedicineCategory } from "../types/marketplace.types";

const VISIBLE_ITEMS = 4.25; // 4 full cards + a peek of the next one
const GAP = Spacing.sm;
const HORIZONTAL_PADDING = Spacing.base;

interface CategoryGridProps {
  categories: MedicineCategory[];
  isLoading: boolean;
}

function CategoryGridBase({ categories, isLoading }: CategoryGridProps) {
  const { width: screenWidth } = useWindowDimensions();
  const scrollViewRef = useRef<ScrollView>(null);

  const availableWidth = screenWidth - HORIZONTAL_PADDING * 2;

  // 4.25 visible cards means:
  // - 4 full gaps are visible between them
  const visibleGaps = Math.ceil(VISIBLE_ITEMS) - 1;

  const cardWidth =
    (availableWidth - GAP * visibleGaps) / VISIBLE_ITEMS;

  const gridItems: GridItem[] = categories.map((cat) => ({
    type: "category",
    data: cat,
  }));

  const handlePressCategory = useCallback((key: string) => {
    router.push({
      pathname: "/(tabs)/categories",
      params: { category: key },
    } as any);
  }, []);

  if (isLoading) {
    return (
      <View style={styles.skeletonContainer}>
        <CategoryGridSkeleton columns={4} count={5} />
      </View>
    );
  }

  if (categories.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        snapToInterval={cardWidth + GAP}
        snapToAlignment="start"
        decelerationRate="fast"
        disableIntervalMomentum
      >
        {gridItems.map((item, index) => (
          <View
            key={item.type === "category" ? item.data.key : `item-${index}`}
            style={[
              styles.cardWrapper,
              { width: cardWidth },
              index < gridItems.length - 1 && { marginRight: GAP },
            ]}
          >
            <CategoryCard
              item={item}
              cardWidth={cardWidth}
              selected={false}
              onPressCategory={handlePressCategory}
              onPressNext={() => {}}
              onPressBack={() => {}}
            />
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: Spacing.md,
  },
  scrollContent: {
    paddingHorizontal: HORIZONTAL_PADDING,
  },
  cardWrapper: {},
  skeletonContainer: {
    marginTop: Spacing.md,
    paddingHorizontal: HORIZONTAL_PADDING,
  },
});

export const CategoryGrid = React.memo(CategoryGridBase);