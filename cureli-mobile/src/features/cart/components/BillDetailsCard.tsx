// src/features/cart/components/BillDetailsCard.tsx
// CHANGED: reads from checkoutStore instead of calculating locally

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';
import { Spacing } from '../../../theme/spacing';
import { useCheckoutStore } from '../../../store/checkoutStore';

const TIP_PRESETS = [0, 10, 20, 50];

function BillRow({
  label,
  value,
  isTotal = false,
  isFree = false,
  dim = false,
}: {
  label:    string;
  value:    string;
  isTotal?: boolean;
  isFree?:  boolean;
  dim?:     boolean;
}) {
  const { colors } = useTheme();
  return (
    <View style={styles.row}>
      <Text style={[
        isTotal ? styles.totalLabel : styles.label,
        { color: dim ? colors.text.faint : isTotal ? colors.text.primary : colors.text.secondary },
      ]}>
        {label}
      </Text>
      <Text style={[
        isTotal ? styles.totalValue : styles.value,
        { color: isFree ? colors.status.success : isTotal ? colors.text.primary : colors.text.primary },
      ]}>
        {value}
      </Text>
    </View>
  );
}

export function BillDetailsCard() {
  const { colors } = useTheme();
  const { breakdown, isQuoteLoading, tip, setTip } = useCheckoutStore();

  if (!breakdown && isQuoteLoading) {
    return (
      <View style={[styles.card, { backgroundColor: colors.background.card }]}>
        <Text style={[styles.title, { color: colors.text.primary }]}>Bill details</Text>
        <Text style={[styles.loading, { color: colors.text.muted }]}>Calculating…</Text>
      </View>
    );
  }

  if (!breakdown) return null;

  return (
    <View style={[styles.card, { backgroundColor: colors.background.card }]}>
      <Text style={[styles.title, { color: colors.text.primary }]}>Bill details</Text>

      <BillRow label="Items total"    value={`₹${breakdown.subtotal.toFixed(2)}`} />
      <BillRow label="Service charge" value={`₹${breakdown.service_charge.toFixed(2)}`} />
      <BillRow label="Delivery fee"   value={`₹${breakdown.delivery_fee.toFixed(2)}`} />

      {breakdown.km_surcharge > 0 && (
        <BillRow label="Distance surcharge" value={`₹${breakdown.km_surcharge.toFixed(2)}`} />
      )}

      {/* ── Tip selector ────────────────────────────────── */}
      <View style={styles.tipRow}>
        <Text style={[styles.label, { color: colors.text.secondary }]}>Tip for rider</Text>
        <View style={styles.tipOptions}>
          {TIP_PRESETS.map((preset) => (
            <TouchableOpacity
              key={preset}
              onPress={() => setTip(preset)}
              style={[
                styles.tipBtn,
                {
                  backgroundColor: tip === preset ? colors.brand.primary : colors.background.tint,
                  borderColor:     tip === preset ? colors.brand.primary : colors.border.default,
                },
              ]}
            >
              <Text style={[
                styles.tipBtnText,
                { color: tip === preset ? '#fff' : colors.text.secondary },
              ]}>
                {preset === 0 ? 'None' : `₹${preset}`}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {tip > 0 && (
        <BillRow label="Tip" value={`₹${tip.toFixed(2)}`} />
      )}

      <View style={[styles.divider, { backgroundColor: colors.border.subtle }]} />

      <BillRow
        label="Grand Total"
        value={`₹${breakdown.grand_total.toFixed(2)}`}
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
  loading: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    paddingVertical: Spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  label: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  value: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },
  totalLabel: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
  },
  totalValue: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
  },
  divider: {
    height: 1,
    marginVertical: Spacing.sm,
  },
  tipRow: {
    marginBottom: Spacing.sm,
  },
  tipOptions: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
    flexWrap: 'wrap',
  },
  tipBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  tipBtnText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
});