// src/features/marketplace/components/ProductCard.tsx
//
// Horizontal-discovery product card.
//
// Layout:
//   ┌─────────────────────────┐
//   │                         │
//   │      Product Image      │
//   │                         │
//   │                   [ADD] │  ← floating, peeks out right
//   ├─────────────────────────┤
//   │  Name (2 lines)         │
//   │  Composition (1 line)   │
//   │  Manufacturer (1 line)  │
//   └─────────────────────────┘
//
// Fixed height: 200px.
// ADD button adds to cart via useCartStore.
// Card background matches page background.

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

// ── Constants ─────────────────────────────────────────────────

const CARD_HEIGHT = 200;
const IMAGE_HEIGHT = 120;

// ── Props ─────────────────────────────────────────────────────

interface ProductCardProps {
  medicine: EnrichedMedicine;
  width: number;
  onPress: (medicine: EnrichedMedicine) => void;
}

// ── Helpers ───────────────────────────────────────────────────

function compositionSummary(med: EnrichedMedicine): string {
  if (Array.isArray(med.composition) && med.composition.length > 0) {
    return med.composition
      .slice(0, 2)
      .map((c) => (c.strength ? `${c.name} ${c.strength}` : c.name))
      .join(" + ");
  }
  return med.strength || med.genericName || "Medicine";
}

// ── Component ─────────────────────────────────────────────────

function ProductCardBase({
  medicine,
  width,
  onPress,
}: ProductCardProps) {
  const { colors } = useTheme();
  const addItem = useCartStore((state) => state.addItem);
  const scale = useSharedValue(1);

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
      quantity: 1,
      pricePerUnit: medicine.marketplace.startsAt,
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
          {/* Positioned so ~10% peeks out to the right of the image area */}
          <TouchableOpacity
            onPress={handleAdd}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={`Add ${medicine.name} to cart`}
            style={styles.addButton}
          >
            <Text style={styles.addText}>ADD</Text>
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

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    borderRadius: Radius.lg,
    overflow: "visible", // Allow ADD button to peek out
  },
  // ── Image ──
  imageContainer: {
    width: "100%",
    height: IMAGE_HEIGHT,
    borderRadius: Radius.lg,
    borderWidth: 1,
    overflow: "visible", // Allow ADD button to peek out
    alignItems: "center",
    justifyContent: "flex-end", // Image sits slightly lower
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
  // ── ADD button ──
  // Floats at bottom-right of image area.
  // right: -6 makes ~10% peek outside image boundary.
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
    // Subtle shadow so it reads above image
    shadowColor: "#000000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  addText: {
    ...Typography.buttonSmall,
    color: "#05015A",
    letterSpacing: 0.5,
  },
  // ── Content ──
  content: {
    paddingHorizontal: Spacing.xs,
    paddingTop: Spacing.base, // Extra top padding to clear the floating ADD button
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