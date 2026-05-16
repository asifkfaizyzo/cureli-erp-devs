// src/features/profile/components/EmptyAddressState.tsx
//
// Shown when the user has no saved addresses.
// Illustration placeholder + clear CTA.

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

interface EmptyAddressStateProps {
  onAddPress?: () => void;
}

export function EmptyAddressState({ onAddPress }: EmptyAddressStateProps) {
  const handlePress = () => {
    if (onAddPress) {
      onAddPress();
    } else {
      router.push('/profile/address/new');
    }
  };

  return (
    <View style={styles.container}>
      {/* Illustration placeholder */}
      <View style={styles.illustration}>
        <MaterialIcons name="location-off" size={48} color="#cbd5e1" />
      </View>

      <Text style={styles.title}>No saved addresses</Text>
      <Text style={styles.subtitle}>
        Save your delivery addresses for faster checkout
      </Text>

      <TouchableOpacity
        style={styles.button}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <MaterialIcons name="add-location-alt" size={18} color="#ffffff" />
        <Text style={styles.buttonText}>Add your first address</Text>
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
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#05015A',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
});