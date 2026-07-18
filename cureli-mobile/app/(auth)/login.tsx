// app/(auth)/login.tsx

import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  Keyboard,
  Platform,
} from 'react-native';
import { useState, useRef } from 'react';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { useTheme } from '../../src/theme/ThemeContext';
import { FontFamily } from '../../src/theme/typography';

export default function LoginScreen() {
  const { sendOtp } = useAuthStore();
  const { colors, isDark } = useTheme();

  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const scrollRef = useRef<ScrollView>(null);

  function validatePhone(value: string): string | null {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length === 0) return 'Enter your mobile number';
    if (cleaned.length < 10) return 'Enter a valid 10-digit mobile number';
    if (cleaned.length > 10) return 'Mobile number must be 10 digits';
    if (!/^[6-9]/.test(cleaned)) return 'Enter a valid Indian mobile number';
    return null;
  }

  async function handleSendOtp() {
    Keyboard.dismiss();
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
      router.push({
        pathname: '/(auth)/otp',
        params: { phone: cleaned },
      });
    } catch (err: unknown) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  function handleInputFocus() {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 350);
  }

  const logoSource = isDark
    ? require('../../assets/images/cureliwhitenew.png')
    : require('../../assets/images/curelidarknew.png');

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background.page }]}
      edges={['top', 'bottom']}
    >
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* ── Logo + branding ────────────────────────── */}
        <View style={styles.topSection}>
          <Image
            source={logoSource}
            style={styles.logo}
            contentFit="contain"
          />
          <Text style={[styles.brandName, { color: colors.text.primary }]}>
            cureli
          </Text>
          <Text style={[styles.tagline, { color: colors.text.faint }]}>
            medicines delivered fast
          </Text>
        </View>

        {/* ── Form ───────────────────────────────────── */}
        <View style={styles.formSection}>
          <View style={styles.welcomeBlock}>
            <Text style={[styles.title, { color: colors.text.primary }]}>
              Welcome
            </Text>
            <Text style={[styles.subtitle, { color: colors.text.muted }]}>
              Enter your mobile number to get started
            </Text>
          </View>

          {/* Phone input */}
          <View
            style={[
              styles.inputWrapper,
              {
                backgroundColor: colors.background.input,
                borderColor: error
                  ? colors.status.error
                  : colors.border.input,
              },
            ]}
          >
            <View
              style={[
                styles.prefix,
                {
                  backgroundColor: isDark
                    ? colors.background.elevated
                    : '#f1f5f9',
                  borderRightColor: colors.border.input,
                },
              ]}
            >
              <Text style={styles.prefixFlag}>🇮🇳</Text>
              <Text
                style={[
                  styles.prefixText,
                  { color: colors.text.secondary },
                ]}
              >
                +91
              </Text>
            </View>

            <TextInput
              style={[styles.input, { color: colors.text.primary }]}
              value={phone}
              onChangeText={(text) => {
                const digits = text.replace(/\D/g, '').slice(0, 10);
                setPhone(digits);
                if (error) setError(null);
              }}
              placeholder="98765 43210"
              placeholderTextColor={colors.text.faint}
              keyboardType="number-pad"
              maxLength={10}
              returnKeyType="done"
              onSubmitEditing={handleSendOtp}
              onFocus={handleInputFocus}
              editable={!loading}
            />
          </View>

          {/* Error */}
          {error ? (
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
          ) : null}

          {/* Send OTP button */}
          <TouchableOpacity
            style={[
              styles.button,
              {
                backgroundColor: isDark
                  ? colors.brand.accent
                  : colors.brand.primary,
              },
              (loading || phone.length < 10) && styles.buttonDisabled,
            ]}
            onPress={handleSendOtp}
            disabled={loading || phone.length < 10}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <>
                <Text style={styles.buttonText}>Send OTP</Text>
                <MaterialIcons
                  name="arrow-forward"
                  size={18}
                  color="#ffffff"
                />
              </>
            )}
          </TouchableOpacity>

          {/* Terms */}
          <Text style={[styles.termsText, { color: colors.text.faint }]}>
            By continuing, you agree to our{' '}
            <Text
              style={[styles.termsLink, { color: colors.brand.accent }]}
            >
              Terms of Service
            </Text>{' '}
            and{' '}
            <Text
              style={[styles.termsLink, { color: colors.brand.accent }]}
            >
              Privacy Policy
            </Text>
          </Text>
        </View>

        {/* ── Scroll padding ─────────────────────────── */}
        <View style={styles.keyboardSpacer} />
      </ScrollView>
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
    if (status === 429)
      return message ?? 'Too many attempts. Please wait before trying again.';
    if (status === 403)
      return message ?? 'Your account has been suspended. Contact support.';
    if (message) return message;
  }
  return 'Something went wrong. Please try again.';
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 24,
  },

  // ── Top: logo ──
  topSection: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 48,
    gap: 4,
  },
  logo: {
    width: 72,
    height: 72,
    marginBottom: 16,
  },
  brandName: {
    fontSize: 34,
    fontFamily: Platform.OS === 'ios' ? FontFamily.amulyaBold : FontFamily.amulya,
    lineHeight: Platform.OS === 'ios' ? 42 : 38,
    letterSpacing: -0.5,
    ...(Platform.OS === 'android' ? { fontWeight: '700' as const } : {}),
  },
  tagline: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    letterSpacing: 0.3,
    marginTop: 2,
  },

  // ── Form ──
  formSection: {
    paddingHorizontal: 24,
    gap: 16,
  },
  welcomeBlock: {
    gap: 6,
    marginBottom: 8,
  },
  title: {
    fontSize: 26,
    fontFamily: 'Inter_700Bold',
    lineHeight: 32,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    lineHeight: 22,
  },

  // ── Phone input ──
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 14,
    overflow: 'hidden',
  },
  prefix: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 16,
    borderRightWidth: 1.5,
  },
  prefixFlag: {
    fontSize: 18,
  },
  prefixText: {
    fontSize: 16,
    fontFamily: 'Inter_600SemiBold',
  },
  input: {
    flex: 1,
    fontSize: 20,
    fontFamily: 'Inter_600SemiBold',
    paddingHorizontal: 16,
    paddingVertical: 16,
    letterSpacing: 2,
  },

  // ── Error ──
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: -8,
  },
  errorText: {
    fontSize: 13,
    fontFamily: 'Inter_500Medium',
  },

  // ── Button ──
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 4,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  },

  // ── Terms ──
  termsText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 4,
  },
  termsLink: {
    fontFamily: 'Inter_600SemiBold',
  },

  // ── Keyboard spacer ──
  keyboardSpacer: {
    height: 320,
  },
});