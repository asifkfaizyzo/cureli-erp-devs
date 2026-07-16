// src/features/profile/types/profile.types.ts

import type { AddressLabel } from "../constants/profile.constants";
import type { MobileUser, UserSex } from "../../../types/auth";

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
  full_name?: string;
  email?: string | null;
  profile_image_key?: string | null;
  date_of_birth?: string | null;  // "YYYY-MM-DD"
  sex?: UserSex | null;
}

// ── Address form ──────────────────────────────────────────────

export interface AddressFormData {
  label: string;
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
  latitude?: number;
  longitude?: number;
}

// ── Update uses Partial so only changed fields are required ───

export interface UpdateAddressPayload extends Partial<AddressFormData> {
  id: string;
}

// ── API response shapes ───────────────────────────────────────

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