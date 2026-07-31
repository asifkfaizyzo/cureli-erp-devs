// app/(auth)/status-pending.tsx
import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { StorageService } from '../../src/services/storage';
import { useAuthStore } from '../../src/store/authStore';
import { useTheme } from '../../src/theme/ThemeContext';
import { Typography } from '../../src/theme/typography';
import { Spacing } from '../../src/theme/spacing';
import { Radius } from '../../src/theme/radius';

export default function StatusPendingScreen() {
  const { colors } = useTheme();
  const { clearAuth } = useAuthStore();

  function handleLogout() {
    StorageService.clearAuth();
    clearAuth();
    router.replace('/(auth)/phone');
  }

  const s = makeStyles(colors);

  return (
    <SafeAreaView style={s.container} edges={['top', 'bottom']}>
      <View style={s.inner}>
        <Text style={s.emoji}>⏳</Text>
        <Text style={s.title}>Application Under Review</Text>
        <View style={s.card}>
          <Text style={s.body}>
            Your documents have been submitted and are currently being reviewed by our team.
          </Text>
          <Text style={s.body}>
            This typically takes 1–2 business days. You'll receive a notification once approved.
          </Text>
        </View>
        <TouchableOpacity style={s.btn} onPress={handleLogout}>
          <Text style={s.btnText}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background.page },
    inner: {
      flex: 1, padding: Spacing.xl,
      justifyContent: 'center', alignItems: 'center', gap: Spacing.lg,
    },
    emoji: { fontSize: 56 },
    title: {
      ...Typography.h2, color: colors.text.primary, textAlign: 'center',
    },
    card: {
      backgroundColor: colors.background.card,
      borderRadius:    Radius.xl,
      borderWidth:     1,
      borderColor:     colors.border.default,
      padding:         Spacing.base,
      gap:             Spacing.sm,
      width:           '100%',
    },
    body: {
      ...Typography.body, color: colors.text.muted,
      textAlign: 'center',
    },
    btn: {
      marginTop:         Spacing.md,
      paddingVertical:   Spacing.md,
      paddingHorizontal: Spacing['2xl'],
      borderRadius:      Radius.lg,
      borderWidth:       1,
      borderColor:       colors.border.default,
    },
    btnText: {
      ...Typography.button, color: colors.text.muted,
    },
  });
}