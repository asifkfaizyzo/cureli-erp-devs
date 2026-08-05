//cureli-rider-app\src\store\authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { mmkvStorage } from '../lib/mmkvStorage';
import type { RiderProfile } from '../types/auth';

interface AuthState {
  rider:           RiderProfile | null;
  accessToken:     string | null;
  refreshToken:    string | null;
  isAuthenticated: boolean;

  setAuth: (rider: RiderProfile, accessToken: string, refreshToken: string) => void;
  updateRider: (partial: Partial<RiderProfile>) => void;
  setAccessToken: (token: string) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      rider:           null,
      accessToken:     null,
      refreshToken:    null,
      isAuthenticated: false,

      setAuth: (rider, accessToken, refreshToken) =>
        set({ rider, accessToken, refreshToken, isAuthenticated: true }),

      updateRider: (partial) =>
        set((state) => ({
          rider: state.rider ? { ...state.rider, ...partial } : null,
        })),

      setAccessToken: (token) =>
        set({ accessToken: token }),

      clearAuth: () =>
        set({
          rider:           null,
          accessToken:     null,
          refreshToken:    null,
          isAuthenticated: false,
        }),
    }),
    {
      name:    'rider-auth-store',
      storage: mmkvStorage,
    }
  )
);