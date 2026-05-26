// src/features/marketplace/components/PrescriptionStrip.tsx
//
// Sticky promotional strip below the hero carousel.
// "Order with Prescription — Upload once, we handle the rest."
// Tapping "Order now" navigates to /prescription/upload.
//
// Height is fixed at ~60px (compact — doesn't compete with the hero).
// Uses brand gradient tint background for visibility without being loud.

import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { useTheme } from "../../../theme/ThemeContext";
import { Typography } from "../../../theme/typography";
import { Spacing } from "../../../theme/spacing";
import { Radius } from "../../../theme/radius";

// ── Component ─────────────────────────────────────────────────

function PrescriptionStripBase() {
  const { colors } = useTheme();

  const handlePress = () => {
    router.push("/prescription/upload" as any);
  };

  return (
    <TouchableOpacity
      activeOpacity={0.85}
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel="Order with prescription"
      style={[
        styles.strip,
        {
          backgroundColor: colors.background.tint,
          borderColor: colors.border.brand,
        },
      ]}
    >
      {/* Left: icon */}
      <View
        style={[
          styles.iconWrap,
          { backgroundColor: colors.brand.primary },
        ]}
      >
        <Ionicons name="document-text-outline" size={18} color="#ffffff" />
      </View>

      {/* Centre: text */}
      <View style={styles.textBlock}>
        <Text style={[styles.title, { color: colors.text.primary }]}>
          Order with Prescription
        </Text>
        <Text style={[styles.subtitle, { color: colors.text.muted }]}>
          Upload once, we handle the rest
        </Text>
      </View>

      {/* Right: CTA */}
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Order now"
        style={[
          styles.ctaButton,
          { backgroundColor: colors.brand.primary },
        ]}
      >
        <Text style={styles.ctaText}>Order now</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  strip: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: Spacing.base,
    marginTop: Spacing.lg,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    gap: Spacing.md,
    minHeight: 60,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
  },
  textBlock: {
    flex: 1,
  },
  title: {
    ...Typography.bodyMedium,
    lineHeight: 18,
  },
  subtitle: {
    ...Typography.caption,
    marginTop: 1,
  },
  ctaButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Radius.md,
  },
  ctaText: {
    ...Typography.buttonSmall,
    color: "#ffffff",
  },
});

export const PrescriptionStrip = React.memo(PrescriptionStripBase);