// src/features/marketplace/components/ProductSection.tsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  useWindowDimensions,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "../../../theme/ThemeContext";
import { Typography } from "../../../theme/typography";
import { Spacing } from "../../../theme/spacing";
import { Radius } from "../../../theme/radius";

import { SectionHeader } from "./SectionHeader";
import { ProductCard } from "./ProductCard";

import { marketplaceApi } from "../api/marketplace.api";
import { generateMarketplaceData } from "../utils/generateMarketplaceData";

import type {
  EnrichedMedicine,
  MedicineType,
} from "../types/marketplace.types";

// ── Constants ─────────────────────────────────────────────────

const CARD_HEIGHT = 200;
const IMAGE_HEIGHT = 120;

// ── Props ─────────────────────────────────────────────────────

interface ProductSectionProps {
  title: string;
  categoryKey: string;
  sectionType: MedicineType;
  initialMedicines: EnrichedMedicine[];
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
  categoryKey,
  sectionType,
  initialMedicines,
  isLoading,
  isError = false,
  onRetry,
}: ProductSectionProps) {
  const { colors } = useTheme();
  const { width: screenWidth } = useWindowDimensions();

  const PAGE_SIZE = 8;
  const isDrugRail = sectionType === "DRUG";

  const cardWidth = Math.floor(
    (screenWidth - Spacing.base * 2 - Spacing.sm * 2) / 3,
  );

  const [items, setItems] = useState<EnrichedMedicine[]>(initialMedicines);
  const [nextPage, setNextPage] = useState(2);
  const [hasNextPage, setHasNextPage] = useState(true);
  const [isFetchingMore, setIsFetchingMore] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const userInteractedRef = useRef(false);

  useEffect(() => {
    setItems(initialMedicines);
    setNextPage(2);
    setHasNextPage(true);
    setIsFetchingMore(false);
    setFetchError(null);
    userInteractedRef.current = false;
  }, [categoryKey, initialMedicines]);

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

  const loadMore = useCallback(async () => {
    if (isFetchingMore || !hasNextPage) return;

    setIsFetchingMore(true);
    setFetchError(null);

    try {
      const response = await marketplaceApi.getMedicines({
        category: categoryKey,
        type: sectionType,
        page: nextPage,
        limit: PAGE_SIZE,
        hasImage: true,
      });

      const newItems: EnrichedMedicine[] = response.medicines.map(
        (variant) => ({
          ...variant,
          marketplace: generateMarketplaceData(variant.variantId),
        }),
      );

      setItems((prev) => {
        const seen = new Set(prev.map((item) => item.variantId));
        const deduped = newItems.filter((item) => !seen.has(item.variantId));
        return deduped.length > 0 ? [...prev, ...deduped] : prev;
      });

      setHasNextPage(Boolean(response.meta?.hasNext));
      setNextPage((p) => p + 1);
    } catch (err) {
      console.error(`[ProductSection] loadMore error for ${categoryKey}:`, err);
      setFetchError("Couldn’t load more items");
    } finally {
      setIsFetchingMore(false);
    }
  }, [categoryKey, sectionType, nextPage, hasNextPage, isFetchingMore]);

  const handleEndReached = useCallback(() => {
    if (!userInteractedRef.current) return;
    if (isFetchingMore || !hasNextPage) return;
    loadMore();
  }, [loadMore, hasNextPage, isFetchingMore]);

  const handleScrollBeginDrag = useCallback(() => {
    userInteractedRef.current = true;
  }, []);

  const renderFooter = useCallback(() => {
    if (isFetchingMore) {
      return (
        <View style={styles.footerLoading}>
          <ActivityIndicator size="small" color={colors.text.brand} />
        </View>
      );
    }

    if (fetchError) {
      return (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={loadMore}
          style={[
            styles.footerRetry,
            {
              borderColor: colors.border.default,
              backgroundColor: colors.background.card,
            },
          ]}
        >
          <Ionicons
            name="refresh-outline"
            size={14}
            color={colors.text.brand}
          />
          <Text style={[styles.retryText, { color: colors.text.brand }]}>
            Retry
          </Text>
        </TouchableOpacity>
      );
    }

    return <View style={{ width: Spacing.base }} />;
  }, [isFetchingMore, fetchError, loadMore, colors]);

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

  if (items.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <SectionHeader title={title} />
      <FlatList
        horizontal
        data={items}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={{ width: Spacing.sm }} />}
        onScrollBeginDrag={handleScrollBeginDrag}
        onMomentumScrollBegin={handleScrollBeginDrag}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.3}
        ListFooterComponent={renderFooter}
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
  footerLoading: {
    width: 56,
    justifyContent: "center",
    alignItems: "center",
  },
  footerRetry: {
    marginRight: Spacing.base,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 6,
    borderWidth: 1,
    borderRadius: Radius.md,
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
    prev.categoryKey === next.categoryKey &&
    prev.sectionType === next.sectionType &&
    prev.isLoading === next.isLoading &&
    prev.isError === next.isError &&
    prev.initialMedicines === next.initialMedicines,
);
