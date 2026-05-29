// src/features/marketplace/components/SearchBar.tsx
//
// Search entry point. Two visual variants:
//   "default" — original light card (for non-header use if needed later).
//   "header"  — frosted semi-transparent style for use inside GradientHeader.
//
// Tapping navigates to /search (handler via prop). Camera icon = prescription
// scan affordance (non-functional for showcase). Presentational + memoised.

// src/features/marketplace/components/SearchBar.tsx

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { useTheme } from "../../../theme/ThemeContext";
import { Typography } from "../../../theme/typography";
import { Spacing } from "../../../theme/spacing";
import { Radius } from "../../../theme/radius";

// ── Props ─────────────────────────────────────────────────────

interface SearchBarProps {
  onPress?: () => void;
  placeholder?: string;
  /** "default" = themed card. "header" = frosted for gradient header. */
  variant?: "default" | "header";
}

// ── Component ─────────────────────────────────────────────────

function SearchBarBase({
  onPress,
  placeholder = "Search medicines, brands…",
  variant = "default",
}: SearchBarProps) {
  const { colors } = useTheme();

  const isHeader = variant === "header";

  const containerStyle = isHeader
    ? {
        backgroundColor: "rgba(255,255,255,0.18)",
        borderColor: "rgba(255,255,255,0.28)",
      }
    : {
        backgroundColor: colors.background.card,
        borderColor: colors.border.default,
      };

  const iconColor = isHeader ? "rgba(255,255,255,0.70)" : colors.text.muted;
  const cameraColor = isHeader ? "rgba(255,255,255,0.90)" : colors.text.brand;
  const placeholderColor = isHeader
    ? "rgba(255,255,255,0.65)"
    : colors.text.muted;
  const dividerColor = isHeader
    ? "rgba(255,255,255,0.25)"
    : colors.border.default;

  const handleCameraPress = () => {
    router.push("/prescription/upload");
  };

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      accessibilityRole="search"
      accessibilityLabel="Search medicines"
      style={[styles.container, containerStyle]}
    >
      <Ionicons name="search" size={18} color={iconColor} />

      <Text
        style={[styles.placeholder, { color: placeholderColor }]}
        numberOfLines={1}
      >
        {placeholder}
      </Text>

      <View style={[styles.divider, { backgroundColor: dividerColor }]} />

      {/* Camera — navigates to prescription upload */}
      <TouchableOpacity
        onPress={handleCameraPress}
        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        accessibilityRole="button"
        accessibilityLabel="Upload prescription"
      >
        <Ionicons name="camera-outline" size={18} color={cameraColor} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    height: 44,
    borderRadius: Radius.lg,
    borderWidth: 1,
  },
  placeholder: {
    ...Typography.body,
    flex: 1,
  },
  divider: {
    width: 1,
    height: 20,
  },
});

export const SearchBar = React.memo(SearchBarBase);