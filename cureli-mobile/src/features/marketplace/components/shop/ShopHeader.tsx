// src/features/marketplace/components/shop/ShopHeader.tsx
//
// Top navigation bar for the shop profile screen.
// Back button + shop name. Shared between loading, error, and detail states.

import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { Typography } from "../../../../theme/typography";
import { Spacing } from "../../../../theme/spacing";
import { Radius } from "../../../../theme/radius";
import type { useTheme } from "../../../../theme/ThemeContext";

interface ShopHeaderProps {
  title: string;
  colors: ReturnType<typeof useTheme>["colors"];
}

export function ShopHeader({ title, colors }: ShopHeaderProps) {
  return (
    <View
      style={[
        styles.header,
        {
          backgroundColor: colors.background.page,
          borderBottomColor: colors.border.subtle,
        },
      ]}
    >
      <TouchableOpacity
        onPress={() => router.back()}
        style={[
          styles.backBtn,
          {
            backgroundColor: colors.background.tint,
            borderColor: colors.border.brand,
          },
        ]}
        accessibilityLabel="Go back"
      >
        <Ionicons name="arrow-back" size={20} color={colors.text.brand} />
      </TouchableOpacity>

      <Text
        style={[styles.title, { color: colors.text.primary }]}
        numberOfLines={1}
      >
        {title}
      </Text>

      <View style={styles.spacer} />
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: Spacing.base,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    gap: Spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    flexShrink: 0,
  },
  title: {
    ...Typography.bodySemiBold,
    flex: 1,
  },
  spacer: {
    width: 40,
    flexShrink: 0,
  },
});