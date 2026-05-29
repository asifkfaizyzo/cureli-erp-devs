import React, { memo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../theme/ThemeContext";
import { Typography } from "../../../theme/typography";
import { Spacing } from "../../../theme/spacing";
import { Radius } from "../../../theme/radius";
import type { DummyShop } from "../constants/dummyShops";

interface ShopCardProps {
  shop: DummyShop;
  onPress: (shop: DummyShop) => void;
}

function ShopCardComponent({ shop, onPress }: ShopCardProps) {
  const { colors } = useTheme();

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
      {/* ── Top row: icon placeholder + name + open badge ── */}
      <View style={styles.topRow}>
        {/* Shop icon circle */}
        <View
          style={[
            styles.iconCircle,
            { backgroundColor: colors.background.tint },
          ]}
        >
          <Ionicons
            name="storefront-outline"
            size={22}
            color={colors.text.brand}
          />
        </View>

        {/* Name + category */}
        <View style={styles.nameBlock}>
          <Text
            style={[styles.name, { color: colors.text.primary }]}
            numberOfLines={1}
          >
            {shop.name}
          </Text>
          <Text
            style={[styles.category, { color: colors.text.muted }]}
            numberOfLines={1}
          >
            {shop.category}
          </Text>
        </View>

        {/* Open / Closed badge */}
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

      {/* ── Tagline ── */}
      <Text
        style={[styles.tagline, { color: colors.text.secondary }]}
        numberOfLines={2}
      >
        {shop.tagline}
      </Text>

      {/* ── Bottom row: area + rating + delivery + CTA ── */}
      <View style={styles.bottomRow}>
        {/* Area */}
        <View style={styles.metaItem}>
          <Ionicons
            name="location-outline"
            size={13}
            color={colors.text.muted}
          />
          <Text style={[styles.metaText, { color: colors.text.muted }]}>
            {shop.area}
          </Text>
        </View>

        {/* Rating */}
        <View style={styles.metaItem}>
          <Ionicons name="star" size={13} color="#FBBF24" />
          <Text style={[styles.metaText, { color: colors.text.muted }]}>
            {shop.rating.toFixed(1)}
          </Text>
        </View>

        {/* Delivery time */}
        <View style={styles.metaItem}>
          <Ionicons
            name="time-outline"
            size={13}
            color={colors.text.muted}
          />
          <Text style={[styles.metaText, { color: colors.text.muted }]}>
            {shop.deliveryTime}
          </Text>
        </View>

        {/* View Shop CTA */}
        <TouchableOpacity
          onPress={() => onPress(shop)}
          activeOpacity={0.8}
          style={[
            styles.cta,
            { backgroundColor: colors.brand.primary },
          ]}
        >
          <Text style={styles.ctaText}>View Shop</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
}

export const ShopCard = memo(ShopCardComponent);

// ── Styles ────────────────────────────────────────────────────

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
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: Radius.full,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  nameBlock: {
    flex: 1,
    gap: 2,
  },
  name: {
    ...Typography.bodyMedium,
  },
  category: {
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
  tagline: {
    ...Typography.small,
    lineHeight: 18,
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
  },
  metaText: {
    ...Typography.small,
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