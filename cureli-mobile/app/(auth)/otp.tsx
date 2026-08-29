// app/(auth)/otp.tsx

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Keyboard,
} from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { useTheme } from '../../src/theme/ThemeContext';
import {
  REVIEW_MODE,
  REVIEW_PHONE,
  REVIEW_OTP,
} from '../../src/constants/config';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 30;

export default function OtpScreen() {
  const params = useLocalSearchParams<{
    phone: string;
    mode?: string;
    password?: string;
    fullName?: string;
    email?: string;
  }>();
  
  const phone = params.phone ?? '';
  const mode = params.mode ?? 'reset';
  const password = params.password ?? '';
  const fullName = params.fullName ?? '';
  const email = params.email ?? '';

  const { sendResetOtp, sendRegisterOtp, register } = useAuthStore();
  const { colors } = useTheme();

  const isReviewSession = REVIEW_MODE && phone === REVIEW_PHONE;

  const [otp, setOtp]                     = useState(isReviewSession ? REVIEW_OTP : '');
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN);
  const [resending, setResending]         = useState(false);

  const inputRef = useRef<TextInput>(null);

  // ── Cooldown Timer ────────────────────────────────────────

  useEffect(() => {
    if (resendCooldown <= 0) return;
    const timer = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCooldown]);

  // ── Auto-submit and navigate/finalize ───────────────────

  useEffect(() => {
    if (otp.length === OTP_LENGTH) {
      Keyboard.dismiss();
      handleVerify(otp);
    }
  }, [otp]);

  // ── Verify Core Action ────────────────────────────────────

  async function handleVerify(code: string) {
    setError(null);
    setLoading(true);

    try {
      const normalizedPhone = `+91${phone}`;

      if (mode === 'register') {
        await register(
          normalizedPhone,
          password,
          code,
          fullName || undefined,
          email || undefined,
        );

        const user = useAuthStore.getState().user;
        if (!user?.profile_complete) {
          router.replace('/onboarding/profile' as any);
        } else {
          router.replace('/(tabs)/home');
        }
      } else {
        setLoading(false);
        router.push({
          pathname: '/(auth)/new-password',
          params: { phone, otp: code, mode },
        });
      }
    } catch (err: unknown) {
      setOtp('');
      setError(extractErrorMessage(err));
      setTimeout(() => inputRef.current?.focus(), 100);
      setLoading(false);
    }
  }

  // ── Resend OTP ────────────────────────────────────────────

  async function handleResend() {
    if (resendCooldown > 0 || !phone) return;
    setResending(true);
    setError(null);
    setOtp('');

    try {
      const normalized = `+91${phone}`;
      if (mode === 'register') {
        await sendRegisterOtp(normalized);
      } else {
        await sendResetOtp(normalized);
      }
      setResendCooldown(RESEND_COOLDOWN);
    } catch (err: unknown) {
      setError(extractErrorMessage(err));
    } finally {
      setResending(false);
    }
  }

  function handleOtpChange(text: string) {
    const digits = text.replace(/\D/g, '').slice(0, OTP_LENGTH);
    setOtp(digits);
    if (error) setError(null);
  }

  // ── OTP Boxes ─────────────────────────────────────────────

  function renderOtpBoxes() {
    return (
      <View style={styles.otpBoxRow}>
        {Array.from({ length: OTP_LENGTH }).map((_, index) => {
          const char = otp[index] ?? '';
          const isCurrent = index === otp.length && !loading;
          const isFilled = index < otp.length;

          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.otpBox,
                {
                  backgroundColor: colors.background.input,
                  borderColor: colors.border.input,
                },
                isFilled && {
                  borderColor: colors.brand.accent,
                  backgroundColor: colors.background.tint,
                },
                isCurrent && {
                  borderColor: colors.brand.accent,
                  borderWidth: 2,
                  backgroundColor: colors.background.card,
                },
                error
                  ? {
                      borderColor: colors.status.error,
                      backgroundColor: colors.status.errorBg,
                    }
                  : null,
              ]}
              onPress={() => inputRef.current?.focus()}
              activeOpacity={1}
            >
              <Text style={[styles.otpChar, { color: colors.text.primary }]}>
                {char}
              </Text>
              {isCurrent && (
                <View
                  style={[
                    styles.cursor,
                    { backgroundColor: colors.brand.accent },
                  ]}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background.page }]}
      edges={['top', 'bottom']}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
          automaticallyAdjustKeyboardInsets={true}
        >
          {/* Back button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            disabled={loading}
          >
            <MaterialIcons
              name="arrow-back"
              size={20}
              color={colors.text.muted}
            />
            <Text style={[styles.backText, { color: colors.text.muted }]}>
              Back
            </Text>
          </TouchableOpacity>

          {/* Header */}
          <View style={styles.header}>
            <View
              style={[
                styles.otpIconWrapper,
                { backgroundColor: colors.background.tint },
              ]}
            >
              <MaterialIcons
                name="sms"
                size={28}
                color={colors.brand.accent}
              />
            </View>

            <Text style={[styles.title, { color: colors.text.primary }]}>
              Verification code
            </Text>
            <Text style={[styles.subtitle, { color: colors.text.muted }]}>
              We sent a 6-digit code to{'\n'}
              <Text
                style={[
                  styles.phoneHighlight,
                  { color: colors.text.primary },
                ]}
              >
                +91 {phone}
              </Text>
            </Text>
          </View>

          {/* OTP Input */}
          <View style={styles.otpSection}>
            <TextInput
              ref={inputRef}
              value={otp}
              onChangeText={handleOtpChange}
              keyboardType="number-pad"
              maxLength={OTP_LENGTH}
              autoFocus
              caretHidden
              style={styles.hiddenInput}
              editable={!loading}
            />
            {renderOtpBoxes()}
          </View>

          {/* Status */}
          <View style={styles.statusSlot}>
            {loading ? (
              <View style={styles.loadingRow}>
                <ActivityIndicator color={colors.brand.accent} size="small" />
                <Text style={[styles.loadingText, { color: colors.brand.accent }]}>
                  Completing Registration…
                </Text>
              </View>
            ) : error ? (
              <View style={styles.errorRow}>
                <MaterialIcons
                  name="error-outline"
                  size={14}
                  color={colors.status.error}
                />
                <Text
                  style={[styles.errorText, { color: colors.status.error }]}
                >
                  {error}
                </Text>
              </View>
            ) : (
              <View />
            )}
          </View>

          {/* Resend */}
          <View style={styles.resendRow}>
            <Text style={[styles.resendLabel, { color: colors.text.muted }]}>
              Didn't receive the code?
            </Text>
            <TouchableOpacity
              onPress={handleResend}
              disabled={resendCooldown > 0 || resending || loading}
            >
              {resending ? (
                <ActivityIndicator
                  color={colors.brand.accent}
                  size="small"
                />
              ) : resendCooldown > 0 ? (
                <Text
                  style={[
                    styles.resendCooldown,
                    { color: colors.text.faint },
                  ]}
                >
                  Resend in {resendCooldown}s
                </Text>
              ) : (
                <Text
                  style={[
                    styles.resendActive,
                    { color: colors.brand.accent },
                  ]}
                >
                  Resend code
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function extractErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const axiosErr = err as {
      response?: { data?: { message?: string }; status?: number };
    };
    const message = axiosErr.response?.data?.message;
    if (message) return message;
  }
  return 'Failed to verify OTP. Please try again.';
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 24,
    paddingBottom: 40,
  },

  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 8,
  },
  backText: { fontSize: 14, fontFamily: 'Inter_500Medium' },

  header: { alignItems: 'center', gap: 10, paddingTop: 16 },
  otpIconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 22,
  },
  phoneHighlight: { fontFamily: 'Inter_600SemiBold' },

  otpSection: { alignItems: 'center', position: 'relative', marginTop: 8 },
  hiddenInput: { position: 'absolute', opacity: 0, width: 1, height: 1 },
  otpBoxRow: { flexDirection: 'row', gap: 10 },
  otpBox: {
    width: 48,
    height: 58,
    borderWidth: 1.5,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  otpChar: { fontSize: 22, fontFamily: 'Inter_700Bold' },
  cursor: {
    position: 'absolute',
    bottom: 10,
    width: 2,
    height: 22,
    borderRadius: 1,
  },

  statusSlot: {
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: -8,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  errorText: { fontSize: 13, fontFamily: 'Inter_500Medium' },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  loadingText: { fontSize: 14, fontFamily: 'Inter_500Medium' },

  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
    paddingBottom: 32,
  },
  resendLabel: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  resendCooldown: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },
  resendActive: { fontSize: 14, fontFamily: 'Inter_700Bold' },
});