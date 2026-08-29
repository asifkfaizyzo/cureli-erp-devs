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

export default function ForgotPasswordScreen() {
  const { sendResetOtp } = useAuthStore();
  const { colors } = useTheme();
  const params = useLocalSearchParams<{
    phone?: string;
    mode?: string;
  }>();

  const isSetPasswordMode = params.mode === 'set-password';

  const [phone, setPhone]     = useState(params.phone ?? '');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState<string | null>(null);

  function validate(): string | null {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.length === 0) return 'Enter your mobile number';
    if (cleaned.length < 10) return 'Enter a valid 10-digit mobile number';
    if (!/^[6-9]/.test(cleaned)) return 'Enter a valid Indian mobile number';
    return null;
  }

  async function handleSendOtp() {
    Keyboard.dismiss();
    setError(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const cleaned = phone.replace(/\D/g, '');
      const normalized = `+91${cleaned}`;
      await sendResetOtp(normalized);

      router.push({
        pathname: '/(auth)/otp',
        params: {
          phone: cleaned,
          mode: isSetPasswordMode ? 'set-password' : 'reset',
        },
      });
    } catch (err: unknown) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background.page }]}
      edges={['top', 'bottom']}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
      >
        <ScrollView
          style={styles.flex}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          automaticallyAdjustKeyboardInsets={true}
        >
          {/* ── Back ─────────────────────────────────────── */}
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

          {/* ── Header ───────────────────────────────────── */}
          <View style={styles.header}>
            <View
              style={[
                styles.iconWrapper,
                { backgroundColor: colors.background.tint },
              ]}
            >
              <MaterialIcons
                name={isSetPasswordMode ? 'key' : 'lock-reset'}
                size={28}
                color={colors.brand.accent}
              />
            </View>

            <Text style={[styles.title, { color: colors.text.primary }]}>
              {isSetPasswordMode ? 'Set your password' : 'Forgot password?'}
            </Text>
            <Text style={[styles.subtitle, { color: colors.text.muted }]}>
              {isSetPasswordMode
                ? 'Your account needs a password. We\'ll send a verification code to your phone.'
                : 'No worries! We\'ll send a verification code to your phone.'}
            </Text>
          </View>

          {/* ── Phone input ──────────────────────────────── */}
          <View style={styles.formSection}>
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
                    backgroundColor: colors.background.elevated ?? '#f1f5f9',
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
                returnKeyType="done"
                onSubmitEditing={handleSendOtp}
                editable={!loading}
              />
            </View>

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

            <TouchableOpacity
              style={[
                styles.button,
                { backgroundColor: colors.brand.accent },
                (loading || phone.replace(/\D/g, '').length < 10) &&
                  styles.buttonDisabled,
              ]}
              onPress={handleSendOtp}
              disabled={loading || phone.replace(/\D/g, '').length < 10}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.buttonText}>Send verification code</Text>
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
  return 'Something went wrong. Please try again.';
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

  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 8,
  },
  backText: { fontSize: 14, fontFamily: 'Inter_500Medium' },

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
    paddingHorizontal: 12,
  },

  formSection: { gap: 14 },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: "center",
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
  input: {
    flex: 1,
    fontSize: 20,
    fontFamily: 'Inter_600SemiBold',
    paddingHorizontal: 16,
    paddingVertical: 16,
    letterSpacing: 2,
  },

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
});