// src/features/onboarding/screens/OnboardingNameScreen.tsx

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
import { Image } from 'expo-image';
import { MaterialIcons } from '@expo/vector-icons';
import { useUpdateProfile } from '../../profile/hooks/useUpdateProfile';
import { useTheme } from '../../../theme/ThemeContext';

export function OnboardingNameScreen() {
  const { colors, isDark } = useTheme();
  const [name, setName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const { updateProfile, isPending, error: mutationError } = useUpdateProfile({
    redirectOnSuccess: false,
  });

  function validate(): boolean {
    const trimmed = name.trim();
    if (trimmed.length < 2) {
      setError('Please enter your full name (at least 2 characters)');
      return false;
    }
    if (trimmed.length > 200) {
      setError('Name is too long');
      return false;
    }
    setError(null);
    return true;
  }

  async function handleContinue() {
    if (!validate()) return;

    updateProfile(
      { full_name: name.trim() },
      {
        onSuccess: () => {
          router.replace('/onboarding/email');
        },
      },
    );
  }

  const displayError = error ?? mutationError;

  const logoSource = isDark
    ? require('../../../../assets/images/cureliwhitenew.png')
    : require('../../../../assets/images/curelidarknew.png');

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
          {/* Logo */}
          <Image source={logoSource} style={styles.logo} contentFit="contain" />

          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.stepLabel, { color: colors.text.faint }]}>
              Step 1 of 2
            </Text>
            <Text style={[styles.title, { color: colors.text.primary }]}>
              What should we{'\n'}call you?
            </Text>
            <Text style={[styles.subtitle, { color: colors.text.muted }]}>
              Your name helps us personalise your experience
            </Text>
          </View>

          {/* Input */}
          <View style={styles.inputBlock}>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: colors.background.input,
                  borderColor: displayError
                    ? colors.status.error
                    : colors.border.input,
                  color: colors.text.primary,
                },
              ]}
              value={name}
              onChangeText={(v) => {
                setName(v);
                if (error) setError(null);
              }}
              placeholder="Enter your full name"
              placeholderTextColor={colors.text.faint}
              autoCapitalize="words"
              autoCorrect={false}
              autoFocus
              maxLength={200}
              returnKeyType="done"
              onSubmitEditing={handleContinue}
            />
            {displayError ? (
              <Text style={[styles.fieldError, { color: colors.status.error }]}>
                {displayError}
              </Text>
            ) : null}
          </View>

          {/* Continue button */}
          <TouchableOpacity
            style={[
              styles.button,
              {
                backgroundColor: isDark
                  ? colors.brand.accent
                  : colors.brand.primary,
              },
              (isPending || name.trim().length < 2) && styles.buttonDisabled,
            ]}
            onPress={handleContinue}
            disabled={isPending || name.trim().length < 2}
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

          {/* Note */}
          <Text style={[styles.note, { color: colors.text.faint }]}>
            You can change this later in your profile settings
          </Text>
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
  logo: {
    width: 52,
    height: 52,
    borderRadius: 14,
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
    gap: 6,
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
  note: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
  },
});