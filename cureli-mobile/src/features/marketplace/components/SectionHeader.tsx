// src/features/marketplace/components/SectionHeader.tsx
//
// Lightweight titled header for feed sections (e.g. "Popular near you").
// Optional right-aligned subtitle/hint. Presentational only.

import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useTheme } from "../../../theme/ThemeContext";
import { Typography } from "../../../theme/typography";
import { Spacing } from "../../../theme/spacing";

interface SectionHeaderProps {
  title: string;
  hint?: string;
}

function SectionHeaderBase({ title, hint }: SectionHeaderProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text.primary }]}>
        {title}
      </Text>
      {hint ? (
        <Text style={[styles.hint, { color: colors.text.muted }]}>{hint}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.base,
    marginTop: Spacing["2xl"],
    marginBottom: Spacing.md,
  },
  title: {
    ...Typography.h3,
  },
  hint: {
    ...Typography.small,
  },
});

export const SectionHeader = React.memo(SectionHeaderBase);