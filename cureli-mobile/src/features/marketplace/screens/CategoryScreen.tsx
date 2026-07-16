// src/features/marketplace/screens/CategoryScreen.tsx
//
// Full category screen.
// Header: Back | Title | Search + Cart
// Body: 3-column vertical grid of ProductCards
// Receives category key via route params.
//
// ENGLISH_MEDICINE handling:
//   The home screen and AllCategories screen navigate here with
//   ?category=ENGLISH_MEDICINE. This is a virtual frontend-only key
//   that does not exist in the DB. When detected, this screen:
//     1. Passes categories[] (the full DRUG key bundle) to useMedicineFeed
//        instead of a single category string.
//     2. Resolves the display label locally ("English Medicine") instead
//        of looking it up via useCategories.

import React, { useCallback, useMemo } from "react";
import {
  View,
  FlatList,
  ActivityIndicator,
  Text,
  StyleSheet,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "../../../theme/ThemeContext";
import { Typography } from "../../../theme/typography";
import { Spacing } from "../../../theme/spacing";

import { CategoryScreenHeader } from "../components/CategoryScreenHeader";
import { ProductCard } from "../components/ProductCard";

import { useMedicineFeed } from "../hooks/useMedicineFeed";
import { useCategories } from "../hooks/useCategories";
import {
  ENGLISH_MEDICINE_KEY,
  ENGLISH_MEDICINE_CATEGORIES,
  TOP_LEVEL_CATEGORIES,
} from "../constants/topLevelCategories";
import type { EnrichedMedicine } from "../types/marketplace.types";

const COLUMNS = 3;
const GAP = Spacing.sm;
const HORIZONTAL_PADDING = Spacing.base * 2;

export function CategoryScreen() {
  const { colors } = useTheme();
  const { width: screenWidth } = useWindowDimensions();
  const params = useLocalSearchParams<{ category?: string }>();

  const categoryKey = params.category ?? null;

  // ── Detect virtual ENGLISH_MEDICINE key ─────────────────────
  const isEnglishMedicine = categoryKey === ENGLISH_MEDICINE_KEY;

  // ── Resolve display label ───────────────────────────────────
  // For top-level cards, resolve label from the constants (no backend needed).
  // For regular categories, fall back to useCategories lookup.
  const { categories } = useCategories();

  const categoryLabel = useMemo(() => {
    // Check top-level first (handles ENGLISH_MEDICINE, Ayurveda Products, Pet Care)
    const topLevel = TOP_LEVEL_CATEGORIES.find((c) => c.key === categoryKey);
    if (topLevel) return topLevel.label;

    // Fall back to backend curated categories
    const backend = categories.find((c) => c.key === categoryKey);
    if (backend) return backend.label;

    return "All Medicines";
  }, [categoryKey, categories]);

  // ── Feed hook — categories[] for English Medicine, single category otherwise
  const feedFilters = useMemo(() => {
    if (isEnglishMedicine) {
      return { categories: ENGLISH_MEDICINE_CATEGORIES };
    }
    return { category: categoryKey ?? undefined };
  }, [categoryKey, isEnglishMedicine]);

  const cardWidth = useMemo(
    () =>
      Math.floor(
        (screenWidth - HORIZONTAL_PADDING - GAP * (COLUMNS - 1)) / COLUMNS,
      ),
    [screenWidth],
  );

  const {
    medicines,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useMedicineFeed(feedFilters);

  // ── Handlers ──────────────────────────────────────────────────

  const handlePressBack = useCallback(() => {
    router.back();
  }, []);

  const handlePressSearch = useCallback(() => {
    router.push("/search" as any);
  }, []);

  const handlePressCart = useCallback(() => {
    router.push("/cart" as any);
  }, []);

  const handlePressProduct = useCallback((medicine: EnrichedMedicine) => {
    router.push(`/product/${medicine.skuId}` as any);
  }, []);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // ── FlatList renderers ────────────────────────────────────────

  const renderItem = useCallback(
    ({ item }: { item: EnrichedMedicine }) => (
      <View style={[styles.cardWrapper, { width: cardWidth }]}>
        <ProductCard
          medicine={item}
          width={cardWidth}
          onPress={handlePressProduct}
        />
      </View>
    ),
    [cardWidth, handlePressProduct],
  );

  const keyExtractor = useCallback(
    (item: EnrichedMedicine) => item.variantId,
    [],
  );

  const ListFooter = useCallback(() => {
    if (isFetchingNextPage) {
      return (
        <View style={styles.footer}>
          <ActivityIndicator size="small" color={colors.brand.primary} />
        </View>
      );
    }
    return <View style={styles.footerSpacer} />;
  }, [isFetchingNextPage, colors.brand.primary]);

  const ListEmpty = useCallback(() => {
    if (isLoading) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.brand.primary} />
          <Text style={[styles.centerText, { color: colors.text.muted }]}>
            Loading medicines…
          </Text>
        </View>
      );
    }

    if (isError) {
      return (
        <View style={styles.center}>
          <Ionicons
            name="cloud-offline-outline"
            size={44}
            color={colors.text.faint}
          />
          <Text style={[styles.centerText, { color: colors.text.secondary }]}>
            Couldn't load medicines
          </Text>
          <Text
            style={[styles.retryText, { color: colors.text.brand }]}
            onPress={() => refetch()}
          >
            Tap to retry
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.center}>
        <Ionicons name="search-outline" size={44} color={colors.text.faint} />
        <Text style={[styles.centerText, { color: colors.text.secondary }]}>
          No medicines found
        </Text>
      </View>
    );
  }, [isLoading, isError, refetch, colors]);

  // ── Render ────────────────────────────────────────────────────

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background.page }]}
      edges={["top"]}
    >
      <CategoryScreenHeader
        title={categoryLabel}
        onPressBack={handlePressBack}
        onPressSearch={handlePressSearch}
        onPressCart={handlePressCart}
      />

      <FlatList
        data={medicines}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        numColumns={COLUMNS}
        columnWrapperStyle={styles.row}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.listContent,
          medicines.length === 0 && styles.emptyContent,
        ]}
        ListEmptyComponent={ListEmpty}
        ListFooterComponent={ListFooter}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        initialNumToRender={12}
        maxToRenderPerBatch={12}
        windowSize={9}
        removeClippedSubviews
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.md,
    paddingBottom: Spacing["3xl"],
  },
  emptyContent: {
    flexGrow: 1,
  },
  row: {
    justifyContent: "space-between",
    marginBottom: Spacing.lg,
  },
  cardWrapper: {},
  footer: {
    paddingVertical: Spacing.lg,
    alignItems: "center",
  },
  footerSpacer: {
    height: Spacing["2xl"],
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing["4xl"],
    gap: Spacing.sm,
  },
  centerText: {
    ...Typography.h4,
    marginTop: Spacing.sm,
    textAlign: "center",
  },
  retryText: {
    ...Typography.bodyMedium,
    textAlign: "center",
  },
});