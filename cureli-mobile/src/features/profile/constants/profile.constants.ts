// src/features/profile/constants/profile.constants.ts

export const QUERY_KEYS = {
  ME: ['mobile-user'],
  ADDRESSES: ['mobile-addresses'],
} as const;

export const ADDRESS_LABELS = ['Home', 'Work', 'Other'] as const;

export type AddressLabel = (typeof ADDRESS_LABELS)[number];

export const ADDRESS_LABEL_ICONS: Record<AddressLabel, string> = {
  Home: 'home',
  Work: 'briefcase',
  Other: 'location-on',
};

export const MAX_ADDRESSES = 10;