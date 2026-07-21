// src/features/cart/components/DeliveryAddressCard.tsx

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

import { useTheme } from '../../../theme/ThemeContext';
import { Spacing } from '../../../theme/spacing';
import { useAddresses } from '../../profile/hooks/useAddresses';
import { useDeliveryLocationStore } from '../../../store/deliveryLocationStore';
import type { Address } from '../../profile/types/profile.types';

interface DeliveryAddressCardProps {
  onChangePress: () => void;
}

export function DeliveryAddressCard({ onChangePress }: DeliveryAddressCardProps) {
  const { colors, isDark } = useTheme();
  const brandColor = isDark ? colors.brand.accent : colors.brand.primary;

  const { addresses, isLoading } = useAddresses();
  const pickedAddressId = useDeliveryLocationStore(
    (s) => s.location.addressId ?? null,
  );
  console.log('[DAC]', {
  pickedAddressId,
  addressIds: addresses.map(a => a.id),
  found: addresses.find(a => a.id === pickedAddressId)?.id ?? 'NOT FOUND',
  isLoading,
});

  const resolvedAddress: Address | null = (() => {
    if (pickedAddressId) {
      return addresses.find((a) => a.id === pickedAddressId) ?? null;
    }
    return addresses.find((a) => a.is_default) ?? addresses[0] ?? null;
  })();

  // ── While addresses are still fetching, show a neutral loading
  // state instead of the "No delivery address set" warning.
  // This prevents a flash of the empty state when the store already
  // has a picked address ID but the addresses array hasn't loaded yet.

  if (isLoading) {
    return (
      <View style={[styles.card, { backgroundColor: colors.background.card }]}>
        <View style={styles.cardHeader}>
          <Ionicons name="location-outline" size={18} color={brandColor} />
          <Text style={[styles.cardTitle, { color: colors.text.primary }]}>
            Delivery Address
          </Text>
        </View>
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color={brandColor} />
          <Text style={[styles.loadingText, { color: colors.text.muted }]}>
            Loading address…
          </Text>
        </View>
      </View>
    );
  }

  const hasAddress = resolvedAddress !== null;

  const typeLabel = hasAddress
    ? (resolvedAddress.custom_label ?? resolvedAddress.label)
    : null;

  const labelIcon =
    resolvedAddress?.label === 'Home'
      ? 'home'
      : resolvedAddress?.label === 'Work'
        ? 'business'
        : 'location-on';

  const detailLine = hasAddress
    ? [
        resolvedAddress.address_line_1,
        resolvedAddress.address_line_2,
        resolvedAddress.city,
        resolvedAddress.state,
        resolvedAddress.pincode,
      ]
        .filter(Boolean)
        .join(', ')
    : null;

  return (
    <View style={[styles.card, { backgroundColor: colors.background.card }]}>
      {/* ── Card header ───────────────────────────────────── */}
      <View style={styles.cardHeader}>
        <Ionicons name="location-outline" size={18} color={brandColor} />
        <Text style={[styles.cardTitle, { color: colors.text.primary }]}>
          Delivery Address
        </Text>
      </View>

      {/* ── Address body ──────────────────────────────────── */}
      {hasAddress ? (
        <View style={styles.addressRow}>
          <View
            style={[
              styles.iconWrap,
              { backgroundColor: colors.background.tint },
            ]}
          >
            <MaterialIcons
              name={labelIcon as any}
              size={18}
              color={brandColor}
            />
          </View>

          <View style={styles.addressText}>
            <Text
              style={[styles.typeLabel, { color: colors.text.primary }]}
              numberOfLines={1}
            >
              {typeLabel}
            </Text>
            <Text
              style={[styles.detailLine, { color: colors.text.muted }]}
              numberOfLines={2}
            >
              {detailLine}
            </Text>
            {resolvedAddress.recipient_name ? (
              <Text
                style={[styles.recipient, { color: colors.text.faint }]}
                numberOfLines={1}
              >
                For: {resolvedAddress.recipient_name}
              </Text>
            ) : null}
          </View>

          <TouchableOpacity
            onPress={onChangePress}
            activeOpacity={0.7}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            accessibilityRole="button"
            accessibilityLabel="Change delivery address"
          >
            <Text style={[styles.actionText, { color: brandColor }]}>
              Change
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <TouchableOpacity
          onPress={onChangePress}
          activeOpacity={0.75}
          style={[
            styles.emptyState,
            {
              borderColor: colors.status.warning,
              backgroundColor: colors.status.warningBg,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel="Add delivery address"
        >
          <MaterialIcons
            name="add-location-alt"
            size={20}
            color={colors.status.warning}
          />
          <View style={styles.emptyText}>
            <Text
              style={[styles.emptyTitle, { color: colors.status.warning }]}
            >
              No delivery address set
            </Text>
            <Text
              style={[styles.emptySub, { color: colors.status.warning }]}
            >
              Tap to add an address before ordering
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={colors.status.warning}
          />
        </TouchableOpacity>
      )}
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  cardTitle: {
    fontSize: 15,
    fontFamily: 'Inter_600SemiBold',
  },

  // ── Loading state ────────────────────────────────────────
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 4,
  },
  loadingText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },

  // ── Has address ──────────────────────────────────────────
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  addressText: {
    flex: 1,
    gap: 2,
  },
  typeLabel: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  detailLine: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    lineHeight: 17,
  },
  recipient: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
    marginTop: 1,
  },
  actionText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    flexShrink: 0,
  },

  // ── No address ───────────────────────────────────────────
  emptyState: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 14,
  },
  emptyText: {
    flex: 1,
    gap: 2,
  },
  emptyTitle: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  emptySub: {
    fontSize: 11,
    fontFamily: 'Inter_400Regular',
  },
});