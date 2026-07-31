// src/features/auth/api/auth.api.ts
import { api } from '../../../services/api';
import type { ApiResponse } from '../../../types/common';
import type { VerifyOtpResponse, RiderProfile } from '../../../types/auth';

interface SendOtpPayload {
  phone: string;
}

interface VerifyOtpPayload {
  phone:              string;
  otp:                string;
  device_id?:         string;
  device_name?:       string;
  device_platform?:   string;
  device_os_version?: string;
  app_version?:       string;
}

export const authApi = {
  sendOtp: (payload: SendOtpPayload) =>
    api.post<ApiResponse<{ timeout: number }>>(
      '/rider/auth/send-otp', payload
    ),

  verifyOtp: (payload: VerifyOtpPayload) =>
    api.post<ApiResponse<VerifyOtpResponse>>(
      '/rider/auth/verify-otp', payload
    ),

  refresh: (refreshToken: string) =>
    api.post<ApiResponse<{ accessToken: string; expiresIn: number }>>(
      '/rider/auth/refresh',
      { refresh_token: refreshToken }
    ),

  logout: () =>
    api.post<ApiResponse<null>>('/rider/auth/logout'),

  getMe: () =>
    api.get<ApiResponse<RiderProfile>>('/rider/auth/me'),
};