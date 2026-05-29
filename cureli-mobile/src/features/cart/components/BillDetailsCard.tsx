// Bill details: items total, handling, demand charge, grand total.

import React from "react";
import { View, Text, StyleSheet } from "react-native";

import { useTheme } from "../../../theme/ThemeContext";
import { Spacing } from "../../../theme/spacing";
import { useCartStore } from "../../../store/cartStore";

const HANDLING_CHARGE = 10;
const HIGH_DEMAND_CHARGE = 5;

function BillRow({
  label,
  value,
  isTotal = false,
}: {
  label: string;
  value: string;
  isTotal?: boolean;
}) {
  const { colors } = useTheme();

  return (
    <View style={styles.row}>
      <Text
        style={[
          isTotal ? styles.totalLabel : styles.label,
          { color: isTotal ? colors.text.primary : colors.text.secondary },
        ]}
      >
        {label}
      </Text>
      <Text
        style={[
          isTotal ? styles.totalValue : styles.value,
          { color: colors.text.primary },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

export function BillDetailsCard() {
  const { colors } = useTheme();
  const items = useCartStore((s) => s.items);

  const itemsTotal = items.reduce(
    (sum, item) => sum + item.pricePerUnit * item.quantity,
    0,
  );
  const grandTotal = itemsTotal + HANDLING_CHARGE + HIGH_DEMAND_CHARGE;

  return (
    <View style={[styles.card, { backgroundColor: colors.background.card }]}>
      <Text style={[styles.title, { color: colors.text.primary }]}>
        Bill details
      </Text>

      <BillRow label="Items total" value={`₹${itemsTotal.toFixed(2)}`} />
      <BillRow label="Handling charge" value={`₹${HANDLING_CHARGE}`} />
      <BillRow label="High demand charge" value={`₹${HIGH_DEMAND_CHARGE}`} />

      <View
        style={[styles.divider, { backgroundColor: colors.border.subtle }]}
      />

      <BillRow
        label="Grand Total"
        value={`₹${grandTotal.toFixed(2)}`}
        isTotal
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
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.sm,
  },
  label: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  value: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  totalLabel: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  totalValue: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  divider: {
    height: 1,
    marginVertical: Spacing.sm,
  },
});