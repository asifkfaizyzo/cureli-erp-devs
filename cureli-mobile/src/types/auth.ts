// src/types/auth.ts
//
// All auth-related types for Cureli Mobile.
// These mirror the API response shapes from the backend exactly.

// ── User ──────────────────────────────────────────────────────

export interface MobileUser {
  id: string;
  phone: string;
  phone_verified: boolean;
  full_name: string | null;
  email: string | null;
  profile_image_key: string | null;
  status: 'active' | 'suspended' | 'deleted';
  referral_code: string | null;
  created_at: string;
  last_seen_at: string | null;
}

// ── API Response Shapes ───────────────────────────────────────
// These match the backend success() response wrapper exactly:
// { success: true, message: string, data: T }

export interface SendOtpResponse {
  expires_in: number;  // seconds until OTP expires (300)
}

export interface VerifyOtpResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;   // access token lifetime in seconds (900)
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

// ── Auth State ────────────────────────────────────────────────
// Shape of the Zustand auth store

export type AuthStatus =
  | 'unknown'      // app just opened, haven't checked yet
  | 'checking'     // actively verifying stored token
  | 'authenticated'
  | 'unauthenticated';

export interface AuthState {
  status: AuthStatus;
  user: MobileUser | null;
  accessToken: string | null;

  // Actions
  initialize: () => Promise<void>;
  login: (phone: string, otp: string, deviceInfo?: DeviceInfo) => Promise<{ isNewUser: boolean }>;
  sendOtp: (phone: string) => Promise<{ expiresIn: number }>;
  logout: () => Promise<void>;
  setUser: (user: MobileUser) => void;
  setAccessToken: (token: string) => void;
}

// ── Device Info ───────────────────────────────────────────────
// Sent to backend on login for session tracking

export interface DeviceInfo {
  device_id?: string;
  device_name?: string;
  device_platform?: 'ios' | 'android';
  device_os_version?: string;
  app_version?: string;
}