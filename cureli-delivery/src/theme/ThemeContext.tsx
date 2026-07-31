// src/theme/ThemeContext.tsx
import React, {
  createContext, useContext, useMemo, useCallback, useState,
} from 'react';
import { StorageService } from '../services/storage';
import { LightColors, DarkColors } from './colors';
import type { ColorPalette } from './colors';

export type ThemePreference = 'light' | 'dark';

interface ThemeContextValue {
  colors:        ColorPalette;
  theme:         ThemePreference;
  preference:    ThemePreference;
  isDark:        boolean;
  setPreference: (pref: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(() =>
    StorageService.getThemePreference()
  );

  const isDark = preference === 'dark';

  const colors = useMemo(() =>
    isDark ? DarkColors : LightColors,
  [isDark]);

  const setPreference = useCallback((pref: ThemePreference) => {
    setPreferenceState(pref);
    StorageService.setThemePreference(pref);
  }, []);

  const value = useMemo<ThemeContextValue>(() => ({
    colors,
    theme: preference,
    preference,
    isDark,
    setPreference,
  }), [colors, preference, isDark, setPreference]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
}