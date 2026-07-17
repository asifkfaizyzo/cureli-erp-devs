// src/features/marketplace/components/product/SiblingCard.tsx

import React, { useEffect, useState, useCallback } from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { Typography } from "../../../../theme/typography";
import { Spacing } from "../../../../theme/spacing";
import { Radius } from "../../../../theme/radius";
import { getPlaceholder } from "../../../../utils/placeholderImage";
import type { useTheme } from "../../../../theme/ThemeContext";
import type { EnrichedMedicine } from "../../../../types/medicine";

interface SiblingCardProps {
  medicine: EnrichedMedicine;
  onPress: (medicine: EnrichedMedicine) => void;
  colors: ReturnType<typeof useTheme>["colors"];
  isDark: boolean;
}

export function SiblingCard({
  medicine,
  onPress,
  colors,
  isDark,
}: SiblingCardProps) {
  const placeholder = getPlaceholder(isDark);
  const imageOpacity = useSharedValue(0);
  const [imageReady, setImageReady] = useState(false);
  const [imageError, setImageError] = useState(false);

  // Reset whenever the source image changes
  useEffect(() => {
    setImageReady(false);
    setImageError(false);
    imageOpacity.value = 0;
  }, [medicine.image]);

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
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => onPress(medicine)}
      style={[
        styles.card,
        {
          backgroundColor: colors.background.card,
          borderColor: colors.border.default,
        },
      ]}
    >
      {/*
        background.elevated is what shows through transparent PNG edges.
        light → #ffffff, dark → #2c2c2e — matches the card surface.
      */}
      <View
        style={[
          styles.imageBox,
          {
            backgroundColor: colors.background.elevated,
            borderColor: colors.border.subtle,
          },
        ]}
      >
        {/* Placeholder: only while real image is loading or errored */}
        {showPlaceholder ? (
          <Animated.Image
            source={placeholder}
            style={styles.image}
            resizeMode="contain"
          />
        ) : null}

        {/* Real image: loads invisibly, fades in, placeholder unmounts */}
        {medicine.image && !imageError ? (
          <Animated.Image
            source={{ uri: medicine.image }}
            style={[styles.image, styles.realImageOverlay, realImageAnimatedStyle]}
            resizeMode="contain"
            onLoad={handleLoad}
            onError={handleError}
          />
        ) : null}
      </View>

      <Text
        style={[styles.name, { color: colors.text.primary }]}
        numberOfLines={2}
      >
        {medicine.name}
      </Text>

      {medicine.packSize ? (
        <Text
          style={[styles.pack, { color: colors.text.muted }]}
          numberOfLines={1}
        >
          {medicine.packSize}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 120,
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.sm,
    gap: 4,
    alignItems: "center",
  },
  imageBox: {
    width: 56,
    height: 56,
    borderRadius: Radius.sm,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  realImageOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
  },
  name: {
    ...Typography.smallMedium,
    textAlign: "center",
    lineHeight: 16,
  },
  pack: {
    ...Typography.caption,
    textAlign: "center",
  },
});