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

type IdentifierMode = "phone" | "email";

export default function LoginScreen() {
  const { loginWithPassword } = useAuthStore();
  const { colors, isDark } = useTheme();

  const [mode, setMode] = useState<IdentifierMode>("phone");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function validate(): string | null {
    if (mode === "phone") {
      const cleaned = phone.replace(/\D/g, "");
      if (cleaned.length === 0) return "Enter your mobile number";
      if (cleaned.length < 10) return "Enter a valid 10-digit mobile number";
      if (!/^[6-9]/.test(cleaned)) return "Enter a valid Indian mobile number";
    } else {
      if (!email.trim()) return "Enter your email address";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()))
        return "Enter a valid email address";
    }
    if (!password) return "Enter your password";
    if (password.length < 8) return "Password must be at least 8 characters";
    return null;
  }

  async function handleLogin() {
    Keyboard.dismiss();
    setError(null);

    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    try {
      const identifier =
        mode === "phone"
          ? `+91${phone.replace(/\D/g, "")}`
          : email.trim().toLowerCase();

      await loginWithPassword(identifier, password);

      const user = useAuthStore.getState().user;
      if (!user?.profile_complete) {
        router.replace("/onboarding/profile" as any);
      } else {
        router.replace("/(tabs)/home");
      }
    } catch (err: unknown) {
      const { message, code } = extractError(err);

      if (code === "PASSWORD_NOT_SET") {
        const phoneForReset = mode === "phone" ? phone.replace(/\D/g, "") : "";
        router.push({
          pathname: "/(auth)/forgot-password",
          params: {
            phone: phoneForReset,
            mode: "set-password",
          },
        });
        return;
      }

      setError(message);
    } finally {
      setLoading(false);
    }
  }

  const canSubmit =
    (mode === "phone"
      ? phone.replace(/\D/g, "").length === 10
      : email.includes("@")) && password.length >= 8;

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
                Welcome back
              </Text>
              <Text style={[styles.subtitle, { color: colors.text.muted }]}>
                Log in to your account
              </Text>
            </View>

            {/* ── Identifier input ───────────────────────── */}
            {mode === "phone" ? (
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
            ) : (
              <View
                style={[
                  styles.inputWrapperSingle,
                  {
                    backgroundColor: colors.background.input,
                    borderColor: error
                      ? colors.status.error
                      : colors.border.input,
                  },
                ]}
              >
                <MaterialIcons
                  name="mail-outline"
                  size={20}
                  color={colors.text.faint}
                  style={styles.inputIcon}
                />
                <TextInput
                  style={[styles.input, { color: colors.text.primary }]}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    if (error) setError(null);
                  }}
                  placeholder="you@example.com"
                  placeholderTextColor={colors.text.faint}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="next"
                  editable={!loading}
                />
              </View>
            )}

            {/* Toggle identifier mode */}
            <TouchableOpacity
              onPress={() => {
                setMode(mode === "phone" ? "email" : "phone");
                setError(null);
              }}
              disabled={loading}
            >
              <Text style={[styles.toggleText, { color: colors.brand.accent }]}>
                {mode === "phone"
                  ? "Use email instead"
                  : "Use phone number instead"}
              </Text>
            </TouchableOpacity>

            {/* ── Password input ─────────────────────────── */}
            <View
              style={[
                styles.inputWrapperSingle,
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
                placeholder="Password"
                placeholderTextColor={colors.text.faint}
                secureTextEntry={!showPassword}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
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

            {/* ── Error ──────────────────────────────────── */}
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

            {/* ── Login button ───────────────────────────── */}
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
              onPress={handleLogin}
              disabled={loading || !canSubmit}
              activeOpacity={0.85}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <>
                  <Text style={styles.buttonText}>Log in</Text>
                  <MaterialIcons name="arrow-forward" size={18} color="#ffffff" />
                </>
              )}
            </TouchableOpacity>

            {/* ── Forgot password ────────────────────────── */}
            <TouchableOpacity
              onPress={() =>
                router.push({
                  pathname: "/(auth)/forgot-password",
                  params: {
                    phone: mode === "phone" ? phone.replace(/\D/g, "") : "",
                  },
                })
              }
              disabled={loading}
              style={styles.forgotRow}
            >
              <Text style={[styles.forgotText, { color: colors.brand.accent }]}>
                Forgot password?
              </Text>
            </TouchableOpacity>

            {/* ── Sign up link ───────────────────────────── */}
            <View style={styles.signupRow}>
              <Text style={[styles.signupLabel, { color: colors.text.muted }]}>
                Don't have an account?{" "}
              </Text>
              <TouchableOpacity
                onPress={() => router.push("/(auth)/register")}
                disabled={loading}
              >
                <Text style={[styles.signupLink, { color: colors.brand.accent }]}>
                  Sign up
                </Text>
              </TouchableOpacity>
            </View>

            {/* ── Terms ──────────────────────────────────── */}
            <Text style={[styles.termsText, { color: colors.text.faint }]}>
              By continuing, you agree to our{" "}
              <Text
                style={[styles.termsLink, { color: colors.brand.accent }]}
                onPress={() => router.push("/profile/terms" as any)}
              >
                Terms of Service
              </Text>{" "}
              and{" "}
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

function extractError(err: unknown): { message: string; code?: string } {
  if (err && typeof err === "object" && "response" in err) {
    const axiosErr = err as {
      response?: {
        data?: { message?: string; data?: { code?: string } };
        status?: number;
      };
    };
    const message = axiosErr.response?.data?.message ?? "Something went wrong.";
    const code = axiosErr.response?.data?.data?.code;
    const status = axiosErr.response?.status;

    if (status === 429)
      return {
        message:
          message ?? "Too many attempts. Please wait before trying again.",
        code,
      };
    if (status === 403)
      return {
        message: message ?? "Your account has been suspended.",
        code,
      };
    return { message, code };
  }
  return { message: "Something went wrong. Please try again." };
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingBottom: 40 },

  topSection: {
    alignItems: "center",
    paddingTop: 48,
    paddingBottom: 36,
    gap: 4,
  },
  logo: { width: 64, height: 64, marginBottom: 12 },
  brandName: {
    fontSize: 32,
    fontFamily:
      Platform.OS === "ios" ? FontFamily.amulyaBold : FontFamily.amulya,
    lineHeight: Platform.OS === "ios" ? 40 : 36,
    letterSpacing: -0.5,
    ...(Platform.OS === "android" ? { fontWeight: "700" as const } : {}),
  },
  tagline: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    letterSpacing: 0.3,
    marginTop: 2,
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
  inputWrapperSingle: {
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

  toggleText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    alignSelf: "flex-start",
    marginTop: -4,
  },

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

  forgotRow: { alignItems: "center", marginTop: 2 },
  forgotText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },

  signupRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },
  signupLabel: { fontSize: 14, fontFamily: "Inter_400Regular" },
  signupLink: { fontSize: 14, fontFamily: "Inter_700Bold" },

  termsText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 19,
    marginTop: 8,
  },
  termsLink: { fontFamily: "Inter_600SemiBold" },
});