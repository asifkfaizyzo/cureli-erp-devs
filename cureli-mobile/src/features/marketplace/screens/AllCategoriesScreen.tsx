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
        {isLoading ? (
          <CategoryGridSkeleton columns={3} count={12} />
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