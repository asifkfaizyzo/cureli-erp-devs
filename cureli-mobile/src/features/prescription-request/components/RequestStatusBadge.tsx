// src/features/prescription-request/components/RequestStatusBadge.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  PENDING:              { label: 'Waiting for responses', color: '#F59E0B', bg: '#F59E0B1A' },
  PARTIALLY_RESPONDED:  { label: 'Some responses received', color: '#3B82F6', bg: '#3B82F61A' },
  FULLY_RESPONDED:      { label: 'All pharmacies responded', color: '#8B5CF6', bg: '#8B5CF61A' },
  ACCEPTED:             { label: 'Quote accepted',  color: '#10B981', bg: '#10B9811A' },
  COMPLETED:            { label: 'Order placed',    color: '#10B981', bg: '#10B9811A' },
  CANCELLED:            { label: 'Cancelled',       color: '#6B7280', bg: '#6B72801A' },
  EXPIRED:              { label: 'Expired',         color: '#6B7280', bg: '#6B72801A' },
};

interface Props {
  status: string;
}

export function RequestStatusBadge({ status }: Props) {
  const { colors } = useTheme();
  const cfg        = STATUS_CONFIG[status] ?? STATUS_CONFIG.PENDING;

  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <View style={[styles.dot, { backgroundColor: cfg.color }]} />
      <Text style={[styles.label, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection:  'row',
    alignItems:     'center',
    gap:            6,
    paddingHorizontal: 10,
    paddingVertical:   5,
    borderRadius:   20,
    alignSelf:      'flex-start',
  },
  dot: {
    width:        6,
    height:       6,
    borderRadius: 3,
  },
  label: {
    fontSize:   12,
    fontFamily: 'Inter_600SemiBold',
  },
});