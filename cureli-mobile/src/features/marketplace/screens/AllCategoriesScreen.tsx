// src/features/marketplace/screens/AllCategoriesScreen.tsx
//
// Full categories screen — reached from "View all" on the home screen.
//
// Layout:
//   1. Top section — the 3 top-level hero categories (English Medicine,
//      Ayurvedic, Veterinary). Same cards as the home screen but displayed
//      in a 3-column row at the top.
//   2. Section divider with label "All Categories".
//   3. Bottom section — all backend-driven curated categories from
//      useCategories, displayed in a 3-column scrollable grid.
//
// Both sections use CategoryCard for visual consistency.
// The top section is static — no backend dependency, no loading state.
// The bottom section shows a skeleton while useCategories loads.

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
import { CategoryCard } from "../components/CategoryCard";
import { CategoryGridSkeleton } from "../components/CategoryGridSkeleton";
import { TOP_LEVEL_CATEGORIES } from "../constants/topLevelCategories";

const COLUMNS = 3;
const GAP = Spacing.sm;
const HORIZONTAL_PADDING = Spacing.base * 2;

function chunkIntoRows<T>(items: T[], size: number): T[][] {
  const rows: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    rows.push(items.slice(i, i + size));
  }
  return rows;
}

export function AllCategoriesScreen() {
  const { colors } = useTheme();
  const { width: screenWidth } = useWindowDimensions();

  const { categories, isLoading } = useCategories();

  const cardWidth =
    (screenWidth - HORIZONTAL_PADDING - GAP * (COLUMNS - 1)) / COLUMNS;

  // ── Top-level row (3 cards, always static) ─────────────────
  // Pad with empty spacers if TOP_LEVEL_CATEGORIES has fewer than 3.
  // Currently exactly 3 — but this guards against future changes.
  const topLevelRow = useMemo(() => {
    const row = [...TOP_LEVEL_CATEGORIES];
    while (row.length < COLUMNS) {
      row.push(undefined as any);
    }
    return row;
  }, []);

  // ── Backend categories in 3-column rows ────────────────────
  const rows = useMemo(() => chunkIntoRows(categories, COLUMNS), [categories]);

  const handleBack = useCallback(() => {
    router.back();
  }, []);

  const handleSelectCategory = useCallback((key: string) => {
    router.push({
      pathname: "/marketplace/category",
      params: { category: key },
    } as any);
  }, []);

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background.page }]}
      edges={["top"]}
    >
      {/* Custom header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.background.page,
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
          <Ionicons
            name="arrow-back"
            size={22}
            color={colors.text.primary}
          />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
          All Categories
        </Text>

        {/* spacer to keep title centered */}
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: Spacing["3xl"] },
        ]}
      >
        {/* ── Top-level hero categories ─────────────────────────── */}
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

        {/* ── Section divider ───────────────────────────────────── */}
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

        {/* ── Backend curated categories ─────────────────────────── */}
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
                  ? Array.from({ length: COLUMNS - row.length }).map(
                      (_, i) => (
                        <View
                          key={`spacer-${rowIndex}-${i}`}
                          style={{ width: cardWidth }}
                        />
                      ),
                    )
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
    height: 56,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.base,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: "center",
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
    flexDirection: "row",
    justifyContent: "center",
  },
  topCardWrapper: {},
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.base,
    marginTop: Spacing.lg,
    marginBottom: Spacing.md,
    gap: Spacing.sm,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerLabel: {
    ...Typography.smallMedium,
    paddingHorizontal: Spacing.sm,
  },
  grid: {
    paddingHorizontal: Spacing.base,
    gap: GAP,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

export default AllCategoriesScreen;