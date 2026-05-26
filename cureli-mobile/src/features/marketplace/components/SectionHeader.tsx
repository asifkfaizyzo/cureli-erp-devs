// src/features/marketplace/components/SectionHeader.tsx
//
// Titled section header with optional clickable right-side hint.

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { useTheme } from "../../../theme/ThemeContext";
import { Typography } from "../../../theme/typography";
import { Spacing } from "../../../theme/spacing";

interface SectionHeaderProps {
  title: string;
  hint?: string;
  onPressHint?: () => void;
}

function SectionHeaderBase({
  title,
  hint,
  onPressHint,
}: SectionHeaderProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text.primary }]}>
        {title}
      </Text>

      {hint ? (
        onPressHint ? (
          <TouchableOpacity
            onPress={onPressHint}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={hint}
          >
            <Text style={[styles.hint, { color: colors.text.brand }]}>
              {hint}
            </Text>
          </TouchableOpacity>
        ) : (
          <Text style={[styles.hint, { color: colors.text.muted }]}>
            {hint}
          </Text>
        )
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
    flex: 1,
    paddingRight: Spacing.sm,
  },
  hint: {
    ...Typography.smallMedium,
  },
});

export const SectionHeader = React.memo(SectionHeaderBase);