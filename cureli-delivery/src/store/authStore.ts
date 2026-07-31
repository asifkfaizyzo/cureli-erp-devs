// src/store/authStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { mmkvStorage } from '../lib/mmkvStorage';
import type { RiderProfile } from '../types/auth';

interface AuthState {
  rider:           RiderProfile | null;
  isAuthenticated: boolean;
  setRider:        (rider: RiderProfile) => void;
  updateRider:     (partial: Partial<RiderProfile>) => void;
  clearAuth:       () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      rider:           null,
      isAuthenticated: false,

      setRider: (rider) =>
        set({ rider, isAuthenticated: true }),

      updateRider: (partial) =>
        set((state) => ({
          rider: state.rider ? { ...state.rider, ...partial } : null,
        })),

      clearAuth: () =>
        set({ rider: null, isAuthenticated: false }),
    }),
    { name: 'rider-auth-store', storage: mmkvStorage }
  )
);