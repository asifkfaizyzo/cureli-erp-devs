// app/(app)/profile.tsx
import React from 'react';
import { View, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../../src/theme/ThemeContext';
import { Typography } from '../../src/theme/typography';

export default function ProfileScreen() {
  const { colors } = useTheme();
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background.page }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ ...Typography.body, color: colors.text.muted }}>
          Profile — Coming in Phase 2
        </Text>
      </View>
    </SafeAreaView>
  );
}