// src/features/payment/components/PaymentSectionCard.tsx
//
// White card containing a section title + list of PaymentMethodRows.

import React from "react";
import { View, Text, StyleSheet } from "react-native";

import { useTheme } from "../../../theme/ThemeContext";
import { Spacing } from "../../../theme/spacing";
import { PaymentMethodRow } from "./PaymentMethodRow";
import { usePaymentStore } from "../../../store/paymentStore";
import type { PaymentSection as PaymentSectionType } from "../constants/payment.constants";

interface PaymentSectionCardProps {
  section: PaymentSectionType;
}

export function PaymentSectionCard({ section }: PaymentSectionCardProps) {
  const { colors } = useTheme();
  const selectedId = usePaymentStore((s) => s.selectedMethod.id);

  return (
    <View
      style={[
        styles.card,
        { backgroundColor: colors.background.card },
      ]}
    >
      <Text style={[styles.title, { color: colors.text.primary }]}>
        {section.title}
      </Text>

      {section.items.map((item, index) => (
        <PaymentMethodRow
          key={item.id}
          item={item}
          isLast={index === section.items.length - 1}
          isSelected={selectedId === item.id}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: Spacing.md,
    shadowColor: "#090025",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
    marginBottom: Spacing.sm,
  },
});