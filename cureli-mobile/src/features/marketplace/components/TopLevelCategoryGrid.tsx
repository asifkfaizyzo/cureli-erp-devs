// src/features/marketplace/components/TopLevelCategoryGrid.tsx
//
// Three top-level hero category cards on the home screen.
//
// Previously fully static. Now merges CAdmin display overrides:
//   - imageUrl from backend → passed into CategoryCard via category.imageUrl
//   - isHidden = true       → card is excluded from the rendered row
//
// Override data comes from useMarketplaceDisplay (30-min staleTime).
// On fetch failure the hook returns an empty overrides map — all 3 cards
// render with icon fallbacks, no error shown.
//
// Layout:
//   - Up to 3 cards in a single centred row
//   - If 1 or 2 cards are hidden, remaining cards stay left-aligned
//     with consistent GAP spacing (no stretching to fill the row)
//   - If all 3 are hidden, the component renders nothing (null)
//
// Navigation unchanged — tapping navigates to /marketplace/category?category=KEY

import React, { useCallback, useMemo } from "react";
import { View, StyleSheet, useWindowDimensions } from "react-native";
import { router } from "expo-router";

import { Spacing } from "../../../theme/spacing";
import { CategoryCard } from "./CategoryCard";
import { TOP_LEVEL_CATEGORIES } from "../constants/topLevelCategories";
import { useMarketplaceDisplay } from "../hooks/useMarketplaceDisplay";
import type { MedicineCategory } from "../types/marketplace.types";

const COLUMNS           = 3;
const GAP               = Spacing.sm;
const HORIZONTAL_PADDING = Spacing.base;

function TopLevelCategoryGridBase() {
  const { width: screenWidth } = useWindowDimensions();
  const { overrides } = useMarketplaceDisplay();

  const availableWidth = screenWidth - HORIZONTAL_PADDING * 2;
  const cardWidth      = (availableWidth - GAP * (COLUMNS - 1)) / COLUMNS;

  // Merge overrides into TOP_LEVEL_CATEGORIES and filter hidden cards.
  // Memoised — only recomputes when overrides object reference changes
  // (which happens when the query resolves or refreshes).
  const visibleCategories = useMemo((): MedicineCategory[] => {
    return TOP_LEVEL_CATEGORIES
      .filter((cat) => {
        const override = overrides[cat.key];
        // No row in DB = visible by default
        return !override?.isHidden;
      })
      .map((cat) => {
        const override = overrides[cat.key];
        return {
          ...cat,
          // Attach remote imageUrl — undefined means no override, falls back to icon
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

  // If all top-level categories are hidden, render nothing.
  // This is an edge case but must not crash or leave an empty gap.
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
    marginTop:        Spacing.md,
    paddingHorizontal: HORIZONTAL_PADDING,
  },
  row: {
    flexDirection: "row",
    // Left-align so remaining cards don't stretch when one is hidden.
    // Previously "center" — changed to "flex-start" to handle
    // the 1-card and 2-card cases correctly.
    justifyContent: "flex-start",
  },
  cardWrapper: {},
});

export const TopLevelCategoryGrid = React.memo(TopLevelCategoryGridBase);