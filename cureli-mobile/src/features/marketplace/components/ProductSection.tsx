// src/features/marketplace/components/ProductSection.tsx
//
// One horizontal product rail per marketplace category.
// Spacing.lg bottom padding between sections.
// Skeleton cards match the fixed 200px card height.

import React, { useCallback, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
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

import { useMedicineFeed } from "../hooks/useMedicineFeed";
import type { EnrichedMedicine } from "../types/marketplace.types";

// ── Constants ─────────────────────────────────────────────────

const CARD_HEIGHT = 200;
const IMAGE_HEIGHT = 120;

// ── Props ─────────────────────────────────────────────────────

interface ProductSectionProps {
  title: string;
  categoryKey: string;
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

function ProductSectionBase({ title, categoryKey }: ProductSectionProps) {
  const { colors } = useTheme();
  const { width: screenWidth } = useWindowDimensions();

  // ~3 cards visible in viewport.
  const cardWidth = useMemo(() => {
    const totalPadding = Spacing.base * 2;
    const gaps = Spacing.sm * 2;
    return Math.floor((screenWidth - totalPadding - gaps) / 3);
  }, [screenWidth]);

  const {
    medicines,
    isLoading,
    isError,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useMedicineFeed({
    category: categoryKey,
  });

  const handlePressProduct = useCallback((medicine: EnrichedMedicine) => {
    router.push(`/product/${medicine.skuId}` as any);
  }, []);

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

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

  // Don't render section if empty after load.
  if (!isLoading && !isError && medicines.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <SectionHeader title={title} />

      {isLoading ? (
        <View style={styles.loadingRow}>
          <ProductSkeletonCard width={cardWidth} />
          <ProductSkeletonCard width={cardWidth} />
          <ProductSkeletonCard width={cardWidth} />
        </View>
      ) : isError ? (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => refetch()}
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
      ) : (
        <FlatList
          horizontal
          data={medicines}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ width: Spacing.sm }} />}
          onEndReached={handleEndReached}
          onEndReachedThreshold={0.6}
          ListFooterComponent={
            isFetchingNextPage ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator
                  size="small"
                  color={colors.brand.primary}
                />
              </View>
            ) : (
              <View style={styles.footerSpacer} />
            )
          }
        />
      )}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  section: {
    marginBottom: Spacing.lg, // Bottom padding between sections
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
  footerLoader: {
    width: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  footerSpacer: {
    width: Spacing.sm,
  },
});

export const ProductSection = React.memo(ProductSectionBase);