// src/features/marketplace/components/ProductCard.tsx

import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  Pressable,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { router } from "expo-router";

import { useTheme } from "../../../theme/ThemeContext";
import { Typography } from "../../../theme/typography";
import { Spacing } from "../../../theme/spacing";
import { Radius } from "../../../theme/radius";
import { getPlaceholder } from "../../../utils/placeholderImage";
import type { EnrichedMedicine } from "../types/marketplace.types";

const CARD_HEIGHT = 200;
const IMAGE_HEIGHT = 120;
const REAL_IMAGE_SCALE = 1.16;

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
  const { colors, isDark } = useTheme();
  const scale = useSharedValue(1);
  const imageOpacity = useSharedValue(0);
  const placeholder = getPlaceholder(isDark);

  const [imageReady, setImageReady] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Reset whenever the source image changes
  useEffect(() => {
    setImageReady(false);
    setImageError(false);
    imageOpacity.value = 0;
  }, [medicine.image]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const realImageAnimatedStyle = useAnimatedStyle(() => ({
    opacity: imageOpacity.value,
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
    router.push(`/product/${medicine.skuId}` as any);
  }, [medicine.skuId]);

  const handleLoad = useCallback(() => {
    setImageReady(true);
    imageOpacity.value = withTiming(1, { duration: 180 });
  }, [imageOpacity]);

  const handleError = useCallback(() => {
    setImageError(true);
  }, []);

  // Placeholder is shown only while image hasn't loaded or errored
  const showPlaceholder = !imageReady || imageError;

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
          {/*
            Inner frame clips the zoomed real image.
            Background here is what shows through transparent PNG edges.
          */}
          <View
            style={[
              styles.imageFrame,
              { backgroundColor: colors.background.card },
            ]}
          >
            {/* Placeholder: only while real image is loading or errored */}
            {showPlaceholder ? (
              <Animated.Image
                source={placeholder}
                style={styles.placeholderImage}
                resizeMode="contain"
              />
            ) : null}

            {/* Real image: loads invisibly, fades in, placeholder unmounts */}
            {medicine.image && !imageError ? (
              <Animated.Image
                source={{ uri: medicine.image }}
                style={[styles.realImage, realImageAnimatedStyle]}
                resizeMode="contain"
                onLoad={handleLoad}
                onError={handleError}
              />
            ) : null}
          </View>

          {/* ── Floating ADD button ── */}
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
    position: "relative",
  },
  // Inner clipping frame — overflow hidden clips the zoomed real image
  // backgroundColor set inline so transparent PNG edges show card color
  imageFrame: {
    width: "100%",
    height: "100%",
    borderRadius: Radius.lg,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "flex-end",
    position: "relative",
  },
  placeholderImage: {
    width: "80%",
    height: "100%",
  },
  realImage: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
    transform: [{ scale: REAL_IMAGE_SCALE }],
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