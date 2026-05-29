// src/features/marketplace/components/ProductSection.tsx
//
// One horizontal product rail per home feed section.
//
// PHASE 3 CHANGE: ProductSection is now a pure rendering component.
// It no longer fetches its own data. The home feed is assembled by
// useHomeFeed() in HomeScreen and passed down as props.
//
// Why this change:
//   The previous design called useMedicineFeed() internally, meaning
//   HomeScreen fired one API request per category on every mount
//   (10 categories = 10 simultaneous requests). The new design fetches
//   all sections in a single GET /mobile/medicines/feed request via
//   useHomeFeed(), then passes the pre-fetched medicines here.
//
// ProductCard is unchanged — it still receives EnrichedMedicine exactly
// as before. The enrichment (generateMarketplaceData) now happens in
// useHomeFeed() rather than useMedicineFeed(), but the card is unaware
// of where the data came from.
//
// CategoryScreen is unaffected — it uses useMedicineFeed() directly
// with its own FlatList and does not use ProductSection at all.

import React, { useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  useWindowDimensions,
  TouchableOpacity,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "../../../theme/ThemeContext";
import { Typography } from "../../../theme/typography";
import { Spacing } from "../../../theme/spacing";
import { Radius } from "../../../theme/radius";

import { SectionHeader } from "./SectionHeader";
import { ProductCard } from "./ProductCard";

import type { EnrichedMedicine } from "../types/marketplace.types";

// ── Constants ─────────────────────────────────────────────────

const CARD_HEIGHT = 200;
const IMAGE_HEIGHT = 120;

// ── Props ─────────────────────────────────────────────────────

interface ProductSectionProps {
  title: string;
  medicines: EnrichedMedicine[];
  isLoading: boolean;
  isError?: boolean;
  onRetry?: () => void;
}

// ── Skeleton ──────────────────────────────────────────────────

function ProductSkeletonCard({ width }: { width: number }) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.skeletonCard,
        {
          width,
          height: CARD_HEIGHT,
          backgroundColor: colors.background.page,
        },
      ]}
    >
      <View
        style={[
          styles.skeletonImage,
          {
            height: IMAGE_HEIGHT,
            backgroundColor: colors.border.subtle,
          },
        ]}
      />
      <View style={styles.skeletonContent}>
        <View
          style={[
            styles.skeletonLine,
            {
              width: "85%",
              backgroundColor: colors.border.default,
            },
          ]}
        />
        <View
          style={[
            styles.skeletonLine,
            {
              width: "65%",
              backgroundColor: colors.border.default,
            },
          ]}
        />
        <View
          style={[
            styles.skeletonLine,
            {
              width: "50%",
              backgroundColor: colors.border.default,
            },
          ]}
        />
      </View>
    </View>
  );
}

// ── Component ─────────────────────────────────────────────────

function ProductSectionBase({
  title,
  medicines,
  isLoading,
  isError = false,
  onRetry,
}: ProductSectionProps) {
  const { colors } = useTheme();
  const { width: screenWidth } = useWindowDimensions();

  // ~3 cards visible in viewport.
  const cardWidth =
    Math.floor((screenWidth - Spacing.base * 2 - Spacing.sm * 2) / 3);

  const handlePressProduct = useCallback((medicine: EnrichedMedicine) => {
    router.push(`/product/${medicine.skuId}` as any);
  }, []);

  const keyExtractor = useCallback(
    (item: EnrichedMedicine) => item.variantId,
    [],
  );

  const renderItem = useCallback(
    ({ item }: { item: EnrichedMedicine }) => (
      <ProductCard
        medicine={item}
        width={cardWidth}
        onPress={handlePressProduct}
      />
    ),
    [cardWidth, handlePressProduct],
  );

  // ── Loading state ──────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={styles.section}>
        <SectionHeader title={title} />
        <View style={styles.loadingRow}>
          <ProductSkeletonCard width={cardWidth} />
          <ProductSkeletonCard width={cardWidth} />
          <ProductSkeletonCard width={cardWidth} />
        </View>
      </View>
    );
  }

  // ── Error state ────────────────────────────────────────────
  if (isError) {
    return (
      <View style={styles.section}>
        <SectionHeader title={title} />
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onRetry}
          style={[
            styles.errorBox,
            {
              backgroundColor: colors.background.card,
              borderColor: colors.border.default,
            },
          ]}
        >
          <Ionicons
            name="cloud-offline-outline"
            size={18}
            color={colors.text.faint}
          />
          <Text style={[styles.errorText, { color: colors.text.secondary }]}>
            Couldn't load {title.toLowerCase()}
          </Text>
          <Text style={[styles.retryText, { color: colors.text.brand }]}>
            Tap to retry
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ── Empty state — render nothing ───────────────────────────
  // useHomeFeed only includes sections with results, so this
  // should not occur in practice. Guard is here for safety.
  if (medicines.length === 0) {
    return null;
  }

  // ── Medicines list ─────────────────────────────────────────
  return (
    <View style={styles.section}>
      <SectionHeader title={title} />
      <FlatList
        horizontal
        data={medicines}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ width: Spacing.sm }} />}
        // The home rail shows 8 items and does not paginate.
        // Infinite scroll lives in CategoryScreen, not here.
      />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  section: {
    marginBottom: Spacing.lg,
  },
  listContent: {
    paddingLeft: Spacing.base,
    paddingRight: Spacing.base,
  },
  loadingRow: {
    flexDirection: "row",
    paddingHorizontal: Spacing.base,
    gap: Spacing.sm,
  },
  skeletonCard: {
    borderRadius: Radius.lg,
    overflow: "hidden",
  },
  skeletonImage: {
    width: "100%",
    borderRadius: Radius.lg,
  },
  skeletonContent: {
    paddingHorizontal: Spacing.xs,
    paddingTop: Spacing.base,
    gap: 6,
  },
  skeletonLine: {
    height: 10,
    borderRadius: Radius.xs,
  },
  errorBox: {
    marginHorizontal: Spacing.base,
    borderWidth: 1,
    borderRadius: Radius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.base,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  errorText: {
    ...Typography.body,
    flex: 1,
  },
  retryText: {
    ...Typography.bodyMedium,
  },
});

export const ProductSection = React.memo(
  ProductSectionBase,
  (prev, next) =>
    prev.title === next.title &&
    prev.isLoading === next.isLoading &&
    prev.isError === next.isError &&
    prev.medicines === next.medicines,
);