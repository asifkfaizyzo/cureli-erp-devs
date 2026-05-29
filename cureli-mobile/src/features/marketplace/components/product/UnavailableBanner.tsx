// src/features/marketplace/components/product/UnavailableBanner.tsx
//
// Shown in place of the marketplace summary card when availableNearYou
// is false (production mode only). Informative, not an error state.

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Typography } from "../../../../theme/typography";
import { Spacing } from "../../../../theme/spacing";
import { Radius } from "../../../../theme/radius";
import type { useTheme } from "../../../../theme/ThemeContext";

interface UnavailableBannerProps {
  colors: ReturnType<typeof useTheme>["colors"];
}

export function UnavailableBanner({ colors }: UnavailableBannerProps) {
  return (
    <View
      style={[
        styles.banner,
        {
          backgroundColor: colors.background.card,
          borderColor: colors.border.default,
        },
      ]}
    >
      <View
        style={[
          styles.iconWrap,
          { backgroundColor: colors.background.tint },
        ]}
      >
        <Ionicons
          name="storefront-outline"
          size={22}
          color={colors.text.muted}
        />
      </View>
      <View style={styles.textWrap}>
        <Text style={[styles.title, { color: colors.text.primary }]}>
          Not available near you
        </Text>
        <Text style={[styles.subtitle, { color: colors.text.muted }]}>
          No pharmacy in your area currently stocks this medicine.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    marginHorizontal: Spacing.base,
    borderRadius: Radius.lg,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    gap: Spacing.md,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  textWrap: {
    flex: 1,
    gap: 4,
  },
  title: {
    ...Typography.bodyMedium,
  },
  subtitle: {
    ...Typography.small,
    lineHeight: 18,
  },
});