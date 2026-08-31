// src/store/authStore.ts

import { create } from 'zustand';
import { StorageService } from '../services/storage';
import { authApi } from '../services/api';
import type { AuthState, CheckPhoneResponse, DeviceInfo, MobileUser } from '../types/auth';

function getCartStore() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  return require('./cartStore').useCartStore.getState();
}

export const useAuthStore = create<AuthState>((set, get) => ({
  status: 'unknown',
  user: null,
  accessToken: null,

  // ── initialize ──────────────────────────────────────────────

  initialize: async () => {
    set({ status: 'checking' });

    const accessToken = StorageService.getAccessToken();
    const refreshToken = StorageService.getRefreshToken();
    const storedUser = StorageService.getUser<MobileUser>();

    if (!accessToken && !refreshToken) {
      set({ status: 'unauthenticated', user: null, accessToken: null });
      return;
    }

    if (storedUser) {
      set({ user: storedUser, accessToken });
    }

    try {
      const { data } = await authApi.me();
      const freshUser = data.data.user;

      StorageService.setUser(freshUser);

      set({
        status: 'authenticated',
        user: freshUser,
        accessToken,
      });

      getCartStore().initCart(freshUser.id);
    } catch {
      StorageService.clearAuth();
      set({ status: 'unauthenticated', user: null, accessToken: null });
    }
  },

  // ── Two-step login: Step 1 ─────────────────────────────────

  checkPhone: async (phone: string): Promise<CheckPhoneResponse> => {
    const { data } = await authApi.checkPhone(phone);
    return data.data;
  },

  // ── Legacy OTP auth ────────────────────────────────────────

  sendOtp: async (phone: string) => {
    const { data } = await authApi.sendOtp(phone);
    return { expiresIn: data.data.expires_in };
  },

  login: async (phone: string, otp: string, deviceInfo?: DeviceInfo) => {
    const { data } = await authApi.verifyOtp(phone, otp, deviceInfo);
    const { access_token, refresh_token, user, is_new_user } = data.data;

    StorageService.setAuthData({
      accessToken: access_token,
      refreshToken: refresh_token,
      user,
    });

    set({
      status: 'authenticated',
      user,
      accessToken: access_token,
    });

    getCartStore().initCart(user.id);

    return { isNewUser: is_new_user };
  },

  // ── Registration with OTP ──────────────────────────────────

  sendRegisterOtp: async (phone: string) => {
    const { data } = await authApi.sendRegisterOtp(phone);
    return { expiresIn: data.data.expires_in };
  },

  register: async (
    phone: string,
    password: string,
    otp: string,
    fullName?: string,
    email?: string,
    deviceInfo?: DeviceInfo,
  ) => {
    const { data } = await authApi.registerVerify(
      phone,
      password,
      otp,
      fullName,
      email,
      deviceInfo,
    );
    const { access_token, refresh_token, user, is_new_user } = data.data;

    StorageService.setAuthData({
      accessToken: access_token,
      refreshToken: refresh_token,
      user,
    });

    set({
      status: 'authenticated',
      user,
      accessToken: access_token,
    });

    getCartStore().initCart(user.id);

    return { isNewUser: is_new_user };
  },

  // ── Password Login ─────────────────────────────────────────

  loginWithPassword: async (
    identifier: string,
    password: string,
    deviceInfo?: DeviceInfo,
  ) => {
    const { data } = await authApi.login(identifier, password, deviceInfo);
    const { access_token, refresh_token, user, is_new_user } = data.data;

    StorageService.setAuthData({
      accessToken: access_token,
      refreshToken: refresh_token,
      user,
    });

    set({
      status: 'authenticated',
      user,
      accessToken: access_token,
    });

    getCartStore().initCart(user.id);

    return { isNewUser: is_new_user };
  },

  // ── Password Reset / Set ───────────────────────────────────

  sendResetOtp: async (phone: string) => {
    const { data } = await authApi.sendResetOtp(phone);
    return { expiresIn: data.data.expires_in };
  },

  resetPassword: async (phone: string, otp: string, newPassword: string) => {
    await authApi.resetPassword(phone, otp, newPassword);
  },

  // ── Session ────────────────────────────────────────────────

  logout: async () => {
    const userId = get().user?.id;

    authApi.logout().catch(() => {});

    if (userId) {
      getCartStore().clearCartForUser(userId);
    }

    StorageService.clearAuth();
    set({ status: 'unauthenticated', user: null, accessToken: null });
  },

  setUser: (user: MobileUser) => {
    StorageService.setUser(user);
    set({ user });
  },

  setAccessToken: (token: string) => {
    set({ accessToken: token });
  },
}));