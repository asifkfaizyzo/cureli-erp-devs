// src/features/profile/screens/DeleteAccountScreen.tsx

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useDeleteAccount } from '../hooks/useDeleteAccount';
import { useProfile } from '../hooks/useProfile';
import { useTheme } from '../../../theme/ThemeContext';
import { useDialog } from '../../../components/Dialog/DialogProvider';

const OTP_LENGTH = 6;

export function DeleteAccountScreen() {
  const { colors } = useTheme();
  const { confirm } = useDialog();
  const { user } = useProfile();
  const {
    step,
    isSendingOtp,
    isConfirming,
    otpError,
    sendError,
    expiresIn,
    requestOtp,
    confirmDeletion,
    resetToWarning,
    setOtpError,
  } = useDeleteAccount();

  const [otp, setOtp] = useState('');
  const [countdown, setCountdown] = useState(0);
  const inputRef = useRef<TextInput>(null);

  useEffect(() => {
    if (step === 'otp') {
      setCountdown(expiresIn);
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) { clearInterval(timer); return 0; }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [step, expiresIn]);

  useEffect(() => {
    if (otp.length === OTP_LENGTH && step === 'otp') {
      handleConfirm(otp);
    }
  }, [otp]);

  function handleOtpChange(text: string) {
    const digits = text.replace(/\D/g, '').slice(0, OTP_LENGTH);
    setOtp(digits);
    if (otpError) setOtpError(null);
  }

  async function handleConfirm(code: string) {
    if (code.length !== OTP_LENGTH) return;

    const confirmed = await confirm({
      title: 'Final confirmation',
      message: 'This will permanently delete your account and all your data. There is no way to undo this.',
      confirmLabel: 'Yes, delete my account',
      cancelLabel: 'Cancel',
      destructive: true,
      icon: 'delete-forever',
    });

    if (!confirmed) {
      setOtp('');
      return;
    }

    confirmDeletion(code);
  }

  function handleBack() {
    if (step === 'otp') { resetToWarning(); setOtp(''); }
    else { router.back(); }
  }

  function formatCountdown(seconds: number): string {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  function renderOtpBoxes() {
    return (
      <View style={styles.otpRow}>
        {Array.from({ length: OTP_LENGTH }).map((_, index) => {
          const char = otp[index] ?? '';
          const isCurrent = index === otp.length && !isConfirming;
          const isFilled = index < otp.length;
          return (
            <TouchableOpacity
              key={index}
              style={[
                styles.otpBox,
                {
                  backgroundColor: colors.background.input,
                  borderColor: colors.border.input,
                },
                isFilled && {
                  borderColor: colors.status.error,
                  backgroundColor: colors.status.errorBg,
                },
                isCurrent && {
                  borderColor: colors.status.error,
                  borderWidth: 2,
                  backgroundColor: colors.background.card,
                },
                otpError ? { borderColor: colors.status.error } : null,
              ]}
              onPress={() => inputRef.current?.focus()}
              activeOpacity={1}
            >
              <Text style={[styles.otpChar, { color: colors.text.primary, fontFamily: 'Inter_700Bold' }]}>
                {char}
              </Text>
              {isCurrent && (
                <View style={[styles.cursor, { backgroundColor: colors.status.error }]} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    );
  }

  const Header = ({ title }: { title: string }) => (
    <View style={[styles.header, { backgroundColor: colors.background.card, borderBottomColor: colors.border.default }]}>
      <TouchableOpacity onPress={handleBack} style={styles.backButton} activeOpacity={0.7} disabled={isConfirming}>
        <MaterialIcons name="arrow-back" size={22} color={colors.text.primary} />
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { color: colors.text.primary, fontFamily: 'Inter_700Bold' }]}>
        {title}
      </Text>
      <View style={styles.headerRight} />
    </View>
  );

  // ── Warning step ──────────────────────────────────────────

  if (step === 'warning') {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: colors.background.page }]} edges={['top', 'bottom']}>
        <Header title="Delete Account" />
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          <View style={[styles.warningIconWrapper, { backgroundColor: colors.status.errorBg }]}>
            <MaterialIcons name="warning" size={48} color={colors.status.error} />
          </View>

          <Text style={[styles.warningTitle, { color: colors.text.primary, fontFamily: 'Inter_700Bold' }]}>
            Are you sure you want to delete your account?
          </Text>
          <Text style={[styles.warningSubtitle, { color: colors.text.muted, fontFamily: 'Inter_400Regular' }]}>
            This action is permanent and cannot be undone.
          </Text>

          <View style={[styles.consequenceCard, { backgroundColor: colors.background.card, borderColor: colors.status.errorBorder }]}>
            <Text style={[styles.consequenceTitle, { color: colors.text.primary, fontFamily: 'Inter_600SemiBold' }]}>
              What will be permanently deleted:
            </Text>
            {[
              'Your profile — name, email, phone',
              'All saved addresses',
              'All active sessions on every device',
              'Your account access permanently',
            ].map((item, index) => (
              <View key={index} style={styles.consequenceRow}>
                <MaterialIcons name="remove-circle" size={16} color={colors.status.error} />
                <Text style={[styles.consequenceText, { color: colors.text.muted, fontFamily: 'Inter_400Regular' }]}>
                  {item}
                </Text>
              </View>
            ))}
          </View>

          <View style={[styles.phoneConfirmCard, { backgroundColor: colors.background.elevated, borderColor: colors.border.default }]}>
            <MaterialIcons name="phone-android" size={18} color={colors.text.muted} />
            <View>
              <Text style={[styles.phoneConfirmLabel, { color: colors.text.faint, fontFamily: 'Inter_500Medium' }]}>
                OTP will be sent to
              </Text>
              <Text style={[styles.phoneConfirmNumber, { color: colors.text.primary, fontFamily: 'Inter_600SemiBold' }]}>
                {user?.phone ?? '—'}
              </Text>
            </View>
          </View>

          {sendError ? (
            <View style={[styles.errorBanner, { backgroundColor: colors.status.errorBg, borderColor: colors.status.errorBorder }]}>
              <MaterialIcons name="error-outline" size={16} color={colors.status.error} />
              <Text style={[styles.errorBannerText, { color: colors.status.error, fontFamily: 'Inter_500Medium' }]}>
                {sendError}
              </Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.deleteButton, { backgroundColor: colors.status.error }, isSendingOtp && styles.buttonDisabled]}
            onPress={requestOtp}
            disabled={isSendingOtp}
            activeOpacity={0.8}
          >
            {isSendingOtp
              ? <ActivityIndicator size={18} color="#ffffff" />
              : <MaterialIcons name="sms" size={18} color="#ffffff" />}
            <Text style={[styles.deleteButtonText, { fontFamily: 'Inter_700Bold' }]}>
              {isSendingOtp ? 'Sending OTP…' : 'Send OTP to Verify'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()} activeOpacity={0.7}>
            <Text style={[styles.cancelButtonText, { color: colors.text.faint, fontFamily: 'Inter_500Medium' }]}>
              Cancel, keep my account
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ── OTP step ──────────────────────────────────────────────

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background.page }]} edges={['top', 'bottom']}>
      <Header title="Verify Deletion" />
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        <View style={[styles.otpIconWrapper, { backgroundColor: colors.status.errorBg }]}>
          <MaterialIcons name="lock-open" size={40} color={colors.status.error} />
        </View>

        <Text style={[styles.otpTitle, { color: colors.text.primary, fontFamily: 'Inter_700Bold' }]}>
          Enter verification code
        </Text>
        <Text style={[styles.otpSubtitle, { color: colors.text.muted, fontFamily: 'Inter_400Regular' }]}>
          We sent a 6-digit code to{'\n'}
          <Text style={[{ color: colors.text.primary, fontFamily: 'Inter_600SemiBold' }]}>
            {user?.phone ?? '—'}
          </Text>
        </Text>

        <TextInput
          ref={inputRef}
          value={otp}
          onChangeText={handleOtpChange}
          keyboardType="number-pad"
          maxLength={OTP_LENGTH}
          autoFocus
          caretHidden
          style={styles.hiddenInput}
          editable={!isConfirming}
        />

        {renderOtpBoxes()}

        {otpError ? (
          <Text style={[styles.otpError, { color: colors.status.error, fontFamily: 'Inter_500Medium' }]}>
            {otpError}
          </Text>
        ) : null}

        {isConfirming ? (
          <View style={styles.confirmingRow}>
            <ActivityIndicator size="small" color={colors.status.error} />
            <Text style={[styles.confirmingText, { color: colors.status.error, fontFamily: 'Inter_500Medium' }]}>
              Deleting account…
            </Text>
          </View>
        ) : null}

        <View style={styles.countdownRow}>
          <MaterialIcons name="timer" size={14} color={countdown < 60 ? colors.status.error : colors.text.faint} />
          <Text style={[
            styles.countdownText,
            { color: colors.text.faint, fontFamily: 'Inter_400Regular' },
            countdown < 60 && { color: colors.status.error, fontFamily: 'Inter_500Medium' },
          ]}>
            {countdown > 0
              ? `OTP expires in ${formatCountdown(countdown)}`
              : 'OTP expired — go back and request a new one'}
          </Text>
        </View>

        <TouchableOpacity
          style={[
            styles.confirmButton,
            { backgroundColor: colors.status.error },
            (otp.length < OTP_LENGTH || isConfirming || countdown === 0) && styles.buttonDisabled,
          ]}
          onPress={() => handleConfirm(otp)}
          disabled={otp.length < OTP_LENGTH || isConfirming || countdown === 0}
          activeOpacity={0.8}
        >
          <MaterialIcons name="delete-forever" size={18} color="#ffffff" />
          <Text style={[styles.confirmButtonText, { fontFamily: 'Inter_700Bold' }]}>
            Confirm Account Deletion
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelButton} onPress={handleBack} disabled={isConfirming} activeOpacity={0.7}>
          <Text style={[styles.cancelButtonText, { color: colors.text.faint, fontFamily: 'Inter_500Medium' }]}>
            Cancel
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  backButton: { width: 36, height: 36, alignItems: 'center', justifyContent: 'center', borderRadius: 8 },
  headerTitle: { fontSize: 17 },
  headerRight: { width: 36 },
  content: { flexGrow: 1, padding: 24, alignItems: 'center', gap: 20 },
  warningIconWrapper: { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  warningTitle: { fontSize: 20, textAlign: 'center', lineHeight: 28 },
  warningSubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 22, marginTop: -8 },
  consequenceCard: { width: '100%', borderRadius: 12, borderWidth: 1.5, padding: 16, gap: 12 },
  consequenceTitle: { fontSize: 13, marginBottom: 4 },
  consequenceRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  consequenceText: { fontSize: 13, flex: 1, lineHeight: 20 },
  phoneConfirmCard: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 12, borderWidth: 1, padding: 14 },
  phoneConfirmLabel: { fontSize: 11 },
  phoneConfirmNumber: { fontSize: 15 },
  errorBanner: { width: '100%', flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 10, padding: 12 },
  errorBannerText: { flex: 1, fontSize: 13 },
  deleteButton: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15, borderRadius: 12 },
  deleteButtonText: { fontSize: 15, color: '#ffffff' },
  cancelButton: { paddingVertical: 12, alignItems: 'center' },
  cancelButtonText: { fontSize: 14 },
  buttonDisabled: { opacity: 0.5 },
  otpIconWrapper: { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginTop: 8 },
  otpTitle: { fontSize: 22, textAlign: 'center' },
  otpSubtitle: { fontSize: 14, textAlign: 'center', lineHeight: 22, marginTop: -8 },
  hiddenInput: { position: 'absolute', opacity: 0, width: 1, height: 1 },
  otpRow: { flexDirection: 'row', gap: 10, marginVertical: 8 },
  otpBox: { width: 48, height: 58, borderWidth: 1.5, borderRadius: 12, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  otpChar: { fontSize: 22 },
  cursor: { position: 'absolute', bottom: 10, width: 2, height: 22, borderRadius: 1 },
  otpError: { fontSize: 13, textAlign: 'center', marginTop: -8 },
  confirmingRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  confirmingText: { fontSize: 14 },
  countdownRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: -8 },
  countdownText: { fontSize: 12 },
  confirmButton: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 15, borderRadius: 12 },
  confirmButtonText: { fontSize: 15, color: '#ffffff' },
});