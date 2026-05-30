// src/features/marketplace/components/product/FindPharmaciesSection.tsx
//
// Shown below the marketplace summary card when availableNearYou is true.
// Prompts the user to find a pharmacy — navigates to /search with the
// Shops tab active and the medicine name pre-filled.
//
// Cart add happens inside the shop screen, not here. This component
// bridges the gap between medicine discovery and pharmacy selection.

import React, { useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Typography } from "../../../../theme/typography";
import { Spacing } from "../../../../theme/spacing";
import { Radius } from "../../../../theme/radius";
import type { useTheme } from "../../../../theme/ThemeContext";

interface FindPharmaciesSectionProps {
  medicineName: string;
  colors: ReturnType<typeof useTheme>["colors"];
}

export function FindPharmaciesSection({
  medicineName,
  colors,
}: FindPharmaciesSectionProps) {
  const handleFind = useCallback(() => {
    router.push({
      pathname: "/search",
      params: { tab: "shops", q: medicineName },
    } as any);
  }, [medicineName]);

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
              Find a nearby pharmacy that stocks this medicine
            </Text>
          </View>
        </View>

        <TouchableOpacity
          onPress={handleFind}
          activeOpacity={0.85}
          style={[styles.btn, { backgroundColor: colors.brand.primary }]}
        >
          <Text style={styles.btnText}>Find</Text>
          <Ionicons name="arrow-forward" size={14} color="#FFFFFF" />
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