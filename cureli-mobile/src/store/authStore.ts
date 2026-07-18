// src/store/authStore.ts
//
// Global auth state for Cureli Mobile.
// This is the single source of truth for:
//   - Whether the user is logged in
//   - Who the user is
//   - The current access token (in memory, not just storage)
//
// MMKV (StorageService) = persistent storage (survives app close)
// Zustand store = in-memory state (what the UI reads)
//
// On app start: initialize() reads MMKV → populates Zustand
// On login: Zustand updates + MMKV updates simultaneously
// On logout: both cleared

import { create } from 'zustand';
import { StorageService } from '../services/storage';
import { authApi } from '../services/api';
import type { AuthState, AuthStatus, MobileUser } from '../types/auth';

// ── Lazy import to avoid circular dependency ──────────────────
// cartStore imports nothing from authStore so this is safe.
// We use getState() at call time, not at module load time.

function getCartStore() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require('./cartStore').useCartStore.getState();
}

export const useAuthStore = create<AuthState>((set, get) => ({
  // ── Initial State ─────────────────────────────────────────────
  status: 'unknown',
  user: null,
  accessToken: null,

  // ── initialize ────────────────────────────────────────────────
  // Called ONCE when the app opens (from _layout.tsx).
  // Checks MMKV for stored tokens.
  // If found: verifies with /me endpoint.
  // If /me fails: attempts refresh.
  // If refresh fails: clears everything → unauthenticated.

  initialize: async () => {
    set({ status: 'checking' });

    const accessToken = StorageService.getAccessToken();
    const refreshToken = StorageService.getRefreshToken();
    const storedUser = StorageService.getUser<MobileUser>();

    // No tokens at all → unauthenticated immediately
    if (!accessToken && !refreshToken) {
      set({ status: 'unauthenticated', user: null, accessToken: null });
      return;
    }

    // Optimistically set stored user while we verify
    if (storedUser) {
      set({ user: storedUser, accessToken });
    }

    // Verify the access token is still valid with /me
    try {
      const { data } = await authApi.me();
      const freshUser = data.data.user;

      StorageService.setUser(freshUser);

      set({
        status: 'authenticated',
        user: freshUser,
        accessToken,
      });

      // Load the user's persisted cart
      getCartStore().initCart(freshUser.id);

    } catch {
      // /me failed — fall through to unauthenticated
      StorageService.clearAuth();
      set({ status: 'unauthenticated', user: null, accessToken: null });
    }
  },

  // ── sendOtp ───────────────────────────────────────────────────

sendOtp: async (phone: string) => {
  try {
    const { data } = await authApi.sendOtp(phone);
    return { expiresIn: data.data.expires_in };
  } catch (err: any) {
    console.log('[sendOtp] full error:', JSON.stringify(err?.response?.data, null, 2));
    console.log('[sendOtp] status:', err?.response?.status);
    console.log('[sendOtp] headers:', JSON.stringify(err?.response?.headers, null, 2));
    throw err;
  }
},

  // ── login ─────────────────────────────────────────────────────

  login: async (phone: string, otp: string, deviceInfo?) => {
    const { data } = await authApi.verifyOtp(phone, otp, deviceInfo);
    const { access_token, refresh_token, user, is_new_user } = data.data;

    // Persist to MMKV
    StorageService.setAuthData({
      accessToken: access_token,
      refreshToken: refresh_token,
      user,
    });

    // Update Zustand state
    set({
      status: 'authenticated',
      user,
      accessToken: access_token,
    });

    // Load this user's persisted cart
    getCartStore().initCart(user.id);

    return { isNewUser: is_new_user };
  },

  // ── logout ────────────────────────────────────────────────────

  logout: async () => {
    // Get user ID before clearing state
    const userId = get().user?.id;

    // Fire-and-forget backend call
    authApi.logout().catch(() => {});

    // Clear this user's cart from memory + MMKV
    if (userId) {
      getCartStore().clearCartForUser(userId);
    }

    StorageService.clearAuth();
    set({ status: 'unauthenticated', user: null, accessToken: null });
  },

  // ── setUser ───────────────────────────────────────────────────

  setUser: (user: MobileUser) => {
    StorageService.setUser(user);
    set({ user });
  },

  // ── setAccessToken ────────────────────────────────────────────

  setAccessToken: (token: string) => {
    set({ accessToken: token });
  },
}));