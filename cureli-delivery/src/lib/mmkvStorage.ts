// src/lib/mmkvStorage.ts
import { createMMKV } from 'react-native-mmkv';
import { createJSONStorage } from 'zustand/middleware';

const mmkv = createMMKV({ id: 'cureli-delivery-zustand' });

export const mmkvStorage = createJSONStorage(() => ({
  getItem:    (name: string) => mmkv.getString(name) ?? null,
  setItem:    (name: string, value: string) => mmkv.set(name, value),
  removeItem: (name: string) => mmkv.remove(name),
}));