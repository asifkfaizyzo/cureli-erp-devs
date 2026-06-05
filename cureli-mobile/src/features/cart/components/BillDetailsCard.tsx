// src/features/cart/components/BillDetailsCard.tsx
// CHANGED: Uses CART_CONFIG instead of hardcoded constants.
// Adds conditional free delivery logic with threshold display.

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';
import { Spacing } from '../../../theme/spacing';
import { useCartStore } from '../../../store/cartStore';
import { CART_CONFIG } from '../../../constants/config';

function BillRow({
  label,
  value,
  isTotal = false,
  isFree = false,
  strikeValue,
}: {
  label: string;
  value: string;
  isTotal?: boolean;
  isFree?: boolean;
  strikeValue?: string;
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
      <View style={styles.valueRow}>
        {strikeValue && (
          <Text
            style={[styles.strikeValue, { color: colors.text.faint }]}
          >
            {strikeValue}
          </Text>
        )}
        <Text
          style={[
            isTotal ? styles.totalValue : styles.value,
            {
              color: isFree
                ? colors.status.success
                : colors.text.primary,
            },
          ]}
        >
          {value}
        </Text>
      </View>
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

  const isFreeDelivery = itemsTotal >= CART_CONFIG.FREE_DELIVERY_ABOVE;
  const deliveryCharge = isFreeDelivery ? 0 : CART_CONFIG.DELIVERY_CHARGE;
  const grandTotal = itemsTotal + CART_CONFIG.HANDLING_CHARGE + deliveryCharge;

  return (
    <View style={[styles.card, { backgroundColor: colors.background.card }]}>
      <Text style={[styles.title, { color: colors.text.primary }]}>
        Bill details
      </Text>

      <BillRow
        label="Items total"
        value={`₹${itemsTotal.toFixed(2)}`}
      />

      <BillRow
        label="Handling charge"
        value={`₹${CART_CONFIG.HANDLING_CHARGE.toFixed(2)}`}
      />

      <BillRow
        label="Delivery charge"
        value={isFreeDelivery ? 'FREE' : `₹${CART_CONFIG.DELIVERY_CHARGE.toFixed(2)}`}
        isFree={isFreeDelivery}
        strikeValue={
          isFreeDelivery
            ? `₹${CART_CONFIG.DELIVERY_CHARGE.toFixed(2)}`
            : undefined
        }
      />

      {/* Free delivery threshold nudge */}
      {!isFreeDelivery && (
        <Text
          style={[
            styles.nudge,
            { color: colors.status.success, fontFamily: 'Inter_400Regular' },
          ]}
        >
          Add ₹{(CART_CONFIG.FREE_DELIVERY_ABOVE - itemsTotal).toFixed(2)} more
          for free delivery
        </Text>
      )}

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
    shadowColor: '#090025',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  title: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
    marginBottom: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  value: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  strikeValue: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    textDecorationLine: 'line-through',
  },
  totalLabel: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
  },
  totalValue: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
  },
  nudge: {
    fontSize: 12,
    marginBottom: Spacing.sm,
    marginTop: -4,
  },
  divider: {
    height: 1,
    marginVertical: Spacing.sm,
  },
});