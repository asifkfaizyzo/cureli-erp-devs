// src/features/marketplace/components/SearchBar.tsx
//
// Large, prominent search entry point. Medicine apps are search-heavy, so this
// is visually weighty. It is NOT a live input here — tapping navigates to the
// dedicated /search screen (handler via prop). A camera icon is shown as a
// placeholder affordance (prescription scan), non-functional for the showcase.

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../theme/ThemeContext";
import { Typography } from "../../../theme/typography";
import { Spacing } from "../../../theme/spacing";
import { Radius } from "../../../theme/radius";

interface SearchBarProps {
  onPress?: () => void;
  placeholder?: string;
}

function SearchBarBase({
  onPress,
  placeholder = "Search medicines, brands, compositions",
}: SearchBarProps) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      accessibilityRole="search"
      accessibilityLabel="Search medicines"
      style={[
        styles.container,
        {
          backgroundColor: colors.background.card,
          borderColor: colors.border.default,
        },
      ]}
    >
      <Ionicons name="search" size={20} color={colors.text.muted} />
      <Text
        style={[styles.placeholder, { color: colors.text.muted }]}
        numberOfLines={1}
      >
        {placeholder}
      </Text>
      <View
        style={[styles.divider, { backgroundColor: colors.border.default }]}
      />
      <Ionicons name="camera-outline" size={20} color={colors.text.brand} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    marginHorizontal: Spacing.base,
    paddingHorizontal: Spacing.base,
    height: 52,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  placeholder: {
    ...Typography.body,
    flex: 1,
  },
  divider: {
    width: 1,
    height: 22,
  },
});

export const SearchBar = React.memo(SearchBarBase);