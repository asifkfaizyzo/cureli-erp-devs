// src/features/orders/components/PriceRow.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';

interface PriceRowProps {
  label: string;
  value: string;
  isTotal?: boolean;
  isDiscount?: boolean;
}

export function PriceRow({ label, value, isTotal, isDiscount }: PriceRowProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.row, isTotal && styles.totalRow]}>
      <Text
        style={[
          styles.label,
          {
            color: isTotal ? colors.text.primary : colors.text.secondary,
            fontFamily: isTotal ? 'Inter_600SemiBold' : 'Inter_400Regular',
          },
        ]}
      >
        {label}
      </Text>
      <Text
        style={[
          styles.value,
          {
            color: isDiscount
              ? colors.status.success
              : isTotal
                ? colors.text.primary
                : colors.text.secondary,
            fontFamily: isTotal ? 'Inter_700Bold' : 'Inter_500Medium',
          },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  totalRow: {
    paddingTop: 12,
    marginTop: 4,
    borderTopWidth: 1,
  },
  label: {
    fontSize: 14,
  },
  value: {
    fontSize: 14,
  },
});