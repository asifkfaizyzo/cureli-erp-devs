// app/(auth)/status-suspended.tsx
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

export default function StatusSuspendedScreen() {
  const { colors } = useTheme();
  const { rider, clearAuth } = useAuthStore();

  function handleLogout() {
    StorageService.clearAuth();
    clearAuth();
    router.replace('/(auth)/phone');
  }

  const s = makeStyles(colors);

  return (
    <SafeAreaView style={s.container} edges={['top', 'bottom']}>
      <View style={s.inner}>
        <Text style={s.emoji}>🚫</Text>
        <Text style={s.title}>Account Suspended</Text>

        {rider?.suspension_reason ? (
          <View style={s.reasonCard}>
            <Text style={s.reasonLabel}>Reason</Text>
            <Text style={s.reasonText}>{rider.suspension_reason}</Text>
          </View>
        ) : null}

        <View style={s.card}>
          <Text style={s.body}>
            Please contact Cureli support to resolve this issue or submit an appeal.
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
      ...Typography.h2, color: colors.status.error, textAlign: 'center',
    },
    reasonCard: {
      backgroundColor: colors.status.errorBg,
      borderRadius:    Radius.xl,
      borderWidth:     1,
      borderColor:     colors.status.errorBorder,
      padding:         Spacing.base,
      width:           '100%',
      gap:             Spacing.xs,
    },
    reasonLabel: {
      ...Typography.label, color: colors.status.error,
    },
    reasonText: {
      ...Typography.body, color: colors.text.primary,
    },
    card: {
      backgroundColor: colors.background.card,
      borderRadius:    Radius.xl,
      borderWidth:     1,
      borderColor:     colors.border.default,
      padding:         Spacing.base,
      width:           '100%',
    },
    body: {
      ...Typography.body, color: colors.text.muted, textAlign: 'center',
    },
    btn: {
      marginTop:         Spacing.md,
      paddingVertical:   Spacing.md,
      paddingHorizontal: Spacing['2xl'],
      borderRadius:      Radius.lg,
      borderWidth:       1,
      borderColor:       colors.border.default,
    },
    btnText: { ...Typography.button, color: colors.text.muted },
  });
}