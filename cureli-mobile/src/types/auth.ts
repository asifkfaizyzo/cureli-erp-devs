// src/types/auth.ts

export type UserSex = 'MALE' | 'FEMALE' | 'OTHER';

export interface MobileUser {
  id: string;
  phone: string;
  phone_verified: boolean;
  full_name: string | null;
  email: string | null;
  date_of_birth: string | null; // "YYYY-MM-DD"
  sex: UserSex | null;
  profile_complete: boolean;
  profile_image_key: string | null;
  status: 'active' | 'suspended' | 'deleted';
  referral_code: string | null;
  created_at: string;
  last_seen_at: string | null;
}

export interface DeviceInfo {
  device_id?: string;
  device_name?: string;
  device_platform?: 'ios' | 'android';
  device_os_version?: string;
  app_version?: string;
}

// ── Response shapes ──────────────────────────────────────────

export interface CheckPhoneResponse {
  exists: boolean;
  has_password: boolean;
  login_provider: string | null;
}

export interface SendOtpResponse {
  expires_in: number;
}

export interface VerifyOtpResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: 'Bearer';
  is_new_user: boolean;
  user: MobileUser;
}

export interface RegisterResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: 'Bearer';
  is_new_user: boolean;
  user: MobileUser;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  token_type: 'Bearer';
  is_new_user: boolean;
  user: MobileUser;
}

export interface RefreshResponse {
  access_token: string;
  expires_in: number;
  token_type: 'Bearer';
}

export interface MeResponse {
  user: MobileUser & {
    address_count: number;
  };
}

export interface SendResetOtpResponse {
  expires_in: number;
}

// ── Auth state ───────────────────────────────────────────────

export type AuthStatus =
  | 'unknown'
  | 'checking'
  | 'authenticated'
  | 'unauthenticated';

export interface AuthState {
  status: AuthStatus;
  user: MobileUser | null;
  accessToken: string | null;

  initialize: () => Promise<void>;

  // Two-step login
  checkPhone: (phone: string) => Promise<CheckPhoneResponse>;

  // Legacy OTP auth
  login: (phone: string, otp: string, deviceInfo?: DeviceInfo) => Promise<{ isNewUser: boolean }>;
  sendOtp: (phone: string) => Promise<{ expiresIn: number }>;

  // Password Registration with OTP
  sendRegisterOtp: (phone: string) => Promise<{ expiresIn: number }>;
  register: (
    phone: string,
    password: string,
    otp: string,
    fullName?: string,
    email?: string,
    deviceInfo?: DeviceInfo,
  ) => Promise<{ isNewUser: boolean }>;

  // Password Login
  loginWithPassword: (
    identifier: string,
    password: string,
    deviceInfo?: DeviceInfo,
  ) => Promise<{ isNewUser: boolean }>;

  // Password Reset / Set
  sendResetOtp: (phone: string) => Promise<{ expiresIn: number }>;
  resetPassword: (
    phone: string,
    otp: string,
    newPassword: string,
  ) => Promise<void>;

  logout: () => Promise<void>;
  setUser: (user: MobileUser) => void;
  setAccessToken: (token: string) => void;
}

// ── Family Members ────────────────────────────────────────────

export interface FamilyMember {
  id: string;
  name: string;
  date_of_birth: string; // "YYYY-MM-DD"
  age: number;
  sex: UserSex;
  phone: string | null;
  created_at: string;
  updated_at: string;
}

// ── Checkout Patient ──────────────────────────────────────────

export interface CheckoutPatient {
  is_self: boolean;
  name: string;
  age: number;
  sex: UserSex;
}