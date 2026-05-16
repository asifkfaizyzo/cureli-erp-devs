// src/features/profile/screens/EditProfileScreen.tsx
//
// Edit full_name and email.
// Phone is identity — never editable, not shown here.
// Validates inline before firing the mutation.

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useProfile } from '../hooks/useProfile';
import { useUpdateProfile } from '../hooks/useUpdateProfile';

// ── Validation ────────────────────────────────────────────────

interface FormErrors {
  full_name?: string;
  email?: string;
}

function validate(name: string, email: string): FormErrors {
  const errors: FormErrors = {};

  if (name.trim().length > 0 && name.trim().length < 2) {
    errors.full_name = 'Name must be at least 2 characters';
  }
  if (name.trim().length > 200) {
    errors.full_name = 'Name must not exceed 200 characters';
  }

  if (email.trim().length > 0) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      errors.email = 'Enter a valid email address';
    }
  }

  return errors;
}

// ── Screen ────────────────────────────────────────────────────

export function EditProfileScreen() {
  const { user } = useProfile();
  const { updateProfile, isPending, error: mutationError, reset } = useUpdateProfile();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState({ full_name: false, email: false });

  // Seed form with current user data once loaded
  useEffect(() => {
    if (user) {
      setFullName(user.full_name ?? '');
      setEmail(user.email ?? '');
    }
  }, [user]);

  // Clear mutation error when user starts typing
  useEffect(() => {
    if (mutationError) reset();
  }, [fullName, email]);

  const handleBlur = (field: 'full_name' | 'email') => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const errs = validate(fullName, email);
    setErrors(errs);
  };

  const handleSave = () => {
    const errs = validate(fullName, email);
    setErrors(errs);
    setTouched({ full_name: true, email: true });

    if (Object.keys(errs).length > 0) return;

    // Build payload — only send fields that have changed
    const payload: { full_name?: string; email?: string | null } = {};

    const trimmedName = fullName.trim();
    const trimmedEmail = email.trim();

    if (trimmedName !== (user?.full_name ?? '')) {
      payload.full_name = trimmedName || undefined;
    }
    if (trimmedEmail !== (user?.email ?? '')) {
      payload.email = trimmedEmail || null;
    }

    if (Object.keys(payload).length === 0) {
      // Nothing changed
      router.back();
      return;
    }

    updateProfile(
      { full_name: trimmedName, email: trimmedEmail },
      {
        onError: (err) => {
          // mutationError from hook covers most cases,
          // but show Alert for network-level failures
          const msg =
            (err as { message?: string })?.message ??
            'Failed to save changes';
          Alert.alert('Error', msg);
        },
      },
    );
  };

  const hasChanges =
    fullName.trim() !== (user?.full_name ?? '') ||
    email.trim() !== (user?.email ?? '');

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <MaterialIcons name="arrow-back" size={22} color="#0f172a" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        {/* Mutation-level error banner */}
        {mutationError ? (
          <View style={styles.errorBanner}>
            <MaterialIcons name="error-outline" size={16} color="#ef4444" />
            <Text style={styles.errorBannerText}>{mutationError}</Text>
          </View>
        ) : null}

        {/* Full Name */}
        <View style={styles.field}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput
            style={[
              styles.input,
              touched.full_name && errors.full_name ? styles.inputError : null,
            ]}
            value={fullName}
            onChangeText={setFullName}
            onBlur={() => handleBlur('full_name')}
            placeholder="Enter your full name"
            placeholderTextColor="#94a3b8"
            autoCapitalize="words"
            autoCorrect={false}
            returnKeyType="next"
            maxLength={200}
          />
          {touched.full_name && errors.full_name ? (
            <Text style={styles.fieldError}>{errors.full_name}</Text>
          ) : null}
        </View>

        {/* Email */}
        <View style={styles.field}>
          <Text style={styles.label}>
            Email{' '}
            <Text style={styles.labelOptional}>(optional)</Text>
          </Text>
          <TextInput
            style={[
              styles.input,
              touched.email && errors.email ? styles.inputError : null,
            ]}
            value={email}
            onChangeText={setEmail}
            onBlur={() => handleBlur('email')}
            placeholder="Enter your email address"
            placeholderTextColor="#94a3b8"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="done"
            maxLength={255}
          />
          {touched.email && errors.email ? (
            <Text style={styles.fieldError}>{errors.email}</Text>
          ) : null}
          <Text style={styles.fieldHint}>
            Used for order confirmations and receipts
          </Text>
        </View>

        {/* Phone — display only */}
        <View style={styles.field}>
          <Text style={styles.label}>Phone Number</Text>
          <View style={styles.phoneRow}>
            <TextInput
              style={[styles.input, styles.inputLocked]}
              value={user?.phone ?? ''}
              editable={false}
            />
            <View style={styles.verifiedBadge}>
              <MaterialIcons name="verified" size={13} color="#22c55e" />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          </View>
          <Text style={styles.fieldHint}>
            Phone number cannot be changed — it is your login identity
          </Text>
        </View>

        {/* Save button */}
        <TouchableOpacity
          style={[
            styles.saveButton,
            (!hasChanges || isPending) && styles.saveButtonDisabled,
          ]}
          onPress={handleSave}
          disabled={!hasChanges || isPending}
          activeOpacity={0.8}
        >
          {isPending ? (
            <ActivityIndicator size={18} color="#ffffff" />
          ) : null}
          <Text style={styles.saveButtonText}>
            {isPending ? 'Saving…' : 'Save Changes'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#f8fafc',
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
    gap: 8,
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
    marginBottom: 8,
  },
  errorBannerText: {
    flex: 1,
    fontSize: 13,
    color: '#ef4444',
    fontWeight: '500',
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  labelOptional: {
    fontWeight: '400',
    color: '#94a3b8',
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
  inputLocked: {
    flex: 1,
    backgroundColor: '#f8fafc',
    color: '#94a3b8',
    borderColor: '#e2e8f0',
  },
  phoneRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  verifiedText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#22c55e',
  },
  fieldError: {
    fontSize: 12,
    color: '#ef4444',
    marginTop: 5,
    fontWeight: '500',
  },
  fieldHint: {
    fontSize: 12,
    color: '#94a3b8',
    marginTop: 5,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#05015A',
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 8,
  },
  saveButtonDisabled: {
    backgroundColor: '#94a3b8',
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#ffffff',
  },
});