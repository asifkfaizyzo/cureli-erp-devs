import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../theme/ThemeContext';
import type { CustomerTicketStatus } from '../../../types/support';

interface TicketStatusBadgeProps {
  status: CustomerTicketStatus;
  size?: 'small' | 'medium';
}

export function TicketStatusBadge({ status, size = 'medium' }: TicketStatusBadgeProps) {
  const { colors } = useTheme();

  const config = {
    OPEN: {
      label: 'Open',
      icon: 'hourglass-outline',
      bg: colors.status.warningBg,
      fg: colors.status.warning,
    },
    IN_PROGRESS: {
      label: 'In Progress',
      icon: 'sync-outline',
      bg: colors.background.tint,
      fg: colors.brand.primary,
    },
    RESOLVED: {
      label: 'Resolved',
      icon: 'checkmark-circle-outline',
      bg: colors.status.successBg,
      fg: colors.status.success,
    },
    CLOSED: {
      label: 'Closed',
      icon: 'lock-closed-outline',
      bg: colors.background.elevated,
      fg: colors.text.muted,
    },
  }[status] || {
    label: status,
    icon: 'help-circle-outline',
    bg: colors.background.tint,
    fg: colors.text.muted,
  };

  const isSmall = size === 'small';

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: config.bg },
        isSmall && styles.badgeSmall,
      ]}
    >
      <Ionicons name={config.icon as any} size={isSmall ? 12 : 14} color={config.fg} />
      <Text
        style={[
          styles.text,
          { color: config.fg },
          isSmall && styles.textSmall,
        ]}
      >
        {config.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
    alignSelf: 'flex-start',
  },
  badgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    gap: 4,
  },
  text: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
  },
  textSmall: {
    fontSize: 11,
  },
});