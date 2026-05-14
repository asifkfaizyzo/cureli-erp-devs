// app/(auth)/login.tsx
//
// LOGIN SCREEN — Phone number entry
//
// Flow:
//   User enters phone → tap Send OTP → POST /mobile/auth/send-otp
//   Success → navigate to /(auth)/otp passing phone as param
//
// Phone normalization:
//   The backend accepts 10-digit numbers with or without +91.
//   We strip formatting here before sending.
//   Display format in the input shows the raw number the user types.

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { useState } from 'react';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthStore } from '../../src/store/authStore';

export default function LoginScreen() {
  const { sendOtp } = useAuthStore();

  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ── Validation ────────────────────────────────────────────
  // Client-side validation before hitting the network.
  // Backend also validates — this is just UX feedback.

  function validatePhone(value: string): string | null {
    const cleaned = value.replace(/\D/g, ''); // strip non-digits
    if (cleaned.length === 0) return 'Enter your mobile number';
    if (cleaned.length < 10) return 'Enter a valid 10-digit mobile number';
    if (cleaned.length > 10) return 'Mobile number must be 10 digits';
    if (!/^[6-9]/.test(cleaned)) return 'Enter a valid Indian mobile number';
    return null;
  }

  // ── Handle Send OTP ───────────────────────────────────────

  async function handleSendOtp() {
    setError(null);

    const cleaned = phone.replace(/\D/g, '');
    const validationError = validatePhone(cleaned);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      await sendOtp(cleaned);

      // Navigate to OTP screen, passing the phone number as a param.
      // The OTP screen needs the phone to call verify-otp.
      // href with params: Expo Router passes them as query string internally.
      router.push({
        pathname: '/(auth)/otp',
        params: { phone: cleaned },
      });
    } catch (err: unknown) {
      const message = extractErrorMessage(err);
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.container}>

          {/* ── Header ──────────────────────────────────── */}
          <View style={styles.header}>
            <Text style={styles.logo}>cureli</Text>
            <Text style={styles.tagline}>medicines delivered fast</Text>
          </View>

          {/* ── Form ────────────────────────────────────── */}
          <View style={styles.form}>
            <Text style={styles.title}>Enter your mobile number</Text>
            <Text style={styles.subtitle}>
              We'll send you a 6-digit OTP to verify
            </Text>

            {/* Phone Input */}
            <View style={styles.inputWrapper}>
              {/* Country code prefix — non-editable */}
              <View style={styles.prefix}>
                <Text style={styles.prefixText}>+91</Text>
              </View>

              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={(text) => {
                  // Only allow digits, max 10
                  const digits = text.replace(/\D/g, '').slice(0, 10);
                  setPhone(digits);
                  if (error) setError(null);
                }}
                placeholder="98765 43210"
                placeholderTextColor="#94a3b8"
                keyboardType="number-pad"
                maxLength={10}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleSendOtp}
                editable={!loading}
              />
            </View>

            {/* Error message */}
            {error && (
              <Text style={styles.errorText}>{error}</Text>
            )}

            {/* Send OTP Button */}
            <TouchableOpacity
              style={[
                styles.button,
                (loading || phone.length < 10) && styles.buttonDisabled,
              ]}
              onPress={handleSendOtp}
              disabled={loading || phone.length < 10}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.buttonText}>Send OTP</Text>
              )}
            </TouchableOpacity>

            {/* Terms note */}
            <Text style={styles.termsText}>
              By continuing, you agree to our{' '}
              <Text style={styles.termsLink}>Terms of Service</Text>
              {' '}and{' '}
              <Text style={styles.termsLink}>Privacy Policy</Text>
            </Text>
          </View>

        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Error extraction helper ───────────────────────────────────
// Extracts the backend's error message from axios errors.
// Falls back to a generic message if the shape is unexpected.

function extractErrorMessage(err: unknown): string {
  if (
    err &&
    typeof err === 'object' &&
    'response' in err
  ) {
    const axiosErr = err as {
      response?: { data?: { message?: string }; status?: number };
    };

    const status = axiosErr.response?.status;
    const message = axiosErr.response?.data?.message;

    if (status === 429) {
      return message ?? 'Too many attempts. Please wait before trying again.';
    }
    if (status === 403) {
      return message ?? 'Your account has been suspended. Contact support.';
    }
    if (message) {
      return message;
    }
  }
  return 'Something went wrong. Please try again.';
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
    justifyContent: 'space-between',
    paddingBottom: 24,
  },
  header: {
    paddingTop: 48,
    alignItems: 'flex-start',
  },
  logo: {
    fontSize: 36,
    fontWeight: '800',
    color: '#05015A',
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 13,
    color: '#94a3b8',
    marginTop: 4,
    fontWeight: '500',
  },
  form: {
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    lineHeight: 20,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    backgroundColor: '#f8fafc',
    overflow: 'hidden',
    marginTop: 8,
  },
  prefix: {
    paddingHorizontal: 14,
    paddingVertical: 16,
    backgroundColor: '#f1f5f9',
    borderRightWidth: 1.5,
    borderRightColor: '#e2e8f0',
  },
  prefixText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#334155',
  },
  input: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#0f172a',
    paddingHorizontal: 16,
    paddingVertical: 16,
    letterSpacing: 2,
  },
  errorText: {
    fontSize: 13,
    color: '#ef4444',
    fontWeight: '500',
    marginTop: -8,
  },
  button: {
    backgroundColor: '#05015A',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '700',
  },
  termsText: {
    fontSize: 12,
    color: '#94a3b8',
    textAlign: 'center',
    lineHeight: 18,
    marginTop: 8,
  },
  termsLink: {
    color: '#05015A',
    fontWeight: '600',
  },
});