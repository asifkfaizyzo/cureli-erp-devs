// src/features/profile/components/EmptyAddressState.tsx

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useTheme } from '../../../theme/ThemeContext';

interface EmptyAddressStateProps {
  onAddPress?: () => void;
}

export function EmptyAddressState({ onAddPress }: EmptyAddressStateProps) {
  const { colors, isDark } = useTheme();

  const handlePress = () => {
    if (onAddPress) {
      onAddPress();
    } else {
      router.push('/profile/address/new');
    }
  };

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.illustration,
          { backgroundColor: colors.background.tint },
        ]}
      >
        <MaterialIcons
          name="location-off"
          size={48}
          color={colors.text.disabled}
        />
      </View>

      <Text style={[styles.title, { color: colors.text.primary, fontFamily: 'Inter_700Bold' }]}>
        No saved addresses
      </Text>
      <Text style={[styles.subtitle, { color: colors.text.faint, fontFamily: 'Inter_400Regular' }]}>
        Save your delivery addresses for faster checkout
      </Text>

      <TouchableOpacity
        style={[
          styles.button,
          { backgroundColor: isDark ? colors.brand.accent : colors.brand.primary },
        ]}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <MaterialIcons name="add-location-alt" size={18} color="#ffffff" />
        <Text style={[styles.buttonText, { fontFamily: 'Inter_600SemiBold' }]}>
          Add your first address
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  illustration: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  buttonText: {
    fontSize: 14,
    color: '#ffffff',
  },
});