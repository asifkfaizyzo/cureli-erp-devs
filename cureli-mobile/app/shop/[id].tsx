import React, { useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  StyleSheet,
  TouchableOpacity,
  type ListRenderItem,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useQuery } from "@tanstack/react-query";

import { useTheme } from "../../src/theme/ThemeContext";
import { Typography } from "../../src/theme/typography";
import { Spacing } from "../../src/theme/spacing";
import { Radius } from "../../src/theme/radius";
import { MedicineCard } from "../../src/features/marketplace/components/MedicineCard";
import { marketplaceApi } from "../../src/features/marketplace/api/marketplace.api";
import { generateMarketplaceData } from "../../src/features/marketplace/utils/generateMarketplaceData";
import { DUMMY_SHOPS } from "../../src/features/marketplace/constants/dummyShops";
import type { EnrichedMedicine } from "../../src/types/medicine";

// ── Shop detail screen ────────────────────────────────────────

export default function ShopScreen() {
  const { colors } = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();

  // Find shop from dummy data
  const shop = DUMMY_SHOPS.find((s) => s.shopId === id);

  // Fetch all medicines (dummy shop shows all medicines for now)
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["medicines", "shop", id],
    queryFn: () => marketplaceApi.getMedicines({ limit: 50 }),
    staleTime: 1000 * 60 * 5,
  });

  const medicines: EnrichedMedicine[] =
    data?.medicines.map((v) => ({
      ...v,
      marketplace: generateMarketplaceData(v.variantId),
    })) ?? [];

  // ── Handlers ───────────────────────────────────────────────

  const handlePressMedicine = useCallback((medicine: EnrichedMedicine) => {
    router.push(`/product/${medicine.skuId}`);
  }, []);

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

  // ── Shop not found guard ───────────────────────────────────

  if (!shop) {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: colors.background.page }]}
        edges={["top"]}
      >
        <Header title="Shop" colors={colors} />
        <View style={styles.center}>
          <Ionicons
            name="alert-circle-outline"
            size={44}
            color={colors.text.faint}
          />
          <Text style={[styles.centerText, { color: colors.text.secondary }]}>
            Shop not found
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Render ─────────────────────────────────────────────────

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background.page }]}
      edges={["top"]}
    >
      {/* ── Navigation header ── */}
      <Header title={shop.name} colors={colors} />

      {/* ── Shop info card ── */}
      <View
        style={[
          styles.infoCard,
          {
            backgroundColor: colors.background.card,
            borderColor: colors.border.subtle,
          },
        ]}
      >
        {/* Icon + name row */}
        <View style={styles.infoTopRow}>
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: colors.background.tint },
            ]}
          >
            <Ionicons
              name="storefront-outline"
              size={26}
              color={colors.text.brand}
            />
          </View>

          <View style={styles.infoNameBlock}>
            <Text style={[styles.shopName, { color: colors.text.primary }]}>
              {shop.name}
            </Text>
            <Text style={[styles.shopTagline, { color: colors.text.muted }]}>
              {shop.tagline}
            </Text>
          </View>

          {/* Open/Closed badge */}
          <View
            style={[
              styles.badge,
              {
                backgroundColor: shop.isOpen
                  ? colors.background.tint
                  : "#F5F5F5",
                borderColor: shop.isOpen ? colors.border.brand : "#E0E0E0",
              },
            ]}
          >
            <View
              style={[
                styles.dot,
                { backgroundColor: shop.isOpen ? "#22C55E" : "#9E9E9E" },
              ]}
            />
            <Text
              style={[
                styles.badgeText,
                {
                  color: shop.isOpen ? colors.text.brand : colors.text.muted,
                },
              ]}
            >
              {shop.isOpen ? "Open" : "Closed"}
            </Text>
          </View>
        </View>

        {/* Meta row */}
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Ionicons
              name="location-outline"
              size={14}
              color={colors.text.muted}
            />
            <Text style={[styles.metaText, { color: colors.text.muted }]}>
              {shop.area}
            </Text>
          </View>

          <View style={styles.separator} />

          <View style={styles.metaItem}>
            <Ionicons name="star" size={14} color="#FBBF24" />
            <Text style={[styles.metaText, { color: colors.text.muted }]}>
              {shop.rating.toFixed(1)}
            </Text>
          </View>

          <View style={styles.separator} />

          <View style={styles.metaItem}>
            <Ionicons
              name="time-outline"
              size={14}
              color={colors.text.muted}
            />
            <Text style={[styles.metaText, { color: colors.text.muted }]}>
              {shop.deliveryTime}
            </Text>
          </View>

          <View style={styles.separator} />

          <View style={styles.metaItem}>
            <Ionicons
              name="medical-outline"
              size={14}
              color={colors.text.muted}
            />
            <Text style={[styles.metaText, { color: colors.text.muted }]}>
              {shop.category}
            </Text>
          </View>
        </View>
      </View>

      {/* ── Medicines section label ── */}
      <View style={styles.sectionLabel}>
        <Text style={[styles.sectionTitle, { color: colors.text.primary }]}>
          Available Medicines
        </Text>
        {!isLoading && !isError && (
          <Text style={[styles.sectionCount, { color: colors.text.muted }]}>
            {medicines.length} items
          </Text>
        )}
      </View>

      {/* ── Loading ── */}
      {isLoading && (
        <View style={styles.center}>
          <ActivityIndicator color={colors.brand.primary} size="large" />
          <Text style={[styles.centerText, { color: colors.text.muted }]}>
            Loading medicines…
          </Text>
        </View>
      )}

      {/* ── Error ── */}
      {isError && (
        <View style={styles.center}>
          <Ionicons
            name="cloud-offline-outline"
            size={44}
            color={colors.text.faint}
          />
          <Text style={[styles.centerText, { color: colors.text.secondary }]}>
            Failed to load medicines
          </Text>
          <Text
            style={[styles.retryText, { color: colors.text.brand }]}
            onPress={() => refetch()}
          >
            Tap to retry
          </Text>
        </View>
      )}

      {/* ── Medicine list ── */}
      {!isLoading && !isError && (
        <FlatList
          data={medicines}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={11}
          removeClippedSubviews
        />
      )}
    </SafeAreaView>
  );
}

// ── Reusable header ───────────────────────────────────────────

function Header({
  title,
  colors,
}: {
  title: string;
  colors: ReturnType<typeof useTheme>["colors"];
}) {
  return (
    <View
      style={[
        styles.header,
        {
          backgroundColor: colors.background.page,
          borderBottomColor: colors.border.subtle,
        },
      ]}
    >
      <TouchableOpacity
        onPress={() => router.back()}
        style={[
          styles.backBtn,
          {
            backgroundColor: colors.background.tint,
            borderColor: colors.border.brand,
          },
        ]}
        accessibilityLabel="Go back"
      >
        <Ionicons name="arrow-back" size={20} color={colors.text.brand} />
      </TouchableOpacity>

      <Text
        style={[styles.headerTitle, { color: colors.text.primary }]}
        numberOfLines={1}
      >
        {title}
      </Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    gap: Spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    flexShrink: 0,
  },
  headerTitle: {
    ...Typography.h4,
    flex: 1,
  },
  infoCard: {
    margin: Spacing.base,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  infoTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  infoNameBlock: {
    flex: 1,
    gap: 3,
  },
  shopName: {
    ...Typography.h4,
  },
  shopTagline: {
    ...Typography.small,
    lineHeight: 18,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    borderRadius: Radius.full,
    borderWidth: 1,
    flexShrink: 0,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
   badgeText: {
    ...Typography.caption,
    fontFamily: "Inter_600SemiBold",
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    ...Typography.small,
  },
  separator: {
    width: 1,
    height: 12,
    backgroundColor: "#E0E0E0",
  },
  sectionLabel: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
  },
  sectionTitle: {
    ...Typography.bodyMedium,
  },
  sectionCount: {
    ...Typography.small,
  },
  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
  },
  centerText: {
    ...Typography.h4,
    textAlign: "center",
    marginTop: Spacing.sm,
  },
  retryText: {
    ...Typography.body,
    textAlign: "center",
  },
  listContent: {
    paddingBottom: Spacing["3xl"],
  },
});