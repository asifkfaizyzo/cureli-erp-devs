// src/features/marketplace/components/product/FindPharmaciesSection.tsx
//
// CTA card that opens the ShopsBottomSheet.
// No longer navigates away — the sheet slides up in-place.
// The onPress handler is provided by the parent screen.

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Typography } from "../../../../theme/typography";
import { Spacing } from "../../../../theme/spacing";
import { Radius } from "../../../../theme/radius";
import type { useTheme } from "../../../../theme/ThemeContext";

interface FindPharmaciesSectionProps {
  shopCount: number;
  isLoading: boolean;
  onPress: () => void;
  colors: ReturnType<typeof useTheme>["colors"];
}

export function FindPharmaciesSection({
  shopCount,
  isLoading,
  onPress,
  colors,
}: FindPharmaciesSectionProps) {
  const subtitle = isLoading
    ? "Finding nearby pharmacies…"
    : shopCount > 0
      ? `${shopCount} ${shopCount === 1 ? "pharmacy" : "pharmacies"} near you`
      : "Tap to check availability";

  return (
    <View style={styles.section}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.background.card,
            borderColor: colors.border.default,
          },
        ]}
      >
        <View style={styles.cardLeft}>
          <View
            style={[
              styles.iconWrap,
              { backgroundColor: colors.background.tint },
            ]}
          >
            <Ionicons
              name="storefront-outline"
              size={20}
              color={colors.text.brand}
            />
          </View>
          <View style={styles.cardText}>
            <Text
              style={[styles.cardTitle, { color: colors.text.primary }]}
            >
              Order from a pharmacy
            </Text>
            <Text style={[styles.cardSub, { color: colors.text.muted }]}>
              {subtitle}
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={onPress}
          activeOpacity={0.85}
          disabled={isLoading}
          style={[
            styles.btn,
            {
              backgroundColor: isLoading
                ? colors.border.default
                : colors.brand.primary,
            },
          ]}
        >
          <Text style={styles.btnText}>
            {isLoading ? "Loading" : "See all"}
          </Text>
          {!isLoading ? (
            <Ionicons name="chevron-up" size={14} color="#FFFFFF" />
          ) : null}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    paddingHorizontal: Spacing.base,
  },
  card: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    flex: 1,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  cardText: {
    flex: 1,
    gap: 3,
  },
  cardTitle: {
    ...Typography.bodyMedium,
  },
  cardSub: {
    ...Typography.small,
    lineHeight: 17,
  },
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: Radius.full,
    flexShrink: 0,
  },
  btnText: {
    ...Typography.smallMedium,
    color: "#FFFFFF",
  },
});