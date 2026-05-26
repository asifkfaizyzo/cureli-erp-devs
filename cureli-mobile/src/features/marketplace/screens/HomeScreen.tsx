// src/features/marketplace/screens/HomeScreen.tsx
//
// Marketplace home screen — assembles the full discovery experience.
//
// Architecture note:
//   The entire non-feed UI (Header, SearchBar, HeroBanner, CategoryRail,
//   SectionHeader) lives inside ListHeaderComponent. This keeps the page as
//   a single FlatList rather than a ScrollView wrapping a FlatList, which
//   would break virtualisation and hurt scroll performance on a long feed.
//
// Data flow:
//   useCategories   → curated category rail (cached 1h, effectively static)
//   useMedicineFeed → infinite paginated feed; each variant is enriched with
//                     deterministic fake marketplace data inside the hook
//
// Interactions:
//   Category pill tap  → setSelectedCategory → new query key → feed refetches
//   Tap active pill    → clears filter (handled inside CategoryRail)
//   Card tap           → router.push('/product/{skuId}')
//   Search tap         → router.push('/search')
//   Profile/bell tap   → router.push('/(tabs)/profile')
//   Pull to refresh    → RefreshControl → refetch()
//   Scroll to bottom   → onEndReached → fetchNextPage()

import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  type ListRenderItem,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "../../../theme/ThemeContext";
import { Typography } from "../../../theme/typography";
import { Spacing } from "../../../theme/spacing";

import { HomeHeader } from "../components/HomeHeader";
import { SearchBar } from "../components/SearchBar";
import { HeroBanner } from "../components/HeroBanner";
import { CategoryRail } from "../components/CategoryRail";
import { SectionHeader } from "../components/SectionHeader";
import { MedicineCard } from "../components/MedicineCard";

import { useMedicineFeed } from "../hooks/useMedicineFeed";
import { useCategories } from "../hooks/useCategories";

import type { EnrichedMedicine } from "../types/marketplace.types";

// ── Screen ────────────────────────────────────────────────────

export function HomeScreen() {
  const { colors } = useTheme();

  // Selected category key (internal backend code, e.g. "DERMA").
  // null means "no filter" — full feed.
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const { categories } = useCategories();

  const {
    medicines,
    isLoading,
    isError,
    refetch,
    isRefetching,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useMedicineFeed({
    category: selectedCategory ?? undefined,
  });

  // ── Handlers ─────────────────────────────────────────────────

  const handleSelectCategory = useCallback((key: string | null) => {
    setSelectedCategory(key);
  }, []);

  const handlePressMedicine = useCallback((medicine: EnrichedMedicine) => {
    router.push(`/product/${medicine.skuId}`);
  }, []);

  const handlePressSearch = useCallback(() => {
    router.push("/search");
  }, []);

  const handlePressProfile = useCallback(() => {
    router.push("/(tabs)/profile");
  }, []);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  // ── FlatList renderers ────────────────────────────────────────

  const renderItem = useCallback<ListRenderItem<EnrichedMedicine>>(
    ({ item }) => (
      <MedicineCard medicine={item} onPress={handlePressMedicine} />
    ),
    [handlePressMedicine],
  );

  const keyExtractor = useCallback(
    (item: EnrichedMedicine) => item.variantId,
    [],
  );

  // ListHeaderComponent — rendered above the first card. useCallback so
  // it doesn't remount when unrelated state changes.
  const ListHeader = useCallback(
    () => (
      <View>
        <HomeHeader
          onPressProfile={handlePressProfile}
          onPressNotifications={handlePressProfile}
        />
        <SearchBar onPress={handlePressSearch} />
        <HeroBanner />
        <CategoryRail
          categories={categories}
          selectedKey={selectedCategory}
          onSelect={handleSelectCategory}
        />
        <SectionHeader
          title={selectedCategory ? "Filtered results" : "Popular near you"}
        />
      </View>
    ),
    [
      categories,
      selectedCategory,
      handlePressProfile,
      handlePressSearch,
      handleSelectCategory,
    ],
  );

  // Spinner row when loading more pages at the bottom.
  const ListFooter = useCallback(() => {
    if (isFetchingNextPage) {
      return (
        <View style={styles.footer}>
          <ActivityIndicator size="small" color={colors.brand.primary} />
        </View>
      );
    }
    // Bottom padding so the last card clears the tab bar.
    return <View style={styles.footerSpacer} />;
  }, [isFetchingNextPage, colors.brand.primary]);

  // Empty state — three distinct phases so the user always knows what's
  // happening: initial load, network error, or genuinely no results.
  const ListEmpty = useCallback(() => {
    if (isLoading) {
      return (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.brand.primary} />
          <Text style={[styles.centerText, { color: colors.text.muted }]}>
            Finding medicines near you…
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
            style={[styles.centerSubtext, { color: colors.text.brand }]}
            onPress={() => refetch()}
          >
            Tap to retry
          </Text>
        </View>
      );
    }

    // No results (e.g. category with no variants).
    return (
      <View style={styles.center}>
        <Ionicons
          name="search-outline"
          size={44}
          color={colors.text.faint}
        />
        <Text style={[styles.centerText, { color: colors.text.secondary }]}>
          No medicines found
        </Text>
        <Text style={[styles.centerSubtext, { color: colors.text.muted }]}>
          Try a different category
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
      <FlatList
        data={medicines}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={ListHeader}
        ListEmptyComponent={ListEmpty}
        ListFooterComponent={ListFooter}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            onRefresh={refetch}
            tintColor={colors.brand.primary}
            // Android spinner colours
            colors={[colors.brand.primary]}
          />
        }
        // ── Performance tuning ──────────────────────────────────
        // initialNumToRender: show enough to fill a screen without over-rendering.
        // maxToRenderPerBatch: controls how much work per JS frame.
        // windowSize: 11 = 5 screens above + 5 below the viewport kept in memory.
        // removeClippedSubviews: unmount off-screen views on Android (safe on iOS).
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        windowSize={11}
        removeClippedSubviews
        // Expand contentContainer when empty so the empty state fills the screen.
        contentContainerStyle={
          medicines.length === 0 ? styles.emptyContent : undefined
        }
      />
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  footer: {
    paddingVertical: Spacing.lg,
    alignItems: "center",
  },
  footerSpacer: {
    // Enough room so the last card isn't hidden behind the custom tab bar.
    height: Spacing["3xl"],
  },
  emptyContent: {
    // flexGrow so the empty state View can flex: 1 to centre its content.
    flexGrow: 1,
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
  centerSubtext: {
    ...Typography.body,
    textAlign: "center",
  },
});