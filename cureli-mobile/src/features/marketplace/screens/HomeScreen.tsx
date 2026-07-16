// src/features/marketplace/screens/HomeScreen.tsx
//
// Home tab — main marketplace entry point.
//
// Category section:
//   Replaced the old backend-driven CategoryGrid with TopLevelCategoryGrid —
//   three hardcoded top-level cards (English Medicine, Ayurvedic, Veterinary).
//   No useCategories call needed on this screen any more.
//
// Feed sections:
//   Still driven by useHomeFeed — curated product rails per category.

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
import { HeroCarousel } from "../components/HeroCarousel";
import { SectionHeader } from "../components/SectionHeader";
import { TopLevelCategoryGrid } from "../components/TopLevelCategoryGrid";
import { ProductSection } from "../components/ProductSection";
import { HomeFooter } from "../components/HomeFooter";

import { useHomeFeed } from "../hooks/useHomeFeed";
import { useLayoutStore } from "../../../store/layoutStore";

export function HomeScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const bottomTabBarHeight = useLayoutStore((s) => s.bottomTabBarHeight);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    sections,
    isLoading: isFeedLoading,
    isError: isFeedError,
    refetch: refetchFeed,
  } = useHomeFeed();

  const handlePressSearch = useCallback(() => {
    router.push("/search" as any);
  }, []);

  const handlePressCart = useCallback(() => {
    router.push("/cart" as any);
  }, []);

  const handlePressViewAll = useCallback(() => {
    router.push("/marketplace/categories" as any);
  }, []);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refetchFeed();
    setIsRefreshing(false);
  }, [refetchFeed]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background.page }]}>
      <GradientHeader
        onPressSearch={handlePressSearch}
        onPressCart={handlePressCart}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: HEADER_HEIGHT + insets.top,
            paddingBottom: bottomTabBarHeight + Spacing.base,
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
        <HeroCarousel />

        <SectionHeader
          title="Everything for your well-being"
          hint="View all"
          onPressHint={handlePressViewAll}
        />

        <TopLevelCategoryGrid />

        {isFeedLoading ? (
          [
            { key: "s1", label: "" },
            { key: "s2", label: "" },
            { key: "s3", label: "" },
          ].map((cat) => (
            <ProductSection
              key={cat.key}
              title={cat.label}
              medicines={[]}
              isLoading={true}
            />
          ))
        ) : isFeedError ? (
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