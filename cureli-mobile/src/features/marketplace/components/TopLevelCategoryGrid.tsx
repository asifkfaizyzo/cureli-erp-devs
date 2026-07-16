// src/features/marketplace/components/TopLevelCategoryGrid.tsx
//
// Three hardcoded top-level category cards displayed on the home screen.
// Static layout — no backend dependency, no loading state, no scrolling.
//
// Cards are evenly spaced in a single centered row.
// Reuses CategoryCard so the visual style is consistent with the
// AllCategories screen and the existing category rail.
//
// Navigation:
//   Tapping a card navigates to /marketplace/category?category=KEY.
//   CategoryScreen detects the virtual ENGLISH_MEDICINE key and passes
//   the bundled categories[] array to useMedicineFeed.

import React, { useCallback } from "react";
import { View, StyleSheet, useWindowDimensions } from "react-native";
import { router } from "expo-router";

import { Spacing } from "../../../theme/spacing";
import { CategoryCard } from "./CategoryCard";
import { TOP_LEVEL_CATEGORIES } from "../constants/topLevelCategories";

const COLUMNS = 3;
const GAP = Spacing.sm;
const HORIZONTAL_PADDING = Spacing.base;

function TopLevelCategoryGridBase() {
  const { width: screenWidth } = useWindowDimensions();

  const availableWidth = screenWidth - HORIZONTAL_PADDING * 2;
  const cardWidth = (availableWidth - GAP * (COLUMNS - 1)) / COLUMNS;

  const handlePressCategory = useCallback((key: string) => {
    router.push({
      pathname: "/marketplace/category",
      params: { category: key },
    } as any);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {TOP_LEVEL_CATEGORIES.map((category, index) => (
          <View
            key={category.key}
            style={[
              styles.cardWrapper,
              { width: cardWidth },
              index < TOP_LEVEL_CATEGORIES.length - 1 && {
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
    marginTop: Spacing.md,
    paddingHorizontal: HORIZONTAL_PADDING,
  },
  row: {
    flexDirection: "row",
    justifyContent: "center",
  },
  cardWrapper: {},
});

export const TopLevelCategoryGrid = React.memo(TopLevelCategoryGridBase);