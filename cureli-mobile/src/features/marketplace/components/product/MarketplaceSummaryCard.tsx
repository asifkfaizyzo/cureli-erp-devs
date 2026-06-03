// src/features/marketplace/components/product/MarketplaceSummaryCard.tsx
//
// Horizontal summary card on the product detail screen.
// Now shows REAL data derived from the shops list:
//
//   Available at : count of branches stocking the medicine
//   From         : lowest real listing price across those branches
//                  "—" if no branch has set a price
//   Stock        : "In Stock" if any branch is IN_STOCK, else "Low Stock"
//
// ETA and distance are removed — we have no real data for them.
// This component is only rendered when shops.length > 0.

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Typography } from "../../../../theme/typography";
import { Spacing } from "../../../../theme/spacing";
import { Radius } from "../../../../theme/radius";
import type { useTheme } from "../../../../theme/ThemeContext";
import type { MedicineShopListing } from "../../../../types/medicine";

interface MarketplaceSummaryCardProps {
  shops: MedicineShopListing[];
  colors: ReturnType<typeof useTheme>["colors"];
}

export function MarketplaceSummaryCard({
  shops,
  colors,
}: MarketplaceSummaryCardProps) {
  // Derive real values from shop list
  const pharmacyCount = shops.length;

  const prices = shops
    .map((s) => s.listingPrice)
    .filter((p): p is number => p !== null);
  const lowestPrice = prices.length > 0 ? Math.min(...prices) : null;

  const hasInStock = shops.some((s) => s.stockStatus === "IN_STOCK");
  const stockLabel = hasInStock ? "In Stock" : "Low Stock";
  const stockColor = hasInStock ? colors.status.success : colors.status.warning;

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
      {/* Available at */}
      <View style={styles.item}>
        <Text style={[styles.label, { color: colors.text.faint }]}>
          Available at
        </Text>
        <Text style={[styles.value, { color: colors.text.primary }]}>
          {pharmacyCount}{" "}
          {pharmacyCount === 1 ? "pharmacy" : "pharmacies"}
        </Text>
      </View>

      <View
        style={[styles.divider, { backgroundColor: colors.border.subtle }]}
      />

      {/* Starts from */}
      <View style={styles.item}>
        <Text style={[styles.label, { color: colors.text.faint }]}>
          From
        </Text>
        <Text style={[styles.value, { color: colors.text.primary }]}>
          {lowestPrice !== null ? `₹${lowestPrice}` : "—"}
        </Text>
      </View>

      <View
        style={[styles.divider, { backgroundColor: colors.border.subtle }]}
      />

      {/* Stock status */}
      <View style={styles.item}>
        <Text style={[styles.label, { color: colors.text.faint }]}>
          Stock
        </Text>
        <View style={styles.stockRow}>
          <View
            style={[styles.stockDot, { backgroundColor: stockColor }]}
          />
          <Text style={[styles.value, { color: stockColor }]}>
            {stockLabel}
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