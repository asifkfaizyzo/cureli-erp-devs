// src/features/onboarding/screens/OnboardingEmailScreen.tsx
//
// Step 2 of post-login onboarding.
// Collects email — optional. User can skip.
// On complete: marks onboarding done, routes to home.

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
import { Colors } from '../../../theme/colors';

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
}

export function OnboardingEmailScreen() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { updateProfile, isPending } = useUpdateProfile({
    redirectOnSuccess: false,
  });

  function finishOnboarding() {
    StorageService.setOnboardingComplete();
    router.replace('/(tabs)/home');
  }

  async function handleFinish() {
    const trimmed = email.trim();

    // If field is empty, treat as skip
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
      { full_name: '', email: trimmed },
      {
        onSuccess: () => {
          finishOnboarding();
        },
        onError: () => {
          // Even if email update fails, let user proceed
          // They can update it later from profile
          finishOnboarding();
        },
      },
    );
  }

  function handleSkip() {
    finishOnboarding();
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
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
            <View style={styles.progressDone} />
            <View style={styles.progressActive} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.stepLabel}>Step 2 of 2</Text>
            <Text style={styles.title}>Stay in the loop</Text>
            <Text style={styles.subtitle}>
              Get order confirmations and health tips straight to your inbox.
              Totally optional.
            </Text>
          </View>

          {/* Input */}
          <View style={styles.inputBlock}>
            <Text style={styles.inputLabel}>
              Email address{' '}
              <Text style={styles.optional}>(optional)</Text>
            </Text>
            <TextInput
              style={[styles.input, error ? styles.inputError : null]}
              value={email}
              onChangeText={(v) => {
                setEmail(v);
                if (error) setError(null);
              }}
              placeholder="you@example.com"
              placeholderTextColor={Colors.text.faint}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoFocus
              maxLength={255}
              returnKeyType="done"
              onSubmitEditing={handleFinish}
            />
            {error ? (
              <Text style={styles.fieldError}>{error}</Text>
            ) : null}
          </View>

          {/* Finish button */}
          <TouchableOpacity
            style={[styles.button, isPending && styles.buttonDisabled]}
            onPress={handleFinish}
            disabled={isPending}
            activeOpacity={0.85}
          >
            {isPending ? (
              <ActivityIndicator size={18} color="#ffffff" />
            ) : null}
            <Text style={styles.buttonText}>
              {isPending ? 'Saving…' : email.trim() ? 'Finish Setup' : 'Skip for now'}
            </Text>
            {!isPending && (
              <MaterialIcons name="check" size={18} color="#ffffff" />
            )}
          </TouchableOpacity>

          {/* Skip link */}
          {email.trim().length === 0 && (
            <TouchableOpacity onPress={handleSkip} style={styles.skipLink}>
              <Text style={styles.skipText}>
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
    backgroundColor: '#ffffff',
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
  progressDone: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.brand.dark,
  },
  progressActive: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.brand.dark,
  },
  header: {
    gap: 10,
  },
  stepLabel: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text.faint,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  title: {
    fontSize: 30,
    fontFamily: 'Inter_700Bold',
    color: Colors.text.primary,
    lineHeight: 38,
  },
  subtitle: {
    fontSize: 15,
    fontFamily: 'Inter_400Regular',
    color: Colors.text.muted,
    lineHeight: 23,
  },
  inputBlock: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 13,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text.secondary,
  },
  optional: {
    fontFamily: 'Inter_400Regular',
    color: Colors.text.faint,
  },
  input: {
    backgroundColor: Colors.background.page,
    borderWidth: 1.5,
    borderColor: Colors.border.default,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 15,
    fontSize: 17,
    fontFamily: 'Inter_400Regular',
    color: Colors.text.primary,
  },
  inputError: {
    borderColor: Colors.status.error,
    backgroundColor: Colors.status.errorBg,
  },
  fieldError: {
    fontSize: 12,
    fontFamily: 'Inter_500Medium',
    color: Colors.status.error,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.brand.dark,
    paddingVertical: 16,
    borderRadius: 14,
  },
  buttonDisabled: {
    backgroundColor: Colors.text.disabled,
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
    color: Colors.text.faint,
    textDecorationLine: 'underline',
  },
});