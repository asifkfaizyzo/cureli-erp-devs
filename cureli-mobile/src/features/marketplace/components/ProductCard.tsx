// src/features/marketplace/components/ProductCard.tsx
//
// Product card used in both horizontal home rails and vertical category grid.
//
// ADD button behavior:
//   - Not in cart: shows "ADD"
//   - In cart: shows "ADD (2)"

import React, { useCallback } from "react";
import {
  View,
  Text,
  Image,
  Pressable,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "../../../theme/ThemeContext";
import { Typography } from "../../../theme/typography";
import { Spacing } from "../../../theme/spacing";
import { Radius } from "../../../theme/radius";
import { useCartStore } from "../../../store/cartStore";
import type { EnrichedMedicine } from "../types/marketplace.types";

const CARD_HEIGHT = 200;
const IMAGE_HEIGHT = 120;

interface ProductCardProps {
  medicine: EnrichedMedicine;
  width: number;
  onPress: (medicine: EnrichedMedicine) => void;
}

function compositionSummary(med: EnrichedMedicine): string {
  if (Array.isArray(med.composition) && med.composition.length > 0) {
    return med.composition
      .slice(0, 2)
      .map((c) => (c.strength ? `${c.name} ${c.strength}` : c.name))
      .join(" + ");
  }
  return med.strength || med.genericName || "Medicine";
}

function ProductCardBase({ medicine, width, onPress }: ProductCardProps) {
  const { colors } = useTheme();
  const addItem = useCartStore((state) => state.addItem);
  const cartItems = useCartStore((state) => state.items);
  const scale = useSharedValue(1);

  // Find quantity in cart for this variant.
  const cartItem = cartItems.find(
    (item) => item.variantId === medicine.variantId,
  );
  const quantityInCart = cartItem?.quantity ?? 0;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = useCallback(() => {
    scale.value = withTiming(0.97, { duration: 100 });
  }, [scale]);

  const handlePressOut = useCallback(() => {
    scale.value = withTiming(1, { duration: 120 });
  }, [scale]);

  const handlePress = useCallback(() => {
    onPress(medicine);
  }, [onPress, medicine]);

  const handleAdd = useCallback(() => {
  addItem({
    variantId: medicine.variantId,
    skuId: medicine.skuId,
    name: medicine.name,
    pricePerUnit: medicine.marketplace.startsAt,
    image: medicine.image,
    manufacturer: medicine.manufacturer,
  });
}, [addItem, medicine]);

  return (
    <Animated.View style={[animatedStyle, { width }]}>
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        accessibilityRole="button"
        accessibilityLabel={medicine.name}
        style={[
          styles.card,
          {
            width,
            height: CARD_HEIGHT,
            backgroundColor: colors.background.page,
          },
        ]}
      >
        {/* ── Image area ── */}
        <View
          style={[
            styles.imageContainer,
            {
              backgroundColor: "#ffffff",
              borderColor: colors.border.subtle,
            },
          ]}
        >
          {medicine.image ? (
            <Image
              source={{ uri: medicine.image }}
              style={styles.image}
              resizeMode="contain"
            />
          ) : (
            <View
              style={[
                styles.imagePlaceholder,
                { backgroundColor: colors.background.tint },
              ]}
            >
              <Ionicons
                name="medical-outline"
                size={32}
                color={colors.text.brand}
              />
            </View>
          )}

          {/* ── Floating ADD button ── */}
          <TouchableOpacity
            onPress={handleAdd}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={
              quantityInCart > 0
                ? `Add more ${medicine.name}, ${quantityInCart} in cart`
                : `Add ${medicine.name} to cart`
            }
            style={[
              styles.addButton,
              quantityInCart > 0 && styles.addButtonActive,
            ]}
          >
            <Text
              style={[
                styles.addText,
                quantityInCart > 0 && styles.addTextActive,
              ]}
            >
              ADD{quantityInCart > 0 ? ` (${quantityInCart})` : ""}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Content area ── */}
        <View style={styles.content}>
          <Text
            style={[styles.name, { color: colors.text.primary }]}
            numberOfLines={2}
          >
            {medicine.name}
          </Text>

          <Text
            style={[styles.composition, { color: colors.text.muted }]}
            numberOfLines={1}
          >
            {compositionSummary(medicine)}
          </Text>

          {medicine.manufacturer ? (
            <Text
              style={[styles.manufacturer, { color: colors.text.faint }]}
              numberOfLines={1}
            >
              {medicine.manufacturer}
            </Text>
          ) : null}
        </View>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    overflow: "visible",
  },
  imageContainer: {
    width: "100%",
    height: IMAGE_HEIGHT,
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: "visible",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: Spacing.sm,
    position: "relative",
  },
  image: {
    width: "80%",
    height: "85%",
  },
  imagePlaceholder: {
    width: "100%",
    height: "100%",
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
  },
  addButton: {
    position: "absolute",
    bottom: -12,
    right: -6,
    backgroundColor: "#ffffff",
    borderWidth: 1.5,
    borderColor: "#05015A",
    borderRadius: Radius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    zIndex: 10,
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonActive: {
    backgroundColor: "#05015A",
  },
  addText: {
    ...Typography.buttonSmall,
    color: "#05015A",
    letterSpacing: 0.5,
  },
  addTextActive: {
    color: "#ffffff",
  },
  content: {
    paddingHorizontal: Spacing.xs,
    paddingTop: Spacing.base,
    gap: 2,
    flex: 1,
  },
  name: {
    ...Typography.smallMedium,
    lineHeight: 17,
  },
  composition: {
    ...Typography.caption,
    lineHeight: 15,
  },
  manufacturer: {
    ...Typography.caption,
    lineHeight: 14,
  },
});

export const ProductCard = React.memo(
  ProductCardBase,
  (prev, next) =>
    prev.medicine.variantId === next.medicine.variantId &&
    prev.width === next.width &&
    prev.onPress === next.onPress,
);