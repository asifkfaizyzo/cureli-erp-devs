// src/features/marketplace/components/SearchBar.tsx

import React from "react";
import {
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "../../../theme/ThemeContext";
import { Typography } from "../../../theme/typography";
import { Spacing } from "../../../theme/spacing";
import { Radius } from "../../../theme/radius";

interface SearchBarProps {
  onPress?: () => void;
  placeholder?: string;
  variant?:
    | "default"
    | "header-solid"
    | "header-frosted"
    | "header-tinted";
}

function SearchBarBase({
  onPress,
  placeholder = "Search medicines, brands…",
  variant = "default",
}: SearchBarProps) {
  const { colors } = useTheme();

  const {
    containerStyle,
    iconColor,
    placeholderColor,
    shadowStyle,
  } = getVariantStyle(variant, colors);

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={onPress}
      accessibilityRole="search"
      accessibilityLabel="Search medicines"
      style={[styles.container, containerStyle, shadowStyle]}
    >
      <Ionicons name="search" size={18} color={iconColor} />

      <Text
        style={[styles.placeholder, { color: placeholderColor }]}
        numberOfLines={1}
      >
        {placeholder}
      </Text>
    </TouchableOpacity>
  );
}

function getVariantStyle(
  variant: SearchBarProps["variant"],
  colors: ReturnType<typeof useTheme>["colors"],
) {
  switch (variant) {
    case "header-solid":
      return {
        containerStyle: {
          backgroundColor: "#FFFFFF",
          borderColor: "transparent",
          borderWidth: 0,
        },
        iconColor: colors.text.brand,
        placeholderColor: "#6B7280",
        shadowStyle: styles.strongShadow,
      };

    case "header-frosted":
      return {
        containerStyle: {
          backgroundColor: "rgba(255,255,255,0.95)",
          borderColor: "rgba(255,255,255,0.60)",
          borderWidth: 1,
        },
        iconColor: colors.text.brand,
        placeholderColor: "#4B5563",
        shadowStyle: styles.mediumShadow,
      };

    case "header-tinted":
      return {
        containerStyle: {
          backgroundColor: colors.background.card,
          borderColor: colors.border.brand,
          borderWidth: 1,
        },
        iconColor: colors.text.brand,
        placeholderColor: colors.text.secondary,
        shadowStyle: styles.mediumShadow,
      };

    case "default":
    default:
      return {
        containerStyle: {
          backgroundColor: colors.background.card,
          borderColor: colors.border.default,
          borderWidth: 1,
        },
        iconColor: colors.text.muted,
        placeholderColor: colors.text.muted,
        shadowStyle: {},
      };
  }
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    height: 44,
    borderRadius: Radius.lg,
  },
  placeholder: {
    ...Typography.body,
    flex: 1,
  },
  strongShadow: {
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.22,
        shadowRadius: 10,
      },
      android: { elevation: 8 },
    }),
  },
  mediumShadow: {
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 6,
      },
      android: { elevation: 5 },
    }),
  },
});

export const SearchBar = React.memo(SearchBarBase);