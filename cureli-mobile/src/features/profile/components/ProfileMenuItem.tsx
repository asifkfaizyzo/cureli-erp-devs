// src/features/profile/components/ProfileMenuItem.tsx

import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../../theme/ThemeContext';

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
  const { colors } = useTheme();

  const resolvedIconColor =
    iconColor ?? (destructive ? colors.status.error : colors.text.muted);
  const resolvedLabelColor =
    labelColor ?? (destructive ? colors.status.error : colors.text.primary);

  return (
    <>
      <TouchableOpacity
        style={[styles.row, { backgroundColor: colors.background.card }]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={styles.iconWrapper}>
          <MaterialIcons name={icon} size={20} color={resolvedIconColor} />
        </View>
        <Text
          style={[
            styles.label,
            { color: resolvedLabelColor, fontFamily: 'Inter_500Medium' },
          ]}
        >
          {label}
        </Text>
        <View style={styles.right}>
          {rightLabel ? (
            <Text style={[styles.rightLabel, { color: colors.text.faint }]}>
              {rightLabel}
            </Text>
          ) : null}
          <MaterialIcons
            name="chevron-right"
            size={20}
            color={colors.text.faint}
          />
        </View>
      </TouchableOpacity>
      {showSeparator && (
        <View
          style={[styles.separator, { backgroundColor: colors.border.subtle }]}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  iconWrapper: {
    width: 32,
    alignItems: 'center',
    marginRight: 12,
  },
  label: {
    flex: 1,
    fontSize: 15,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  rightLabel: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
  },
  separator: {
    height: 1,
    marginLeft: 60,
  },
});