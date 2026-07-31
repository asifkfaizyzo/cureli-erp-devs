// src/services/storage.ts
import { createMMKV } from 'react-native-mmkv';

const storage = createMMKV({ id: 'cureli-delivery-storage' });

export const StorageService = {
  // ── Auth tokens ───────────────────────────────────────────
  getAccessToken(): string | null {
    return storage.getString('auth.access_token') ?? null;
  },
  setAccessToken(token: string): void {
    storage.set('auth.access_token', token);
  },

  getRefreshToken(): string | null {
    return storage.getString('auth.refresh_token') ?? null;
  },
  setRefreshToken(token: string): void {
    storage.set('auth.refresh_token', token);
  },

  clearAuth(): void {
    storage.remove('auth.access_token');
    storage.remove('auth.refresh_token');
    storage.remove('auth.rider');
  },

  clearAll(): void {
    storage.clearAll();
  },

  // ── Theme ─────────────────────────────────────────────────
  getThemePreference(): 'light' | 'dark' {
    const val = storage.getString('app.theme_preference');
    if (val === 'light' || val === 'dark') return val;
    return 'dark'; // delivery app defaults to dark
  },
  setThemePreference(pref: 'light' | 'dark'): void {
    storage.set('app.theme_preference', pref);
  },

  // ── Generic ───────────────────────────────────────────────
  getString(key: string): string | null {
    return storage.getString(key) ?? null;
  },
  setString(key: string, value: string): void {
    storage.set(key, value);
  },
};