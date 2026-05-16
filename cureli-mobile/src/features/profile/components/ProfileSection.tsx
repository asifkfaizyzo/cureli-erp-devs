// src/features/profile/components/ProfileSection.tsx

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../../../theme/ThemeContext';

interface ProfileSectionProps {
  title: string;
  children: React.ReactNode;
}

export function ProfileSection({ title, children }: ProfileSectionProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.title, { color: colors.text.muted }]}>{title}</Text>
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.background.card,
            borderColor: colors.border.default,
          },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
  },
  title: {
    fontSize: 12,
    fontFamily: 'Inter_700Bold',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: 8,
    paddingHorizontal: 16,
  },
  card: {
    borderRadius: 12,
    marginHorizontal: 16,
    overflow: 'hidden',
    borderWidth: 1,
  },
});