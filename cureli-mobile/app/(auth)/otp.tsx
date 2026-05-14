// app/(auth)/otp.tsx
//
// OTP SCREEN — 6-digit code entry
//
// Receives: phone (as route param from login screen)
//
// Flow:
//   Auto-focus → user types 6 digits → auto-submit on 6th digit
//   Success → navigate to /(tabs)/home, replace history
//   Failure → show error, allow retry
//   Resend → cooldown timer, then allow re-send

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useState, useEffect, useRef } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/store/authStore';

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 30; // seconds

export default function OtpScreen() {
  const { phone } = useLocalSearchParams<{ phone: string }>();
  const { login, sendOtp } = useAuthStore();

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendCooldown, setResendCooldown] = useState(RESEND_COOLDOWN);
  const [resending, setResending] = useState(false);

  const inputRef = useRef<TextInput>(null);

  // ── Cooldown Timer ────────────────────────────────────────
  // Counts down from 30 to 0. When 0, resend button becomes active.

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

  // ── Auto-submit when 6 digits entered ─────────────────────

  useEffect(() => {
    if (otp.length === OTP_LENGTH) {
      handleVerify(otp);
    }
  }, [otp]);

  // ── Verify OTP ────────────────────────────────────────────

  async function handleVerify(code: string) {
    if (!phone) {
      setError('Phone number missing. Please go back and try again.');
      return;
    }
    if (code.length !== OTP_LENGTH) return;

    setError(null);
    setLoading(true);

    try {
      const { isNewUser } = await login(phone, code);

      // Replace the auth stack with the main app.
      // router.replace() means the user cannot press back to get to login.
      // This is correct — once logged in, going back should not be possible.
      router.replace('/(tabs)/home');

      // isNewUser is available here for future onboarding routing:
      // if (isNewUser) router.replace('/(onboarding)/name');
      // else router.replace('/(tabs)/home');
    } catch (err: unknown) {
      setOtp(''); // clear the input on failure
      setError(extractErrorMessage(err));
      // Re-focus the input so user can try again immediately
      setTimeout(() => inputRef.current?.focus(), 100);
    } finally {
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
      await sendOtp(phone);
      setResendCooldown(RESEND_COOLDOWN);
    } catch (err: unknown) {
      setError(extractErrorMessage(err));
    } finally {
      setResending(false);
    }
  }

  // ── OTP Input Handler ─────────────────────────────────────

  function handleOtpChange(text: string) {
    const digits = text.replace(/\D/g, '').slice(0, OTP_LENGTH);
    setOtp(digits);
    if (error) setError(null);
  }

  // ── Render OTP Boxes ──────────────────────────────────────
  // Visual trick: one hidden TextInput captures the actual input.
  // We render 6 styled boxes on top that read from the otp state string.
  // This gives full control over the appearance of each digit cell.

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
                isFilled && styles.otpBoxFilled,
                isCurrent && styles.otpBoxActive,
                error && styles.otpBoxError,
              ]}
              onPress={() => inputRef.current?.focus()}
              activeOpacity={1}
            >
              <Text style={styles.otpChar}>{char}</Text>
              {/* Blinking cursor on the active box */}
              {isCurrent && <View style={styles.cursor} />}
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.container}>

          {/* ── Back Button ──────────────────────────────── */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            disabled={loading}
          >
            <Text style={styles.backText}>← Change number</Text>
          </TouchableOpacity>

          {/* ── Header ──────────────────────────────────── */}
          <View style={styles.header}>
            <Text style={styles.title}>Enter OTP</Text>
            <Text style={styles.subtitle}>
              Sent to{' '}
              <Text style={styles.phoneHighlight}>
                +91 {phone}
              </Text>
            </Text>
          </View>

          {/* ── OTP Input (hidden) + Visual Boxes ────────── */}
          <View style={styles.otpSection}>
            {/* Hidden input — captures actual keyboard input */}
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

            {/* Visual OTP boxes rendered on top */}
            {renderOtpBoxes()}
          </View>

          {/* ── Error ────────────────────────────────────── */}
          {error && (
            <Text style={styles.errorText}>{error}</Text>
          )}

          {/* ── Loading indicator ─────────────────────────── */}
          {loading && (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#05015A" size="small" />
              <Text style={styles.loadingText}>Verifying...</Text>
            </View>
          )}

          {/* ── Resend ───────────────────────────────────── */}
          <View style={styles.resendRow}>
            <Text style={styles.resendLabel}>Didn't receive the OTP?</Text>
            <TouchableOpacity
              onPress={handleResend}
              disabled={resendCooldown > 0 || resending || loading}
            >
              {resending ? (
                <ActivityIndicator color="#05015A" size="small" />
              ) : resendCooldown > 0 ? (
                <Text style={styles.resendCooldown}>
                  Resend in {resendCooldown}s
                </Text>
              ) : (
                <Text style={styles.resendActive}>Resend OTP</Text>
              )}
            </TouchableOpacity>
          </View>

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function extractErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const axiosErr = err as {
      response?: { data?: { message?: string }; status?: number };
    };
    const status = axiosErr.response?.status;
    const message = axiosErr.response?.data?.message;

    if (status === 429) return message ?? 'Too many attempts. Please wait.';
    if (status === 403) return message ?? 'Account suspended. Contact support.';
    if (message) return message;
  }
  return 'Verification failed. Please try again.';
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  keyboardView: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 28,
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: 8,
  },
  backText: {
    fontSize: 14,
    color: '#64748b',
    fontWeight: '500',
  },
  header: {
    gap: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
  },
  subtitle: {
    fontSize: 15,
    color: '#64748b',
    lineHeight: 22,
  },
  phoneHighlight: {
    color: '#05015A',
    fontWeight: '700',
  },
  otpSection: {
    alignItems: 'center',
    position: 'relative',
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
  otpBoxRow: {
    flexDirection: 'row',
    gap: 10,
  },
  otpBox: {
    width: 48,
    height: 58,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    position: 'relative',
  },
  otpBoxFilled: {
    borderColor: '#05015A',
    backgroundColor: '#eef2ff',
  },
  otpBoxActive: {
    borderColor: '#05015A',
    borderWidth: 2,
    backgroundColor: '#ffffff',
  },
  otpBoxError: {
    borderColor: '#ef4444',
    backgroundColor: '#fff5f5',
  },
  otpChar: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
  },
  cursor: {
    position: 'absolute',
    bottom: 10,
    width: 2,
    height: 22,
    backgroundColor: '#05015A',
    borderRadius: 1,
  },
  errorText: {
    fontSize: 13,
    color: '#ef4444',
    fontWeight: '500',
    textAlign: 'center',
    marginTop: -12,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: -12,
  },
  loadingText: {
    fontSize: 14,
    color: '#05015A',
    fontWeight: '500',
  },
  resendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    justifyContent: 'center',
  },
  resendLabel: {
    fontSize: 14,
    color: '#64748b',
  },
  resendCooldown: {
    fontSize: 14,
    color: '#94a3b8',
    fontWeight: '600',
  },
  resendActive: {
    fontSize: 14,
    color: '#05015A',
    fontWeight: '700',
  },
});