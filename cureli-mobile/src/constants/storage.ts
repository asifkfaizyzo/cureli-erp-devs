// src/constants/storage.ts
//
// MMKV key constants for Cureli Mobile.
// All storage keys live here — no magic strings elsewhere.

export const STORAGE_KEYS = {
  // ── Auth (also defined in services/storage.ts internally) ─
  ACCESS_TOKEN: "auth.access_token",
  REFRESH_TOKEN: "auth.refresh_token",
  USER: "auth.user",

  // ── Onboarding ────────────────────────────────────────────
  INTRO_SEEN: "onboarding.intro_seen",
  ONBOARDING_COMPLETE: "onboarding.completed",

  // App settings
  THEME_PREFERENCE: "app.theme_preference",
  DARK_VARIANT: "app.dark_variant",
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];
