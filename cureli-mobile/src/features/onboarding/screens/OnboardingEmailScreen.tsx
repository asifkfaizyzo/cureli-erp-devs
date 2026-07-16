// src/features/onboarding/screens/OnboardingEmailScreen.tsx

import { useState } from 'react';
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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useUpdateProfile } from '../../profile/hooks/useUpdateProfile';
import { StorageService } from '../../../services/storage';
import { useTheme } from '../../../theme/ThemeContext';

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function OnboardingEmailScreen() {
  const { colors, isDark } = useTheme();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { updateProfile, isPending } = useUpdateProfile({
    redirectOnSuccess: false,
  });

  function finishOnboarding() {
    router.replace('/(tabs)/home');
  }

  async function handleFinish() {
    const trimmed = email.trim();

    if (!trimmed) {
      finishOnboarding();
      return;
    }

    if (!isValidEmail(trimmed)) {
      setError('Please enter a valid email address');
      return;
    }

    setError(null);

    updateProfile(
      { email: trimmed },
      {
        onSuccess: () => finishOnboarding(),
        onError: () => finishOnboarding(),
      },
    );
  }

  function handleSkip() {
    finishOnboarding();
  }

  return (
    <SafeAreaView
      style={[styles.safe, { backgroundColor: colors.background.page }]}
      edges={['top', 'bottom']}
    >
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Progress */}
          <View style={styles.progressRow}>
            <View
              style={[
                styles.progressBar,
                { backgroundColor: isDark ? colors.brand.accent : colors.brand.primary },
              ]}
            />
            <View
              style={[
                styles.progressBar,
                { backgroundColor: isDark ? colors.brand.accent : colors.brand.primary },
              ]}
            />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.stepLabel, { color: colors.text.faint }]}>
              Step 2 of 2
            </Text>
            <Text style={[styles.title, { color: colors.text.primary }]}>
              Stay in the loop
            </Text>
            <Text style={[styles.subtitle, { color: colors.text.muted }]}>
              Get order confirmations and health tips straight to your inbox.
              Totally optional.
            </Text>
          </View>

          {/* Input */}
          <View style={styles.inputBlock}>
            <Text style={[styles.inputLabel, { color: colors.text.secondary }]}>
              Email address{' '}
              <Text style={{ color: colors.text.faint }}>(optional)</Text>
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
                },
              ]}
              value={email}
              onChangeText={(v) => {
                setEmail(v);
                if (error) setError(null);
              }}
              placeholder="you@example.com"
              placeholderTextColor={colors.text.faint}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
              maxLength={255}
              returnKeyType="done"
              onSubmitEditing={handleFinish}
            />
            {error ? (
              <Text style={[styles.fieldError, { color: colors.status.error }]}>
                {error}
              </Text>
            ) : null}
          </View>

          {/* Finish button */}
          <TouchableOpacity
            style={[
              styles.button,
              {
                backgroundColor: isDark
                  ? colors.brand.accent
                  : colors.brand.primary,
              },
              isPending && styles.buttonDisabled,
            ]}
            onPress={handleFinish}
            disabled={isPending}
            activeOpacity={0.85}
          >
            {isPending ? (
              <ActivityIndicator size={18} color="#ffffff" />
            ) : null}
            <Text style={styles.buttonText}>
              {isPending
                ? 'Saving…'
                : email.trim()
                ? 'Finish Setup'
                : 'Skip for now'}
            </Text>
            {!isPending && (
              <MaterialIcons name="check" size={18} color="#ffffff" />
            )}
          </TouchableOpacity>

          {/* Skip link */}
          {email.trim().length === 0 && (
            <TouchableOpacity onPress={handleSkip} style={styles.skipLink}>
              <Text style={[styles.skipText, { color: colors.text.faint }]}>
                I'll add this later from my profile
              </Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  flex: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: 28,
    paddingTop: 32,
    paddingBottom: 24,
    gap: 32,
  },
  progressRow: {
    flexDirection: 'row',
    gap: 8,
  },
  progressBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  header: {
    gap: 10,
  },
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
  inputBlock: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
  },
  input: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontSize: 17,
    fontFamily: 'Inter_400Regular',
  },
  fieldError: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 14,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonText: {
    fontSize: 16,
    fontFamily: 'Inter_700Bold',
    color: '#ffffff',
  },
  skipLink: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  skipText: {
    fontSize: 13,
    fontFamily: 'Inter_400Regular',
    textDecorationLine: 'underline',
  },
});