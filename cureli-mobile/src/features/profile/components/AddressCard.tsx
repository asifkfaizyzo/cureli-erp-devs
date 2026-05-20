// src/features/profile/components/AddressCard.tsx

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../../theme/ThemeContext';
import type { Address } from '../types/profile.types';
import type { AddressLabel } from '../constants/profile.constants';

const LABEL_ICONS: Record<AddressLabel, keyof typeof MaterialIcons.glyphMap> = {
  Home: 'home',
  Work: 'business',
  Other: 'location-on',
};

interface AddressCardProps {
  address: Address;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
  onSetDefault: (id: string) => void;
  isDeleting?: boolean;
  isSettingDefault?: boolean;
}

export function AddressCard({
  address,
  onEdit,
  onDelete,
  onSetDefault,
  isDeleting = false,
  isSettingDefault = false,
}: AddressCardProps) {
  const { colors, isDark } = useTheme();

  const label = address.label as AddressLabel;
  const iconName = LABEL_ICONS[label] ?? 'location-on';
  const brandColor = isDark ? colors.brand.accent : colors.brand.primary;

  const displayLabel =
    label === 'Other' && address.custom_label ? address.custom_label : label;

  const addressLines = [
    address.address_line_1,
    address.address_line_2,
    address.landmark ? `Near ${address.landmark}` : null,
    `${address.city}, ${address.state} — ${address.pincode}`,
  ]
    .filter(Boolean)
    .join('\n');

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.background.card,
          borderColor: address.is_default
            ? brandColor
            : colors.border.default,
          borderWidth: address.is_default ? 1.5 : 1,
        },
      ]}
    >
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.labelRow}>
          <MaterialIcons name={iconName} size={18} color={brandColor} />
          <Text
            style={[
              styles.labelText,
              { color: brandColor, fontFamily: 'Inter_700Bold' },
            ]}
          >
            {displayLabel}
          </Text>
        </View>
        {address.is_default && (
          <View style={[styles.defaultBadge, { backgroundColor: brandColor }]}>
            <Text style={styles.defaultBadgeText}>DEFAULT</Text>
          </View>
        )}
      </View>

      {address.recipient_name && (
        <Text
          style={[
            styles.recipientName,
            { color: colors.text.primary, fontFamily: 'Inter_600SemiBold' },
          ]}
        >
          {address.recipient_name}
        </Text>
      )}

      <Text
        style={[
          styles.addressText,
          { color: colors.text.muted, fontFamily: 'Inter_400Regular' },
        ]}
      >
        {addressLines}
      </Text>

      {address.recipient_phone && (
        <Text
          style={[
            styles.recipientPhone,
            { color: colors.text.faint, fontFamily: 'Inter_400Regular' },
          ]}
        >
          {address.recipient_phone}
        </Text>
      )}

      {/* Actions */}
      <View
        style={[
          styles.actions,
          { borderTopColor: colors.border.subtle },
        ]}
      >
        {!address.is_default && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onSetDefault(address.id)}
            disabled={isSettingDefault}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.actionTextPrimary,
                { color: brandColor, fontFamily: 'Inter_600SemiBold' },
              ]}
            >
              {isSettingDefault ? 'Updating…' : 'Set Default'}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onEdit(address.id)}
          activeOpacity={0.7}
        >
          <MaterialIcons name="edit" size={14} color={colors.text.muted} />
          <Text
            style={[
              styles.actionTextMuted,
              { color: colors.text.muted, fontFamily: 'Inter_500Medium' },
            ]}
          >
            Edit
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onDelete(address.id)}
          disabled={isDeleting}
          activeOpacity={0.7}
        >
          <MaterialIcons
            name="delete-outline"
            size={14}
            color={colors.status.error}
          />
          <Text
            style={[
              styles.actionTextDestructive,
              { color: colors.status.error, fontFamily: 'Inter_500Medium' },
            ]}
          >
            {isDeleting ? 'Removing…' : 'Remove'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  labelText: {
    fontSize: 14,
  },
  defaultBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  defaultBadgeText: {
    fontSize: 9,
    fontFamily: 'Inter_800ExtraBold',
    color: '#ffffff',
    letterSpacing: 1,
  },
  recipientName: {
    fontSize: 13,
    marginBottom: 4,
  },
  addressText: {
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 4,
  },
  recipientPhone: {
    fontSize: 12,
    marginBottom: 8,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    marginTop: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionTextPrimary: {
    fontSize: 12,
  },
  actionTextMuted: {
    fontSize: 12,
  },
  actionTextDestructive: {
    fontSize: 12,
  },
});