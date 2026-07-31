// src/constants/storage.ts
export const STORAGE_KEYS = {
  ACCESS_TOKEN:  'auth.access_token',
  REFRESH_TOKEN: 'auth.refresh_token',
  RIDER:         'auth.rider',
  THEME_PREFERENCE: 'app.theme_preference',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];