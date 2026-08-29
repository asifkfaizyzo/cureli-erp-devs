import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../../theme/ThemeContext';
import type { CustomerTicketCategory } from '../../../types/support';

export const SUPPORT_CATEGORIES: Array<{
  key: CustomerTicketCategory;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
}> = [
  { key: 'WRONG_ITEM', label: 'Wrong Item Received', icon: 'swap-horizontal-outline' },
  { key: 'DAMAGED_PRODUCT', label: 'Damaged / Broken', icon: 'shield-half-outline' },
  { key: 'MISSING_ITEM', label: 'Missing Item(s)', icon: 'cube-outline' },
  { key: 'QUALITY_ISSUE', label: 'Quality / Expiry Issue', icon: 'alert-circle-outline' },
  { key: 'DELIVERY_ISSUE', label: 'Delivery Problem', icon: 'bicycle-outline' },
  { key: 'REFUND_REQUEST', label: 'Billing / Refund', icon: 'card-outline' },
  { key: 'OTHER', label: 'Other Inquiries', icon: 'help-buoy-outline' },
];

interface CategoryPickerProps {
  selectedCategory: CustomerTicketCategory | null;
  onSelect: (category: CustomerTicketCategory) => void;
}

export function CategoryPicker({ selectedCategory, onSelect }: CategoryPickerProps) {
  const { colors, isDark } = useTheme();
  const brandColor = isDark ? colors.brand.accent : colors.brand.primary;

  return (
    <View style={styles.container}>
      {SUPPORT_CATEGORIES.map((item) => {
        const isSelected = selectedCategory === item.key;
        return (
          <TouchableOpacity
            key={item.key}
            style={[
              styles.option,
              {
                backgroundColor: isSelected ? colors.background.tint : colors.background.card,
                borderColor: isSelected ? brandColor : colors.border.default,
              },
            ]}
            onPress={() => onSelect(item.key)}
            activeOpacity={0.7}
          >
            <View
              style={[
                styles.iconWrap,
                { backgroundColor: isSelected ? brandColor : colors.background.elevated },
              ]}
            >
              <Ionicons
                name={item.icon}
                size={18}
                color={isSelected ? '#ffffff' : colors.text.muted}
              />
            </View>
            <Text
              style={[
                styles.label,
                {
                  color: isSelected ? brandColor : colors.text.primary,
                  fontFamily: isSelected ? 'Inter_600SemiBold' : 'Inter_400Regular',
                },
              ]}
            >
              {item.label}
            </Text>
            {isSelected && (
              <Ionicons name="checkmark-circle" size={18} color={brandColor} style={styles.check} />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  iconWrap: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  label: {
    fontSize: 14,
    flex: 1,
  },
  check: {
    marginLeft: 8,
  },
});