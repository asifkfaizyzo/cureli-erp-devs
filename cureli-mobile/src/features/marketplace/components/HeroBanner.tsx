// src/features/marketplace/components/HeroBanner.tsx
//
// Single premium marketplace hero banner.
//
// GRADIENT NOTE: to avoid adding `expo-linear-gradient` without confirmation,
// this uses a layered solid-tint composition — a brand-colored card with two
// soft translucent circles for depth. It reads as premium and atmospheric
// without a new dependency. If expo-linear-gradient is available, the base
// View can be swapped for <LinearGradient> with the same children.

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../theme/ThemeContext";
import { Typography } from "../../../theme/typography";
import { Spacing } from "../../../theme/spacing";
import { Radius } from "../../../theme/radius";

function HeroBannerBase() {
  const { colors, isDark } = useTheme();

  // Base brand surface; darker in light mode for contrast against page.
  const base = isDark ? colors.background.accent : colors.brand.primary;
  const accentCircle = isDark
    ? "rgba(139,124,246,0.18)"
    : "rgba(255,255,255,0.10)";
  const accentCircle2 = isDark
    ? "rgba(167,139,250,0.12)"
    : "rgba(255,255,255,0.06)";

  return (
    <View style={styles.outer}>
      <View style={[styles.banner, { backgroundColor: base }]}>
        {/* Decorative depth layers */}
        <View
          style={[styles.circleLarge, { backgroundColor: accentCircle }]}
          pointerEvents="none"
        />
        <View
          style={[styles.circleSmall, { backgroundColor: accentCircle2 }]}
          pointerEvents="none"
        />

        <View style={styles.content}>
          <View style={styles.textBlock}>
            <Text style={styles.title}>
              Order medicines from{"\n"}nearby pharmacies
            </Text>
            <Text style={styles.subtitle}>
              Fast medicine discovery with trusted local pharmacies
            </Text>
          </View>

          <View style={styles.iconBadge}>
            <Ionicons name="medkit" size={28} color="#ffffff" />
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    paddingHorizontal: Spacing.base,
    marginTop: Spacing.lg,
  },
  banner: {
    borderRadius: Radius.xl,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    overflow: "hidden",
    minHeight: 132,
    justifyContent: "center",
  },
  circleLarge: {
    position: "absolute",
    width: 180,
    height: 180,
    borderRadius: 90,
    right: -50,
    top: -60,
  },
  circleSmall: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
    right: 40,
    bottom: -50,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing.base,
  },
  textBlock: {
    flex: 1,
  },
  title: {
    ...Typography.h3,
    color: "#ffffff",
    marginBottom: 6,
  },
  subtitle: {
    ...Typography.small,
    color: "rgba(255,255,255,0.82)",
    lineHeight: 18,
  },
  iconBadge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.16)",
    alignItems: "center",
    justifyContent: "center",
  },
});

export const HeroBanner = React.memo(HeroBannerBase);