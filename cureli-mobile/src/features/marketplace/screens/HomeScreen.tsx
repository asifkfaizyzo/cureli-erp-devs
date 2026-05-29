// src/features/marketplace/screens/HomeScreen.tsx
//
// Home screen — single-request feed architecture.
//
// PHASE 4 CHANGE: replaced the previous per-category ProductSection loop
// with a single useHomeFeed() call. Previously HomeScreen fired one API
// request per curated category on every mount (10 categories = 10
// simultaneous requests). Now it fires two:
//
//   1. GET /mobile/medicines/categories  — useCategories()
//      Drives the CategoryGrid at the top of the screen.
//      staleTime: 1 hour — effectively static within a session.
//
//   2. GET /mobile/medicines/feed        — useHomeFeed()
//      Drives all ProductSection rails below the grid.
//      staleTime: 0 — revalidates on every mount, cached data shown
//      instantly while revalidation runs.
//
// The two fetches are independent and run concurrently on mount.
// CategoryGrid and ProductSection rails are sourced separately —
// the grid always shows all curated categories, the rails only show
// categories that returned results from the backend.
//
// Pull-to-refresh refetches both in parallel via Promise.all().
//
// Feed mode (demo vs production) is determined entirely server-side
// by MOBILE_SHOW_UNLISTED_MEDICINES. HomeScreen is unaware of it.

import React, { useCallback, useState } from "react";
import {
  View,
  ScrollView,
  RefreshControl,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";

import { useTheme } from "../../../theme/ThemeContext";
import { Spacing } from "../../../theme/spacing";

import { GradientHeader, HEADER_HEIGHT } from "../components/GradientHeader";
import { PrescriptionStrip } from "../components/PrescriptionStrip";
import { HeroCarousel } from "../components/HeroCarousel";
import { SectionHeader } from "../components/SectionHeader";
import { CategoryGrid } from "../components/CategoryGrid";
import { ProductSection } from "../components/ProductSection";
import { HomeFooter } from "../components/HomeFooter";

import { useCategories } from "../hooks/useCategories";
import { useHomeFeed } from "../hooks/useHomeFeed";

export function HomeScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    categories,
    isLoading: isCategoriesLoading,
    refetch: refetchCategories,
  } = useCategories();

  const {
    sections,
    isLoading: isFeedLoading,
    isError: isFeedError,
    refetch: refetchFeed,
  } = useHomeFeed();

  // ── Navigation ─────────────────────────────────────────────

  const handlePressSearch = useCallback(() => {
    router.push("/search" as any);
  }, []);

  const handlePressCart = useCallback(() => {
    router.push("/cart" as any);
  }, []);

  const handlePressProfile = useCallback(() => {
    router.push("/(tabs)/profile" as any);
  }, []);

  const handlePressAddress = useCallback(() => {
    // Phase 6
  }, []);

  const handlePressViewAll = useCallback(() => {
    router.push("/marketplace/categories" as any);
  }, []);

  // ── Refresh ────────────────────────────────────────────────
  // Refetch both queries in parallel. Neither blocks the other.
  // setIsRefreshing(false) only after both settle — success or error.

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([refetchCategories(), refetchFeed()]);
    setIsRefreshing(false);
  }, [refetchCategories, refetchFeed]);

  // ── Render ─────────────────────────────────────────────────

  return (
    <View style={[styles.root, { backgroundColor: colors.background.page }]}>
      <GradientHeader
        onPressSearch={handlePressSearch}
        onPressCart={handlePressCart}
        onPressProfile={handlePressProfile}
        onPressAddress={handlePressAddress}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: HEADER_HEIGHT + insets.top,
            paddingBottom: Spacing["3xl"] + insets.bottom,
          },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={colors.brand.primary}
            colors={[colors.brand.primary]}
            progressViewOffset={HEADER_HEIGHT + insets.top}
          />
        }
      >
        <PrescriptionStrip />
        <HeroCarousel />

        <SectionHeader
          title="Everything for your well-being"
          hint="View all"
          onPressHint={handlePressViewAll}
        />

        {/* Category grid — always sourced from useCategories.
            Shows all curated categories regardless of feed results.
            Tapping a category navigates to the categories tab. */}
        <CategoryGrid
          categories={categories}
          isLoading={isCategoriesLoading}
        />

        {/* Product rails — sourced from useHomeFeed.
            One rail per section returned by the feed endpoint.
            Sections with zero results are omitted server-side,
            so no empty rails ever reach this loop.
            While loading, each section shows skeleton cards.
            On error, each section shows a retry prompt. */}
        {isFeedLoading ? (
          // Show skeleton rails for every curated category while loading.
          // We use the categories list for the skeleton titles so the
          // layout does not shift when real data arrives.
          // If categories haven't loaded yet, fall back to three unnamed
          // skeleton rails — enough to fill the viewport.
          (categories.length > 0 ? categories : [{key:"s1",label:""},{key:"s2",label:""},{key:"s3",label:""}]).map((cat) => (
            <ProductSection
              key={cat.key}
              title={cat.label}
              medicines={[]}
              isLoading={true}
            />
          ))
        ) : isFeedError ? (
          // Single error state covers all sections — the feed is one
          // request, so all sections fail or succeed together.
          // Show a single retry-able error rail rather than one per section.
          <ProductSection
            key="feed-error"
            title="Medicines"
            medicines={[]}
            isLoading={false}
            isError={true}
            onRetry={refetchFeed}
          />
        ) : (
          sections.map((section) => (
            <ProductSection
              key={section.key}
              title={section.title}
              medicines={section.medicines}
              isLoading={false}
            />
          ))
        )}

        <HomeFooter />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
});