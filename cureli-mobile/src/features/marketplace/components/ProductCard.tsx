// src/features/marketplace/components/ProductCard.tsx
//
// Product card used in horizontal home rails and vertical category grid.
//
// PHASE 4 CHANGE: ADD button now navigates to the product detail page
// instead of adding directly to cart. This is intentional — the cart
// now requires pharmacy context (shopId, branchId) which is not available
// from the home feed or category screen. The user must select a pharmacy
// on the detail page before adding to cart.
//
// The ADD button visual is preserved so the card looks identical to before.
// Tapping it routes to /product/:skuId — same destination as tapping the
// card body. The distinction will become meaningful in Phase 5 when the
// detail page has a pharmacy selector and a real Add to Cart flow.
//
// cartItem / quantityInCart are removed — cart state is no longer
// reflected on this card since items can only be added via the detail page.
//
// DARK MODE FIX: previously used hardcoded "#ffffff" for the image
// container background and the ADD button background. Both are now
// driven by theme tokens (colors.background.card) so the card renders
// correctly in dark mode.

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
import { router } from "expo-router";

import { useTheme } from "../../../theme/ThemeContext";
import { Typography } from "../../../theme/typography";
import { Spacing } from "../../../theme/spacing";
import { Radius } from "../../../theme/radius";
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

  // ADD button navigates to detail page — pharmacy selection happens there.
  // Does NOT add to cart directly. cartStore.addItem requires pharmacy
  // context that is not available from the feed/category context.
  const handleAdd = useCallback(() => {
    router.push(`/product/${medicine.skuId}` as any);
  }, [medicine.skuId]);

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
              backgroundColor: colors.background.card,
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

          {/* ── Floating ADD button — navigates to detail page ── */}
          <TouchableOpacity
            onPress={handleAdd}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel={`View ${medicine.name}`}
            style={[
              styles.addButton,
              {
                backgroundColor: colors.background.card,
                borderColor: colors.brand.primary,
              },
            ]}
          >
            <Text style={[styles.addText, { color: colors.brand.primary }]}>
              ADD
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
    position: "relative",
  },
  image: {
    width: "80%",
    height: "100%",
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
    borderWidth: 1.5,
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
  addText: {
    ...Typography.buttonSmall,
    letterSpacing: 0.5,
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