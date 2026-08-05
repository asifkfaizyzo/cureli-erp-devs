//cureli-rider-app\src\lib\mmkvStorage.ts
import { MMKV } from 'react-native-mmkv';
import { createJSONStorage } from 'zustand/middleware';

const mmkv = new MMKV({ id: 'cureli-rider-zustand' });

export const mmkvStorage = createJSONStorage(() => ({
  getItem:    (name: string) => mmkv.getString(name) ?? null,
  setItem:    (name: string, value: string) => mmkv.set(name, value),
  removeItem: (name: string) => mmkv.delete(name),
}));