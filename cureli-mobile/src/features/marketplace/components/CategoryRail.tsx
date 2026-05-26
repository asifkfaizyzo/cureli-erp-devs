// src/features/marketplace/components/CategoryRail.tsx
//
// Horizontally scrollable Quick Categories rail.
// Each pill = an icon chip + label. The selected pill animates to the brand
// accent. Tapping toggles selection and bubbles the category key (or null
// when deselected) to the parent, which refetches the feed.
//
// Presentational: data (categories) + selection state come from props.

import React, { useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
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
import { getCategoryAccent } from "../constants/categoryDisplay";
import type { MedicineCategory } from "../types/marketplace.types";

interface CategoryRailProps {
  categories: MedicineCategory[];
  selectedKey: string | null;
  onSelect: (key: string | null) => void;
}

interface PillProps {
  category: MedicineCategory;
  selected: boolean;
  onPress: (key: string) => void;
}

function CategoryPill({ category, selected, onPress }: PillProps) {
  const { colors } = useTheme();
  const accent = getCategoryAccent(category.key);

  const animatedStyle = useAnimatedStyle(() => ({
    // Subtle lift when selected.
    transform: [{ scale: withTiming(selected ? 1.0 : 1.0, { duration: 120 }) }],
  }));

  const chipBg = selected ? accent : colors.background.tint;
  const iconColor = selected ? "#ffffff" : colors.text.brand;
  const labelColor = selected ? colors.text.brand : colors.text.secondary;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => onPress(category.key)}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={category.label}
      style={styles.pill}
    >
      <Animated.View style={animatedStyle}>
        <View
          style={[
            styles.iconChip,
            {
              backgroundColor: chipBg,
              borderColor: selected ? accent : colors.border.brand,
            },
          ]}
        >
          <Ionicons name={category.icon as any} size={22} color={iconColor} />
        </View>
      </Animated.View>
      <Text
        style={[styles.label, { color: labelColor }]}
        numberOfLines={1}
      >
        {category.label}
      </Text>
    </TouchableOpacity>
  );
}

const MemoPill = React.memo(CategoryPill);

function CategoryRailBase({
  categories,
  selectedKey,
  onSelect,
}: CategoryRailProps) {
  const handlePress = useCallback(
    (key: string) => {
      // Tapping the active pill clears the filter.
      onSelect(selectedKey === key ? null : key);
    },
    [onSelect, selectedKey],
  );

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.content}
      style={styles.scroll}
    >
      {categories.map((cat) => (
        <MemoPill
          key={cat.key}
          category={cat}
          selected={selectedKey === cat.key}
          onPress={handlePress}
        />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    marginTop: Spacing.lg,
  },
  content: {
    paddingHorizontal: Spacing.base,
    gap: Spacing.base,
  },
  pill: {
    alignItems: "center",
    width: 68,
    gap: 6,
  },
  iconChip: {
    width: 56,
    height: 56,
    borderRadius: Radius.lg,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
  },
  label: {
    ...Typography.caption,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
  },
});

export const CategoryRail = React.memo(CategoryRailBase);