// src/features/cart/components/DeliveryInstructionCard.tsx

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../theme/ThemeContext';
import { Spacing } from '../../../theme/spacing';

export const INSTRUCTIONS = [
  { id: 'bell', icon: 'notifications-off-outline' as const, label: 'Avoid ringing bell' },
  { id: 'call', icon: 'call-outline' as const,              label: 'Avoid calling' },
  { id: 'door', icon: 'home-outline' as const,              label: 'Leave at door' },
  { id: 'mask', icon: 'shield-outline' as const,            label: 'Wear a mask' },
  { id: 'safe', icon: 'hand-left-outline' as const,         label: 'Contactless' },
] as const;

interface DeliveryInstructionCardProps {
  selected: string[];
  onToggle: (id: string) => void;
}

export function DeliveryInstructionCard({
  selected,
  onToggle,
}: DeliveryInstructionCardProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.card, { backgroundColor: colors.background.card }]}>
      <Text style={[styles.title, { color: colors.text.primary }]}>
        Delivery instructions
      </Text>

      <FlatList
        horizontal
        data={INSTRUCTIONS}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const isSelected = selected.includes(item.id);
          return (
            <TouchableOpacity
              onPress={() => onToggle(item.id)}
              activeOpacity={0.8}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isSelected }}
              style={[
                styles.chip,
                {
                  backgroundColor: colors.background.tint,
                  borderColor: isSelected ? colors.brand.primary : 'transparent',
                  borderWidth: isSelected ? 2 : 0,
                },
              ]}
            >
              <Ionicons
                name={item.icon}
                size={22}
                color={isSelected ? colors.brand.primary : colors.text.secondary}
              />
              <Text
                style={[
                  styles.chipLabel,
                  {
                    color: isSelected ? colors.brand.primary : colors.text.secondary,
                    fontFamily: isSelected ? 'Inter_600SemiBold' : 'Inter_400Regular',
                  },
                ]}
                numberOfLines={2}
              >
                {item.label}
              </Text>
              <View
                style={[
                  styles.checkbox,
                  {
                    borderColor: isSelected
                      ? colors.brand.primary
                      : colors.border.default,
                    backgroundColor: isSelected
                      ? colors.brand.primary
                      : 'transparent',
                  },
                ]}
              >
                {isSelected && (
                  <Ionicons name="checkmark" size={10} color="#ffffff" />
                )}
              </View>
            </TouchableOpacity>
          );
        }}
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
  list: {
    gap: Spacing.sm,
  },
  chip: {
    width: 84,
    height: 96,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    gap: 5,
  },
  chipLabel: {
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 14,
  },
  checkbox: {
    width: 15,
    height: 15,
    borderRadius: 4,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
});