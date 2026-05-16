// src/features/profile/components/ProfileMenuItem.tsx
//
// Reusable menu row: icon + label + optional right element + chevron.
// Separator line renders between items automatically via StyleSheet.

import React from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface ProfileMenuItemProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  label: string;
  onPress: () => void;
  rightLabel?: string;
  iconColor?: string;
  labelColor?: string;
  showSeparator?: boolean;
  destructive?: boolean;
}

export function ProfileMenuItem({
  icon,
  label,
  onPress,
  rightLabel,
  iconColor,
  labelColor,
  showSeparator = true,
  destructive = false,
}: ProfileMenuItemProps) {
  const resolvedIconColor = iconColor ?? (destructive ? '#ef4444' : '#64748b');
  const resolvedLabelColor = labelColor ?? (destructive ? '#ef4444' : '#0f172a');

  return (
    <>
      <TouchableOpacity
        style={styles.row}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.iconWrapper}>
          <MaterialIcons name={icon} size={20} color={resolvedIconColor} />
        </View>
        <Text style={[styles.label, { color: resolvedLabelColor }]}>
          {label}
        </Text>
        <View style={styles.right}>
          {rightLabel ? (
            <Text style={styles.rightLabel}>{rightLabel}</Text>
          ) : null}
          <MaterialIcons name="chevron-right" size={20} color="#94a3b8" />
        </View>
      </TouchableOpacity>
      {showSeparator && <View style={styles.separator} />}
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
  },
  iconWrapper: {
    width: 32,
    alignItems: 'center',
    marginRight: 12,
  },
  label: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#0f172a',
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rightLabel: {
    fontSize: 13,
    color: '#94a3b8',
  },
  separator: {
    height: 1,
    backgroundColor: '#e2e8f0',
    marginLeft: 60,
  },
});