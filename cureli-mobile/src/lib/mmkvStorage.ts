// src/lib/mmkvStorage.ts
//
// MMKV-based storage adapter for Zustand persist middleware.
// Uses react-native-mmkv v4 which uses createMMKV instead of new MMKV().

import { createMMKV } from 'react-native-mmkv';
import type { StateStorage } from 'zustand/middleware';

const mmkv = createMMKV({ id: 'cureli-zustand' });

export const mmkvStorage: StateStorage = {
  getItem: (name: string) => {
    const value = mmkv.getString(name);
    return value ?? null;
  },
  setItem: (name: string, value: string) => {
    mmkv.set(name, value);
  },
  removeItem: (name: string) => {
    mmkv.remove(name);
  },
};