//cureli-rider-app\src\features\auth\api\auth.api.ts
import { api } from '../../../services/api';
import type { VerifyOtpResponse } from '../../../types/auth';

export const authApi = {
sendOtp: async (phone: string): Promise<{ timeout: number }> => {
  const raw = phone.replace(/^\+?91/, '');
  const { data } = await api.post('/rider/auth/send-otp', { phone: raw });
  return data.data;
},

verifyOtp: async (phone: string, otp: string): Promise<VerifyOtpResponse> => {
  const raw = phone.replace(/^\+?91/, '');
  const { data } = await api.post('/rider/auth/verify-otp', { phone: raw, otp });
  return data.data;
},

  refreshToken: async (
    refresh_token: string,
  ): Promise<{ accessToken: string; expiresIn: number }> => {
    const { data } = await api.post('/rider/auth/refresh', { refresh_token });
    return data.data;
  },

  logout: async (): Promise<void> => {
    await api.post('/rider/auth/logout');
  },

  getMe: async () => {
    const { data } = await api.get('/rider/auth/me');
    return data.data;
  },
};