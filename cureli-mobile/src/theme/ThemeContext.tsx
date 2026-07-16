// src/theme/ThemeContext.tsx
//
// Provides theme colors and mode to the entire app.
// Reads preference from MMKV. Defaults to 'light'.
// Re-renders only the consumers that use useTheme().
//
// Note: 'system' preference has been removed. Users must explicitly
// choose 'light' or 'dark' via the Settings screen. New installs
// start in light mode.

import React, {
  createContext,
  useContext,
  useMemo,
  useCallback,
  useState,
} from "react";
import { StorageService } from "../services/storage";
import { LightColors, DarkColors } from "./colors";
import type { ColorPalette } from "./colors";

// ── Types ─────────────────────────────────────────────────────

export type ThemePreference = "light" | "dark";

interface ThemeContextValue {
  colors: ColorPalette;
  theme: ThemePreference;
  preference: ThemePreference;
  isDark: boolean;
  setPreference: (pref: ThemePreference) => void;
}

// ── Context ───────────────────────────────────────────────────

const ThemeContext = createContext<ThemeContextValue | null>(null);

// ── Provider ──────────────────────────────────────────────────

interface ThemeProviderProps {
  children: React.ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [preference, setPreferenceState] = useState<ThemePreference>(() => {
    return StorageService.getThemePreference();
  });

  const isDark = preference === "dark";

  const colors = useMemo(() => {
    return isDark ? DarkColors : LightColors;
  }, [isDark]);

  const setPreference = useCallback((pref: ThemePreference) => {
    setPreferenceState(pref);
    StorageService.setThemePreference(pref);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      colors,
      theme: preference,
      preference,
      isDark,
      setPreference,
    }),
    [colors, preference, isDark, setPreference],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}