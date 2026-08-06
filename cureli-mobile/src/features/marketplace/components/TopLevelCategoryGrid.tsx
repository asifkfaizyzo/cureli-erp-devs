// src/features/marketplace/components/TopLevelCategoryGrid.tsx

import React, { useCallback, useEffect, useMemo } from "react";  // ← useEffect added
import { View, StyleSheet, useWindowDimensions } from "react-native";
import { router } from "expo-router";

import { Spacing } from "../../../theme/spacing";
import { CategoryCard } from "./CategoryCard";
import { TOP_LEVEL_CATEGORIES } from "../constants/topLevelCategories";
import { useMarketplaceDisplay } from "../hooks/useMarketplaceDisplay";
import type { MedicineCategory } from "../types/marketplace.types";

const COLUMNS            = 3;
const GAP                = Spacing.sm;
const HORIZONTAL_PADDING = Spacing.base;

// ← added
interface TopLevelCategoryGridProps {
  refreshTrigger?: number;
}

function TopLevelCategoryGridBase({ refreshTrigger }: TopLevelCategoryGridProps) {  // ← prop added
  const { width: screenWidth } = useWindowDimensions();
  const { overrides, refetch } = useMarketplaceDisplay();  // ← refetch added

  const availableWidth = screenWidth - HORIZONTAL_PADDING * 2;
  const cardWidth      = (availableWidth - GAP * (COLUMNS - 1)) / COLUMNS;

  // ← added — fires refetch whenever HomeScreen bumps the trigger
  useEffect(() => {
    if (refreshTrigger && refreshTrigger > 0) {
      refetch();
    }
  }, [refreshTrigger]);

  const visibleCategories = useMemo((): MedicineCategory[] => {
    return TOP_LEVEL_CATEGORIES
      .filter((cat) => {
        const override = overrides[cat.key];
        return !override?.isHidden;
      })
      .map((cat) => {
        const override = overrides[cat.key];
        return {
          ...cat,
          imageUrl: override?.imageUrl ?? null,
        };
      });
  }, [overrides]);

  const handlePressCategory = useCallback((key: string) => {
    router.push({
      pathname: "/marketplace/category",
      params: { category: key },
    } as any);
  }, []);

  if (visibleCategories.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {visibleCategories.map((category, index) => (
          <View
            key={category.key}
            style={[
              styles.cardWrapper,
              { width: cardWidth },
              index < visibleCategories.length - 1 && {
                marginRight: GAP,
              },
            ]}
          >
            <CategoryCard
              item={{ type: "category", data: category }}
              cardWidth={cardWidth}
              selected={false}
              onPressCategory={handlePressCategory}
              onPressNext={() => {}}
              onPressBack={() => {}}
            />
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop:         Spacing.md,
    paddingHorizontal: HORIZONTAL_PADDING,
  },
  row: {
    flexDirection:  "row",
    justifyContent: "flex-start",
  },
  cardWrapper: {},
});

export const TopLevelCategoryGrid = React.memo(TopLevelCategoryGridBase);