// src/features/marketplace/components/product/SiblingCard.tsx
//
// A single card in the "Other options" horizontal rail on the product
// detail screen. Shows image, name, and pack size.
// Price is hidden — marketplace.startsAt is fake and not rendered here.

import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Typography } from "../../../../theme/typography";
import { Spacing } from "../../../../theme/spacing";
import { Radius } from "../../../../theme/radius";
import type { useTheme } from "../../../../theme/ThemeContext";
import type { EnrichedMedicine } from "../../../../types/medicine";

interface SiblingCardProps {
  medicine: EnrichedMedicine;
  onPress: (medicine: EnrichedMedicine) => void;
  colors: ReturnType<typeof useTheme>["colors"];
}

export function SiblingCard({ medicine, onPress, colors }: SiblingCardProps) {
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={() => onPress(medicine)}
      style={[
        styles.card,
        {
          backgroundColor: colors.background.card,
          borderColor: colors.border.default,
        },
      ]}
    >
      <View
        style={[
          styles.imageBox,
          { backgroundColor: colors.background.tint },
        ]}
      >
        {medicine.image ? (
          <Image
            source={{ uri: medicine.image }}
            style={styles.image}
            resizeMode="contain"
          />
        ) : (
          <Ionicons
            name="medical-outline"
            size={22}
            color={colors.text.brand}
          />
        )}
      </View>

      <Text
        style={[styles.name, { color: colors.text.primary }]}
        numberOfLines={2}
      >
        {medicine.name}
      </Text>

      {medicine.packSize ? (
        <Text
          style={[styles.pack, { color: colors.text.muted }]}
          numberOfLines={1}
        >
          {medicine.packSize}
        </Text>
      ) : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 120,
    borderRadius: Radius.md,
    borderWidth: 1,
    padding: Spacing.sm,
    gap: 4,
    alignItems: "center",
  },
  imageBox: {
    width: 56,
    height: 56,
    borderRadius: Radius.sm,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  name: {
    ...Typography.smallMedium,
    textAlign: "center",
    lineHeight: 16,
  },
  pack: {
    ...Typography.caption,
    textAlign: "center",
  },
});