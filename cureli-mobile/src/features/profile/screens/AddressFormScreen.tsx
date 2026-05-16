// src/features/profile/screens/AddressFormScreen.tsx
//
// Shared form for both creating and editing an address.
// Mode is determined by whether `addressId` prop is present.
// All fields are manual — no maps, no autocomplete.

import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAddresses } from '../hooks/useAddresses';
import { useAddressMutations } from '../hooks/useAddressMutations';
import { useProfile } from '../hooks/useProfile';
import { extractErrorMessage } from '../api/profile.api';
import { ADDRESS_LABELS } from '../constants/profile.constants';
import type { AddressLabel } from '../constants/profile.constants';
import type { AddressFormData } from '../types/profile.types';

// ── Form state ────────────────────────────────────────────────

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
}

const EMPTY_FORM: FormState = {
  label: 'Home',
  custom_label: '',
  recipient_name: '',
  recipient_phone: '',
  address_line_1: '',
  address_line_2: '',
  landmark: '',
  city: '',
  state: '',
  pincode: '',
  is_default: false,
};

// ── Validation ────────────────────────────────────────────────

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

  if (form.label === 'Other' && !form.custom_label.trim()) {
    errors.custom_label = 'Please enter a label for this address';
  }

  if (form.address_line_1.trim().length < 5) {
    errors.address_line_1 = 'Address is too short (min 5 characters)';
  }

  if (!form.city.trim()) {
    errors.city = 'City is required';
  }

  if (!form.state.trim()) {
    errors.state = 'State is required';
  }

  if (!/^\d{6}$/.test(form.pincode.trim())) {
    errors.pincode = 'Enter a valid 6-digit pincode';
  }

  if (form.recipient_phone.trim()) {
    const stripped = form.recipient_phone.trim().replace(/^\+?91/, '');
    if (!/^[6-9]\d{9}$/.test(stripped)) {
      errors.recipient_phone = 'Enter a valid Indian mobile number';
    }
  }

  return errors;
}

// ── Props ─────────────────────────────────────────────────────

interface AddressFormScreenProps {
  addressId?: string;
}

// ── Screen ────────────────────────────────────────────────────

export function AddressFormScreen({ addressId }: AddressFormScreenProps) {
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

  const isPending = isCreating || isUpdating;

  // ── Scroll ref for keyboard avoidance ────────────────────
  const scrollRef = useRef<ScrollView>(null);

  // ── Seed form in edit mode ────────────────────────────────

  useEffect(() => {
    if (isEditMode && addresses.length > 0) {
      const existing = addresses.find((a) => a.id === addressId);
      if (!existing) {
        Alert.alert('Error', 'Address not found');
        router.back();
        return;
      }
      setForm({
        label: existing.label as AddressLabel,
        custom_label: existing.custom_label ?? '',
        recipient_name: existing.recipient_name ?? '',
        recipient_phone: existing.recipient_phone ?? '',
        address_line_1: existing.address_line_1,
        address_line_2: existing.address_line_2 ?? '',
        landmark: existing.landmark ?? '',
        city: existing.city,
        state: existing.state,
        pincode: existing.pincode,
        is_default: existing.is_default,
      });
    } else if (!isEditMode && user) {
      setForm((prev) => ({
        ...prev,
        recipient_name: user.full_name ?? '',
        recipient_phone: user.phone ?? '',
      }));
    }
  }, [isEditMode, addresses, user]);

  // ── Helpers ───────────────────────────────────────────────

  const setField = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSubmitError(null);
    if (touched[key as keyof FormErrors]) {
      const updated = { ...form, [key]: value };
      const errs = validateForm(updated);
      setErrors((prev) => ({ ...prev, [key]: errs[key as keyof FormErrors] }));
    }
  };

  const handleBlur = (key: keyof FormErrors) => {
    setTouched((prev) => ({ ...prev, [key]: true }));
    const errs = validateForm(form);
    setErrors((prev) => ({ ...prev, [key]: errs[key] }));
  };

  // Scrolls the ScrollView so the focused input is visible
  // above the keyboard. `y` is the approximate top offset of
  // the field inside the ScrollView content.
  const scrollToY = (y: number) => {
    scrollRef.current?.scrollTo({ y, animated: true });
  };

  // ── Submit ────────────────────────────────────────────────

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
        form.label === 'Other' ? form.custom_label.trim() : undefined,
      recipient_name: form.recipient_name.trim() || undefined,
      recipient_phone: form.recipient_phone.trim() || undefined,
      address_line_1: form.address_line_1.trim(),
      address_line_2: form.address_line_2.trim() || undefined,
      landmark: form.landmark.trim() || undefined,
      city: form.city.trim(),
      state: form.state.trim(),
      pincode: form.pincode.trim(),
      is_default: form.is_default,
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

  // ── Render ────────────────────────────────────────────────

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      {/* Header sits outside KeyboardAvoidingView so it never moves */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <MaterialIcons name="arrow-back" size={22} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isEditMode ? 'Edit Address' : 'New Address'}
        </Text>
        <View style={styles.headerRight} />
      </View>

      {/*
        KeyboardAvoidingView fix:
        - iOS   → 'padding' shrinks the bottom of the view
        - Android → 'height' shrinks the overall height so the
          ScrollView naturally becomes shorter and the content
          above the keyboard stays reachable.
        keyboardVerticalOffset accounts for the header height.
      */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 0}
      >
        <ScrollView
          ref={scrollRef}
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          // Prevents the ScrollView from intercepting the
          // KeyboardAvoidingView resize on Android
          keyboardDismissMode="interactive"
        >
          {/* Submit error banner */}
          {submitError ? (
            <View style={styles.errorBanner}>
              <MaterialIcons name="error-outline" size={16} color="#ef4444" />
              <Text style={styles.errorBannerText}>{submitError}</Text>
            </View>
          ) : null}

          {/* ── Label selector ──────────────────────────── */}
          <Text style={styles.sectionLabel}>Address Type</Text>
          <View style={styles.labelRow}>
            {ADDRESS_LABELS.map((lbl) => (
              <TouchableOpacity
                key={lbl}
                style={[
                  styles.labelChip,
                  form.label === lbl && styles.labelChipActive,
                ]}
                onPress={() => setField('label', lbl)}
                activeOpacity={0.7}
              >
                <MaterialIcons
                  name={
                    lbl === 'Home'
                      ? 'home'
                      : lbl === 'Work'
                      ? 'business'
                      : 'location-on'
                  }
                  size={16}
                  color={form.label === lbl ? '#ffffff' : '#64748b'}
                />
                <Text
                  style={[
                    styles.labelChipText,
                    form.label === lbl && styles.labelChipTextActive,
                  ]}
                >
                  {lbl}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Custom label */}
          {form.label === 'Other' && (
            <View style={styles.field}>
              <Text style={styles.label}>
                Label Name <Text style={styles.required}>*</Text>
              </Text>
              <TextInput
                style={[
                  styles.input,
                  touched.custom_label && errors.custom_label
                    ? styles.inputError
                    : null,
                ]}
                value={form.custom_label}
                onChangeText={(v) => setField('custom_label', v)}
                onBlur={() => handleBlur('custom_label')}
                placeholder="e.g. Parents' Home, Gym"
                placeholderTextColor="#94a3b8"
                maxLength={100}
              />
              {touched.custom_label && errors.custom_label ? (
                <Text style={styles.fieldError}>{errors.custom_label}</Text>
              ) : null}
            </View>
          )}

          {/* ── Delivery address ─────────────────────────── */}
          <Text style={styles.sectionLabel}>Delivery Address</Text>

          <FieldInput
            label="Address Line 1"
            required
            value={form.address_line_1}
            onChangeText={(v) => setField('address_line_1', v)}
            onBlur={() => handleBlur('address_line_1')}
            onFocus={() => scrollToY(180)}
            error={
              touched.address_line_1 ? errors.address_line_1 : undefined
            }
            placeholder="Flat / House No, Building, Street"
            maxLength={300}
          />

          <FieldInput
            label="Address Line 2"
            value={form.address_line_2}
            onChangeText={(v) => setField('address_line_2', v)}
            onFocus={() => scrollToY(260)}
            placeholder="Area, Colony (optional)"
            maxLength={300}
          />

          <FieldInput
            label="Landmark"
            value={form.landmark}
            onChangeText={(v) => setField('landmark', v)}
            onFocus={() => scrollToY(340)}
            placeholder="Near a school, temple, etc. (optional)"
            maxLength={200}
          />

          <View style={styles.row}>
            <View style={styles.rowFieldLarge}>
              <FieldInput
                label="City"
                required
                value={form.city}
                onChangeText={(v) => setField('city', v)}
                onBlur={() => handleBlur('city')}
                onFocus={() => scrollToY(420)}
                error={touched.city ? errors.city : undefined}
                placeholder="City"
                maxLength={100}
              />
            </View>
            <View style={styles.rowFieldSmall}>
              <FieldInput
                label="Pincode"
                required
                value={form.pincode}
                onChangeText={(v) =>
                  setField('pincode', v.replace(/\D/g, '').slice(0, 6))
                }
                onBlur={() => handleBlur('pincode')}
                onFocus={() => scrollToY(420)}
                error={touched.pincode ? errors.pincode : undefined}
                placeholder="6 digits"
                keyboardType="number-pad"
                maxLength={6}
              />
            </View>
          </View>

          <FieldInput
            label="State"
            required
            value={form.state}
            onChangeText={(v) => setField('state', v)}
            onBlur={() => handleBlur('state')}
            onFocus={() => scrollToY(500)}
            error={touched.state ? errors.state : undefined}
            placeholder="State"
            maxLength={100}
          />

          {/* ── Recipient details ────────────────────────── */}
          <Text style={styles.sectionLabel}>Recipient Details</Text>
          <Text style={styles.sectionHint}>
            Leave blank to use your own name and number
          </Text>

          <FieldInput
            label="Recipient Name"
            value={form.recipient_name}
            onChangeText={(v) => setField('recipient_name', v)}
            onFocus={() => scrollToY(640)}
            placeholder="Full name of the person receiving"
            maxLength={200}
            autoCapitalize="words"
          />

          <FieldInput
            label="Recipient Phone"
            value={form.recipient_phone}
            onChangeText={(v) => setField('recipient_phone', v)}
            onBlur={() => handleBlur('recipient_phone')}
            onFocus={() => scrollToY(720)}
            error={
              touched.recipient_phone ? errors.recipient_phone : undefined
            }
            placeholder="+91 XXXXX XXXXX"
            keyboardType="phone-pad"
            maxLength={15}
          />

          {/* ── Set as default ───────────────────────────── */}
          <View style={styles.defaultRow}>
            <View style={styles.defaultText}>
              <Text style={styles.defaultTitle}>Set as default address</Text>
              <Text style={styles.defaultSubtitle}>
                Used automatically at checkout
              </Text>
            </View>
            <Switch
              value={form.is_default}
              onValueChange={(v) => setField('is_default', v)}
              trackColor={{ false: '#e2e8f0', true: '#05015A' }}
              thumbColor="#ffffff"
            />
          </View>

          {/* ── Save button ──────────────────────────────── */}
          <TouchableOpacity
            style={[
              styles.saveButton,
              isPending && styles.saveButtonDisabled,
            ]}
            onPress={handleSubmit}
            disabled={isPending}
            activeOpacity={0.8}
          >
            {isPending ? (
              <ActivityIndicator size={18} color="#ffffff" />
            ) : null}
            <Text style={styles.saveButtonText}>
              {isPending
                ? isEditMode
                  ? 'Saving…'
                  : 'Adding…'
                : isEditMode
                ? 'Save Changes'
                : 'Add Address'}
            </Text>
          </TouchableOpacity>

          <View style={styles.bottomPad} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ── Reusable field component ──────────────────────────────────

interface FieldInputProps {
  label: string;
  required?: boolean;
  value: string;
  onChangeText: (v: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  error?: string;
  placeholder?: string;
  keyboardType?: 'default' | 'email-address' | 'number-pad' | 'phone-pad';
  maxLength?: number;
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
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
  keyboardType = 'default',
  maxLength,
  autoCapitalize = 'sentences',
}: FieldInputProps) {
  return (
    <View style={styles.field}>
      <Text style={styles.label}>
        {label} {required && <Text style={styles.required}>*</Text>}
      </Text>
      <TextInput
        style={[styles.input, error ? styles.inputError : null]}
        value={value}
        onChangeText={onChangeText}
        onBlur={onBlur}
        onFocus={onFocus}
        placeholder={placeholder}
        placeholderTextColor="#94a3b8"
        keyboardType={keyboardType}
        maxLength={maxLength}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
      />
      {error ? <Text style={styles.fieldError}>{error}</Text> : null}
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
  },
  headerRight: {
    width: 36,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 20,
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    color: '#ef4444',
    fontWeight: '500',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
    color: '#64748b',
    textTransform: 'uppercase',
    marginTop: 8,
    marginBottom: 12,
  },
  sectionHint: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: -8,
    marginBottom: 12,
  },
  labelRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  labelChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  labelChipActive: {
    backgroundColor: '#05015A',
    borderColor: '#05015A',
  },
  labelChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  labelChipTextActive: {
    color: '#ffffff',
  },
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  required: {
    color: '#ef4444',
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#0f172a',
  },
  inputError: {
    borderColor: '#ef4444',
    backgroundColor: '#fef2f2',
  },
  fieldError: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 5,
    fontWeight: '500',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 0,
  },
  rowFieldLarge: {
    flex: 2,
  },
  rowFieldSmall: {
    flex: 1,
  },
  defaultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: 16,
    marginTop: 8,
    marginBottom: 24,
  },
  defaultText: {
    flex: 1,
    marginRight: 12,
  },
  defaultTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0f172a',
  },
  defaultSubtitle: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 2,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#05015A',
    paddingVertical: 14,
    borderRadius: 12,
  },
  saveButtonDisabled: {
    backgroundColor: '#94a3b8',
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
  bottomPad: {
    height: 32,
  },
});