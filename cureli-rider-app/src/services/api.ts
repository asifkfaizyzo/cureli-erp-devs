//cureli-rider-app\src\services\api.ts
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { CONFIG } from '../constants/config';

export const api = axios.create({
  baseURL: CONFIG.BASE_URL,
  timeout: CONFIG.API_TIMEOUT,
  headers: { 'Content-Type': 'application/json' },
});

// Attach token from store — imported lazily to avoid circular deps
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const { useAuthStore } = require('../store/authStore');
  const token = useAuthStore.getState().accessToken;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let isRefreshing = false;
let refreshQueue: Array<{
  resolve: (token: string) => void;
  reject:  (err: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null) {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token!);
  });
  refreshQueue = [];
}

api.interceptors.response.use(
  (res) => res,
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & {
      _retry?: boolean;
    };
    const isAuthRoute = original.url?.includes('/rider/auth/');

    if (error.response?.status === 401 && !original._retry && !isAuthRoute) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({
            resolve: (token) => {
              original.headers!.Authorization = `Bearer ${token}`;
              resolve(api(original));
            },
            reject,
          });
        });
      }

      original._retry = true;
      isRefreshing    = true;

      try {
        const { useAuthStore } = require('../store/authStore');
        const refreshToken = useAuthStore.getState().refreshToken;
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post(
          `${CONFIG.BASE_URL}/rider/auth/refresh`,
          { refresh_token: refreshToken },
        );

        const newToken = data.data.accessToken;
        useAuthStore.getState().setAccessToken(newToken);
        processQueue(null, newToken);

        original.headers!.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch (err) {
        processQueue(err, null);
        const { useAuthStore } = require('../store/authStore');
        useAuthStore.getState().clearAuth();
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);