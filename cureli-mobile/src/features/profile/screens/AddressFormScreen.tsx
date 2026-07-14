// src/features/profile/screens/AddressFormScreen.tsx

import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { MaterialIcons } from "@expo/vector-icons";
import { useAddresses } from "../hooks/useAddresses";
import { useAddressMutations } from "../hooks/useAddressMutations";
import { useProfile } from "../hooks/useProfile";
import { extractErrorMessage } from "../api/profile.api";
import { ADDRESS_LABELS } from "../constants/profile.constants";
import { useTheme } from "../../../theme/ThemeContext";
import { useDialog } from "../../../components/Dialog/DialogProvider";
import { LocationPickerSheet } from "../components/LocationPickerSheet";
import type { AddressLabel } from "../constants/profile.constants";
import type { AddressFormData } from "../types/profile.types";
import type { PlaceDetails } from "../api/places.api";

// ── Form state ─────────────────────────────────────────────────

interface FormState {
  label: AddressLabel;
  custom_label: string;
  recipient_name: string;
  recipient_phone: string;
  address_line_1: string;
  address_line_2: string;
  landmark: string;
  city: string;
  state: string;
  pincode: string;
  is_default: boolean;
  // Coordinates — populated by location picker
  latitude: number | null;
  longitude: number | null;
}

const EMPTY_FORM: FormState = {
  label: "Home",
  custom_label: "",
  recipient_name: "",
  recipient_phone: "",
  address_line_1: "",
  address_line_2: "",
  landmark: "",
  city: "",
  state: "",
  pincode: "",
  is_default: false,
  latitude: null,
  longitude: null,
};

// ── Validation ─────────────────────────────────────────────────

interface FormErrors {
  custom_label?: string;
  address_line_1?: string;
  city?: string;
  state?: string;
  pincode?: string;
  recipient_phone?: string;
}

function validateForm(form: FormState): FormErrors {
  const errors: FormErrors = {};

  if (form.label === "Other" && !form.custom_label.trim()) {
    errors.custom_label = "Please enter a label for this address";
  }
  if (form.address_line_1.trim().length < 5) {
    errors.address_line_1 = "Address is too short (min 5 characters)";
  }
  if (!form.city.trim()) {
    errors.city = "City is required";
  }
  if (!form.state.trim()) {
    errors.state = "State is required";
  }
  if (!/^\d{6}$/.test(form.pincode.trim())) {
    errors.pincode = "Enter a valid 6-digit pincode";
  }
  if (form.recipient_phone.trim()) {
    const stripped = form.recipient_phone.trim().replace(/^\+?91/, "");
    if (!/^[6-9]\d{9}$/.test(stripped)) {
      errors.recipient_phone = "Enter a valid Indian mobile number";
    }
  }

  return errors;
}

// ── Props ──────────────────────────────────────────────────────

interface AddressFormScreenProps {
  addressId?: string;
}

// ── Component ──────────────────────────────────────────────────

export function AddressFormScreen({ addressId }: AddressFormScreenProps) {
  const { colors, isDark } = useTheme();
  const { alert } = useDialog();
  const isEditMode = Boolean(addressId);
  const { addresses } = useAddresses();
  const { user } = useProfile();
  const { createAddress, isCreating, updateAddress, isUpdating } =
    useAddressMutations();

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<
    Partial<Record<keyof FormErrors, boolean>>
  >({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [locationPickerVisible, setLocationPickerVisible] = useState(false);

  const scrollRef = useRef<ScrollView>(null);
  const isPending = isCreating || isUpdating;
  const brandColor = isDark ? colors.brand.accent : colors.brand.primary;

  // ── Seed form on mount ─────────────────────────────────────

  useEffect(() => {
    if (isEditMode && addresses.length > 0) {
      const existing = addresses.find((a) => a.id === addressId);
      if (!existing) {
        alert({
          title: "Error",
          message: "Address not found",
          confirmLabel: "OK",
        }).then(() => router.back());
        return;
      }
      setForm({
        label: existing.label as AddressLabel,
        custom_label: existing.custom_label ?? "",
        recipient_name: existing.recipient_name ?? "",
        recipient_phone: existing.recipient_phone ?? "",
        address_line_1: existing.address_line_1,
        address_line_2: existing.address_line_2 ?? "",
        landmark: existing.landmark ?? "",
        city: existing.city,
        state: existing.state,
        pincode: existing.pincode,
        is_default: existing.is_default,
        latitude: existing.latitude ? Number(existing.latitude) : null,
        longitude: existing.longitude ? Number(existing.longitude) : null,
      });
    } else if (!isEditMode && user) {
      setForm((prev) => ({
        ...prev,
        recipient_name: user.full_name ?? "",
        recipient_phone: user.phone ?? "",
      }));
    }
  }, [isEditMode, addresses, user]);

  // ── Field helpers ──────────────────────────────────────────

  const setField = <K extends keyof FormState>(
    key: K,
    value: FormState[K],
  ) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSubmitError(null);
    if (touched[key as keyof FormErrors]) {
      const updated = { ...form, [key]: value };
      const errs = validateForm(updated);
      setErrors((prev) => ({
        ...prev,
        [key]: errs[key as keyof FormErrors],
      }));
    }
  };

  const handleBlur = (key: keyof FormErrors) => {
    setTouched((prev) => ({ ...prev, [key]: true }));
    const errs = validateForm(form);
    setErrors((prev) => ({ ...prev, [key]: errs[key] }));
  };

  const scrollToY = (y: number) => {
    scrollRef.current?.scrollTo({ y, animated: true });
  };

  // ── Location picker confirm ────────────────────────────────

  const handleLocationConfirm = useCallback((details: PlaceDetails) => {
    setForm((prev) => ({
      ...prev,
      // Only overwrite fields that the place returned a value for.
      // Never blank out something the user already typed.
      address_line_1:
        details.address_line_1 && details.address_line_1.trim().length >= 5
          ? details.address_line_1
          : prev.address_line_1,
      address_line_2: details.address_line_2 ?? prev.address_line_2,
      city: details.city ?? prev.city,
      state: details.state ?? prev.state,
      pincode: details.pincode ?? prev.pincode,
      latitude: details.latitude ?? prev.latitude,
      longitude: details.longitude ?? prev.longitude,
    }));

    // Clear errors for fields we just filled
    setErrors((prev) => ({
      ...prev,
      address_line_1:
        details.address_line_1 &&
        details.address_line_1.trim().length >= 5
          ? undefined
          : prev.address_line_1,
      city: details.city ? undefined : prev.city,
      state: details.state ? undefined : prev.state,
      pincode:
        details.pincode && /^\d{6}$/.test(details.pincode)
          ? undefined
          : prev.pincode,
    }));

    // Mark touched so validation messages show correctly
    setTouched((prev) => ({
      ...prev,
      address_line_1: true,
      city: true,
      state: true,
      pincode: true,
    }));

    setSubmitError(null);
  }, []);

  // ── Submit ─────────────────────────────────────────────────

  const handleSubmit = async () => {
    setTouched({
      custom_label: true,
      address_line_1: true,
      city: true,
      state: true,
      pincode: true,
      recipient_phone: true,
    });

    const errs = validateForm(form);
    setErrors(errs);
    if (Object.keys(errs).length > 0) return;

    setSubmitError(null);

    const payload: AddressFormData = {
      label: form.label,
      custom_label:
        form.label === "Other" ? form.custom_label.trim() : undefined,
      recipient_name: form.recipient_name.trim() || undefined,
      recipient_phone: form.recipient_phone.trim() || undefined,
      address_line_1: form.address_line_1.trim(),
      address_line_2: form.address_line_2.trim() || undefined,
      landmark: form.landmark.trim() || undefined,
      city: form.city.trim(),
      state: form.state.trim(),
      pincode: form.pincode.trim(),
      is_default: form.is_default,
      // Coordinates from location picker (optional)
      latitude: form.latitude ?? undefined,
      longitude: form.longitude ?? undefined,
    };

    try {
      if (isEditMode && addressId) {
        await updateAddress({ id: addressId, ...payload });
      } else {
        await createAddress(payload);
      }
      router.back();
    } catch (error) {
      setSubmitError(extractErrorMessage(error));
    }
  };

  // ── Render ─────────────────────────────────────────────────

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background.page }]}
      edges={["bottom"]}
    >
      {/* ── Header ────────────────────────────────────────── */}
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
          <MaterialIcons
            name="arrow-back"
            size={22}
            color={colors.text.primary}
          />
        </TouchableOpacity>
        <Text
          style={[
            styles.headerTitle,
            { color: colors.text.primary, fontFamily: "Inter_700Bold" },
          ]}
        >
          {isEditMode ? "Edit Address" : "New Address"}
        </Text>
        <View style={styles.headerRight} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          keyboardDismissMode="interactive"
        >
          {/* ── Submit error banner ────────────────────────── */}
          {submitError ? (
            <View
              style={[
                styles.errorBanner,
                {
                  backgroundColor: colors.status.errorBg,
                  borderColor: colors.status.errorBorder,
                },
              ]}
            >
              <MaterialIcons
                name="error-outline"
                size={16}
                color={colors.status.error}
              />
              <Text
                style={[
                  styles.errorBannerText,
                  {
                    color: colors.status.error,
                    fontFamily: "Inter_500Medium",
                  },
                ]}
              >
                {submitError}
              </Text>
            </View>
          ) : null}

          {/* ── Location picker trigger ────────────────────── */}
          <TouchableOpacity
            style={[
              styles.locationPickerButton,
              {
                backgroundColor: colors.background.card,
                borderColor: form.latitude
                  ? colors.status.successBorder
                  : brandColor,
              },
            ]}
            onPress={() => setLocationPickerVisible(true)}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.locationPickerIcon,
                {
                  backgroundColor: form.latitude
                    ? colors.status.successBg
                    : colors.background.tint,
                },
              ]}
            >
              <MaterialIcons
                name={form.latitude ? "location-on" : "add-location-alt"}
                size={20}
                color={
                  form.latitude ? colors.status.success : brandColor
                }
              />
            </View>
            <View style={styles.locationPickerTextBlock}>
              <Text
                style={[
                  styles.locationPickerTitle,
                  {
                    color: form.latitude
                      ? colors.status.success
                      : brandColor,
                    fontFamily: "Inter_600SemiBold",
                  },
                ]}
              >
                {form.latitude
                  ? "Location set - tap to change"
                  : "Search or use current location"}
              </Text>
              <Text
                style={[
                  styles.locationPickerSubtitle,
                  {
                    color: colors.text.faint,
                    fontFamily: "Inter_400Regular",
                  },
                ]}
              >
                {form.latitude
                  ? "Auto-filled address fields below"
                  : "Auto-fills city, state & pincode"}
              </Text>
            </View>
            <MaterialIcons
              name={form.latitude ? "check-circle" : "chevron-right"}
              size={20}
              color={
                form.latitude ? colors.status.success : colors.text.faint
              }
            />
          </TouchableOpacity>

          {/* ── Location picker sheet ──────────────────────── */}
          <LocationPickerSheet
            visible={locationPickerVisible}
            onClose={() => setLocationPickerVisible(false)}
            onConfirm={handleLocationConfirm}
          />

          {/* ── Address Type ───────────────────────────────── */}
          <Text
            style={[
              styles.sectionLabel,
              { color: colors.text.muted, fontFamily: "Inter_700Bold" },
            ]}
          >
            Address Type
          </Text>
          <View style={styles.labelRow}>
            {ADDRESS_LABELS.map((lbl) => (
              <TouchableOpacity
                key={lbl}
                style={[
                  styles.labelChip,
                  {
                    borderColor:
                      form.label === lbl
                        ? brandColor
                        : colors.border.default,
                    backgroundColor:
                      form.label === lbl
                        ? brandColor
                        : colors.background.card,
                  },
                ]}
                onPress={() => setField("label", lbl)}
                activeOpacity={0.7}
              >
                <MaterialIcons
                  name={
                    lbl === "Home"
                      ? "home"
                      : lbl === "Work"
                        ? "business"
                        : "location-on"
                  }
                  size={16}
                  color={form.label === lbl ? "#ffffff" : colors.text.muted}
                />
                <Text
                  style={[
                    styles.labelChipText,
                    {
                      color:
                        form.label === lbl ? "#ffffff" : colors.text.muted,
                      fontFamily: "Inter_600SemiBold",
                    },
                  ]}
                >
                  {lbl}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Custom label — only when "Other" */}
          {form.label === "Other" && (
            <FieldInput
              label="Label Name"
              required
              value={form.custom_label}
              onChangeText={(v) => setField("custom_label", v)}
              onBlur={() => handleBlur("custom_label")}
              error={touched.custom_label ? errors.custom_label : undefined}
              placeholder="e.g. Parents' Home, Gym"
              maxLength={100}
              colors={colors}
            />
          )}

          {/* ── Delivery Address ───────────────────────────── */}
          <Text
            style={[
              styles.sectionLabel,
              { color: colors.text.muted, fontFamily: "Inter_700Bold" },
            ]}
          >
            Delivery Address
          </Text>

          <FieldInput
            label="Address Line 1"
            required
            value={form.address_line_1}
            onChangeText={(v) => setField("address_line_1", v)}
            onBlur={() => handleBlur("address_line_1")}
            onFocus={() => scrollToY(280)}
            error={
              touched.address_line_1 ? errors.address_line_1 : undefined
            }
            placeholder="Flat / House No, Building, Street"
            maxLength={300}
            colors={colors}
          />

          <FieldInput
            label="Address Line 2"
            value={form.address_line_2}
            onChangeText={(v) => setField("address_line_2", v)}
            onFocus={() => scrollToY(360)}
            placeholder="Area, Colony (optional)"
            maxLength={300}
            colors={colors}
          />

          <FieldInput
            label="Landmark"
            value={form.landmark}
            onChangeText={(v) => setField("landmark", v)}
            onFocus={() => scrollToY(440)}
            placeholder="Near a school, temple, etc. (optional)"
            maxLength={200}
            colors={colors}
          />

          <View style={styles.row}>
            <View style={styles.rowFieldLarge}>
              <FieldInput
                label="City"
                required
                value={form.city}
                onChangeText={(v) => setField("city", v)}
                onBlur={() => handleBlur("city")}
                onFocus={() => scrollToY(520)}
                error={touched.city ? errors.city : undefined}
                placeholder="City"
                maxLength={100}
                colors={colors}
              />
            </View>
            <View style={styles.rowFieldSmall}>
              <FieldInput
                label="Pincode"
                required
                value={form.pincode}
                onChangeText={(v) =>
                  setField("pincode", v.replace(/\D/g, "").slice(0, 6))
                }
                onBlur={() => handleBlur("pincode")}
                onFocus={() => scrollToY(520)}
                error={touched.pincode ? errors.pincode : undefined}
                placeholder="6 digits"
                keyboardType="number-pad"
                maxLength={6}
                colors={colors}
              />
            </View>
          </View>

          <FieldInput
            label="State"
            required
            value={form.state}
            onChangeText={(v) => setField("state", v)}
            onBlur={() => handleBlur("state")}
            onFocus={() => scrollToY(600)}
            error={touched.state ? errors.state : undefined}
            placeholder="State"
            maxLength={100}
            colors={colors}
          />

          {/* ── Recipient Details ──────────────────────────── */}
          <Text
            style={[
              styles.sectionLabel,
              { color: colors.text.muted, fontFamily: "Inter_700Bold" },
            ]}
          >
            Recipient Details
          </Text>
          <Text
            style={[
              styles.sectionHint,
              { color: colors.text.faint, fontFamily: "Inter_400Regular" },
            ]}
          >
            Leave blank to use your own name and number
          </Text>

          <FieldInput
            label="Recipient Name"
            value={form.recipient_name}
            onChangeText={(v) => setField("recipient_name", v)}
            onFocus={() => scrollToY(740)}
            placeholder="Full name of the person receiving"
            maxLength={200}
            autoCapitalize="words"
            colors={colors}
          />

          <FieldInput
            label="Recipient Phone"
            value={form.recipient_phone}
            onChangeText={(v) => setField("recipient_phone", v)}
            onBlur={() => handleBlur("recipient_phone")}
            onFocus={() => scrollToY(820)}
            error={
              touched.recipient_phone ? errors.recipient_phone : undefined
            }
            placeholder="+91 XXXXX XXXXX"
            keyboardType="phone-pad"
            maxLength={15}
            colors={colors}
          />

          {/* ── Default toggle ─────────────────────────────── */}
          <View
            style={[
              styles.defaultRow,
              {
                backgroundColor: colors.background.card,
                borderColor: colors.border.default,
              },
            ]}
          >
            <View style={styles.defaultText}>
              <Text
                style={[
                  styles.defaultTitle,
                  {
                    color: colors.text.primary,
                    fontFamily: "Inter_600SemiBold",
                  },
                ]}
              >
                Set as default address
              </Text>
              <Text
                style={[
                  styles.defaultSubtitle,
                  {
                    color: colors.text.faint,
                    fontFamily: "Inter_400Regular",
                  },
                ]}
              >
                Used automatically at checkout
              </Text>
            </View>
            <Switch
              value={form.is_default}
              onValueChange={(v) => setField("is_default", v)}
              trackColor={{
                false: colors.border.default,
                true: brandColor,
              }}
              thumbColor="#ffffff"
            />
          </View>

          {/* ── Save button ────────────────────────────────── */}
          <TouchableOpacity
            style={[
              styles.saveButton,
              { backgroundColor: brandColor },
              isPending && styles.saveButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={isPending}
            activeOpacity={0.8}
          >
            {isPending ? (
              <ActivityIndicator size={18} color="#ffffff" />
            ) : null}
            <Text
              style={[
                styles.saveButtonText,
                { fontFamily: "Inter_700Bold" },
              ]}
            >
              {isPending
                ? isEditMode
                  ? "Saving…"
                  : "Adding…"
                : isEditMode
                  ? "Save Changes"
                  : "Add Address"}
            </Text>
          </TouchableOpacity>

          <View style={styles.bottomPad} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── FieldInput ─────────────────────────────────────────────────

interface FieldInputProps {
  label: string;
  required?: boolean;
  value: string;
  onChangeText: (v: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  error?: string;
  placeholder?: string;
  keyboardType?: "default" | "email-address" | "number-pad" | "phone-pad";
  maxLength?: number;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  colors: ReturnType<typeof useTheme>["colors"];
}

function FieldInput({
  label,
  required,
  value,
  onChangeText,
  onBlur,
  onFocus,
  error,
  placeholder,
  keyboardType = "default",
  maxLength,
  autoCapitalize = "sentences",
  colors,
}: FieldInputProps) {
  return (
    <View style={styles.field}>
      <Text
        style={[
          styles.fieldLabel,
          {
            color: colors.text.secondary,
            fontFamily: "Inter_600SemiBold",
          },
        ]}
      >
        {label}{" "}
        {required && (
          <Text style={{ color: colors.status.error }}>*</Text>
        )}
      </Text>
      <TextInput
        style={[
          styles.input,
          {
            backgroundColor: colors.background.input,
            borderColor: error
              ? colors.status.error
              : colors.border.input,
            color: colors.text.primary,
            fontFamily: "Inter_400Regular",
          },
          error ? { backgroundColor: colors.status.errorBg } : null,
        ]}
        value={value}
        onChangeText={onChangeText}
        onBlur={onBlur}
        onFocus={onFocus}
        placeholder={placeholder}
        placeholderTextColor={colors.text.faint}
        keyboardType={keyboardType}
        maxLength={maxLength}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
      />
      {error ? (
        <Text
          style={[
            styles.fieldError,
            {
              color: colors.status.error,
              fontFamily: "Inter_500Medium",
            },
          ]}
        >
          {error}
        </Text>
      ) : null}
    </View>
  );
}

// ── Styles ─────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1 },
  flex: { flex: 1 },

  // Header
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

  // Scroll
  scroll: { flex: 1 },
  content: { padding: 20 },

  // Error banner
  errorBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorBannerText: { flex: 1, fontSize: 13 },

  // Location picker trigger
  locationPickerButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1.5,
    borderRadius: 12,
    padding: 14,
    marginBottom: 20,
  },
  locationPickerIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  locationPickerTextBlock: {
    flex: 1,
    gap: 2,
  },
  locationPickerTitle: {
    fontSize: 14,
  },
  locationPickerSubtitle: {
    fontSize: 12,
  },

  // Section labels
  sectionLabel: {
    fontSize: 12,
    letterSpacing: 1,
    textTransform: "uppercase",
    marginTop: 4,
    marginBottom: 12,
  },
  sectionHint: {
    fontSize: 12,
    marginTop: -8,
    marginBottom: 12,
  },

  // Label chips
  labelRow: { flexDirection: "row", gap: 10, marginBottom: 20 },
  labelChip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
  },
  labelChipText: { fontSize: 13 },

  // Fields
  field: { marginBottom: 16 },
  fieldLabel: { fontSize: 13, marginBottom: 8 },
  input: {
    borderWidth: 1.5,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
  },
  fieldError: { fontSize: 12, marginTop: 5 },

  // City + Pincode row
  row: { flexDirection: "row", gap: 12 },
  rowFieldLarge: { flex: 2 },
  rowFieldSmall: { flex: 1 },

  // Default toggle
  defaultRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 12,
    borderWidth: 1,
    padding: 16,
    marginTop: 8,
    marginBottom: 24,
  },
  defaultText: { flex: 1, marginRight: 12 },
  defaultTitle: { fontSize: 14 },
  defaultSubtitle: { fontSize: 12, marginTop: 2 },

  // Save button
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
  },
  saveButtonDisabled: { opacity: 0.45 },
  saveButtonText: { fontSize: 15, color: "#ffffff" },

  bottomPad: { height: 32 },
});