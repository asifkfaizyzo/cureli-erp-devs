import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTheme } from '../../src/theme/ThemeContext';
import { authApi } from '../../src/features/auth/api/auth.api';

export default function PhoneScreen() {
  const { colors } = useTheme();
  const router = useRouter();

  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid = phone.length === 10 && /^[6-9]\d{9}$/.test(phone);

  async function handleSendOtp() {
    if (!isValid) return;
    setError(null);
    setLoading(true);
    try {
      await authApi.sendOtp(`+91${phone}`);
      router.push({ pathname: '/(auth)/otp', params: { phone } });
    } catch (err: any) {
      setError(err?.response?.data?.message ?? 'Failed to send OTP. Try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background.page }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>

        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.wordmark, { color: colors.text.primary }]}>
            cureli
          </Text>
          <Text style={[styles.tagline, { color: colors.text.muted }]}>
            Delivery Partner
          </Text>
        </View>

        {/* Card */}
        <View style={[styles.card, { backgroundColor: colors.background.card, borderColor: colors.border.default }]}>
          <Text style={[styles.title, { color: colors.text.primary }]}>
            Enter your mobile number
          </Text>
          <Text style={[styles.subtitle, { color: colors.text.muted }]}>
            We'll send you a 6-digit OTP to verify
          </Text>

          {/* Input */}
          <View style={[styles.inputRow, {
            backgroundColor: colors.background.input,
            borderColor: error ? colors.status.error : colors.border.input,
          }]}>
            <Text style={[styles.prefix, { color: colors.text.secondary }]}>
              +91
            </Text>
            <View style={[styles.divider, { backgroundColor: colors.border.default }]} />
            <TextInput
              style={[styles.input, { color: colors.text.primary }]}
              placeholder="10-digit mobile number"
              placeholderTextColor={colors.text.faint}
              keyboardType="number-pad"
              maxLength={10}
              value={phone}
              onChangeText={(t) => {
                setPhone(t.replace(/\D/g, ''));
                setError(null);
              }}
              returnKeyType="done"
              onSubmitEditing={handleSendOtp}
            />
          </View>

          {/* Error */}
          {error && (
            <Text style={[styles.errorText, { color: colors.status.error }]}>
              {error}
            </Text>
          )}

          {/* Button */}
          <TouchableOpacity
            style={[
              styles.button,
              {
                backgroundColor: isValid
                  ? colors.brand.primary
                  : colors.border.default,
              },
            ]}
            onPress={handleSendOtp}
            disabled={!isValid || loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>Send OTP</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Text style={[styles.footer, { color: colors.text.faint }]}>
          By continuing, you agree to Cureli's{'\n'}
          Terms of Service and Privacy Policy
        </Text>

      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  inner: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
    gap: 24,
  },
  header: {
    alignItems: 'center',
    gap: 4,
  },
  wordmark: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1,
  },
  tagline: {
    fontSize: 14,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 24,
    gap: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    height: 52,
    marginTop: 4,
  },
  prefix: {
    paddingHorizontal: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  divider: {
    width: 1,
    height: 24,
  },
  input: {
    flex: 1,
    paddingHorizontal: 16,
    fontSize: 18,
    letterSpacing: 1,
  },
  errorText: {
    fontSize: 13,
    marginTop: 2,
  },
  button: {
    height: 52,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  footer: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
});