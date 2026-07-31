// app/(app)/home.tsx
import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useAuthStore } from '../../src/store/authStore';
import { StorageService } from '../../src/services/storage';
import { authApi } from '../../src/features/auth/api/auth.api';
import { useTheme } from '../../src/theme/ThemeContext';
import { Typography, FontFamily } from '../../src/theme/typography';
import { Spacing } from '../../src/theme/spacing';
import { Radius } from '../../src/theme/radius';

export default function HomeScreen() {
  const { colors } = useTheme();
  const { rider, clearAuth } = useAuthStore();

  async function handleLogout() {
    try { await authApi.logout(); } catch { }
    StorageService.clearAuth();
    clearAuth();
    router.replace('/(auth)/phone');
  }

  const s = makeStyles(colors);

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <ScrollView contentContainerStyle={s.content}>

        {/* Header */}
        <View style={s.header}>
          <Text style={s.wordmark}>cureli</Text>
          <View style={[
            s.statusPill,
            rider?.status === 'ACTIVE' && s.statusPillActive,
          ]}>
            <Text style={s.statusText}>
              {rider?.status?.replace('_', ' ') ?? '—'}
            </Text>
          </View>
        </View>

        {/* Welcome card */}
        <View style={s.card}>
          <Text style={s.greeting}>
            Hello, {rider?.full_name ?? rider?.phone ?? 'Rider'} 👋
          </Text>
          <Text style={s.cardSubtext}>
            Phase 1 complete. Full delivery functionality coming in Phase 2.
          </Text>
        </View>

        {/* Info card */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>Account Details</Text>
          <InfoRow label="Phone"      value={rider?.phone ?? '—'} colors={colors} />
          <InfoRow label="Status"     value={rider?.status ?? '—'} colors={colors} />
          <InfoRow label="Zone"       value={rider?.zone?.name ?? 'Not assigned'} colors={colors} />
          <InfoRow label="Rating"     value={`${rider?.rating?.toFixed(1) ?? '0.0'} ★`} colors={colors} />
          <InfoRow label="Deliveries" value={String(rider?.total_deliveries ?? 0)} colors={colors} />
          <InfoRow label="Bank"       value={rider?.bank_verified ? 'Verified ✓' : 'Not verified'} colors={colors} />
        </View>

        {/* Logout */}
        <TouchableOpacity style={s.logoutBtn} onPress={handleLogout} activeOpacity={0.7}>
          <Text style={s.logoutText}>Log Out</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({
  label, value, colors,
}: {
  label: string;
  value: string;
  colors: ReturnType<typeof useTheme>['colors'];
}) {
  return (
    <View style={{
      flexDirection:    'row',
      justifyContent:   'space-between',
      paddingVertical:  Spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.subtle,
    }}>
      <Text style={{ ...Typography.small, color: colors.text.muted }}>
        {label}
      </Text>
      <Text style={{ ...Typography.smallMedium, color: colors.text.primary }}>
        {value}
      </Text>
    </View>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background.page },
    content:   { padding: Spacing.base, gap: Spacing.base, paddingBottom: Spacing['3xl'] },

    header: {
      flexDirection:  'row',
      justifyContent: 'space-between',
      alignItems:     'center',
      paddingVertical: Spacing.sm,
    },
    wordmark: {
      ...Typography.wordmark,
      color: colors.brand.primary,
    },
    statusPill: {
      backgroundColor:   colors.background.elevated,
      paddingHorizontal: Spacing.md,
      paddingVertical:   Spacing.xs,
      borderRadius:      Radius.full,
      borderWidth:       1,
      borderColor:       colors.border.default,
    },
    statusPillActive: {
      backgroundColor: colors.status.successBg,
      borderColor:     colors.status.successBorder,
    },
    statusText: {
      ...Typography.smallBold,
      color: colors.text.muted,
    },

    card: {
      backgroundColor: colors.background.card,
      borderRadius:    Radius.xl,
      borderWidth:     1,
      borderColor:     colors.border.default,
      padding:         Spacing.base,
      gap:             Spacing.xs,
    },
    sectionTitle: {
      ...Typography.smallBold,
      color:         colors.text.muted,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      marginBottom:  Spacing.xs,
    },
    greeting: {
      ...Typography.h3,
      color: colors.text.primary,
    },
    cardSubtext: {
      ...Typography.body,
      color: colors.text.muted,
    },

    logoutBtn: {
      borderWidth:     1,
      borderColor:     colors.border.default,
      borderRadius:    Radius.lg,
      paddingVertical: Spacing.base,
      alignItems:      'center',
      marginTop:       Spacing.sm,
    },
    logoutText: {
      ...Typography.button,
      color: colors.text.muted,
    },
  });
}