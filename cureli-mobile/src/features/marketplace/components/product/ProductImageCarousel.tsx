// src/features/marketplace/components/product/ProductImageCarousel.tsx
//
// Medicine image display for the product detail screen.
//
// Behavior:
//   - 0 images → branded placeholder (Ionicons medical icon)
//   - 1 image  → static single image, no carousel chrome, no dots
//   - 2+ images → horizontal swipeable carousel with dot indicator below
//
// Uses react-native-reanimated-carousel (already installed).
// Autoplay is disabled — user-driven only.
// Dots update in sync with the active slide index.
//
// Image area background matches colors.background.card (same as before).
// The component is fully controlled by the parent — it receives
// `images: string[]` and derives its own display mode internally.

import React, { useState, useCallback } from "react";
import {
  View,
  Image,
  StyleSheet,
  Dimensions,
} from "react-native";
import Carousel from "react-native-reanimated-carousel";
import { Ionicons } from "@expo/vector-icons";
import { Radius } from "../../../../theme/radius";
import { Spacing } from "../../../../theme/spacing";
import type { useTheme } from "../../../../theme/ThemeContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Image area dimensions — matches the previous single-image layout
const IMAGE_AREA_HEIGHT = SCREEN_WIDTH * 0.62;
const IMAGE_SIZE = SCREEN_WIDTH * 0.42;

interface ProductImageCarouselProps {
  images: string[];
  colors: ReturnType<typeof useTheme>["colors"];
}

export function ProductImageCarousel({
  images,
  colors,
}: ProductImageCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);

  const handleSnapToItem = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  // ── 0 images — placeholder ────────────────────────────────
  if (images.length === 0) {
    return (
      <View
        style={[
          styles.imageArea,
          { backgroundColor: colors.background.card },
        ]}
      >
        <View
          style={[
            styles.imagePlaceholder,
            { backgroundColor: colors.background.tint },
          ]}
        >
          <Ionicons
            name="medical-outline"
            size={64}
            color={colors.text.brand}
          />
        </View>
      </View>
    );
  }

  // ── 1 image — static, no carousel chrome ─────────────────
  if (images.length === 1) {
    return (
      <View
        style={[
          styles.imageArea,
          { backgroundColor: colors.background.card },
        ]}
      >
        <Image
          source={{ uri: images[0] }}
          style={styles.singleImage}
          resizeMode="contain"
        />
      </View>
    );
  }

  // ── 2+ images — carousel with dots ───────────────────────
  return (
    <View
      style={[
        styles.carouselArea,
        { backgroundColor: colors.background.card },
      ]}
    >
      <Carousel
        width={SCREEN_WIDTH}
        height={IMAGE_AREA_HEIGHT}
        data={images}
        autoPlay={false}
        onSnapToItem={handleSnapToItem}
        scrollAnimationDuration={300}
        renderItem={({ item }) => (
          <View style={styles.slideWrap}>
            <Image
              source={{ uri: item }}
              style={styles.slideImage}
              resizeMode="contain"
            />
          </View>
        )}
      />

      {/* Dot indicator */}
      <View style={styles.dotsRow}>
        {images.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor:
                  i === activeIndex
                    ? colors.brand.primary
                    : colors.border.default,
                width: i === activeIndex ? 16 : 6,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  // ── Shared container for 0 and 1 image modes ──────────────
  imageArea: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["2xl"],
  },

  // ── 0 image — placeholder ─────────────────────────────────
  imagePlaceholder: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: Radius.xl,
    alignItems: "center",
    justifyContent: "center",
  },

  // ── 1 image — static ──────────────────────────────────────
  singleImage: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
  },

  // ── 2+ images — carousel container ───────────────────────
  carouselArea: {
    // No vertical padding — carousel fills its own height
  },

  // ── Each carousel slide ───────────────────────────────────
  slideWrap: {
    width: SCREEN_WIDTH,
    height: IMAGE_AREA_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing["2xl"],
  },

  slideImage: {
    width: "100%",
    height: "100%",
  },

  // ── Dot indicator row ─────────────────────────────────────
  dotsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.xs,
    paddingVertical: Spacing.md,
  },

  dot: {
    height: 6,
    borderRadius: 3,
    // width is set inline — active dot is wider (pill shape)
  },
});