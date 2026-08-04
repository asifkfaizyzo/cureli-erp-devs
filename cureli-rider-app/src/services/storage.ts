import { MMKV } from 'react-native-mmkv';

const storage = new MMKV({ id: 'cureli-rider-storage' });

export const StorageService = {
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
    storage.delete('auth.access_token');
    storage.delete('auth.refresh_token');
  },
  clearAll(): void {
    storage.clearAll();
  },
  getThemePreference(): 'light' | 'dark' {
    const val = storage.getString('app.theme_preference');
    if (val === 'light' || val === 'dark') return val;
    return 'dark';
  },
  setThemePreference(pref: 'light' | 'dark'): void {
    storage.set('app.theme_preference', pref);
  },
  getString(key: string): string | null {
    return storage.getString(key) ?? null;
  },
  setString(key: string, value: string): void {
    storage.set(key, value);
  },
};