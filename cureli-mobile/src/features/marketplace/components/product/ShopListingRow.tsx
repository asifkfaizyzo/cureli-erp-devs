// src/features/marketplace/components/product/ShopListingRow.tsx

import React, { useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Typography } from "../../../../theme/typography";
import { Spacing } from "../../../../theme/spacing";
import { Radius } from "../../../../theme/radius";
import { RemoteImage } from "../../../../components/RemoteImage";
import type { useTheme } from "../../../../theme/ThemeContext";
import type { MedicineShopListing } from "../../../../types/medicine";

interface ShopListingRowProps {
  shop: MedicineShopListing;
  cartQuantity: number;
  onAdd: (shop: MedicineShopListing) => void;
  onIncrement: (shop: MedicineShopListing) => void;
  onDecrement: (shop: MedicineShopListing) => void;
  colors: ReturnType<typeof useTheme>["colors"];
}

export function ShopListingRow({
  shop,
  cartQuantity,
  onAdd,
  onIncrement,
  onDecrement,
  colors,
}: ShopListingRowProps) {
  const handleViewShop = useCallback(() => {
    router.push(`/shop/${shop.shopId}` as any);
  }, [shop.shopId]);

  const handleAdd       = useCallback(() => onAdd(shop),       [onAdd, shop]);
  const handleIncrement = useCallback(() => onIncrement(shop), [onIncrement, shop]);
  const handleDecrement = useCallback(() => onDecrement(shop), [onDecrement, shop]);

  const inCart = cartQuantity > 0;

  return (
    <View
      style={[
        styles.row,
        {
          backgroundColor: colors.background.card,
          borderColor: colors.border.default,
        },
      ]}
    >
      {/* ── Top: shop identity + distance ── */}
      <View style={styles.topRow}>
        {/*
          Shop logo — mode="shop" so storefront icon is used as fallback.
          This is semantically correct: a shop logo placeholder should look
          like a shop, not a medicine bottle.
        */}
        <RemoteImage
          uri={shop.logoUrl ?? null}
          style={[
            styles.logoWrap,
            { backgroundColor: colors.background.tint },
          ]}
          resizeMode="cover"
          mode="shop"
          fallbackIcon="storefront-outline"
          fallbackIconSize={20}
          fallbackIconColor={colors.text.brand}
        />

        <View style={styles.nameBlock}>
          <Text
            style={[styles.shopName, { color: colors.text.primary }]}
            numberOfLines={1}
          >
            {shop.shopName}
          </Text>
          {shop.branchName ? (
            <Text
              style={[styles.branchName, { color: colors.text.muted }]}
              numberOfLines={1}
            >
              {shop.branchName}
            </Text>
          ) : null}
        </View>

        {shop.distanceKm !== null ? (
          <Text style={[styles.distance, { color: colors.text.faint }]}>
            {shop.distanceKm} km
          </Text>
        ) : null}
      </View>

      {/* ── Middle: address + status badges ── */}
      {shop.address ? (
        <Text
          style={[styles.address, { color: colors.text.muted }]}
          numberOfLines={2}
        >
          {shop.address}
        </Text>
      ) : null}

      <View style={styles.badgeRow}>
        <View
          style={[
            styles.badge,
            {
              backgroundColor: shop.isOpen
                ? colors.status.successBg
                : colors.status.errorBg,
              borderColor: shop.isOpen
                ? colors.status.success
                : colors.status.error,
            },
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              {
                color: shop.isOpen
                  ? colors.status.success
                  : colors.status.error,
              },
            ]}
          >
            {shop.is24Hours ? "24 hrs" : shop.isOpen ? "Open" : "Closed"}
          </Text>
        </View>

        {shop.deliveryEnabled ? (
          <View
            style={[
              styles.badge,
              {
                backgroundColor: colors.background.tint,
                borderColor: colors.border.brand,
              },
            ]}
          >
            <Ionicons name="bicycle-outline" size={11} color={colors.text.brand} />
            <Text style={[styles.badgeText, { color: colors.text.brand }]}>
              Delivery
            </Text>
          </View>
        ) : null}

        {shop.pickupEnabled ? (
          <View
            style={[
              styles.badge,
              {
                backgroundColor: colors.background.tint,
                borderColor: colors.border.brand,
              },
            ]}
          >
            <Ionicons name="bag-handle-outline" size={11} color={colors.text.brand} />
            <Text style={[styles.badgeText, { color: colors.text.brand }]}>
              Pickup
            </Text>
          </View>
        ) : null}

        <View
          style={[
            styles.badge,
            {
              backgroundColor:
                shop.stockStatus === "IN_STOCK"
                  ? colors.status.successBg
                  : colors.status.warningBg,
              borderColor:
                shop.stockStatus === "IN_STOCK"
                  ? colors.status.success
                  : colors.status.warning,
            },
          ]}
        >
          <Text
            style={[
              styles.badgeText,
              {
                color:
                  shop.stockStatus === "IN_STOCK"
                    ? colors.status.success
                    : colors.status.warning,
              },
            ]}
          >
            {shop.stockStatus === "IN_STOCK" ? "In Stock" : "Low Stock"}
          </Text>
        </View>
      </View>

      {/* ── Bottom: price + actions ── */}
      <View style={styles.bottomRow}>
        <View>
          <Text style={[styles.priceLabel, { color: colors.text.faint }]}>
            Price
          </Text>
          <Text style={[styles.price, { color: colors.text.primary }]}>
            {shop.listingPrice !== null ? `₹${shop.listingPrice}` : "Not set"}
          </Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            onPress={handleViewShop}
            activeOpacity={0.8}
            style={[styles.viewBtn, { borderColor: colors.brand.primary }]}
            accessibilityLabel={`View ${shop.shopName}`}
          >
            <Text style={[styles.viewBtnText, { color: colors.brand.primary }]}>
              View Shop
            </Text>
          </TouchableOpacity>

          {inCart ? (
            <View style={[styles.stepper, { borderColor: colors.brand.primary }]}>
              <TouchableOpacity
                onPress={handleDecrement}
                activeOpacity={0.7}
                style={[styles.stepperBtn, { backgroundColor: colors.brand.primary }]}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                accessibilityLabel="Decrease quantity"
              >
                <Ionicons name="remove" size={13} color="#ffffff" />
              </TouchableOpacity>
              <Text style={[styles.stepperCount, { color: colors.brand.primary }]}>
                {cartQuantity}
              </Text>
              <TouchableOpacity
                onPress={handleIncrement}
                activeOpacity={0.7}
                style={[styles.stepperBtn, { backgroundColor: colors.brand.primary }]}
                hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                accessibilityLabel="Increase quantity"
              >
                <Ionicons name="add" size={13} color="#ffffff" />
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity
              onPress={handleAdd}
              activeOpacity={0.8}
              style={[styles.addBtn, { borderColor: colors.brand.primary }]}
              accessibilityLabel={`Add from ${shop.shopName}`}
            >
              <Text style={[styles.addBtnText, { color: colors.brand.primary }]}>
                ADD
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  // RemoteImage fills this container
  logoWrap: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    overflow: "hidden",
    flexShrink: 0,
  },
  nameBlock: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  shopName: {
    ...Typography.bodyMedium,
  },
  branchName: {
    ...Typography.caption,
  },
  distance: {
    ...Typography.smallMedium,
    flexShrink: 0,
  },
  address: {
    ...Typography.caption,
    lineHeight: 17,
  },
  badgeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.xs,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: Radius.xs,
    borderWidth: 1,
  },
  badgeText: {
    ...Typography.caption,
    fontSize: 10,
  },
  bottomRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: Spacing.xs,
  },
  priceLabel: {
    ...Typography.caption,
    fontSize: 10,
  },
  price: {
    ...Typography.h4,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  viewBtn: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  viewBtnText: {
    ...Typography.smallMedium,
  },
  addBtn: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 58,
  },
  addBtnText: {
    ...Typography.smallMedium,
    letterSpacing: 0.8,
  },
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    overflow: "hidden",
    minWidth: 90,
  },
  stepperBtn: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperCount: {
    flex: 1,
    textAlign: "center",
    ...Typography.bodyMedium,
    fontSize: 13,
  },
});