// src/features/marketplace/components/CategoryCard.tsx
//
// Bigger category tile with image-first rendering.
//
// Image priority order:
//   1. category.imageUrl  — remote CDN URL from CAdmin display override
//   2. getCategoryImage() — local bundled image (currently all null, kept as future fallback)
//   3. Ionicons           — always-available fallback, uses category.icon
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

  const imageBoxSize = Math.min(100, cardWidth - 6);

  if (item.type === "empty") {
    return <View style={[styles.card, { width: cardWidth }]} />;
  }

  if (item.type === "next" || item.type === "back") {
    const isNext = item.type === "next";
    const label = isNext ? "More" : "Back";
    const icon  = isNext ? "arrow-forward" : "arrow-back";

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
  const accent   = getCategoryAccent(category.key);
  const tintBg   = `${accent}18`;

  // Image priority:
  //   1. Remote URL from backend override (CAdmin-uploaded via App Config)
  //   2. Local bundled image from getCategoryImage() (all null currently,
  //      kept as a future fallback if images are ever bundled locally)
  //   3. Ionicons icon — rendered when imageSource is null
  const imageSource = category.imageUrl
    ? { uri: category.imageUrl }
    : getCategoryImage(category.key);

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
              width:           imageBoxSize,
              height:          imageBoxSize,
              backgroundColor: tintBg,
              borderColor:     selected ? colors.brand.primary : `${accent}40`,
              borderWidth:     selected ? 2 : 1,
            },
          ]}
        >
          {imageSource ? (
            <Image
              source={imageSource}
              style={styles.image}
              resizeMode="cover"
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
            color:      selected ? colors.text.brand : colors.text.secondary,
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
    width:  "100%",
    height: "100%",
  },
  label: {
    ...Typography.smallMedium,
    textAlign:     "center",
    paddingHorizontal: 2,
    minHeight: 32,
  },
});

export const CategoryCard = React.memo(CategoryCardBase);