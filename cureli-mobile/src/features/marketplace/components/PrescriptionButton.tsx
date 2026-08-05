// src/features/marketplace/components/PrescriptionButton.tsx
//
// Prescription upload button.
// Same circular frosted style as CartButton.
// Navigates to /prescription-request on press.
// Designed to sit next to SearchBar inside GradientHeader.

import React from "react";
import {
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

interface PrescriptionButtonProps {
  onPress?: () => void;
}

function PrescriptionButtonBase({ onPress }: PrescriptionButtonProps) {
  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      router.push("/prescription-request" as any);
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel="Upload prescription for quote"
      style={styles.button}
    >
      <Ionicons name="camera-outline" size={22} color="#ffffff" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.18)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.28)",
    alignItems: "center",
    justifyContent: "center",
    overflow: "visible",
  },
});

export const PrescriptionButton = React.memo(PrescriptionButtonBase);