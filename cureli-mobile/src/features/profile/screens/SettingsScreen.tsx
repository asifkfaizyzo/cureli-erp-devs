// src/features/profile/screens/SettingsScreen.tsx
//
// App settings screen with theme picker and dark variant picker.

import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '../../../theme/ThemeContext';
import type { ThemePreference } from '../../../theme/ThemeContext';
import type { DarkVariant } from '../../../theme/colors';

const THEME_OPTIONS: { value: ThemePreference; label: string; icon: keyof typeof MaterialIcons.glyphMap }[] = [
  { value: 'system', label: 'System default', icon: 'settings-suggest' },
  { value: 'light',  label: 'Light',          icon: 'light-mode' },
  { value: 'dark',   label: 'Dark',           icon: 'dark-mode' },
];

const VARIANT_OPTIONS: { value: DarkVariant; label: string; preview: string }[] = [
  { value: 'navy',    label: 'Navy',    preview: '#090025' },
  { value: 'pure',    label: 'Pure Black', preview: '#000000' },
  { value: 'neutral', label: 'Neutral', preview: '#0a0a0a' },
];

export function SettingsScreen() {
  const { colors, preference, setPreference, isDark, darkVariant, setDarkVariant } = useTheme();

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: colors.background.page }]} edges={['top']}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.background.card, borderBottomColor: colors.border.default }]}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <MaterialIcons name="arrow-back" size={22} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text.primary }]}>Settings</Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Theme section */}
        <Text style={[styles.sectionTitle, { color: colors.text.muted }]}>APPEARANCE</Text>
        <View style={[styles.card, { backgroundColor: colors.background.card, borderColor: colors.border.default }]}>
          {THEME_OPTIONS.map((option, index) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.optionRow,
                index < THEME_OPTIONS.length - 1 && {
                  borderBottomWidth: 1,
                  borderBottomColor: colors.border.subtle,
                },
              ]}
              onPress={() => setPreference(option.value)}
              activeOpacity={0.7}
            >
              <MaterialIcons name={option.icon} size={20} color={colors.text.muted} />
              <Text style={[styles.optionLabel, { color: colors.text.primary }]}>
                {option.label}
              </Text>
              {preference === option.value && (
                <MaterialIcons name="check-circle" size={20} color={colors.brand.accent} />
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Dark variant section — only visible when in dark mode */}
        {isDark && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.text.muted }]}>DARK THEME STYLE</Text>
            <View style={[styles.card, { backgroundColor: colors.background.card, borderColor: colors.border.default }]}>
              {VARIANT_OPTIONS.map((option, index) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionRow,
                    index < VARIANT_OPTIONS.length - 1 && {
                      borderBottomWidth: 1,
                      borderBottomColor: colors.border.subtle,
                    },
                  ]}
                  onPress={() => setDarkVariant(option.value)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.colorPreview, { backgroundColor: option.preview }]} />
                  <Text style={[styles.optionLabel, { color: colors.text.primary }]}>
                    {option.label}
                  </Text>
                  {darkVariant === option.value && (
                    <MaterialIcons name="check-circle" size={20} color={colors.brand.accent} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
            <Text style={[styles.hint, { color: colors.text.faint }]}>
              Changes the background style when dark mode is active
            </Text>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
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
    fontFamily: 'Inter_700Bold',
  },
  headerRight: {
    width: 36,
  },
  content: {
    padding: 16,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 12,
    fontFamily: 'Inter_600SemiBold',
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  card: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 16,
    paddingVertical: 15,
  },
  optionLabel: {
    flex: 1,
    fontSize: 15,
    fontFamily: 'Inter_500Medium',
  },
  colorPreview: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  hint: {
    fontSize: 12,
    fontFamily: 'Inter_400Regular',
    paddingHorizontal: 4,
    marginTop: 4,
  },
});