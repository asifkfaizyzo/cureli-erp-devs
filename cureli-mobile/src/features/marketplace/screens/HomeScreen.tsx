// src/features/marketplace/screens/HomeScreen.tsx

import React, { useCallback, useState } from "react";
import {
  View,
  ScrollView,
  RefreshControl,
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
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
import { StripBannerCarousel } from "../components/StripBannerCarousel";

import { useHomeFeed } from "../hooks/useHomeFeed";
import { useBannerConfig } from "../hooks/useBannerConfig";
import { useHomeScreenConfig } from "../hooks/useHomeScreenConfig";
import { useLayoutStore } from "../../../store/layoutStore";

// ════════════════════════════════════════════════════════════════════════════
// PRESCRIPTION BANNER
// ════════════════════════════════════════════════════════════════════════════

interface PrescriptionRequestBannerProps {
  text: string;
}

function PrescriptionRequestBanner({ text }: PrescriptionRequestBannerProps) {
  return (
    <TouchableOpacity
      onPress={() => router.push("/prescription-request" as any)}
      activeOpacity={0.85}
      style={styles.prescriptionPill}
    >
      <Text style={styles.prescriptionPillText}>{text}</Text>
      <Ionicons name="cloud-upload-outline" size={16} color="#ffffff" />
    </TouchableOpacity>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// FULL-SCREEN ERROR STATE
// Shown when useHomeScreenConfig fails entirely.
// ════════════════════════════════════════════════════════════════════════════

interface FullScreenErrorProps {
  onRetry: () => void;
}

function FullScreenError({ onRetry }: FullScreenErrorProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.fullScreenError,
        {
          paddingTop: insets.top + HEADER_HEIGHT + Spacing.xl,
          paddingBottom: insets.bottom + Spacing.xl,
          backgroundColor: colors.background.page,
        },
      ]}
    >
      <View
        style={[
          styles.errorIconWrap,
          { backgroundColor: colors.background.tint },
        ]}
      >
        <Ionicons
          name="cloud-offline-outline"
          size={36}
          color={colors.text.brand}
        />
      </View>

      <Text style={[styles.errorTitle, { color: colors.text.primary }]}>
        Oops, something went wrong
      </Text>

      <Text style={[styles.errorSubtitle, { color: colors.text.secondary }]}>
        We couldn't load the home screen.{"\n"}Check your connection and try
        again.
      </Text>

      <TouchableOpacity
        onPress={onRetry}
        activeOpacity={0.8}
        style={[styles.retryButton, { backgroundColor: colors.brand.primary }]}
      >
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// FULL-SCREEN LOADING STATE
// Shown only while useHomeScreenConfig is loading for the first time.
// ════════════════════════════════════════════════════════════════════════════

function FullScreenLoader() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.fullScreenError,
        {
          paddingTop: insets.top + HEADER_HEIGHT + Spacing.xl,
          backgroundColor: colors.background.page,
        },
      ]}
    >
      <ActivityIndicator size="large" color={colors.brand.primary} />
    </View>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// HOME SCREEN
// ════════════════════════════════════════════════════════════════════════════

export function HomeScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const bottomTabBarHeight = useLayoutStore((s) => s.bottomTabBarHeight);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [categoryRefreshTrigger, setCategoryRefreshTrigger] = useState(0);

  // ── Data hooks ────────────────────────────────────────────────────────────

  const {
    config,
    isLoading: isConfigLoading,
    isError: isConfigError,
    refetch: refetchConfig,
  } = useHomeScreenConfig();

  const {
    sections,
    isLoading: isFeedLoading,
    isError: isFeedError,
    refetch: refetchFeed,
  } = useHomeFeed();

  const { config: bannerConfig, refetch: refetchBanners } = useBannerConfig();

  // ── Navigation ────────────────────────────────────────────────────────────

  const handlePressSearch = useCallback(() => {
    router.push("/search" as any);
  }, []);
  const handlePressCart = useCallback(() => {
    router.push("/cart" as any);
  }, []);
  const handlePressViewAll = useCallback(() => {
    router.push("/marketplace/categories" as any);
  }, []);

  // ── Pull-to-refresh ───────────────────────────────────────────────────────
  // Refreshes all backend-driven data in parallel.

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await Promise.all([refetchConfig(), refetchFeed(), refetchBanners()]);
    setCategoryRefreshTrigger((prev) => prev + 1);
    setIsRefreshing(false);
  }, [refetchConfig, refetchFeed, refetchBanners]);

  // ── Shared header (always rendered) ──────────────────────────────────────

  const header = (
    <GradientHeader
      onPressSearch={handlePressSearch}
      onPressCart={handlePressCart}
    />
  );

  // ── Config loading — show loader behind header ────────────────────────────

  if (isConfigLoading) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background.page }]}>
        {header}
        <FullScreenLoader />
      </View>
    );
  }

  // ── Config error — show error behind header ───────────────────────────────

  if (isConfigError || !config) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background.page }]}>
        {header}
        <FullScreenError onRetry={refetchConfig} />
      </View>
    );
  }

  // ── Normal render — config is available ───────────────────────────────────

  return (
    <View style={[styles.root, { backgroundColor: colors.background.page }]}>
      {header}

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
        {/* ── Hero Carousel ─────────────────────────────────────────────── */}
        {config.heroCarouselVisible && (
          <HeroCarousel slides={bannerConfig.slides} />
        )}

        {/* ── Strip Banners ─────────────────────────────────────────────── */}
        {config.stripBannersVisible && bannerConfig.strips.length > 0 && (
          <StripBannerCarousel strips={bannerConfig.strips} />
        )}

        {/* ── Category Grid ─────────────────────────────────────────────── */}
        {config.categorySectionVisible && (
          <>
            <SectionHeader
              title={config.categorySectionTitle}
              hint={config.categorySectionHint}
              onPressHint={handlePressViewAll}
            />
            <TopLevelCategoryGrid refreshTrigger={categoryRefreshTrigger} />
          </>
        )}

        {/* ── Prescription Banner ───────────────────────────────────────── */}
        {config.prescriptionBannerVisible && (
          <PrescriptionRequestBanner text={config.prescriptionBannerText} />
        )}

        {/* ── Product Feed ──────────────────────────────────────────────── */}
        {config.productFeedVisible && (
          <>
            {isFeedLoading ? (
              // Skeleton placeholders while feed loads
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
              // Inline error — single section slot with retry
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
          </>
        )}

        <HomeFooter />
      </ScrollView>
    </View>
  );
}

// ════════════════════════════════════════════════════════════════════════════
// STYLES
// ════════════════════════════════════════════════════════════════════════════

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

  // ── Prescription pill ──────────────────────────────────────────────────
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

  // ── Full-screen states ─────────────────────────────────────────────────
  fullScreenError: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing["2xl"],
    gap: Spacing.md,
  },
  errorIconWrap: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.sm,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: "700",
    textAlign: "center",
  },
  errorSubtitle: {
    fontSize: 14,
    textAlign: "center",
    lineHeight: 22,
  },
  retryButton: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing["2xl"],
    paddingVertical: Spacing.md,
    borderRadius: Radius.lg,
  },
  retryButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
});
