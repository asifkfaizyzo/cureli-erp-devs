// src/features/profile/components/MemberFormSheet.tsx

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../../theme/ThemeContext';
import { WheelDatePicker } from '../../onboarding/screens/WheelDatePicker';
import type { FamilyMember, CreateMemberPayload, UpdateMemberPayload } from '../../../types/members';
import type { UserSex } from '../../../types/auth';

// ── Types ─────────────────────────────────────────────────────

interface MemberFormSheetProps {
  visible: boolean;
  member?: FamilyMember | null;   // null = create mode, member = edit mode
  onClose: () => void;
  onSubmit: (payload: CreateMemberPayload | UpdateMemberPayload) => void;
  isSubmitting?: boolean;
}

// ── Constants ─────────────────────────────────────────────────

const SEX_OPTIONS: { value: UserSex; label: string }[] = [
  { value: 'MALE',   label: 'Male'   },
  { value: 'FEMALE', label: 'Female' },
  { value: 'OTHER',  label: 'Other'  },
];

const SCREEN_HEIGHT = Dimensions.get('window').height;

// ── Helpers ───────────────────────────────────────────────────

function formatDobForDisplay(dob: string): string {
  const [year, month, day] = dob.split('-').map(Number);
  const months = [
    'Jan','Feb','Mar','Apr','May','Jun',
    'Jul','Aug','Sep','Oct','Nov','Dec',
  ];
  return `${day} ${months[month - 1]} ${year}`;
}

// ── Component ─────────────────────────────────────────────────

export function MemberFormSheet({
  visible,
  member,
  onClose,
  onSubmit,
  isSubmitting,
}: MemberFormSheetProps) {
  const { colors, isDark } = useTheme();

  const isEditMode = !!member;
  const brandColor = isDark ? colors.brand.accent : colors.brand.primary;

  // ── Animation ─────────────────────────────────────────────
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;

  useEffect(() => {
    if (visible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 20,
        stiffness: 200,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }).start();
    }
  }, [visible]);

  // ── Form State ────────────────────────────────────────────
  const [name, setName]           = useState('');
  const [dob,  setDob]            = useState<string | null>(null);
  const [sex,  setSex]            = useState<UserSex | null>(null);
  const [phone, setPhone]         = useState('');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [errors, setErrors]       = useState<{
    name?: string;
    dob?: string;
    sex?: string;
    phone?: string;
  }>({});

  // Pre-fill form when editing
  useEffect(() => {
    if (visible) {
      if (member) {
        setName(member.name);
        setDob(member.date_of_birth);
        setSex(member.sex);
        setPhone(member.phone?.replace(/^\+91/, '') ?? '');
      } else {
        setName('');
        setDob(null);
        setSex(null);
        setPhone('');
      }
      setErrors({});
    }
  }, [visible, member]);

  // ── Validation ────────────────────────────────────────────

  function validate(): boolean {
    const newErrors: typeof errors = {};

    if (name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }
    if (!dob) {
      newErrors.dob = 'Please select a date of birth';
    }
    if (!sex) {
      newErrors.sex = 'Please select sex';
    }

    const cleanedPhone = phone.replace(/\D/g, '');
    if (cleanedPhone.length > 0 && cleanedPhone.length !== 10) {
      newErrors.phone = 'Enter a valid 10-digit mobile number';
    }
    if (cleanedPhone.length > 0 && !/^[6-9]/.test(cleanedPhone)) {
      newErrors.phone = 'Enter a valid Indian mobile number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  // ── Submit ────────────────────────────────────────────────

  const handleSubmit = useCallback(() => {
    if (!validate()) return;

    const cleanedPhone = phone.replace(/\D/g, '');
    const formattedPhone =
      cleanedPhone.length === 10 ? `+91${cleanedPhone}` : null;

    const payload: CreateMemberPayload = {
      name: name.trim(),
      date_of_birth: dob!,
      sex: sex!,
      phone: formattedPhone,
    };

    onSubmit(payload);
  }, [name, dob, sex, phone, onSubmit]);

  const canSubmit = name.trim().length >= 2 && dob !== null && sex !== null;

  // ── Render ────────────────────────────────────────────────

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <TouchableOpacity
        style={styles.backdrop}
        onPress={onClose}
        activeOpacity={1}
      />

      {/* Sheet */}
      <Animated.View
        style={[
          styles.sheet,
          {
            backgroundColor: colors.background.card,
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          {/* Handle */}
          <View
            style={[styles.handle, { backgroundColor: colors.border.subtle }]}
          />

          {/* Header */}
          <View style={styles.sheetHeader}>
            <TouchableOpacity
              onPress={onClose}
              style={styles.headerBtn}
              disabled={isSubmitting}
            >
              <MaterialIcons
                name="close"
                size={22}
                color={colors.text.muted}
              />
            </TouchableOpacity>

            <Text
              style={[styles.sheetTitle, { color: colors.text.primary }]}
            >
              {isEditMode ? 'Edit Member' : 'Add Family Member'}
            </Text>

            <View style={styles.headerBtn} />
          </View>

          <ScrollView
            contentContainerStyle={styles.formContent}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Name */}
            <View style={styles.field}>
              <Text
                style={[styles.fieldLabel, { color: colors.text.secondary }]}
              >
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
                  if (errors.name)
                    setErrors((e) => ({ ...e, name: undefined }));
                }}
                placeholder="Member's full name"
                placeholderTextColor={colors.text.faint}
                autoCapitalize="words"
                autoCorrect={false}
                maxLength={200}
                returnKeyType="done"
              />
              {errors.name ? (
                <Text
                  style={[styles.errorText, { color: colors.status.error }]}
                >
                  {errors.name}
                </Text>
              ) : null}
            </View>

            {/* Date of birth */}
            <View style={styles.field}>
              <Text
                style={[styles.fieldLabel, { color: colors.text.secondary }]}
              >
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
                onPress={() => setShowDatePicker(true)}
                activeOpacity={0.7}
              >
                <Text
                  style={[
                    styles.pickerTriggerText,
                    {
                      color: dob
                        ? colors.text.primary
                        : colors.text.faint,
                    },
                  ]}
                >
                  {dob ? formatDobForDisplay(dob) : 'Select date of birth'}
                </Text>
                <MaterialIcons
                  name="calendar-today"
                  size={16}
                  color={colors.text.muted}
                />
              </TouchableOpacity>
              {errors.dob ? (
                <Text
                  style={[styles.errorText, { color: colors.status.error }]}
                >
                  {errors.dob}
                </Text>
              ) : null}
            </View>

            {/* Sex */}
            <View style={styles.field}>
              <Text
                style={[styles.fieldLabel, { color: colors.text.secondary }]}
              >
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
                        if (errors.sex)
                          setErrors((e) => ({ ...e, sex: undefined }));
                      }}
                      activeOpacity={0.75}
                    >
                      <Text
                        style={[
                          styles.sexChipText,
                          {
                            color: isSelected
                              ? '#ffffff'
                              : colors.text.secondary,
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
                <Text
                  style={[styles.errorText, { color: colors.status.error }]}
                >
                  {errors.sex}
                </Text>
              ) : null}
            </View>

            {/* Phone (optional) */}
            <View style={styles.field}>
              <Text
                style={[styles.fieldLabel, { color: colors.text.secondary }]}
              >
                Phone number{' '}
                <Text style={{ color: colors.text.faint, fontFamily: 'Inter_400Regular' }}>
                  (optional)
                </Text>
              </Text>
              <View
                style={[
                  styles.phoneInputWrapper,
                  {
                    backgroundColor: colors.background.input,
                    borderColor: errors.phone
                      ? colors.status.error
                      : colors.border.input,
                  },
                ]}
              >
                <View
                  style={[
                    styles.phonePrefix,
                    {
                      backgroundColor: isDark
                        ? colors.background.elevated
                        : '#f1f5f9',
                      borderRightColor: colors.border.input,
                    },
                  ]}
                >
                  <Text style={styles.phonePrefixFlag}>🇮🇳</Text>
                  <Text
                    style={[
                      styles.phonePrefixText,
                      { color: colors.text.secondary },
                    ]}
                  >
                    +91
                  </Text>
                </View>
                <TextInput
                  style={[styles.phoneInput, { color: colors.text.primary }]}
                  value={phone}
                  onChangeText={(v) => {
                    const digits = v.replace(/\D/g, '').slice(0, 10);
                    setPhone(digits);
                    if (errors.phone)
                      setErrors((e) => ({ ...e, phone: undefined }));
                  }}
                  placeholder="98765 43210"
                  placeholderTextColor={colors.text.faint}
                  keyboardType="number-pad"
                  maxLength={10}
                  returnKeyType="done"
                />
              </View>
              {errors.phone ? (
                <Text
                  style={[styles.errorText, { color: colors.status.error }]}
                >
                  {errors.phone}
                </Text>
              ) : null}
            </View>

            {/* Submit */}
            <TouchableOpacity
              style={[
                styles.submitBtn,
                { backgroundColor: brandColor },
                (!canSubmit || isSubmitting) && styles.submitBtnDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!canSubmit || isSubmitting}
              activeOpacity={0.85}
            >
              {isSubmitting ? (
                <ActivityIndicator size={18} color="#ffffff" />
              ) : null}
              <Text style={styles.submitBtnText}>
                {isSubmitting
                  ? 'Saving…'
                  : isEditMode
                  ? 'Save Changes'
                  : 'Add Member'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </Animated.View>

      {/* Date picker — rendered on top of sheet */}
      <WheelDatePicker
        visible={showDatePicker}
        value={dob}
        onConfirm={(dateStr) => {
          setDob(dateStr);
          setShowDatePicker(false);
          if (errors.dob) setErrors((e) => ({ ...e, dob: undefined }));
        }}
        onClose={() => setShowDatePicker(false)}
      />
    </Modal>
  );
}

// ── Styles ────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 20,
    maxHeight: SCREEN_HEIGHT * 0.92,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetTitle: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
  },
  formContent: {
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 48 : 32,
    gap: 20,
  },
  field: { gap: 8 },
  fieldLabel: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
  },
  pickerTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerTriggerText: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
  },
  sexRow: {
    flexDirection: 'row',
    gap: 10,
  },
  sexChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sexChipText: {
    fontSize: 14,
  },
  phoneInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    overflow: 'hidden',
  },
  phonePrefix: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRightWidth: 1.5,
  },
  phonePrefixFlag: { fontSize: 16 },
  phonePrefixText: {
    fontSize: 14,
    fontFamily: 'Inter_600SemiBold',
  },
  phoneInput: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    paddingHorizontal: 12,
    paddingVertical: 14,
  },
  errorText: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 15,
    borderRadius: 14,
    marginTop: 4,
  },
  submitBtnDisabled: { opacity: 0.45 },
  submitBtnText: {
    fontSize: 15,
    fontFamily: 'Inter_700Bold',
    color: '#ffffff',
  },
});