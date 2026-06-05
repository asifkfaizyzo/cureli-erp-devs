// src/features/marketplace/screens/HomeScreen.tsx

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
import { useLayoutStore } from "../../../store/layoutStore";

export function HomeScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const bottomTabBarHeight = useLayoutStore((s) => s.bottomTabBarHeight);

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
    await Promise.all([refetchCategories(), refetchFeed()]);
    setIsRefreshing(false);
  }, [refetchCategories, refetchFeed]);

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
        <PrescriptionStrip />
        <HeroCarousel />

        <SectionHeader
          title="Everything for your well-being"
          hint="View all"
          onPressHint={handlePressViewAll}
        />

        <CategoryGrid
          categories={categories}
          isLoading={isCategoriesLoading}
        />

        {isFeedLoading ? (
          (categories.length > 0
            ? categories
            : [
                { key: "s1", label: "" },
                { key: "s2", label: "" },
                { key: "s3", label: "" },
              ]
          ).map((cat) => (
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