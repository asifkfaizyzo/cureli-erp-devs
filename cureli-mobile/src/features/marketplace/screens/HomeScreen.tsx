// src/features/marketplace/screens/HomeScreen.tsx
//
// Phase 4 final:
//   — Category taps navigate to categories tab
//   — Home always shows all product sections
//   — No more filtering on home

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

export function HomeScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [isRefreshing, setIsRefreshing] = useState(false);

  const {
    categories,
    isLoading: isCategoriesLoading,
    refetch: refetchCategories,
  } = useCategories();

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

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refetchCategories();
    setIsRefreshing(false);
  }, [refetchCategories]);

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

        <CategoryGrid
          categories={categories}
          isLoading={isCategoriesLoading}
        />

        {categories.map((category) => (
          <ProductSection
            key={category.key}
            title={category.label}
            categoryKey={category.key}
          />
        ))}

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