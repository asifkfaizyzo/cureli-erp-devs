// src/features/marketplace/components/CategoryCard.tsx
//
// Bigger category tile with image-first rendering.
// If no image exists, falls back to the backend-provided Ionicon.
//
// Grid item can be:
//   - category
//   - next
//   - back
//   - empty

import React, { useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "../../../theme/ThemeContext";
import { Typography } from "../../../theme/typography";
import { Spacing } from "../../../theme/spacing";
import { Radius } from "../../../theme/radius";
import {
  getCategoryAccent,
  getCategoryImage,
} from "../constants/categoryDisplay";
import type { MedicineCategory } from "../types/marketplace.types";

export type GridItem =
  | { type: "category"; data: MedicineCategory }
  | { type: "next" }
  | { type: "back" }
  | { type: "empty" };

interface CategoryCardProps {
  item: GridItem;
  cardWidth: number;
  selected: boolean;
  onPressCategory: (key: string) => void;
  onPressNext: () => void;
  onPressBack: () => void;
}

function CategoryCardBase({
  item,
  cardWidth,
  selected,
  onPressCategory,
  onPressNext,
  onPressBack,
}: CategoryCardProps) {
  const { colors } = useTheme();

  // Important:
  // We want the box to be ~100 on larger phones,
  // but it must shrink on smaller devices so 3 columns still fit.
  const imageBoxSize = Math.min(100, cardWidth - 6);

  if (item.type === "empty") {
    return <View style={[styles.card, { width: cardWidth }]} />;
  }

  if (item.type === "next" || item.type === "back") {
    const isNext = item.type === "next";
    const label = isNext ? "More" : "Back";
    const icon = isNext ? "arrow-forward" : "arrow-back";

    return (
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={isNext ? onPressNext : onPressBack}
        accessibilityRole="button"
        accessibilityLabel={label}
        style={[styles.card, { width: cardWidth }]}
      >
        <View
          style={[
            styles.imageBox,
            styles.navBox,
            {
              width: imageBoxSize,
              height: imageBoxSize,
              backgroundColor: colors.background.card,
              borderColor: colors.border.default,
            },
          ]}
        >
          <Ionicons name={icon} size={30} color={colors.text.brand} />
        </View>

        <Text style={[styles.label, { color: colors.text.brand }]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  }

  const category = item.data;
  const accent = getCategoryAccent(category.key);
  const imageSource = getCategoryImage(category.key);
  const tintBg = `${accent}18`;

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: withTiming(selected ? 1.02 : 1, { duration: 120 }) }],
  }));

  const handlePress = useCallback(() => {
    onPressCategory(category.key);
  }, [onPressCategory, category.key]);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel={category.label}
      accessibilityState={{ selected }}
      style={[styles.card, { width: cardWidth }]}
    >
      <Animated.View style={animatedStyle}>
        <View
          style={[
            styles.imageBox,
            {
              width: imageBoxSize,
              height: imageBoxSize,
              backgroundColor: tintBg,
              borderColor: selected ? colors.brand.primary : `${accent}40`,
              borderWidth: selected ? 2 : 1,
            },
          ]}
        >
          {imageSource ? (
            <Image
              source={imageSource}
              style={styles.image}
              resizeMode="contain"
            />
          ) : (
            <Ionicons name={category.icon as any} size={34} color={accent} />
          )}
        </View>
      </Animated.View>

      <Text
        style={[
          styles.label,
          {
            color: selected ? colors.text.brand : colors.text.secondary,
            fontFamily: selected ? "Inter_600SemiBold" : "Inter_500Medium",
          },
        ]}
        numberOfLines={2}
      >
        {category.label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    alignItems: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  imageBox: {
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  navBox: {
    borderStyle: "dashed",
  },
  image: {
    width: "78%",
    height: "78%",
  },
  label: {
    ...Typography.smallMedium,
    textAlign: "center",
    paddingHorizontal: 2,
    minHeight: 32,
  },
});

export const CategoryCard = React.memo(CategoryCardBase);