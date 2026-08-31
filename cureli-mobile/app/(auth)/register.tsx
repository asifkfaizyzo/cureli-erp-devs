// app/(auth)/register.tsx

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
} from "react-native";
import { useState } from "react";
import { router } from "expo-router";
import { Image } from "expo-image";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useAuthStore } from "../../src/store/authStore";
import { useTheme } from "../../src/theme/ThemeContext";
import { FontFamily } from "../../src/theme/typography";

export default function RegisterScreen() {
  const { sendRegisterOtp } = useAuthStore();
  const { colors, isDark } = useTheme();

  // Keep state completely empty to satisfy validation flows
  const [phone, setPhone] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function validate(): string | null {
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length < 10) return "Enter a valid 10-digit mobile number";
    
    // Bypass constraints strictly for the reviewer number past client validations
    const isReview = cleaned === "1234567890";
    if (!isReview && !/^[6-9]/.test(cleaned)) return "Enter a valid Indian mobile number";
    if (password.length < 8) return "Password must be at least 8 characters";
    if (password !== confirmPassword) return "Passwords do not match";
    return null;
  }

  async function handleRegister() {
    Keyboard.dismiss();
    setError(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const cleanedPhone = phone.replace(/\D/g, "");
      const normalizedPhone = `+91${cleanedPhone}`;
      
      await sendRegisterOtp(normalizedPhone);

      router.push({
        pathname: "/(auth)/otp",
        params: {
          phone: cleanedPhone,
          mode: "register",
          password: password,
          fullName: fullName.trim() || undefined,
        },
      });
    } catch (err: unknown) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  const canSubmit =
    phone.replace(/\D/g, "").length === 10 &&
    password.length >= 8 &&
    confirmPassword.length >= 8;

  const logoSource = isDark
    ? require("../../assets/images/cureliwhitenew.png")
    : require("../../assets/images/curelidarknew.png");

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background.page }]}
      edges={["top", "bottom"]}
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
          </TouchableOpacity>

          <View style={styles.topSection}>
            <Image source={logoSource} style={styles.logo} contentFit="contain" />
            <Text style={[styles.brandName, { color: colors.text.primary }]}>
              cureli
            </Text>
          </View>

          <View style={styles.formSection}>
            <View style={styles.welcomeBlock}>
              <Text style={[styles.title, { color: colors.text.primary }]}>
                Create account
              </Text>
              <Text style={[styles.subtitle, { color: colors.text.muted }]}>
                Sign up with your mobile number
              </Text>
            </View>

            <View
              style={[
                styles.inputWrapper,
                {
                  backgroundColor: colors.background.input,
                  borderColor: colors.border.input,
                },
              ]}
            >
              <View
                style={[
                  styles.prefix,
                  {
                    backgroundColor: isDark
                      ? colors.background.elevated
                      : "#f1f5f9",
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
                  setPhone(text.replace(/\D/g, "").slice(0, 10));
                  if (error) setError(null);
                }}
                placeholder="98765 43210"
                placeholderTextColor={colors.text.faint}
                keyboardType="number-pad"
                maxLength={10}
                returnKeyType="next"
                editable={!loading}
              />
            </View>

            <View
              style={[
                styles.inputRow,
                {
                  backgroundColor: colors.background.input,
                  borderColor: colors.border.input,
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
                placeholder="Password (min 8 chars)"
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
                  name={showPassword ? "visibility-off" : "visibility"}
                  size={20}
                  color={colors.text.faint}
                />
              </TouchableOpacity>
            </View>

            <View
              style={[
                styles.inputRow,
                {
                  backgroundColor: colors.background.input,
                  borderColor: colors.border.input,
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
                placeholder="Confirm password"
                placeholderTextColor={colors.text.faint}
                secureTextEntry={!showPassword}
                returnKeyType="done"
                onSubmitEditing={handleRegister}
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
                <Text style={[styles.errorText, { color: colors.status.error }]}>
                  {error}
                </Text>
              </View>
            ) : null}

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
              onPress={handleRegister}
              disabled={loading || !canSubmit}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.buttonText}>Create account</Text>
              )}
            </TouchableOpacity>

            <View style={styles.loginRow}>
              <Text style={[styles.loginLabel, { color: colors.text.muted }]}>
                Already have an account?{" "}
              </Text>
              <TouchableOpacity onPress={() => router.back()} disabled={loading}>
                <Text style={[styles.loginLink, { color: colors.brand.accent }]}>
                  Log in
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.termsText, { color: colors.text.faint }]}>
              By continuing, you agree to our{" "}
              <Text
                style={[styles.termsLink, { color: colors.brand.accent }]}
                onPress={() => router.push("/profile/terms" as any)}
              >
                Terms of Service
              </Text>{' '}
              and{' '}
              <Text
                style={[styles.termsLink, { color: colors.brand.accent }]}
                onPress={() => router.push("/profile/privacy" as any)}
              >
                Privacy Policy
              </Text>
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function extractErrorMessage(err: unknown): string {
  if (err && typeof err === "object" && "response" in err) {
    const axiosErr = err as {
      response?: { data?: { message?: string }; status?: number };
    };
    const message = axiosErr.response?.data?.message;
    if (message) return message;
  }
  return "Something went wrong. Please try again.";
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 40 },

  backButton: {
    padding: 16,
    alignSelf: "flex-start",
  },

  topSection: {
    alignItems: "center",
    paddingTop: 8,
    paddingBottom: 28,
    gap: 4,
  },
  logo: { width: 56, height: 56, marginBottom: 8 },
  brandName: {
    fontSize: 28,
    fontFamily:
      Platform.OS === "ios" ? FontFamily.amulyaBold : FontFamily.amulya,
    ...(Platform.OS === "android" ? { fontWeight: "700" as const } : {}),
  },

  formSection: { paddingHorizontal: 24, gap: 14 },
  welcomeBlock: { gap: 6, marginBottom: 4 },
  title: { fontSize: 26, fontFamily: "Inter_700Bold", lineHeight: 32 },
  subtitle: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 22 },

  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 14,
    overflow: "hidden",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderRadius: 14,
    overflow: "hidden",
  },
  prefix: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 16,
    borderRightWidth: 1.5,
  },
  prefixFlag: { fontSize: 18 },
  prefixText: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  inputIcon: { paddingLeft: 14 },
  input: {
    flex: 1,
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    paddingHorizontal: 14,
    paddingVertical: 16,
  },
  eyeButton: { paddingRight: 14, paddingVertical: 8 },

  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: -6,
  },
  errorText: { fontSize: 13, fontFamily: "Inter_500Medium" },

  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
    marginTop: 4,
  },
  buttonDisabled: { opacity: 0.45 },
  buttonText: {
    color: "#ffffff",
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },

  loginRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  loginLabel: { fontSize: 14, fontFamily: "Inter_400Regular" },
  loginLink: { fontSize: 14, fontFamily: "Inter_700Bold" },

  termsText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 19,
    marginTop: 8,
  },
  termsLink: { fontFamily: "Inter_600SemiBold" },
});