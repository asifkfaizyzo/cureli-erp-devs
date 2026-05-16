// src/features/profile/components/AddressCard.tsx
//
// Displays a single address with label icon, default badge,
// and action buttons (edit, delete, set default).
// Used in Phase 1A (display only). Action handlers are passed as props
// so the card stays dumb — the screen owns the mutation logic.

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
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
  const label = address.label as AddressLabel;
  const iconName = LABEL_ICONS[label] ?? 'location-on';

  const displayLabel = label === 'Other' && address.custom_label
    ? address.custom_label
    : label;

  const addressLines = [
    address.address_line_1,
    address.address_line_2,
    address.landmark ? `Near ${address.landmark}` : null,
    `${address.city}, ${address.state} — ${address.pincode}`,
  ]
    .filter(Boolean)
    .join('\n');

  return (
    <View style={[styles.card, address.is_default && styles.cardDefault]}>
      {/* Header row: icon + label + default badge */}
      <View style={styles.headerRow}>
        <View style={styles.labelRow}>
          <MaterialIcons name={iconName} size={18} color="#05015A" />
          <Text style={styles.labelText}>{displayLabel}</Text>
        </View>
        {address.is_default && (
          <View style={styles.defaultBadge}>
            <Text style={styles.defaultBadgeText}>DEFAULT</Text>
          </View>
        )}
      </View>

      {/* Recipient info */}
      {address.recipient_name && (
        <Text style={styles.recipientName}>{address.recipient_name}</Text>
      )}

      {/* Address text */}
      <Text style={styles.addressText}>{addressLines}</Text>

      {/* Recipient phone */}
      {address.recipient_phone && (
        <Text style={styles.recipientPhone}>{address.recipient_phone}</Text>
      )}

      {/* Action buttons */}
      <View style={styles.actions}>
        {!address.is_default && (
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() => onSetDefault(address.id)}
            disabled={isSettingDefault}
            activeOpacity={0.7}
          >
            <Text style={styles.actionTextPrimary}>
              {isSettingDefault ? 'Updating…' : 'Set Default'}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onEdit(address.id)}
          activeOpacity={0.7}
        >
          <MaterialIcons name="edit" size={14} color="#64748b" />
          <Text style={styles.actionTextMuted}>Edit</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onDelete(address.id)}
          disabled={isDeleting}
          activeOpacity={0.7}
        >
          <MaterialIcons name="delete-outline" size={14} color="#ef4444" />
          <Text style={styles.actionTextDestructive}>
            {isDeleting ? 'Removing…' : 'Remove'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardDefault: {
    borderColor: '#05015A',
    borderWidth: 1.5,
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
    fontWeight: '700',
    color: '#05015A',
  },
  defaultBadge: {
    backgroundColor: '#05015A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  defaultBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 1,
  },
  recipientName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0f172a',
    marginBottom: 4,
  },
  addressText: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 20,
    marginBottom: 4,
  },
  recipientPhone: {
    fontSize: 12,
    color: '#94a3b8',
    marginBottom: 8,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    marginTop: 4,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionTextPrimary: {
    fontSize: 12,
    fontWeight: '600',
    color: '#05015A',
  },
  actionTextMuted: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748b',
  },
  actionTextDestructive: {
    fontSize: 12,
    fontWeight: '500',
    color: '#ef4444',
  },
});