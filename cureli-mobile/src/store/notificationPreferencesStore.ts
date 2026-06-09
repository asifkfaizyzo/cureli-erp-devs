// src/store/notificationPreferencesStore.ts
//
// Stores push notification preferences for the mobile user.
//
// Persistence strategy:
//   - MMKV: instant local read on app start (no network wait)
//   - Backend: source of truth, synced on login and on change
//
// The UI reads from this store.
// The push service reads from this store before sending local decisions.
// The backend enforces preferences server-side before sending push.

import { create } from 'zustand';
import { StorageService } from '../services/storage';
import { api } from '../services/api';
import { PUSH_CATEGORIES, type PushCategory } from '../constants/pushCategories';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface PushPreferences {
  master_enabled:         boolean;
  order_updates:          boolean;
  promotions:             boolean;
  prescription_updates:   boolean;
  system_messages:        boolean;
  cart_abandonment:       boolean;
}

const DEFAULT_PREFERENCES: PushPreferences = {
  master_enabled:         true,
  order_updates:          true,
  promotions:             true,
  prescription_updates:   true,
  system_messages:        true,
  cart_abandonment:       true,
};

const STORAGE_KEY = 'push_preferences';

interface NotificationPreferencesState {
  preferences:  PushPreferences;
  isLoading:    boolean;
  isSaving:     boolean;
  lastSyncedAt: Date | null;

  // Actions
  loadPreferences:  () => Promise<void>;
  updatePreference: (key: keyof PushPreferences, value: boolean) => Promise<void>;
  setMasterEnabled: (enabled: boolean) => Promise<void>;
  resetToDefaults:  () => Promise<void>;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function loadFromMMKV(): PushPreferences | null {
  try {
    const raw = StorageService.getString(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as PushPreferences;
  } catch {
    return null;
  }
}

function saveToMMKV(prefs: PushPreferences): void {
  try {
    StorageService.setString(STORAGE_KEY, JSON.stringify(prefs));
  } catch {
    // Non-fatal
  }
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useNotificationPreferencesStore = create<NotificationPreferencesState>(
  (set, get) => ({
    preferences:  loadFromMMKV() ?? DEFAULT_PREFERENCES,
    isLoading:    false,
    isSaving:     false,
    lastSyncedAt: null,

    // ── loadPreferences ───────────────────────────────────────────────────
    // Called on login. Fetches from backend and updates MMKV + store.
    // If backend fails, falls back to MMKV cache.

    loadPreferences: async () => {
      set({ isLoading: true });
      try {
        const { data } = await api.get('/mobile/push/preferences');
        const prefs = data.data as PushPreferences;

        saveToMMKV(prefs);
        set({ preferences: prefs, lastSyncedAt: new Date() });
      } catch (err) {
        // Backend failed — use MMKV cache (already in state from initializer)
        console.warn('[PushPrefs] Failed to load from backend, using cache');
      } finally {
        set({ isLoading: false });
      }
    },

    // ── updatePreference ──────────────────────────────────────────────────
    // Optimistic update: update local state immediately, then sync to backend.
    // If backend fails, roll back.

    updatePreference: async (key: keyof PushPreferences, value: boolean) => {
      const previous = get().preferences;
      const updated = { ...previous, [key]: value };

      // Optimistic update
      set({ preferences: updated, isSaving: true });
      saveToMMKV(updated);

      try {
        await api.patch('/mobile/push/preferences', { [key]: value });
        set({ lastSyncedAt: new Date() });
      } catch (err) {
        // Roll back
        console.warn('[PushPrefs] Save failed, rolling back');
        set({ preferences: previous });
        saveToMMKV(previous);
      } finally {
        set({ isSaving: false });
      }
    },

    // ── setMasterEnabled ──────────────────────────────────────────────────
    // Toggles master switch. When disabling, all categories go false.
    // When enabling, restores defaults for each category.

    setMasterEnabled: async (enabled: boolean) => {
      const previous = get().preferences;

      const updated: PushPreferences = enabled
        ? { ...DEFAULT_PREFERENCES, master_enabled: true }
        : {
            master_enabled:       false,
            order_updates:        false,
            promotions:           false,
            prescription_updates: false,
            system_messages:      false,
            cart_abandonment:     false,
          };

      set({ preferences: updated, isSaving: true });
      saveToMMKV(updated);

      try {
        await api.patch('/mobile/push/preferences', updated);
        set({ lastSyncedAt: new Date() });
      } catch (err) {
        console.warn('[PushPrefs] Master toggle save failed, rolling back');
        set({ preferences: previous });
        saveToMMKV(previous);
      } finally {
        set({ isSaving: false });
      }
    },

    // ── resetToDefaults ───────────────────────────────────────────────────

    resetToDefaults: async () => {
      const previous = get().preferences;

      set({ preferences: DEFAULT_PREFERENCES, isSaving: true });
      saveToMMKV(DEFAULT_PREFERENCES);

      try {
        await api.patch('/mobile/push/preferences', DEFAULT_PREFERENCES);
        set({ lastSyncedAt: new Date() });
      } catch (err) {
        set({ preferences: previous });
        saveToMMKV(previous);
      } finally {
        set({ isSaving: false });
      }
    },
  }),
);