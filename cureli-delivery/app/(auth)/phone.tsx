// app/(auth)/phone.tsx
import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator,
} from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { authApi } from '../../src/features/auth/api/auth.api';
import { useOnboardingStore } from '../../src/store/onboardingStore';
import { useTheme } from '../../src/theme/ThemeContext';
import { Typography, FontFamily } from '../../src/theme/typography';
import { Spacing } from '../../src/theme/spacing';
import { Radius } from '../../src/theme/radius';

export default function PhoneScreen() {
  const { colors } = useTheme();
  const [phone,   setPhone]   = useState('');
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');

  const { setPhone: storePhone, setOtpSent } = useOnboardingStore();

  const isValid = /^[6-9]\d{9}$/.test(phone.trim());

  async function handleSendOtp() {
    if (!isValid) return;
    setLoading(true);
    setError('');
    try {
      await authApi.sendOtp({ phone: phone.trim() });
      storePhone(phone.trim());
      setOtpSent(true);
      router.push('/(auth)/otp');
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to send OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const s = makeStyles(colors);

  return (
    <SafeAreaView style={s.container} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={s.inner}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Brand */}
        <View style={s.header}>
          <Text style={s.wordmark}>cureli</Text>
          <Text style={s.tagline}>delivery</Text>
          <View style={s.divider} />
          <Text style={s.title}>Enter your mobile number</Text>
          <Text style={s.subtitle}>
            We'll send a 6-digit OTP to verify your number
          </Text>
        </View>

        {/* Input */}
        <View style={s.inputGroup}>
          <View style={[
            s.inputWrapper,
            error ? { borderColor: colors.status.error } : null,
          ]}>
            <Text style={s.prefix}>+91</Text>
            <TextInput
              style={s.input}
              value={phone}
              onChangeText={(t) => {
                setPhone(t.replace(/\D/g, '').slice(0, 10));
                setError('');
              }}
              placeholder="10-digit mobile number"
              placeholderTextColor={colors.text.faint}
              keyboardType="phone-pad"
              maxLength={10}
              autoFocus
            />
          </View>
          {error ? <Text style={s.errorText}>{error}</Text> : null}
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={[s.btn, (!isValid || loading) && s.btnDisabled]}
          onPress={handleSendOtp}
          disabled={!isValid || loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color={colors.brand.primaryText} />
            : <Text style={s.btnText}>Get OTP</Text>
          }
        </TouchableOpacity>

        <Text style={s.disclaimer}>
          By continuing, you agree to Cureli's Terms of Service and Privacy Policy.
        </Text>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function makeStyles(colors: ReturnType<typeof useTheme>['colors']) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background.page },
    inner: {
      flex: 1,
      padding:        Spacing.base,
      justifyContent: 'center',
      gap:            Spacing.xl,
    },

    header: { gap: Spacing.sm },
    wordmark: {
      ...Typography.wordmark,
      color: colors.brand.primary,
    },
    tagline: {
      ...Typography.label,
      color:         colors.text.muted,
      marginTop:     -Spacing.xs,
      letterSpacing: 3,
    },
    divider: {
      height:          1,
      backgroundColor: colors.border.subtle,
      marginVertical:  Spacing.md,
    },
    title: {
      ...Typography.h2,
      color: colors.text.primary,
    },
    subtitle: {
      ...Typography.body,
      color: colors.text.muted,
    },

    inputGroup:   { gap: Spacing.sm },
    inputWrapper: {
      flexDirection:     'row',
      alignItems:        'center',
      backgroundColor:   colors.background.input,
      borderRadius:      Radius.lg,
      borderWidth:       1,
      borderColor:       colors.border.input,
      paddingHorizontal: Spacing.base,
    },
    prefix: {
      ...Typography.bodyMedium,
      color:       colors.text.muted,
      marginRight: Spacing.sm,
    },
    input: {
      flex:       1,
      height:     54,
      ...Typography.bodyLarge,
      color:      colors.text.primary,
    },
    errorText: {
      ...Typography.small,
      color:             colors.status.error,
      paddingHorizontal: Spacing.xs,
    },

    btn: {
      backgroundColor: colors.brand.primary,
      height:          54,
      borderRadius:    Radius.lg,
      alignItems:      'center',
      justifyContent:  'center',
    },
    btnDisabled: { opacity: 0.45 },
    btnText: {
      ...Typography.buttonLarge,
      color: colors.brand.primaryText,
    },

    disclaimer: {
      ...Typography.caption,
      color:     colors.text.faint,
      textAlign: 'center',
    },
  });
}