// src/features/marketplace/components/ShopCard.tsx

import React, { memo } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../theme/ThemeContext";
import { Typography } from "../../../theme/typography";
import { Spacing } from "../../../theme/spacing";
import { Radius } from "../../../theme/radius";
import { RemoteImage } from "../../../components/RemoteImage";
import type { ShopSearchResult } from "../../../types/shop";

interface ShopCardProps {
  shop: ShopSearchResult;
  onPress: (shop: ShopSearchResult) => void;
}

function ShopCardComponent({ shop, onPress }: ShopCardProps) {
  const { colors } = useTheme();
  const branch = shop.nearestBranch;

  return (
    <TouchableOpacity
      activeOpacity={0.75}
      onPress={() => onPress(shop)}
      style={[
        styles.card,
        {
          backgroundColor: colors.background.card,
          borderColor: colors.border.subtle,
        },
      ]}
    >
      {/* ── Top row: logo + name + open badge ── */}
      <View style={styles.topRow}>
        {/*
          Shop logo — mode="shop" so storefront icon is the fallback.
          Semantically correct for a shop card.
        */}
        <RemoteImage
          uri={shop.logoUrl ?? null}
          style={[
            styles.logoCircle,
            {
              backgroundColor: colors.background.tint,
              borderColor: colors.border.subtle,
            },
          ]}
          resizeMode="contain"
          mode="shop"
          fallbackIcon="storefront-outline"
          fallbackIconSize={22}
          fallbackIconColor={colors.text.brand}
        />

        <View style={styles.nameBlock}>
          <Text
            style={[styles.name, { color: colors.text.primary }]}
            numberOfLines={1}
          >
            {shop.name}
          </Text>
          <Text
            style={[styles.medicineCount, { color: colors.text.muted }]}
            numberOfLines={1}
          >
            {shop.listedMedicineCount > 0
              ? `${shop.listedMedicineCount} medicines listed`
              : "No medicines listed yet"}
          </Text>
        </View>

        {branch ? (
          <View
            style={[
              styles.badge,
              {
                backgroundColor: branch.isOpen
                  ? colors.background.tint
                  : "#F5F5F5",
                borderColor: branch.isOpen ? colors.border.brand : "#E0E0E0",
              },
            ]}
          >
            <View
              style={[
                styles.dot,
                { backgroundColor: branch.isOpen ? "#22C55E" : "#9E9E9E" },
              ]}
            />
            <Text
              style={[
                styles.badgeText,
                {
                  color: branch.isOpen ? colors.text.brand : colors.text.muted,
                },
              ]}
            >
              {branch.isOpen ? "Open" : "Closed"}
            </Text>
          </View>
        ) : null}
      </View>

      {/* ── Description ── */}
      {shop.description ? (
        <Text
          style={[styles.description, { color: colors.text.secondary }]}
          numberOfLines={2}
        >
          {shop.description}
        </Text>
      ) : null}

      {/* ── Capability pills ── */}
      {branch ? (
        <View style={styles.pillRow}>
          {branch.pickupEnabled ? (
            <View
              style={[
                styles.pill,
                {
                  backgroundColor: colors.background.tint,
                  borderColor: colors.border.brand,
                },
              ]}
            >
              <Ionicons name="bag-handle-outline" size={11} color={colors.text.brand} />
              <Text style={[styles.pillText, { color: colors.text.brand }]}>
                Pickup
              </Text>
            </View>
          ) : null}

          {branch.deliveryEnabled ? (
            <View
              style={[
                styles.pill,
                {
                  backgroundColor: colors.background.tint,
                  borderColor: colors.border.brand,
                },
              ]}
            >
              <Ionicons name="bicycle-outline" size={11} color={colors.text.brand} />
              <Text style={[styles.pillText, { color: colors.text.brand }]}>
                Delivery
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {/* ── Bottom row: address + distance + rating + CTA ── */}
      <View style={styles.bottomRow}>
        {branch?.address ? (
          <View style={styles.metaItem}>
            <Ionicons name="location-outline" size={13} color={colors.text.muted} />
            <Text
              style={[styles.metaText, { color: colors.text.muted }]}
              numberOfLines={1}
            >
              {branch.address}
            </Text>
          </View>
        ) : null}

        {branch?.distanceKm != null ? (
          <View style={styles.metaItem}>
            <Ionicons name="navigate-outline" size={13} color={colors.text.muted} />
            <Text style={[styles.metaText, { color: colors.text.muted }]}>
              {branch.distanceKm} km
            </Text>
          </View>
        ) : null}

        <View style={styles.metaItem}>
          <Ionicons
            name="star"
            size={13}
            color={shop.rating != null ? "#FBBF24" : colors.text.faint}
          />
          <Text
            style={[
              styles.metaText,
              {
                color: shop.rating != null ? colors.text.muted : colors.text.faint,
              },
            ]}
          >
            {shop.rating != null ? shop.rating.toFixed(1) : "No rating yet"}
          </Text>
        </View>

        <TouchableOpacity
          onPress={() => onPress(shop)}
          activeOpacity={0.8}
          style={[styles.cta, { backgroundColor: colors.brand.primary }]}
        >
          <Text style={styles.ctaText}>View Shop</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

export const ShopCard = memo(ShopCardComponent);

const styles = StyleSheet.create({
  card: {
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  // RemoteImage fills this container
  logoCircle: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    borderWidth: 1,
    overflow: "hidden",
    flexShrink: 0,
  },
  nameBlock: {
    flex: 1,
    gap: 2,
  },
  name: {
    ...Typography.bodyMedium,
  },
  medicineCount: {
    ...Typography.small,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
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
  description: {
    ...Typography.small,
    lineHeight: 18,
  },
  pillRow: {
    flexDirection: "row",
    gap: Spacing.sm,
    flexWrap: "wrap",
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
    borderRadius: Radius.full,
    borderWidth: 1,
  },
  pillText: {
    ...Typography.caption,
    fontFamily: "Inter_600SemiBold",
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginTop: Spacing.xs,
    flexWrap: "wrap",
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    flexShrink: 1,
    minWidth: 0,
  },
  metaText: {
    ...Typography.small,
    flexShrink: 1,
  },
  cta: {
    marginLeft: "auto",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.full,
  },
  ctaText: {
    ...Typography.smallMedium,
    color: "#FFFFFF",
  },
});