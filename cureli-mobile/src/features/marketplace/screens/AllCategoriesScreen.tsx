// src/features/marketplace/screens/AllCategoriesScreen.tsx
//
// Full categories screen — reached from "View all" on the home screen.
//
// Layout:
//   1. Top section — the top-level hero categories (English Medicine,
//      Ayurvedic, Pet Care). Same cards as the home screen but displayed
//      in a 3-column row at the top.
//      Hidden categories (CAdmin override) are excluded from this row.
//   2. Section divider with label "All Categories".
//   3. Bottom section — all backend-driven curated categories from
//      useCategories, displayed in a 3-column scrollable grid.
//      Hidden categories are already excluded from the API response.
//      Top-level keys (Ayurveda Products, Pet Care, ENGLISH_MEDICINE) are
//      excluded from this grid — they are already shown above and repeating
//      them would be redundant. This exclusion is intentional and hardcoded
//      because these categories will never need to appear in both sections
//      simultaneously.
//
// Both sections use CategoryCard for visual consistency.
// The top section uses useMarketplaceDisplay for remote image + visibility.
// The bottom section uses useCategories (already merges imageUrl + filters hidden).

import React, { useCallback, useMemo } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  Text,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "../../../theme/ThemeContext";
import { Typography } from "../../../theme/typography";
import { Spacing } from "../../../theme/spacing";

import { useCategories } from "../hooks/useCategories";
import { useMarketplaceDisplay } from "../hooks/useMarketplaceDisplay";
import { CategoryCard } from "../components/CategoryCard";
import { CategoryGridSkeleton } from "../components/CategoryGridSkeleton";
import { TOP_LEVEL_CATEGORIES } from "../constants/topLevelCategories";
import type { MedicineCategory } from "../types/marketplace.types";

const COLUMNS            = 3;
const GAP                = Spacing.sm;
const HORIZONTAL_PADDING = Spacing.base * 2;

// Keys already shown in the top-level hero row.
// Excluded from the curated grid below to prevent the same category
// appearing twice on the same screen.
// Derived from TOP_LEVEL_CATEGORIES so any future top-level additions
// are automatically excluded without touching this file.
const TOP_LEVEL_KEYS_SET = new Set(
  TOP_LEVEL_CATEGORIES.map((c) => c.key)
);

function chunkIntoRows<T>(items: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    rows.push(items.slice(i, i + size));
  }
  return rows;
}

export function AllCategoriesScreen() {
  const { colors }             = useTheme();
  const { width: screenWidth } = useWindowDimensions();

  const { categories, isLoading } = useCategories();
  const { overrides }             = useMarketplaceDisplay();

  const cardWidth =
    (screenWidth - HORIZONTAL_PADDING - GAP * (COLUMNS - 1)) / COLUMNS;

  // ── Top-level hero row ─────────────────────────────────────────────────────
  // Filter hidden cards and attach remote imageUrl from overrides.
  // Pads to COLUMNS with undefined spacers so layout stays consistent
  // regardless of how many cards are hidden.

  const visibleTopLevel = useMemo((): MedicineCategory[] => {
    return TOP_LEVEL_CATEGORIES
      .filter((cat) => !overrides[cat.key]?.isHidden)
      .map((cat) => ({
        ...cat,
        imageUrl: overrides[cat.key]?.imageUrl ?? null,
      }));
  }, [overrides]);

  const topLevelRow = useMemo(() => {
    const row: (MedicineCategory | undefined)[] = [...visibleTopLevel];
    while (row.length < COLUMNS) {
      row.push(undefined);
    }
    return row;
  }, [visibleTopLevel]);

  // ── Curated grid ───────────────────────────────────────────────────────────
  // useCategories already filters hidden categories and attaches imageUrl.
  // Additionally exclude any key that appears in the top-level row above
  // to avoid showing the same category twice on this screen.

  const rows = useMemo(() => {
    const filtered = categories.filter((c) => !TOP_LEVEL_KEYS_SET.has(c.key));
    return chunkIntoRows(filtered, COLUMNS);
  }, [categories]);

  // ── Handlers ───────────────────────────────────────────────────────────────

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  const handleSelectCategory = useCallback((key: string) => {
    router.push({
      pathname: "/marketplace/category",
      params: { category: key },
    } as any);
  }, []);

  // If all top-level cards are hidden, skip the top section entirely
  const showTopSection = visibleTopLevel.length > 0;

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background.page }]}
      edges={["top"]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor:   colors.background.page,
            borderBottomColor: colors.border.subtle,
          },
        ]}
      >
        <TouchableOpacity
          onPress={handleBack}
          activeOpacity={0.7}
          accessibilityRole="button"
          accessibilityLabel="Go back"
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={22} color={colors.text.primary} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
          All Categories
        </Text>

        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Spacing["3xl"] },
        ]}
      >
        {/* ── Top-level hero categories ──────────────────────────────────── */}
        {showTopSection && (
          <View style={styles.sectionContainer}>
            <View style={styles.topRow}>
              {topLevelRow.map((category, index) => {
                if (!category) {
                  return (
                    <View
                      key={`top-spacer-${index}`}
                      style={{ width: cardWidth }}
                    />
                  );
                }
                return (
                  <View
                    key={category.key}
                    style={[
                      styles.topCardWrapper,
                      { width: cardWidth },
                      index < topLevelRow.length - 1 && { marginRight: GAP },
                    ]}
                  >
                    <CategoryCard
                      item={{ type: "category", data: category }}
                      cardWidth={cardWidth}
                      selected={false}
                      onPressCategory={handleSelectCategory}
                      onPressNext={() => {}}
                      onPressBack={() => {}}
                    />
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* ── Section divider ────────────────────────────────────────────── */}
        <View style={styles.dividerContainer}>
          <View
            style={[styles.dividerLine, { backgroundColor: colors.border.subtle }]}
          />
          <Text style={[styles.dividerLabel, { color: colors.text.secondary }]}>
            All Categories
          </Text>
          <View
            style={[styles.dividerLine, { backgroundColor: colors.border.subtle }]}
          />
        </View>

        {/* ── Curated categories grid ────────────────────────────────────── */}
        {isLoading ? (
          <View style={styles.sectionContainer}>
            <CategoryGridSkeleton columns={3} count={12} />
          </View>
        ) : (
          <View style={styles.grid}>
            {rows.map((row, rowIndex) => (
              <View key={`row-${rowIndex}`} style={styles.row}>
                {row.map((category) => (
                  <CategoryCard
                    key={category.key}
                    item={{ type: "category", data: category }}
                    cardWidth={cardWidth}
                    selected={false}
                    onPressCategory={handleSelectCategory}
                    onPressNext={() => {}}
                    onPressBack={() => {}}
                  />
                ))}

                {row.length < COLUMNS
                  ? Array.from({ length: COLUMNS - row.length }).map((_, i) => (
                      <View
                        key={`spacer-${rowIndex}-${i}`}
                        style={{ width: cardWidth }}
                      />
                    ))
                  : null}
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    height:            56,
    flexDirection:     "row",
    alignItems:        "center",
    justifyContent:    "space-between",
    paddingHorizontal: Spacing.base,
    borderBottomWidth: 1,
  },
  backButton: {
    width:          36,
    height:         36,
    alignItems:     "center",
    justifyContent: "center",
  },
  headerTitle: {
    ...Typography.h4,
  },
  headerSpacer: {
    width: 36,
  },
  content: {
    paddingTop: Spacing.md,
  },
  sectionContainer: {
    paddingHorizontal: Spacing.base,
  },
  topRow: {
    flexDirection:  "row",
    justifyContent: "center",
  },
  topCardWrapper: {},
  dividerContainer: {
    flexDirection:     "row",
    alignItems:        "center",
    paddingHorizontal: Spacing.base,
    marginTop:         Spacing.lg,
    marginBottom:      Spacing.md,
    gap:               Spacing.sm,
  },
  dividerLine: {
    flex:   1,
    height: 1,
  },
  dividerLabel: {
    ...Typography.smallMedium,
    paddingHorizontal: Spacing.sm,
  },
  grid: {
    paddingHorizontal: Spacing.base,
    gap:               GAP,
  },
  row: {
    flexDirection:  "row",
    justifyContent: "space-between",
  },
});

export default AllCategoriesScreen;