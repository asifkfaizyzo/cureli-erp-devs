// src/features/marketplace/screens/HomeScreen.tsx

import React, { useCallback, useState } from "react";
import {
  View,
  ScrollView,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  Text,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "../../../theme/ThemeContext";
import { Spacing } from "../../../theme/spacing";
import { Radius } from "../../../theme/radius";

import { GradientHeader, HEADER_HEIGHT } from "../components/GradientHeader";
import { HeroCarousel } from "../components/HeroCarousel";
import { SectionHeader } from "../components/SectionHeader";
import { TopLevelCategoryGrid } from "../components/TopLevelCategoryGrid";
import { ProductSection } from "../components/ProductSection";
import { HomeFooter } from "../components/HomeFooter";

import { useHomeFeed } from "../hooks/useHomeFeed";
import { useLayoutStore } from "../../../store/layoutStore";

// ── Prescription request entry banner ─────────────────────────────────────────

function PrescriptionRequestBanner() {
  return (
    <TouchableOpacity
      onPress={() => router.push("/prescription-request" as any)}
      activeOpacity={0.85}
      style={styles.prescriptionPill}
    >
      <Text style={styles.prescriptionPillText}>Upload prescription</Text>
      <Ionicons name="cloud-upload-outline" size={16} color="#ffffff" />
    </TouchableOpacity>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

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

        {/* ── Prescription request entry point ─────────────────────────── */}
        <PrescriptionRequestBanner />
        {/* ───────────────────────────────────────────────────────────────── */}

        {isFeedLoading ? (
          [{ key: "s1" }, { key: "s2" }, { key: "s3" }].map((cat) => (
            <ProductSection
              key={cat.key}
              title=""
              categoryKey={cat.key}
              sectionType="DRUG"
              initialMedicines={[]}
              isLoading={true}
            />
          ))
        ) : isFeedError ? (
          <ProductSection
            key="feed-error"
            title="Medicines"
            categoryKey="feed-error"
            sectionType="DRUG"
            initialMedicines={[]}
            isLoading={false}
            isError={true}
            onRetry={refetchFeed}
          />
        ) : (
          sections.map((section) => (
            <ProductSection
              key={section.key}
              title={section.title}
              categoryKey={section.key}
              sectionType={section.type}
              initialMedicines={section.medicines}
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
  // ── Prescription banner ───────────────────────────────────────────────────
  prescriptionBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginHorizontal: Spacing.base,
    marginVertical: Spacing.sm,
    padding: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  prescriptionIcon: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  prescriptionText: { flex: 1, gap: 3 },
  prescriptionTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  prescriptionSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    lineHeight: 17,
  },

  prescriptionPill: {
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#16044d",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 999,
    marginVertical: Spacing.sm,
  },

  prescriptionPillText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
});
