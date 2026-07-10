// src/features/cart/components/StickyCheckoutBar.tsx

import React, { useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

import { useTheme } from '../../../theme/ThemeContext';
import { Spacing } from '../../../theme/spacing';
import { useCartStore } from '../../../store/cartStore';
import { usePrescriptionStore } from '../../../store/prescriptionStore';
import { CART_CONFIG } from '../../../constants/config';
import { useAddresses } from '../../profile/hooks/useAddresses';
import { useDeliveryLocationStore } from '../../../store/deliveryLocationStore';
import type { Address } from '../../profile/types/profile.types';

interface StickyCheckoutBarProps {
  onPlaceOrder: () => void;
  onAddressPress: () => void;
}

export function StickyCheckoutBar({
  onPlaceOrder,
  onAddressPress,
}: StickyCheckoutBarProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const items = useCartStore((s) => s.items);
  const tempFiles = usePrescriptionStore((s) => s.tempFiles);

  const { addresses } = useAddresses();
  const pickedAddressId = useDeliveryLocationStore(
    (s) => s.location.addressId ?? null,
  );

  const resolvedAddress: Address | null = (() => {
    if (pickedAddressId) {
      return addresses.find((a) => a.id === pickedAddressId) ?? null;
    }
    return addresses.find((a) => a.is_default) ?? addresses[0] ?? null;
  })();

  const itemsTotal = items.reduce(
    (sum, item) => sum + item.pricePerUnit * item.quantity,
    0,
  );
  const isFreeDelivery = itemsTotal >= CART_CONFIG.FREE_DELIVERY_ABOVE;
  const deliveryCharge = isFreeDelivery ? 0 : CART_CONFIG.DELIVERY_CHARGE;
  const grandTotal = itemsTotal + CART_CONFIG.HANDLING_CHARGE + deliveryCharge;

  const requiresPrescription = items.some((i) => i.requiresPrescription);
  const prescriptionBlocked = requiresPrescription && tempFiles.length === 0;
  const noAddress = !resolvedAddress;
  const isBlocked = prescriptionBlocked || noAddress;

  const addressLabel = resolvedAddress
    ? (resolvedAddress.custom_label ?? resolvedAddress.label)
    : null;
  const addressLine = resolvedAddress
    ? `${resolvedAddress.city}, ${resolvedAddress.state}`
    : null;

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: colors.background.card,
          borderTopColor: colors.border.default,
          paddingBottom: Math.max(insets.bottom, 12),
        },
      ]}
    >
      {/* ── Delivery location row ──────────────────────── */}
      <View style={styles.locationRow}>
        <Ionicons
          name="location-outline"
          size={15}
          color={noAddress ? colors.status.warning : colors.text.brand}
        />
        <View style={styles.locationText}>
          <Text
            style={[
              styles.locationLabel,
              {
                color: noAddress
                  ? colors.status.warning
                  : colors.text.muted,
              },
            ]}
          >
            {noAddress ? 'No address set' : 'Delivering to'}
          </Text>
          {resolvedAddress && (
            <Text
              style={[styles.locationValue, { color: colors.text.primary }]}
              numberOfLines={1}
            >
              {addressLabel} — {addressLine}
            </Text>
          )}
        </View>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onAddressPress}
          accessibilityRole="button"
          accessibilityLabel={
            noAddress ? 'Add delivery address' : 'Change delivery address'
          }
        >
          <Text style={[styles.changeText, { color: colors.text.brand }]}>
            {noAddress ? 'Add' : 'Change'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* ── Prescription blocked notice ────────────────── */}
      {prescriptionBlocked && (
        <View
          style={[
            styles.prescriptionNotice,
            { backgroundColor: colors.status.warningBg },
          ]}
        >
          <MaterialIcons
            name="assignment"
            size={13}
            color={colors.status.warning}
          />
          <Text
            style={[
              styles.prescriptionNoticeText,
              {
                color: colors.status.warning,
                fontFamily: 'Inter_500Medium',
              },
            ]}
          >
            Upload prescription above before placing order
          </Text>
        </View>
      )}

      {/* ── Proceed button ────────────────────────────── */}
      <View style={styles.actionRow}>
        <View style={styles.totalBlock}>
          <Text style={[styles.totalAmount, { color: colors.text.primary }]}>
            ₹{grandTotal.toFixed(2)}
          </Text>
          <Text style={[styles.totalLabel, { color: colors.text.muted }]}>
            {isFreeDelivery ? 'incl. free delivery' : 'incl. all charges'}
          </Text>
        </View>

        <TouchableOpacity
          onPress={isBlocked ? undefined : onPlaceOrder}
          activeOpacity={isBlocked ? 1 : 0.85}
          accessibilityRole="button"
          accessibilityLabel={
            prescriptionBlocked
              ? 'Upload prescription to continue'
              : noAddress
                ? 'Add delivery address to continue'
                : `Place order for ₹${grandTotal.toFixed(2)}`
          }
          style={[
            styles.proceedBtn,
            { backgroundColor: colors.brand.primary },
            isBlocked && styles.proceedBtnDisabled,
          ]}
        >
          <Text style={styles.proceedBtnText}>Place Order</Text>
          <Ionicons name="arrow-forward" size={16} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: 1,
  },
  locationRow: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: Spacing.sm,
  },
  locationText: { flex: 1 },
  locationLabel: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
  },
  locationValue: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    marginTop: 1,
  },
  changeText: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  prescriptionNotice: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginHorizontal: 16,
    marginBottom: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  prescriptionNoticeText: {
    fontSize: 11,
    flex: 1,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  totalBlock: {
    gap: 2,
  },
  totalAmount: {
    fontSize: 18,
    fontFamily: 'Inter_700Bold',
  },
  totalLabel: {
    fontSize: 10,
    fontFamily: 'Inter_400Regular',
  },
  proceedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
  },
  proceedBtnDisabled: {
    opacity: 0.4,
  },
  proceedBtnText: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    color: '#ffffff',
  },
});