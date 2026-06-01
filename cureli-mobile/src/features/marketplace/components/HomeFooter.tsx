// src/features/marketplace/components/HomeFooter.tsx
//
// End-of-feed footer shown after all product sections.
// "You've explored everything!" + brand wordmark + tagline.

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "../../../theme/ThemeContext";
import { Typography } from "../../../theme/typography";
import { Spacing } from "../../../theme/spacing";

function HomeFooterBase() {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.container,
        { borderTopColor: colors.border.subtle },
      ]}
    >
      {/* Checkmark badge */}
      <View
        style={[
          styles.badge,
          { backgroundColor: colors.background.tint },
        ]}
      >
        <Ionicons
          name="checkmark-circle"
          size={28}
          color={colors.text.brand}
        />
      </View>

      <Text style={[styles.heading, { color: colors.text.primary }]}>
        You've explored everything!
      </Text>

      {/* Wordmark */}
      <Text style={[styles.wordmark, { color: colors.text.brand }]}>
        cureli
      </Text>

      <Text style={[styles.tagline, { color: colors.text.muted }]}>
        Your trusted neighbourhood pharmacy,{"\n"}now on your phone.
      </Text>

      {/* Subtle divider */}
      <View
        style={[styles.divider, { backgroundColor: colors.border.subtle }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    paddingTop: Spacing["2xl"],
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing["2xl"],
    marginTop: Spacing.lg,
    borderTopWidth: 1,
    gap: Spacing.sm,
  },
  badge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xs,
  },
  heading: {
    ...Typography.h4,
    textAlign: "center",
  },
  wordmark: {
    ...Typography.h1,
    letterSpacing: -0.5,
    textTransform: "lowercase",
    marginTop: Spacing.xs,
  },
  tagline: {
    ...Typography.body,
    textAlign: "center",
    lineHeight: 22,
  },
  divider: {
    width: 40,
    height: 2,
    borderRadius: 1,
    marginTop: Spacing.md,
  },
  madeWith: {
    ...Typography.caption,
    marginTop: Spacing.sm,
  },
});

export const HomeFooter = React.memo(HomeFooterBase);