// src/features/marketplace/components/product/InfoRow.tsx
//
// A single label/value row in the Medicine Info section.
// Used by the product detail screen.

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Typography } from "../../../../theme/typography";
import { Spacing } from "../../../../theme/spacing";
import type { useTheme } from "../../../../theme/ThemeContext";

interface InfoRowProps {
  label: string;
  value: string;
  colors: ReturnType<typeof useTheme>["colors"];
}

export function InfoRow({ label, value, colors }: InfoRowProps) {
  return (
    <View style={styles.row}>
      <Text style={[styles.label, { color: colors.text.faint }]}>
        {label}
      </Text>
      <Text
        style={[styles.value, { color: colors.text.secondary }]}
        numberOfLines={2}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    paddingVertical: Spacing.sm,
    gap: Spacing.md,
  },
  label: {
    ...Typography.smallMedium,
    width: 110,
    flexShrink: 0,
  },
  value: {
    ...Typography.small,
    flex: 1,
  },
});