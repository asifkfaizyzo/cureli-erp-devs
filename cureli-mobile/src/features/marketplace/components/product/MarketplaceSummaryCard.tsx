// src/features/marketplace/components/product/MarketplaceSummaryCard.tsx
//
// Horizontal card showing fake marketplace data on the product detail screen:
// starts-at price, nearby pharmacy count, ETA, and stock status.
// All values come from generateMarketplaceData (deterministic, frontend-only).

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Typography } from "../../../../theme/typography";
import { Spacing } from "../../../../theme/spacing";
import { Radius } from "../../../../theme/radius";
import type { useTheme } from "../../../../theme/ThemeContext";
import type { MarketplaceData } from "../../../../types/medicine";

interface MarketplaceSummaryCardProps {
  marketplace: MarketplaceData;
  colors: ReturnType<typeof useTheme>["colors"];
}

export function MarketplaceSummaryCard({
  marketplace,
  colors,
}: MarketplaceSummaryCardProps) {
  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.background.card,
          borderColor: colors.border.default,
        },
      ]}
    >
      {/* Starts at */}
      <View style={styles.item}>
        <Text style={[styles.label, { color: colors.text.faint }]}>
          Starts at
        </Text>
        <Text style={[styles.value, { color: colors.text.primary }]}>
          ₹{marketplace.startsAt}
        </Text>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border.subtle }]} />

      {/* Nearby pharmacies */}
      <View style={styles.item}>
        <Text style={[styles.label, { color: colors.text.faint }]}>
          Nearby
        </Text>
        <Text style={[styles.value, { color: colors.text.primary }]}>
          {marketplace.pharmacyCount}{" "}
          {marketplace.pharmacyCount === 1 ? "pharmacy" : "pharmacies"}
        </Text>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border.subtle }]} />

      {/* ETA */}
      <View style={styles.item}>
        <Text style={[styles.label, { color: colors.text.faint }]}>
          ETA
        </Text>
        <Text style={[styles.value, { color: colors.text.primary }]}>
          {marketplace.etaMins} mins
        </Text>
      </View>

      <View style={[styles.divider, { backgroundColor: colors.border.subtle }]} />

      {/* Stock */}
      <View style={styles.item}>
        <Text style={[styles.label, { color: colors.text.faint }]}>
          Stock
        </Text>
        <View style={styles.stockRow}>
          <View
            style={[
              styles.stockDot,
              {
                backgroundColor: marketplace.inStock
                  ? colors.status.success
                  : colors.status.warning,
              },
            ]}
          />
          <Text
            style={[
              styles.value,
              {
                color: marketplace.inStock
                  ? colors.status.success
                  : colors.status.warning,
              },
            ]}
          >
            {marketplace.stockLabel}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginHorizontal: Spacing.base,
    borderRadius: Radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  item: {
    flex: 1,
    alignItems: "center",
    gap: 4,
  },
  label: {
    ...Typography.caption,
    textAlign: "center",
  },
  value: {
    ...Typography.smallBold,
    textAlign: "center",
  },
  divider: {
    width: 1,
    height: 32,
  },
  stockRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  stockDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});