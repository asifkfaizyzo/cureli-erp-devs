// src/features/payment/components/PaymentMethodRow.tsx
//
// Single payment method row inside a section card.
// If action="ADD" → shows ADD button, navigates to addRoute.
// Otherwise → tapping selects this method and goes back.

import React, { useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

import { useTheme } from "../../../theme/ThemeContext";
import { Spacing } from "../../../theme/spacing";
import { usePaymentStore } from "../../../store/paymentStore";
import type { PaymentMethodItem } from "../constants/payment.constants";

interface PaymentMethodRowProps {
  item: PaymentMethodItem;
  isLast: boolean;
  isSelected: boolean;
}

export function PaymentMethodRow({
  item,
  isLast,
  isSelected,
}: PaymentMethodRowProps) {
  const { colors } = useTheme();
  const setSelectedMethod = usePaymentStore((s) => s.setSelectedMethod);

  const handleSelect = useCallback(() => {
    setSelectedMethod({
      id: item.id,
      label: item.label,
      type: item.type,
      icon: item.icon,
    });
    router.back();
  }, [item, setSelectedMethod]);

  const handleAdd = useCallback(() => {
    if (item.addRoute) {
      router.push(item.addRoute as any);
    }
  }, [item.addRoute]);

  return (
    <TouchableOpacity
      onPress={item.action ? handleAdd : handleSelect}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={item.label}
      style={[
        styles.row,
        !isLast && {
          borderBottomWidth: 1,
          borderBottomColor: colors.border.subtle,
        },
      ]}
    >
      {/* Icon */}
      <View
        style={[
          styles.iconWrap,
          { backgroundColor: colors.background.tint },
        ]}
      >
        <Ionicons
          name={item.icon as any}
          size={20}
          color={colors.text.brand}
        />
      </View>

      {/* Label */}
      <Text
        style={[styles.label, { color: colors.text.primary }]}
        numberOfLines={1}
      >
        {item.label}
      </Text>

      {/* Right side */}
      <View style={styles.rightSide}>
        {isSelected && !item.action && (
          <Ionicons
            name="checkmark-circle"
            size={20}
            color={colors.status.success}
          />
        )}

        {item.action && (
          <TouchableOpacity
            onPress={handleAdd}
            activeOpacity={0.7}
            accessibilityRole="button"
            accessibilityLabel={`${item.action} ${item.label}`}
          >
            <Text style={[styles.addText, { color: "#05015A" }]}>
              {item.action}
            </Text>
          </TouchableOpacity>
        )}

        {!item.action && !isSelected && (
          <View
            style={[
              styles.radio,
              { borderColor: colors.border.default },
            ]}
          />
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
    height: 52,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  label: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  rightSide: {
    alignItems: "center",
    justifyContent: "center",
  },
  addText: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
  },
  radio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 2,
  },
});