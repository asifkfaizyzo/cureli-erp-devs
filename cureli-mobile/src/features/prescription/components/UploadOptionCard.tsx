// src/features/prescription/components/UploadOptionCard.tsx
//
// Single upload option tile — used in a 3-across row.
// Gallery / Camera / Document.
//
// Structure:
//   ○ (icon circle)
//   Label

import React from "react";
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useTheme } from "../../../theme/ThemeContext";
import { Radius } from "../../../theme/radius";

interface UploadOptionCardProps {
  icon: React.ComponentProps<typeof Ionicons>["name"];
  title: string;
  onPress: () => void;
  disabled?: boolean;
}

function UploadOptionCardBase({
  icon,
  title,
  onPress,
  disabled = false,
}: UploadOptionCardProps) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={title}
      style={[
        styles.card,
        {
          backgroundColor: colors.background.card,
          opacity: disabled ? 0.5 : 1,
        },
      ]}
    >
      {/* Icon circle */}
      <View style={styles.iconCircle}>
        <Ionicons name={icon} size={24} color="#222222" />
      </View>

      {/* Label */}
      <Text
        style={[styles.label, { color: colors.text.primary }]}
        numberOfLines={2}
      >
        {title}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flex: 1,
    height: 130,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 6,
    shadowColor: "#090025",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#EEF5FC",
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    marginTop: 14,
    textAlign: "center",
    lineHeight: 17,
  },
});

export const UploadOptionCard = React.memo(UploadOptionCardBase);