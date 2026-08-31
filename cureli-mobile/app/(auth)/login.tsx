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
  LayoutAnimation,
} from 'react-native';
import { useState, useRef } from 'react';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { useTheme } from '../../src/theme/ThemeContext';
import { FontFamily } from '../../src/theme/typography';

type LoginStep = 'phone' | 'password';

export default function LoginScreen() {
  const { checkPhone, loginWithPassword } = useAuthStore();
  const { colors, isDark } = useTheme();

  const [step, setStep]             = useState<LoginStep>('phone');
  const [phone, setPhone]           = useState('');
  const [password, setPassword]     = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);

  const scrollRef = useRef<ScrollView>(null);

  // ── Step 1: Check Phone ────────────────────────────────────

  async function handleContinue() {
    Keyboard.dismiss();
    setError(null);

    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length < 10) {
      setError('Enter a valid 10-digit mobile number');
      return;
    }
    if (!/^[6-9]/.test(cleaned)) {
      setError('Enter a valid Indian mobile number');
      return;
    }

    setLoading(true);
    try {
      const normalizedPhone = `+91${cleaned}`;
      const result = await checkPhone(normalizedPhone);

      if (!result.exists) {
        // New user → go to register with phone pre-filled
        router.push({
          pathname: '/(auth)/register',
          params: { phone: cleaned },
        });
        return;
      }

      if (!result.has_password) {
        // Legacy OTP user → go to set-password flow
        router.push({
          pathname: '/(auth)/forgot-password',
          params: { phone: cleaned, mode: 'set-password' },
        });
        return;
      }

      // Existing user with password → show Step 2
      LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
      setStep('password');
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (err: unknown) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  // ── Step 2: Login with Password ────────────────────────────

  async function handleLogin() {
    Keyboard.dismiss();
    setError(null);

    if (!password) {
      setError('Enter your password');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    try {
      const identifier = `+91${phone.replace(/\D/g, '')}`;
      await loginWithPassword(identifier, password);

      const user = useAuthStore.getState().user;
      if (!user?.profile_complete) {
        router.replace('/onboarding/profile' as any);
      } else {
        router.replace('/(tabs)/home');
      }
    } catch (err: unknown) {
      const { message, code } = extractError(err);

      if (code === 'PASSWORD_NOT_SET') {
        router.push({
          pathname: '/(auth)/forgot-password',
          params: { phone: phone.replace(/\D/g, ''), mode: 'set-password' },
        });
        return;
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  }

  function handleBackToPhone() {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setStep('phone');
    setPassword('');
    setError(null);
  }

  function handleInputFocus() {
    setTimeout(() => {
      scrollRef.current?.scrollToEnd({ animated: true });
    }, 350);
  }

  const cleanedPhone = phone.replace(/\D/g, '');
  const canContinue = cleanedPhone.length === 10;
  const canLogin = password.length >= 8;

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
        {/* ── Logo ─────────────────────────────────────── */}
        <View style={styles.topSection}>
          <Image source={logoSource} style={styles.logo} contentFit="contain" />
          <Text style={[styles.brandName, { color: colors.text.primary }]}>
            cureli
          </Text>
          <Text style={[styles.tagline, { color: colors.text.faint }]}>
            medicines delivered fast
          </Text>
        </View>

        {/* ── Form ─────────────────────────────────────── */}
        <View style={styles.formSection}>
          <View style={styles.welcomeBlock}>
            <Text style={[styles.title, { color: colors.text.primary }]}>
              {step === 'phone' ? 'Welcome' : 'Welcome back'}
            </Text>
            <Text style={[styles.subtitle, { color: colors.text.muted }]}>
              {step === 'phone'
                ? 'Enter your mobile number to get started'
                : `Logging in as +91 ${cleanedPhone}`}
            </Text>
          </View>

          {/* ── Back button (Step 2 only) ──────────────── */}
          {step === 'password' && (
            <TouchableOpacity
              style={styles.changePhoneRow}
              onPress={handleBackToPhone}
              disabled={loading}
            >
              <MaterialIcons
                name="arrow-back"
                size={16}
                color={colors.brand.accent}
              />
              <Text
                style={[styles.changePhoneText, { color: colors.brand.accent }]}
              >
                Change number
              </Text>
            </TouchableOpacity>
          )}

          {/* ── Phone input ────────────────────────────── */}
          <View
            style={[
              styles.inputWrapper,
              {
                backgroundColor: colors.background.input,
                borderColor:
                  step === 'phone' && error
                    ? colors.status.error
                    : colors.border.input,
                opacity: step === 'password' ? 0.5 : 1,
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
                style={[styles.prefixText, { color: colors.text.secondary }]}
              >
                +91
              </Text>
            </View>
            <TextInput
              style={[styles.input, { color: colors.text.primary }]}
              value={phone}
              onChangeText={(text) => {
                setPhone(text.replace(/\D/g, '').slice(0, 10));
                if (error) setError(null);
              }}
              placeholder="98765 43210"
              placeholderTextColor={colors.text.faint}
              keyboardType="number-pad"
              maxLength={10}
              returnKeyType={step === 'phone' ? 'done' : 'next'}
              onSubmitEditing={step === 'phone' ? handleContinue : undefined}
              onFocus={handleInputFocus}
              editable={!loading && step === 'phone'}
            />
            {step === 'password' && (
              <MaterialIcons
                name="check-circle"
                size={20}
                color="#22c55e"
                style={{ paddingRight: 14 }}
              />
            )}
          </View>

          {/* ── Password input (Step 2 only) ───────────── */}
          {step === 'password' && (
            <View
              style={[
                styles.inputRow,
                {
                  backgroundColor: colors.background.input,
                  borderColor: error
                    ? colors.status.error
                    : colors.border.input,
                },
              ]}
            >
              <MaterialIcons
                name="lock-outline"
                size={20}
                color={colors.text.faint}
                style={styles.inputIcon}
              />
              <TextInput
                style={[styles.input, { color: colors.text.primary }]}
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (error) setError(null);
                }}
                placeholder="Enter your password"
                placeholderTextColor={colors.text.faint}
                secureTextEntry={!showPassword}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
                onFocus={handleInputFocus}
                editable={!loading}
                autoFocus
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                hitSlop={8}
                style={styles.eyeButton}
              >
                <MaterialIcons
                  name={showPassword ? 'visibility-off' : 'visibility'}
                  size={20}
                  color={colors.text.faint}
                />
              </TouchableOpacity>
            </View>
          )}

          {/* ── Error ──────────────────────────────────── */}
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

          {/* ── Action button ──────────────────────────── */}
          <TouchableOpacity
            style={[
              styles.button,
              {
                backgroundColor: isDark
                  ? colors.brand.accent
                  : colors.brand.primary,
              },
              (loading ||
                (step === 'phone' ? !canContinue : !canLogin)) &&
                styles.buttonDisabled,
            ]}
            onPress={step === 'phone' ? handleContinue : handleLogin}
            disabled={
              loading ||
              (step === 'phone' ? !canContinue : !canLogin)
            }
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" size="small" />
            ) : (
              <>
                <Text style={styles.buttonText}>
                  {step === 'phone' ? 'Continue' : 'Log in'}
                </Text>
                <MaterialIcons
                  name="arrow-forward"
                  size={18}
                  color="#ffffff"
                />
              </>
            )}
          </TouchableOpacity>

          {/* ── Forgot password (Step 2 only) ──────────── */}
          {step === 'password' && (
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: '/(auth)/forgot-password',
                  params: { phone: cleanedPhone },
                })
              }
              disabled={loading}
              style={styles.forgotRow}
            >
              <Text
                style={[styles.forgotText, { color: colors.brand.accent }]}
              >
                Forgot password?
              </Text>
            </TouchableOpacity>
          )}

          {/* ── Sign up link (Step 1 only) ─────────────── */}
          {step === 'phone' && (
            <View style={styles.signupRow}>
              <Text
                style={[styles.signupLabel, { color: colors.text.muted }]}
              >
                New to Cureli?{' '}
              </Text>
              <TouchableOpacity
                onPress={() =>
                  router.push({
                    pathname: '/(auth)/register',
                    params: { phone: cleanedPhone },
                  })
                }
                disabled={loading}
              >
                <Text
                  style={[styles.signupLink, { color: colors.brand.accent }]}
                >
                  Create account
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── Terms ──────────────────────────────────── */}
          <Text style={[styles.termsText, { color: colors.text.faint }]}>
            By continuing, you agree to our{' '}
            <Text style={[styles.termsLink, { color: colors.brand.accent }]}>
              Terms of Service
            </Text>{' '}
            and{' '}
            <Text style={[styles.termsLink, { color: colors.brand.accent }]}>
              Privacy Policy
            </Text>
          </Text>
        </View>

        <View style={styles.keyboardSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Helpers ──────────────────────────────────────────────────

function extractError(err: unknown): { message: string; code?: string } {
  if (err && typeof err === 'object' && 'response' in err) {
    const axiosErr = err as {
      response?: {
        data?: { message?: string; data?: { code?: string } };
        status?: number;
      };
    };
    const message =
      axiosErr.response?.data?.message ?? 'Something went wrong.';
    const code = axiosErr.response?.data?.data?.code;
    return { message, code };
  }
  return { message: 'Something went wrong. Please try again.' };
}

function extractErrorMessage(err: unknown): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const axiosErr = err as {
      response?: { data?: { message?: string }; status?: number };
    };
    const message = axiosErr.response?.data?.message;
    if (message) return message;
  }
  return 'Something went wrong. Please try again.';
}

// ── Styles ───────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 24 },

  topSection: {
    alignItems: 'center',
    paddingTop: 48,
    paddingBottom: 36,
    gap: 4,
  },
  logo: { width: 64, height: 64, marginBottom: 12 },
  brandName: {
    fontSize: 32,
    fontFamily:
      Platform.OS === 'ios' ? FontFamily.amulyaBold : FontFamily.amulya,
    lineHeight: Platform.OS === 'ios' ? 40 : 36,
    letterSpacing: -0.5,
    ...(Platform.OS === 'android' ? { fontWeight: '700' as const } : {}),
  },
  tagline: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    letterSpacing: 0.3,
    marginTop: 2,
  },

  formSection: { paddingHorizontal: 24, gap: 14 },
  welcomeBlock: { gap: 6, marginBottom: 4 },
  title: { fontSize: 26, fontFamily: 'Inter_700Bold', lineHeight: 32 },
  subtitle: { fontSize: 14, fontFamily: 'Inter_400Regular', lineHeight: 22 },

  changePhoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    marginTop: -4,
  },
  changePhoneText: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },

  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 14,
    overflow: 'hidden',
  },
  inputRow: {
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
  prefixFlag: { fontSize: 18 },
  prefixText: { fontSize: 16, fontFamily: 'Inter_600SemiBold' },
  inputIcon: { paddingLeft: 14 },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Inter_500Medium',
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
  eyeButton: { paddingRight: 14, paddingVertical: 8 },

  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: -6,
  },
  errorText: { fontSize: 13, fontFamily: 'Inter_500Medium' },

  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 4,
  },
  buttonDisabled: { opacity: 0.45 },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  },

  forgotRow: { alignItems: 'center', marginTop: 2 },
  forgotText: { fontSize: 14, fontFamily: 'Inter_600SemiBold' },

  signupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  signupLabel: { fontSize: 14, fontFamily: 'Inter_400Regular' },
  signupLink: { fontSize: 14, fontFamily: 'Inter_700Bold' },

  termsText: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 19,
    marginTop: 8,
  },
  termsLink: { fontFamily: 'Inter_600SemiBold' },

  keyboardSpacer: { height: 280 },
});