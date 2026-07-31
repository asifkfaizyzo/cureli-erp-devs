// app/(auth)/otp.tsx
import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authApi } from '../../src/features/auth/api/auth.api';
import { useOnboardingStore } from '../../src/store/onboardingStore';
import { useAuthStore } from '../../src/store/authStore';
import { StorageService } from '../../src/services/storage';
import { useTheme } from '../../src/theme/ThemeContext';
import { Typography } from '../../src/theme/typography';
import { Spacing } from '../../src/theme/spacing';
import { Radius } from '../../src/theme/radius';
import type { RiderStatus } from '../../src/types/auth';

const OTP_LENGTH = 6;

export default function OtpScreen() {
  const { colors } = useTheme();
  const [otp,        setOtp]        = useState('');
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState('');
  const [resendWait, setResendWait] = useState(30);
  const [resending,  setResending]  = useState(false);

  const inputRef = useRef<TextInput>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const { phone, reset: resetOnboarding } = useOnboardingStore();
  const { setRider } = useAuthStore();

  useEffect(() => {
    startCountdown();
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  function startCountdown() {
    setResendWait(30);
    timerRef.current = setInterval(() => {
      setResendWait((prev) => {
        if (prev <= 1) { clearInterval(timerRef.current!); return 0; }
        return prev - 1;
      });
    }, 1000);
  }

  async function handleVerify(value: string) {
    if (value.length !== OTP_LENGTH) return;
    setLoading(true);
    setError('');
    try {
      const { data } = await authApi.verifyOtp({ phone, otp: value });
      const result = data.data;
      StorageService.setAccessToken(result.accessToken);
      StorageService.setRefreshToken(result.refreshToken);
      setRider(result.rider);
      resetOnboarding();
      navigateByStatus(result.rider.status);
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Verification failed. Please try again.');
      setOtp('');
    } finally {
      setLoading(false);
    }
  }

  function navigateByStatus(status: RiderStatus) {
    switch (status) {
      case 'ACTIVE':         return router.replace('/(app)/home');
      case 'SUSPENDED':
      case 'BLOCKED':        return router.replace('/(auth)/status-suspended');
      case 'REJECTED':       return router.replace('/(auth)/status-rejected');
      case 'PENDING_REVIEW':
      default:               return router.replace('/(auth)/status-pending');
    }
  }

  async function handleResend() {
    if (resendWait > 0 || resending) return;
    setResending(true);
    setError('');
    try {
      await authApi.sendOtp({ phone });
      startCountdown();
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to resend OTP.');
    } finally {
      setResending(false);
    }
  }

  function handleOtpChange(value: string) {
    const cleaned = value.replace(/\D/g, '').slice(0, OTP_LENGTH);
    setOtp(cleaned);
    setError('');
    if (cleaned.length === OTP_LENGTH) handleVerify(cleaned);
  }

  const digits = otp.split('');
  const s = makeStyles(colors);

  return (
    <SafeAreaView style={s.container} edges={['top', 'bottom']}>
      <View style={s.inner}>
        {/* Back */}
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Text style={s.backText}>← Back</Text>
        </TouchableOpacity>

        {/* Header */}
        <View style={s.header}>
          <Text style={s.title}>Enter OTP</Text>
          <Text style={s.subtitle}>
            Sent to{' '}
            <Text style={s.phoneHighlight}>+91 {phone}</Text>
          </Text>
        </View>

        {/* Hidden input driving visual boxes */}
        <TextInput
          ref={inputRef}
          value={otp}
          onChangeText={handleOtpChange}
          keyboardType="number-pad"
          maxLength={OTP_LENGTH}
          style={s.hiddenInput}
          autoFocus
        />

        {/* OTP boxes */}
        <TouchableOpacity
          style={s.boxRow}
          onPress={() => inputRef.current?.focus()}
          activeOpacity={1}
        >
          {Array.from({ length: OTP_LENGTH }).map((_, i) => (
            <View
              key={i}
              style={[
                s.box,
                digits[i]    ? s.boxFilled : null,
                i === otp.length ? s.boxActive : null,
                error          ? s.boxError  : null,
              ]}
            >
              <Text style={s.boxText}>{digits[i] ?? ''}</Text>
            </View>
          ))}
        </TouchableOpacity>

        {error ? (
          <Text style={s.errorText}>{error}</Text>
        ) : null}

        {loading && (
          <ActivityIndicator
            color={colors.brand.primary}
            style={{ marginTop: Spacing.sm }}
          />
        )}

        {/* Resend */}
        <TouchableOpacity
          onPress={handleResend}
          disabled={resendWait > 0 || resending}
          style={s.resendRow}
        >
          <Text style={[
            s.resendText,
            (resendWait > 0 || resending) && s.resendDisabled,
          ]}>
            {resendWait > 0
              ? `Resend OTP in ${resendWait}s`
              : resending
              ? 'Sending...'
              : 'Resend OTP'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const BOX_SIZE = 50;

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background.page },
    inner: {
      flex: 1, padding: Spacing.base, gap: Spacing.xl,
    },

    backBtn:  { marginTop: Spacing.sm },
    backText: { ...Typography.bodyMedium, color: colors.text.muted },

    header:          { gap: Spacing.xs },
    title:           { ...Typography.h2, color: colors.text.primary },
    subtitle:        { ...Typography.body, color: colors.text.muted },
    phoneHighlight:  { ...Typography.bodyMedium, color: colors.text.primary },

    hiddenInput: { position: 'absolute', opacity: 0, height: 0, width: 0 },

    boxRow: {
      flexDirection:  'row',
      gap:            Spacing.sm,
      justifyContent: 'center',
    },
    box: {
      width:           BOX_SIZE,
      height:          BOX_SIZE,
      borderRadius:    Radius.md,
      borderWidth:     1.5,
      borderColor:     colors.border.input,
      backgroundColor: colors.background.input,
      alignItems:      'center',
      justifyContent:  'center',
    },
    boxFilled: { borderColor: colors.brand.primary },
    boxActive: { borderColor: colors.border.inputFocused },
    boxError:  { borderColor: colors.status.error },
    boxText: {
      ...Typography.h3,
      color: colors.text.primary,
    },

    errorText: {
      ...Typography.small,
      color:     colors.status.error,
      textAlign: 'center',
    },

    resendRow:     { alignItems: 'center' },
    resendText:    { ...Typography.bodyMedium, color: colors.brand.primary },
    resendDisabled:{ color: colors.text.faint },
  });
}