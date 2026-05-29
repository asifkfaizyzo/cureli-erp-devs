import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTheme } from "../../../theme/ThemeContext";
import { Spacing } from "../../../theme/spacing";

const INSTRUCTIONS = [
  { id: "bell", icon: "notifications-off-outline" as const, label: "Avoid ringing bell" },
  { id: "call", icon: "call-outline" as const, label: "Avoid calling" },
  { id: "door", icon: "home-outline" as const, label: "Leave at door" },
  { id: "mask", icon: "shield-outline" as const, label: "Wear a mask" },
  { id: "safe", icon: "hand-left-outline" as const, label: "Contactless" },
];

export function DeliveryInstructionCard() {
  const { colors } = useTheme();
  const [selected, setSelected] = useState<string[]>([]);

  const toggleSelect = useCallback((id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id],
    );
  }, []);

  return (
    <View style={[styles.card, { backgroundColor: colors.background.card }]}>
      <Text style={[styles.title, { color: colors.text.primary }]}>
        Delivery instructions
      </Text>

      <FlatList
        horizontal
        data={INSTRUCTIONS}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const isSelected = selected.includes(item.id);
          return (
            <TouchableOpacity
              onPress={() => toggleSelect(item.id)}
              activeOpacity={0.8}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isSelected }}
              style={[
                styles.chip,
                {
                  backgroundColor: colors.background.tint,
                  borderColor: isSelected ? "#05015A" : "transparent",
                  borderWidth: isSelected ? 2 : 0,
                },
              ]}
            >
              <Ionicons
                name={item.icon}
                size={22}
                color={
                  isSelected ? "#05015A" : colors.text.secondary
                }
              />
              <Text
                style={[
                  styles.chipLabel,
                  {
                    color: isSelected ? "#05015A" : colors.text.secondary,
                    fontFamily: isSelected
                      ? "Inter_600SemiBold"
                      : "Inter_400Regular",
                  },
                ]}
                numberOfLines={2}
              >
                {item.label}
              </Text>

              <View
                style={[
                  styles.checkbox,
                  {
                    borderColor: isSelected ? "#05015A" : colors.border.default,
                    backgroundColor: isSelected ? "#05015A" : "transparent",
                  },
                ]}
              >
                {isSelected && (
                  <Ionicons name="checkmark" size={10} color="#ffffff" />
                )}
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    shadowColor: "#090025",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    marginBottom: Spacing.md,
  },
  list: {
    gap: Spacing.sm,
  },
  chip: {
    width: 80,
    height: 90,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    padding: 6,
    gap: 4,
  },
  chipLabel: {
    fontSize: 10,
    textAlign: "center",
    lineHeight: 13,
  },
  checkbox: {
    width: 14,
    height: 14,
    borderRadius: 3,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
});