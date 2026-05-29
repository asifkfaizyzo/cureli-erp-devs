// src/features/marketplace/components/shop/MedicineRow.tsx
//
// Horizontal medicine card used inside the shop profile medicine list.
//
// ADD button design:
//   - quantity === 0 → plain "ADD" button (outlined, brand color)
//   - quantity  > 0 → inline stepper:  [ − ]  { count }  [ + ]
//     The stepper replaces the ADD button entirely.
//     Tapping − at quantity 1 removes the item from cart (goes back to ADD).
//
// listingPrice: real price from MarketplaceListing (set by the shop).
//   - Non-null → label "Price", real value shown
//   - Null     → label "Approx.", fake generateMarketplaceData value shown
//
// Tapping the card body navigates to the product detail screen.

import React, { useCallback } from "react";
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Pressable,
  StyleSheet,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Typography } from "../../../../theme/typography";
import { Spacing } from "../../../../theme/spacing";
import { Radius } from "../../../../theme/radius";
import type { useTheme } from "../../../../theme/ThemeContext";
import type { EnrichedBranchMedicine } from "../../hooks/useShopMedicines";

interface MedicineRowProps {
  item: EnrichedBranchMedicine;
  cartQuantity: number;
  onAdd: (item: EnrichedBranchMedicine) => void;
  onIncrement: (item: EnrichedBranchMedicine) => void;
  onDecrement: (item: EnrichedBranchMedicine) => void;
  colors: ReturnType<typeof useTheme>["colors"];
}

export function MedicineRow({
  item,
  cartQuantity,
  onAdd,
  onIncrement,
  onDecrement,
  colors,
}: MedicineRowProps) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withTiming(0.98, { duration: 80 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withTiming(1, { duration: 100 });
  }, [scale]);

  const handlePressCard = useCallback(() => {
    router.push(`/product/${item.skuId}` as any);
  }, [item.skuId]);

  const handleAdd = useCallback(() => {
    onAdd(item);
  }, [onAdd, item]);

  const handleIncrement = useCallback(() => {
    onIncrement(item);
  }, [onIncrement, item]);

  const handleDecrement = useCallback(() => {
    onDecrement(item);
  }, [onDecrement, item]);

  const displayPrice = item.listingPrice ?? item.marketplace.startsAt;
  const hasRealPrice = item.listingPrice != null;
  const inCart = cartQuantity > 0;

  return (
    <Animated.View style={animStyle}>
      <Pressable
        onPress={handlePressCard}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.row,
          {
            backgroundColor: colors.background.card,
            borderColor: colors.border.default,
          },
        ]}
      >
        {/* ── Image ── */}
        <View
          style={[
            styles.imageWrap,
            { backgroundColor: "#ffffff", borderColor: colors.border.subtle },
          ]}
        >
          {item.image ? (
            <Image
              source={{ uri: item.image }}
              style={styles.image}
              resizeMode="contain"
            />
          ) : (
            <Ionicons
              name="medical-outline"
              size={26}
              color={colors.text.brand}
            />
          )}
        </View>

        {/* ── Details ── */}
        <View style={styles.details}>
          {/* Name + Rx badge */}
          <View style={styles.nameRow}>
            <Text
              style={[styles.name, { color: colors.text.primary }]}
              numberOfLines={2}
            >
              {item.name}
            </Text>
            {item.prescriptionRequired ? (
              <View
                style={[
                  styles.rxBadge,
                  {
                    backgroundColor: colors.status.warningBg,
                    borderColor: colors.status.warning,
                  },
                ]}
              >
                <Text
                  style={[styles.rxText, { color: colors.status.warning }]}
                >
                  Rx
                </Text>
              </View>
            ) : null}
          </View>

          {item.manufacturer ? (
            <Text
              style={[styles.mfr, { color: colors.text.faint }]}
              numberOfLines={1}
            >
              {item.manufacturer}
            </Text>
          ) : null}

          {item.packSize ? (
            <Text
              style={[styles.pack, { color: colors.text.muted }]}
              numberOfLines={1}
            >
              {item.packSize}
            </Text>
          ) : null}

          {/* ── Price + Action row ── */}
          <View style={styles.bottom}>
            {/* Price block */}
            <View>
              <Text
                style={[styles.priceLabel, { color: colors.text.faint }]}
              >
                {hasRealPrice ? "Price" : "Approx."}
              </Text>
              <Text style={[styles.price, { color: colors.text.primary }]}>
                ₹{displayPrice}
              </Text>
            </View>

            {/* ── ADD  /  Stepper ── */}
            {inCart ? (
              // ── Quantity stepper ─────────────────────────────
              <View
                style={[
                  styles.stepper,
                  { borderColor: colors.brand.primary },
                ]}
              >
                {/* Decrement */}
                <TouchableOpacity
                  onPress={handleDecrement}
                  activeOpacity={0.7}
                  style={[
                    styles.stepperBtn,
                    { backgroundColor: colors.brand.primary },
                  ]}
                  accessibilityLabel="Decrease quantity"
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Ionicons name="remove" size={14} color="#ffffff" />
                </TouchableOpacity>

                {/* Count */}
                <Text
                  style={[
                    styles.stepperCount,
                    { color: colors.brand.primary },
                  ]}
                >
                  {cartQuantity}
                </Text>

                {/* Increment */}
                <TouchableOpacity
                  onPress={handleIncrement}
                  activeOpacity={0.7}
                  style={[
                    styles.stepperBtn,
                    { backgroundColor: colors.brand.primary },
                  ]}
                  accessibilityLabel="Increase quantity"
                  hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
                >
                  <Ionicons name="add" size={14} color="#ffffff" />
                </TouchableOpacity>
              </View>
            ) : (
              // ── Plain ADD button ──────────────────────────────
              <TouchableOpacity
                onPress={handleAdd}
                activeOpacity={0.8}
                style={[
                  styles.addBtn,
                  {
                    borderColor: colors.brand.primary,
                  },
                ]}
                accessibilityLabel={`Add ${item.name} to cart`}
              >
                <Text
                  style={[styles.addBtnText, { color: colors.brand.primary }]}
                >
                  ADD
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    marginHorizontal: Spacing.base,
    marginBottom: Spacing.sm,
    borderRadius: Radius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  imageWrap: {
    width: 72,
    height: 72,
    borderRadius: Radius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  details: {
    flex: 1,
    minWidth: 0,
    gap: 3,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
  },
  name: {
    ...Typography.bodyMedium,
    flex: 1,
    lineHeight: 20,
  },
  rxBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radius.xs,
    borderWidth: 1,
    marginTop: 2,
    flexShrink: 0,
  },
  rxText: {
    ...Typography.smallBold,
    fontSize: 10,
  },
  mfr: {
    ...Typography.caption,
  },
  pack: {
    ...Typography.caption,
  },
  bottom: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: Spacing.sm,
  },
  priceLabel: {
    ...Typography.caption,
    fontSize: 10,
  },
  price: {
    ...Typography.h4,
  },

  // ── Plain ADD button (quantity === 0) ──────────────────────
  addBtn: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    backgroundColor: "#ffffff",
    alignItems: "center",
    justifyContent: "center",
    minWidth: 64,
  },
  addBtnText: {
    ...Typography.smallMedium,
    letterSpacing: 0.8,
  },

  // ── Quantity stepper (quantity > 0) ────────────────────────
  stepper: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    overflow: "hidden",
    minWidth: 96,
  },
  stepperBtn: {
    width: 30,
    height: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  stepperCount: {
    flex: 1,
    textAlign: "center",
    ...Typography.bodyMedium,
    fontSize: 14,
  },
});