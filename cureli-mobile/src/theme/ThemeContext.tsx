// src/theme/ThemeContext.tsx
//
// Provides theme colors and mode to the entire app.
// Reads preference from MMKV. Defaults to system.
// Re-renders only the consumers that use useTheme().

import React, { createContext, useContext, useMemo, useCallback, useState} from 'react';
import { useColorScheme } from 'react-native';
import { StorageService } from '../services/storage';
import { LightColors, getDarkColors, DARK_VARIANT } from './colors';
import type { ColorPalette, DarkVariant } from './colors';

// ── Types ─────────────────────────────────────────────────────

export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

interface ThemeContextValue {
  colors: ColorPalette;
  theme: ResolvedTheme;
  preference: ThemePreference;
  isDark: boolean;
  setPreference: (pref: ThemePreference) => void;
  darkVariant: DarkVariant;
  setDarkVariant: (variant: DarkVariant) => void;
}

// ── Context ───────────────────────────────────────────────────

const ThemeContext = createContext<ThemeContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const systemScheme = useColorScheme(); // 'light' | 'dark' | null

  const [preference, setPreferenceState] = useState<ThemePreference>(() => {
    return StorageService.getThemePreference();
  });

  const [darkVariant, setDarkVariantState] = useState<DarkVariant>(() => {
    return StorageService.getDarkVariant();
  });

  // Resolve the actual theme
  const resolvedTheme: ResolvedTheme = useMemo(() => {
    if (preference === 'system') {
      return systemScheme === 'dark' ? 'dark' : 'light';
    }
    return preference;
  }, [preference, systemScheme]);

  const isDark = resolvedTheme === 'dark';

  const colors = useMemo(() => {
    return isDark ? getDarkColors(darkVariant) : LightColors;
  }, [isDark, darkVariant]);

  const setPreference = useCallback((pref: ThemePreference) => {
    setPreferenceState(pref);
    StorageService.setThemePreference(pref);
  }, []);

  const setDarkVariant = useCallback((variant: DarkVariant) => {
    setDarkVariantState(variant);
    StorageService.setDarkVariant(variant);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      colors,
      theme: resolvedTheme,
      preference,
      isDark,
      setPreference,
      darkVariant,
      setDarkVariant,
    }),
    [colors, resolvedTheme, preference, isDark, setPreference, darkVariant, setDarkVariant],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}