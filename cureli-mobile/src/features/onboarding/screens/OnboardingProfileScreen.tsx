// src/features/onboarding/screens/OnboardingProfileScreen.tsx

import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { useUpdateProfile } from '../../profile/hooks/useUpdateProfile';
import { useTheme } from '../../../theme/ThemeContext';
import { WheelDatePicker } from './WheelDatePicker';
import type { UserSex } from '../../../types/auth';

// ── Sex options ───────────────────────────────────────────────

const SEX_OPTIONS: { value: UserSex; label: string }[] = [
  { value: 'MALE',   label: 'Male'   },
  { value: 'FEMALE', label: 'Female' },
  { value: 'OTHER',  label: 'Other'  },
];

// ── Helpers ───────────────────────────────────────────────────

function formatDobForDisplay(dob: string): string {
  // "1995-06-15" → "15 Jun 1995"
  const [year, month, day] = dob.split('-').map(Number);
  const months = [
    'Jan','Feb','Mar','Apr','May','Jun',
    'Jul','Aug','Sep','Oct','Nov','Dec',
  ];
  return `${day} ${months[month - 1]} ${year}`;
}

// ── Main Screen ───────────────────────────────────────────────

export function OnboardingProfileScreen() {
  const { colors, isDark } = useTheme();

  const [name, setName]       = useState('');
  const [dob, setDob]         = useState<string | null>(null);
  const [sex, setSex]         = useState<UserSex | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [errors, setErrors]   = useState<{
    name?: string;
    dob?: string;
    sex?: string;
  }>({});

  const { updateProfile, isPending, error: mutationError } = useUpdateProfile({
    redirectOnSuccess: false,
  });

  // ── Validation ────────────────────────────────────────────

  function validate(): boolean {
    const newErrors: typeof errors = {};

    if (name.trim().length < 2) {
      newErrors.name = 'Please enter your full name (at least 2 characters)';
    }
    if (name.trim().length > 200) {
      newErrors.name = 'Name is too long';
    }
    if (!dob) {
      newErrors.dob = 'Please select your date of birth';
    }
    if (!sex) {
      newErrors.sex = 'Please select your sex';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // ── Submit ────────────────────────────────────────────────

  async function handleContinue() {
    if (!validate()) return;

    updateProfile(
      {
        full_name: name.trim(),
        date_of_birth: dob!,
        sex: sex!,
      },
      {
        onSuccess: () => {
          router.replace('/onboarding/email');
        },
      },
    );
  }

  const canContinue =
    name.trim().length >= 2 && dob !== null && sex !== null;

  const logoSource = isDark
    ? require('../../../../assets/images/cureliwhitenew.png')
    : require('../../../../assets/images/curelidarknew.png');

  const brandColor = isDark ? colors.brand.accent : colors.brand.primary;

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background.page }]}
      edges={['top', 'bottom']}
    >
      {/* ── KeyboardAvoidingView lifts content above keyboard ── */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 24}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* Logo */}
          <Image
            source={logoSource}
            style={styles.logo}
            contentFit="contain"
          />

          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.stepLabel, { color: colors.text.faint }]}>
              Step 1 of 2
            </Text>
            <Text style={[styles.title, { color: colors.text.primary }]}>
              Tell us about{'\n'}yourself
            </Text>
            <Text style={[styles.subtitle, { color: colors.text.muted }]}>
              This helps us personalise your experience and is required for
              ordering medicines.
            </Text>
          </View>

          {/* ── Name ─────────────────────────────────────── */}
          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: colors.text.secondary }]}>
              Full name
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.background.input,
                  borderColor: errors.name
                    ? colors.status.error
                    : colors.border.input,
                  color: colors.text.primary,
                },
              ]}
              value={name}
              onChangeText={(v) => {
                setName(v);
                if (errors.name) setErrors((e) => ({ ...e, name: undefined }));
              }}
              placeholder="Enter your full name"
              placeholderTextColor={colors.text.faint}
              autoCapitalize="words"
              autoCorrect={false}
              autoFocus
              maxLength={200}
              returnKeyType="done"
            />
            {errors.name ? (
              <Text style={[styles.fieldError, { color: colors.status.error }]}>
                {errors.name}
              </Text>
            ) : null}
          </View>

          {/* ── Date of Birth ─────────────────────────────── */}
          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: colors.text.secondary }]}>
              Date of birth
            </Text>
            <TouchableOpacity
              style={[
                styles.input,
                styles.pickerTrigger,
                {
                  backgroundColor: colors.background.input,
                  borderColor: errors.dob
                    ? colors.status.error
                    : colors.border.input,
                },
              ]}
              onPress={() => setShowPicker(true)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.pickerTriggerText,
                  {
                    color: dob ? colors.text.primary : colors.text.faint,
                  },
                ]}
              >
                {dob ? formatDobForDisplay(dob) : 'Select date of birth'}
              </Text>
              <MaterialIcons
                name="calendar-today"
                size={18}
                color={colors.text.muted}
              />
            </TouchableOpacity>
            {errors.dob ? (
              <Text style={[styles.fieldError, { color: colors.status.error }]}>
                {errors.dob}
              </Text>
            ) : null}
          </View>

          {/* ── Sex ──────────────────────────────────────── */}
          <View style={styles.field}>
            <Text style={[styles.fieldLabel, { color: colors.text.secondary }]}>
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
                        backgroundColor: isSelected
                          ? brandColor
                          : colors.background.input,
                        borderColor: isSelected
                          ? brandColor
                          : colors.border.input,
                      },
                    ]}
                    onPress={() => {
                      setSex(opt.value);
                      if (errors.sex) setErrors((e) => ({ ...e, sex: undefined }));
                    }}
                    activeOpacity={0.75}
                  >
                    <Text
                      style={[
                        styles.sexChipText,
                        {
                          color: isSelected ? '#ffffff' : colors.text.secondary,
                          fontFamily: isSelected
                            ? 'Inter_600SemiBold'
                            : 'Inter_400Regular',
                        },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
            {errors.sex ? (
              <Text style={[styles.fieldError, { color: colors.status.error }]}>
                {errors.sex}
              </Text>
            ) : null}
          </View>

          {/* Mutation error */}
          {mutationError ? (
            <View style={styles.mutationErrorRow}>
              <MaterialIcons
                name="error-outline"
                size={14}
                color={colors.status.error}
              />
              <Text
                style={[styles.fieldError, { color: colors.status.error }]}
              >
                {mutationError}
              </Text>
            </View>
          ) : null}

          {/* ── Continue button ───────────────────────────── */}
          <TouchableOpacity
            style={[
              styles.button,
              { backgroundColor: brandColor },
              (!canContinue || isPending) && styles.buttonDisabled,
            ]}
            onPress={handleContinue}
            disabled={!canContinue || isPending}
            activeOpacity={0.85}
          >
            {isPending ? (
              <ActivityIndicator size={18} color="#ffffff" />
            ) : null}
            <Text style={styles.buttonText}>
              {isPending ? 'Saving…' : 'Continue'}
            </Text>
            {!isPending && (
              <MaterialIcons name="arrow-forward" size={18} color="#ffffff" />
            )}
          </TouchableOpacity>

          <Text style={[styles.note, { color: colors.text.faint }]}>
            You can update these details later from your profile settings
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Date Picker Modal ─────────────────────────────── */}
      <WheelDatePicker
        visible={showPicker}
        value={dob}
        onConfirm={(dateStr) => {
          setDob(dateStr);
          setShowPicker(false);
          if (errors.dob) setErrors((e) => ({ ...e, dob: undefined }));
        }}
        onClose={() => setShowPicker(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  // ── Added to give KeyboardAvoidingView full height ────────
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 40,
    gap: 28,
  },
  logo: {
    width: 52,
    height: 52,
    borderRadius: 14,
  },
  header: { gap: 10 },
  stepLabel: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    fontSize: 30,
    fontFamily: 'Inter_700Bold',
    lineHeight: 38,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    lineHeight: 23,
  },
  field: { gap: 8 },
  fieldLabel: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  },
  pickerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerTriggerText: {
    fontSize: 16,
    fontFamily: 'Inter_400Regular',
  },
  sexRow: {
    flexDirection: 'row',
    gap: 10,
  },
  sexChip: {
    flex: 1,
    paddingVertical: 13,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sexChipText: {
    fontSize: 14,
  },
  fieldError: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  mutationErrorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: -12,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
  },
  buttonDisabled: { opacity: 0.45 },
  buttonText: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: '#ffffff',
  },
  note: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
});