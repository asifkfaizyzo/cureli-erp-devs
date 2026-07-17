// src/features/marketplace/components/product/ProductImageCarousel.tsx

import React, { useState, useCallback, useEffect } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import Carousel from "react-native-reanimated-carousel";
import { Radius } from "../../../../theme/radius";
import { Spacing } from "../../../../theme/spacing";
import { getPlaceholder } from "../../../../utils/placeholderImage";
import type { useTheme } from "../../../../theme/ThemeContext";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const IMAGE_AREA_HEIGHT = SCREEN_WIDTH * 0.62;
const IMAGE_SIZE = SCREEN_WIDTH * 0.42;

interface ProductImageCarouselProps {
  images: string[];
  colors: ReturnType<typeof useTheme>["colors"];
  isDark: boolean;
}

// ── Per-slide component ───────────────────────────────────────
// Each slide manages its own load/error state independently.
// Placeholder shown only while loading; removed once real image is ready.
// Transparent PNG edges show the card background color, not the placeholder.

function CarouselSlide({
  uri,
  placeholder,
  backgroundColor,
}: {
  uri: string;
  placeholder: ReturnType<typeof getPlaceholder>;
  backgroundColor: string;
}) {
  const imageOpacity = useSharedValue(0);
  const [imageReady, setImageReady] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageReady(false);
    setImageError(false);
    imageOpacity.value = 0;
  }, [uri]);

  const realImageAnimatedStyle = useAnimatedStyle(() => ({
    opacity: imageOpacity.value,
  }));

  const handleLoad = useCallback(() => {
    setImageReady(true);
    imageOpacity.value = withTiming(1, { duration: 180 });
  }, [imageOpacity]);

  const handleError = useCallback(() => {
    setImageError(true);
  }, []);

  const showPlaceholder = !imageReady || imageError;

  return (
    <View style={[carouselSlideStyles.wrap, { backgroundColor }]}>
      {showPlaceholder ? (
        <Animated.Image
          source={placeholder}
          style={carouselSlideStyles.image}
          resizeMode="contain"
        />
      ) : null}

      {!imageError ? (
        <Animated.Image
          source={{ uri }}
          style={[
            carouselSlideStyles.image,
            carouselSlideStyles.overlay,
            realImageAnimatedStyle,
          ]}
          resizeMode="contain"
          onLoad={handleLoad}
          onError={handleError}
        />
      ) : null}
    </View>
  );
}

const carouselSlideStyles = StyleSheet.create({
  wrap: {
    width: SCREEN_WIDTH,
    height: IMAGE_AREA_HEIGHT,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing["2xl"],
  },
  image: {
    width: "100%",
    height: "100%",
  },
  overlay: {
    position: "absolute",
    top: 0,
    left: Spacing["2xl"],
    right: Spacing["2xl"],
  },
});

// ── Single static image ───────────────────────────────────────

function SingleImage({
  uri,
  placeholder,
  backgroundColor,
}: {
  uri: string;
  placeholder: ReturnType<typeof getPlaceholder>;
  backgroundColor: string;
}) {
  const imageOpacity = useSharedValue(0);
  const [imageReady, setImageReady] = useState(false);
  const [imageError, setImageError] = useState(false);

  useEffect(() => {
    setImageReady(false);
    setImageError(false);
    imageOpacity.value = 0;
  }, [uri]);

  const realImageAnimatedStyle = useAnimatedStyle(() => ({
    opacity: imageOpacity.value,
  }));

  const handleLoad = useCallback(() => {
    setImageReady(true);
    imageOpacity.value = withTiming(1, { duration: 180 });
  }, [imageOpacity]);

  const handleError = useCallback(() => {
    setImageError(true);
  }, []);

  const showPlaceholder = !imageReady || imageError;

  return (
    <View style={[styles.singleImageWrap, { backgroundColor }]}>
      {showPlaceholder ? (
        <Animated.Image
          source={placeholder}
          style={styles.singleImage}
          resizeMode="contain"
        />
      ) : null}

      {!imageError ? (
        <Animated.Image
          source={{ uri }}
          style={[
            styles.singleImage,
            styles.singleImageOverlay,
            realImageAnimatedStyle,
          ]}
          resizeMode="contain"
          onLoad={handleLoad}
          onError={handleError}
        />
      ) : null}
    </View>
  );
}

// ── Main export ───────────────────────────────────────────────

export function ProductImageCarousel({
  images,
  colors,
  isDark,
}: ProductImageCarouselProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const placeholder = getPlaceholder(isDark);

  const handleSnapToItem = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  // ── 0 images — placeholder only ───────────────────────────
  if (images.length === 0) {
    return (
      <View
        style={[styles.imageArea, { backgroundColor: colors.background.card }]}
      >
        <Animated.Image
          source={placeholder}
          style={styles.placeholderImage}
          resizeMode="contain"
        />
      </View>
    );
  }

  // ── 1 image — static ──────────────────────────────────────
  if (images.length === 1) {
    return (
      <View
        style={[styles.imageArea, { backgroundColor: colors.background.card }]}
      >
        <SingleImage
          uri={images[0]}
          placeholder={placeholder}
          backgroundColor={colors.background.card}
        />
      </View>
    );
  }

  // ── 2+ images — carousel ──────────────────────────────────
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
          <CarouselSlide
            uri={item}
            placeholder={placeholder}
            backgroundColor={colors.background.card}
          />
        )}
      />

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
  imageArea: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing["2xl"],
  },
  placeholderImage: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
  },
  singleImageWrap: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
  },
  singleImage: {
    width: "100%",
    height: "100%",
  },
  singleImageOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  carouselArea: {},
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
  },
});