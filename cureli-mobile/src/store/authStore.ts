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

export const useAuthStore = create<AuthState>((set, get) => ({
  // ── Initial State ────────────────────────────────────────
  status: 'unknown',
  user: null,
  accessToken: null,

  // ── initialize ───────────────────────────────────────────
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

    // We have tokens — optimistically set the stored user while we verify.
    // This prevents a blank screen flash if /me is slow.
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
    } catch {
      // /me failed. The api interceptor will attempt refresh automatically.
      // If refresh succeeds, the interceptor retries /me and it succeeds.
      // If refresh fails, the interceptor clears storage and emits 'logout'.
      // In that case the _layout.tsx listener handles redirect.
      //
      // However if we land here it means even the retry failed.
      // Fall through to unauthenticated.
      StorageService.clearAuth();
      set({ status: 'unauthenticated', user: null, accessToken: null });
    }
  },

  // ── sendOtp ──────────────────────────────────────────────
  // Calls the send-otp endpoint.
  // Returns expiresIn so the OTP screen can show a countdown.
  // Throws on failure so the screen can show the error message.

  sendOtp: async (phone: string) => {
    const { data } = await authApi.sendOtp(phone);
    return { expiresIn: data.data.expires_in };
  },

  // ── login ────────────────────────────────────────────────
  // Calls verify-otp with phone + OTP.
  // On success: persists tokens + user, sets authenticated state.
  // Returns isNewUser so the caller can decide navigation.
  // Throws on failure — the screen handles error display.

  login: async (phone: string, otp: string, deviceInfo?) => {
    const { data } = await authApi.verifyOtp(phone, otp, deviceInfo);
    const { access_token, refresh_token, user, is_new_user } = data.data;

    // Persist to MMKV (survives app close/restart)
    StorageService.setAuthData({
      accessToken: access_token,
      refreshToken: refresh_token,
      user,
    });

    // Update in-memory Zustand state (what UI reads)
    set({
      status: 'authenticated',
      user,
      accessToken: access_token,
    });

    return { isNewUser: is_new_user };
  },

  // ── logout ───────────────────────────────────────────────
  // Tells the backend to revoke the session.
  // Clears local state regardless of whether the API call succeeds.
  // (We always log out locally — even if network fails.)

  logout: async () => {
    // Fire-and-forget the backend call
    // Do not await — if it fails, we still clear locally
    authApi.logout().catch(() => {});

    StorageService.clearAuth();
    set({ status: 'unauthenticated', user: null, accessToken: null });
  },

  // ── setUser ──────────────────────────────────────────────
  // Called after profile updates to keep in-memory state fresh.

  setUser: (user: MobileUser) => {
    StorageService.setUser(user);
    set({ user });
  },

  // ── setAccessToken ───────────────────────────────────────
  // Called by the interceptor after a successful token refresh
  // to keep in-memory state in sync with MMKV.

  setAccessToken: (token: string) => {
    set({ accessToken: token });
  },
}));