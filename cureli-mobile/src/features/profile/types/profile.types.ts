// src/features/profile/types/profile.types.ts

import type { AddressLabel } from '../constants/profile.constants';

// ── Address ───────────────────────────────────────────────────

export interface Address {
  id: string;
  user_id: string;
  label: AddressLabel;
  custom_label: string | null;
  recipient_name: string | null;
  recipient_phone: string | null;
  address_line_1: string;
  address_line_2: string | null;
  landmark: string | null;
  city: string;
  state: string;
  pincode: string;
  latitude: number | null;
  longitude: number | null;
  is_default: boolean;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
}

// ── Profile form ──────────────────────────────────────────────

export interface ProfileFormData {
  full_name: string;
  email: string;
}

// ── Address form ──────────────────────────────────────────────

export interface AddressFormData {
  label: AddressLabel;
  custom_label?: string;
  recipient_name?: string;
  recipient_phone?: string;
  address_line_1: string;
  address_line_2?: string;
  landmark?: string;
  city: string;
  state: string;
  pincode: string;
  is_default?: boolean;
}

export interface UpdateAddressPayload extends AddressFormData {
  id: string;
}

// ── API response shapes ───────────────────────────────────────

import type { MobileUser } from '../../../types/auth';

export interface MeResponseData {
  user: MobileUser & { address_count: number };
}

export interface AddressesResponseData {
  addresses: Address[];
}

export interface UpdateProfileResponseData {
  user: MobileUser;
}

export interface AddressResponseData {
  address: Address;
}