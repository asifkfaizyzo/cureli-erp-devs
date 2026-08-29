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
  KeyboardAvoidingView,
} from 'react-native';
import { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuthStore } from '../../src/store/authStore';
import { useTheme } from '../../src/theme/ThemeContext';

export default function NewPasswordScreen() {
  const { resetPassword } = useAuthStore();
  const { colors, isDark } = useTheme();

  const params = useLocalSearchParams<{
    phone: string;
    otp: string;
    mode?: string;
  }>();

  const phone = params.phone ?? '';
  const otp = params.otp ?? '';
  const isSetPasswordMode = params.mode === 'set-password';

  const [password, setPassword]               = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword]       = useState(false);
  const [loading, setLoading]                 = useState(false);
  const [error, setError]                     = useState<string | null>(null);
  const [isSuccess, setIsSuccess]             = useState(false);

  function validate(): string | null {
    if (!password) return 'Enter a new password';
    if (password.length < 8) return 'Password must be at least 8 characters';
    if (password !== confirmPassword) return 'Passwords do not match';
    return null;
  }

  async function handleResetPassword() {
    Keyboard.dismiss();
    setError(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const normalizedPhone = `+91${phone}`;
      await resetPassword(normalizedPhone, otp, password);

      // Show gratitude & confirmation feedback
      setIsSuccess(true);
    } catch (err: unknown) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  function handleNavigateToLogin() {
    router.dismissAll();
    router.replace({
      pathname: '/(auth)/login',
      params: { mode: 'phone' },
    });
  }

  const canSubmit = password.length >= 8 && confirmPassword.length >= 8;

  // ── Success State View ──────────────────────────────────────────
  if (isSuccess) {
    return (
      <SafeAreaView
        style={[styles.safe, { backgroundColor: colors.background.page }]}
        edges={['top', 'bottom']}
      >
        <View style={styles.successContainer}>
          <View
            style={[
              styles.successIconWrapper,
              { backgroundColor: colors.background.tint },
            ]}
          >
            <MaterialIcons
              name="check-circle"
              size={64}
              color={colors.brand.accent}
            />
          </View>

          <Text style={[styles.title, { color: colors.text.primary }]}>
            {isSetPasswordMode ? 'Password Created!' : 'Password Changed!'}
          </Text>

          <Text style={[styles.subtitle, { color: colors.text.muted }]}>
            Thank you for keeping your account secure. Your password has been
            successfully updated. Please log in with your new password to
            continue.
          </Text>

          <TouchableOpacity
            style={[
              styles.button,
              styles.successButton,
              {
                backgroundColor: isDark
                  ? colors.brand.accent
                  : colors.brand.primary,
              },
            ]}
            onPress={handleNavigateToLogin}
            activeOpacity={0.85}
          >
            <Text style={styles.buttonText}>Log In with New Password</Text>
            <MaterialIcons name="arrow-forward" size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Form State View ─────────────────────────────────────────────
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
          automaticallyAdjustKeyboardInsets={true}
        >
          {/* ── Header ───────────────────────────────────── */}
          <View style={styles.header}>
            <View
              style={[
                styles.iconWrapper,
                { backgroundColor: colors.background.tint },
              ]}
            >
              <MaterialIcons
                name="lock"
                size={28}
                color={colors.brand.accent}
              />
            </View>

            <Text style={[styles.title, { color: colors.text.primary }]}>
              {isSetPasswordMode ? 'Create your password' : 'Reset password'}
            </Text>
            <Text style={[styles.subtitle, { color: colors.text.muted }]}>
              Choose a strong password with at least 8 characters.
            </Text>
          </View>

          {/* ── Form ─────────────────────────────────────── */}
          <View style={styles.formSection}>
            {/* New password input */}
            <View
              style={[
                styles.inputRow,
                {
                  backgroundColor: colors.background.input,
                  borderColor: error ? colors.status.error : colors.border.input,
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
                placeholder="New password (min 8 chars)"
                placeholderTextColor={colors.text.faint}
                secureTextEntry={!showPassword}
                returnKeyType="next"
                editable={!loading}
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

            {/* Confirm password input */}
            <View
              style={[
                styles.inputRow,
                {
                  backgroundColor: colors.background.input,
                  borderColor: error ? colors.status.error : colors.border.input,
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
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  if (error) setError(null);
                }}
                placeholder="Confirm new password"
                placeholderTextColor={colors.text.faint}
                secureTextEntry={!showPassword}
                returnKeyType="done"
                onSubmitEditing={handleResetPassword}
                editable={!loading}
              />
            </View>

            {/* Error Message */}
            {error ? (
              <View style={styles.errorRow}>
                <MaterialIcons
                  name="error-outline"
                  size={14}
                  color={colors.status.error}
                />
                <Text style={[styles.errorText, { color: colors.status.error }]}>
                  {error}
                </Text>
              </View>
            ) : null}

            {/* Submit button */}
            <TouchableOpacity
              style={[
                styles.button,
                {
                  backgroundColor: isDark
                    ? colors.brand.accent
                    : colors.brand.primary,
                },
                (loading || !canSubmit) && styles.buttonDisabled,
              ]}
              onPress={handleResetPassword}
              disabled={loading || !canSubmit}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.buttonText}>
                  {isSetPasswordMode ? 'Set Password & Log In' : 'Update Password'}
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
  return 'Password reset failed. Please try again.';
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },

  header: { alignItems: 'center', gap: 10, paddingTop: 32, paddingBottom: 32 },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontFamily: 'Inter_700Bold',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 24,
  },

  formSection: { gap: 14 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 14,
    overflow: 'hidden',
  },
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

  /* ── Success Feedback Styles ── */
  successContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 16,
  },
  successIconWrapper: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  successButton: {
    width: '100%',
    marginTop: 20,
  },
});