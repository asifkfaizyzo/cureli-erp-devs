// src/features/profile/screens/EditProfileScreen.tsx

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useProfile } from "../hooks/useProfile";
import { useUpdateProfile } from "../hooks/useUpdateProfile";
import { useTheme } from "../../../theme/ThemeContext";
import { useDialog } from "../../../components/Dialog/DialogProvider";
import { WheelDatePicker } from "../../onboarding/screens/WheelDatePicker";
import type { UserSex } from "../../../types/auth";

// ── Constants ─────────────────────────────────────────────────

const SEX_OPTIONS: { value: UserSex; label: string }[] = [
  { value: "MALE",   label: "Male"   },
  { value: "FEMALE", label: "Female" },
  { value: "OTHER",  label: "Other"  },
];

// ── Helpers ───────────────────────────────────────────────────

function formatDobForDisplay(dob: string): string {
  const [year, month, day] = dob.split("-").map(Number);
  const months = [
    "Jan","Feb","Mar","Apr","May","Jun",
    "Jul","Aug","Sep","Oct","Nov","Dec",
  ];
  return `${day} ${months[month - 1]} ${year}`;
}

interface FormErrors {
  full_name?: string;
  email?: string;
}

function validate(name: string, email: string): FormErrors {
  const errors: FormErrors = {};
  if (name.trim().length > 0 && name.trim().length < 2) {
    errors.full_name = "Name must be at least 2 characters";
  }
  if (name.trim().length > 200) {
    errors.full_name = "Name must not exceed 200 characters";
  }
  if (email.trim().length > 0) {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = "Enter a valid email address";
    }
  }
  return errors;
}

// ── Screen ────────────────────────────────────────────────────

export function EditProfileScreen() {
  const { colors, isDark } = useTheme();
  const { alert } = useDialog();
  const { user } = useProfile();
  const {
    updateProfile,
    isPending,
    error: mutationError,
    reset,
  } = useUpdateProfile();

  const [fullName, setFullName] = useState("");
  const [email,    setEmail]    = useState("");
  const [dob,      setDob]      = useState<string | null>(null);
  const [sex,      setSex]      = useState<UserSex | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [errors,  setErrors]    = useState<FormErrors>({});
  const [touched, setTouched]   = useState({ full_name: false, email: false });

  const brandColor = isDark ? colors.brand.accent : colors.brand.primary;

  // Pre-fill from current user data
  useEffect(() => {
    if (user) {
      setFullName(user.full_name ?? "");
      setEmail(user.email ?? "");
      setDob(user.date_of_birth ?? null);
      setSex(user.sex ?? null);
    }
  }, [user]);

  // Clear mutation error when user edits any field
  useEffect(() => {
    if (mutationError) reset();
  }, [fullName, email, dob, sex]);

  const handleBlur = (field: "full_name" | "email") => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors(validate(fullName, email));
  };

  const handleSave = () => {
    const errs = validate(fullName, email);
    setErrors(errs);
    setTouched({ full_name: true, email: true });
    if (Object.keys(errs).length > 0) return;

    const trimmedName  = fullName.trim();
    const trimmedEmail = email.trim();

    const payload: {
      full_name?: string;
      email?: string | null;
      date_of_birth?: string | null;
      sex?: UserSex | null;
    } = {};

    if (trimmedName !== (user?.full_name ?? ""))
      payload.full_name = trimmedName || undefined;
    if (trimmedEmail !== (user?.email ?? ""))
      payload.email = trimmedEmail || null;
    if (dob !== (user?.date_of_birth ?? null))
      payload.date_of_birth = dob;
    if (sex !== (user?.sex ?? null))
      payload.sex = sex;

    if (Object.keys(payload).length === 0) {
      router.back();
      return;
    }

    updateProfile(
      {
        full_name:     trimmedName,
        email:         trimmedEmail || null,
        date_of_birth: dob,
        sex,
      },
      {
        onError: async (err) => {
          await alert({
            title: "Error",
            message:
              (err as { message?: string })?.message ??
              "Failed to save changes",
            confirmLabel: "OK",
            icon: "error-outline",
          });
        },
      },
    );
  };

  const hasChanges =
    fullName.trim() !== (user?.full_name ?? "") ||
    email.trim()    !== (user?.email ?? "")     ||
    dob             !== (user?.date_of_birth ?? null) ||
    sex             !== (user?.sex ?? null);

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background.page }]}
      edges={["top", "bottom"]}
    >
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            backgroundColor: colors.background.card,
            borderBottomColor: colors.border.default,
          },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <MaterialIcons name="arrow-back" size={22} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>
          Edit Profile
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Mutation error banner */}
        {mutationError ? (
          <View
            style={[
              styles.errorBanner,
              {
                backgroundColor: colors.status.errorBg,
                borderColor: colors.status.errorBorder,
              },
            ]}
          >
            <MaterialIcons name="error-outline" size={16} color={colors.status.error} />
            <Text
              style={[
                styles.errorBannerText,
                { color: colors.status.error, fontFamily: "Inter_500Medium" },
              ]}
            >
              {mutationError}
            </Text>
          </View>
        ) : null}

        {/* ── Full Name ──────────────────────────────────── */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text.secondary, fontFamily: "Inter_600SemiBold" }]}>
            Full Name
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.background.input,
                borderColor:
                  touched.full_name && errors.full_name
                    ? colors.status.error
                    : colors.border.input,
                color: colors.text.primary,
                fontFamily: "Inter_400Regular",
              },
            ]}
            value={fullName}
            onChangeText={setFullName}
            onBlur={() => handleBlur("full_name")}
            placeholder="Enter your full name"
            placeholderTextColor={colors.text.faint}
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="next"
            maxLength={200}
          />
          {touched.full_name && errors.full_name ? (
            <Text style={[styles.fieldError, { color: colors.status.error, fontFamily: "Inter_500Medium" }]}>
              {errors.full_name}
            </Text>
          ) : null}
        </View>

        {/* ── Date of Birth ──────────────────────────────── */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text.secondary, fontFamily: "Inter_600SemiBold" }]}>
            Date of Birth
          </Text>
          <TouchableOpacity
            style={[
              styles.input,
              styles.pickerTrigger,
              {
                backgroundColor: colors.background.input,
                borderColor: colors.border.input,
              },
            ]}
            onPress={() => setShowDatePicker(true)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.pickerText,
                { color: dob ? colors.text.primary : colors.text.faint, fontFamily: "Inter_400Regular" },
              ]}
            >
              {dob ? formatDobForDisplay(dob) : "Select date of birth"}
            </Text>
            <MaterialIcons name="calendar-today" size={17} color={colors.text.muted} />
          </TouchableOpacity>
        </View>

        {/* ── Sex ───────────────────────────────────────── */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text.secondary, fontFamily: "Inter_600SemiBold" }]}>
            Sex
          </Text>
          <View style={styles.sexRow}>
            {SEX_OPTIONS.map((opt) => {
              const isSelected = sex === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.sexChip,
                    {
                      backgroundColor: isSelected ? brandColor : colors.background.input,
                      borderColor:     isSelected ? brandColor : colors.border.input,
                    },
                  ]}
                  onPress={() => setSex(opt.value)}
                  activeOpacity={0.75}
                >
                  <Text
                    style={[
                      styles.sexChipText,
                      {
                        color:      isSelected ? "#ffffff" : colors.text.secondary,
                        fontFamily: isSelected ? "Inter_600SemiBold" : "Inter_400Regular",
                      },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Email ─────────────────────────────────────── */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text.secondary, fontFamily: "Inter_600SemiBold" }]}>
            Email{" "}
            <Text style={{ color: colors.text.faint, fontFamily: "Inter_400Regular" }}>
              (optional)
            </Text>
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.background.input,
                borderColor:
                  touched.email && errors.email
                    ? colors.status.error
                    : colors.border.input,
                color: colors.text.primary,
                fontFamily: "Inter_400Regular",
              },
            ]}
            value={email}
            onChangeText={setEmail}
            onBlur={() => handleBlur("email")}
            placeholder="Enter your email address"
            placeholderTextColor={colors.text.faint}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            maxLength={255}
          />
          {touched.email && errors.email ? (
            <Text style={[styles.fieldError, { color: colors.status.error, fontFamily: "Inter_500Medium" }]}>
              {errors.email}
            </Text>
          ) : null}
          <Text style={[styles.fieldHint, { color: colors.text.faint, fontFamily: "Inter_400Regular" }]}>
            Used for order confirmations and receipts
          </Text>
        </View>

        {/* ── Phone — locked ────────────────────────────── */}
        <View style={styles.field}>
          <Text style={[styles.label, { color: colors.text.secondary, fontFamily: "Inter_600SemiBold" }]}>
            Phone Number
          </Text>
          <View style={styles.phoneRow}>
            <TextInput
              style={[
                styles.input,
                styles.inputLocked,
                {
                  backgroundColor: colors.background.elevated,
                  borderColor:     colors.border.subtle,
                  color:           colors.text.faint,
                  fontFamily:      "Inter_400Regular",
                },
              ]}
              value={user?.phone ?? ""}
              editable={false}
            />
            <View
              style={[
                styles.verifiedBadge,
                {
                  backgroundColor: colors.status.successBg,
                  borderColor:     colors.status.successBorder,
                },
              ]}
            >
              <MaterialIcons name="verified" size={13} color={colors.status.success} />
              <Text style={[styles.verifiedText, { color: colors.status.success, fontFamily: "Inter_600SemiBold" }]}>
                Verified
              </Text>
            </View>
          </View>
          <Text style={[styles.fieldHint, { color: colors.text.faint, fontFamily: "Inter_400Regular" }]}>
            Phone number cannot be changed — it is your login identity
          </Text>
        </View>

        {/* ── Save ──────────────────────────────────────── */}
        <TouchableOpacity
          style={[
            styles.saveButton,
            { backgroundColor: brandColor },
            (!hasChanges || isPending) && styles.saveButtonDisabled,
          ]}
          onPress={handleSave}
          disabled={!hasChanges || isPending}
          activeOpacity={0.8}
        >
          {isPending ? <ActivityIndicator size={18} color="#ffffff" /> : null}
          <Text style={[styles.saveButtonText, { fontFamily: "Inter_700Bold" }]}>
            {isPending ? "Saving…" : "Save Changes"}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Date Picker */}
      <WheelDatePicker
        visible={showDatePicker}
        value={dob}
        onConfirm={(dateStr) => {
          setDob(dateStr);
          setShowDatePicker(false);
        }}
        onClose={() => setShowDatePicker(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 8,
  },
  headerTitle: { fontSize: 17 },
  headerRight: { width: 36 },
  scroll: { flex: 1 },
  content: { padding: 20, gap: 8 },
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  errorBannerText: { flex: 1, fontSize: 13 },
  field: { marginBottom: 20 },
  label: { fontSize: 13, marginBottom: 8 },
  input: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  inputLocked: { flex: 1 },
  pickerTrigger: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  pickerText: { fontSize: 15 },
  sexRow: {
    flexDirection: "row",
    gap: 10,
  },
  sexChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  sexChipText: { fontSize: 14 },
  phoneRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  verifiedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  verifiedText: { fontSize: 11 },
  fieldError: { fontSize: 12, marginTop: 5 },
  fieldHint: { fontSize: 12, marginTop: 5 },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  saveButtonDisabled: { opacity: 0.45 },
  saveButtonText: { fontSize: 15, color: "#ffffff" },
});