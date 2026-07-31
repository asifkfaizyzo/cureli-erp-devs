// src/services/api.ts
import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { CONFIG } from '../constants/config';
import { StorageService } from './storage';

export const api = axios.create({
  baseURL: CONFIG.BASE_URL,
  timeout: CONFIG.API_TIMEOUT,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request — attach access token ────────────────────────────
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = StorageService.getAccessToken();
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response — silent refresh ─────────────────────────────────
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

    if (
      error.response?.status === 401 &&
      !original._retry &&
      !isAuthRoute
    ) {
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
      isRefreshing = true;

      try {
        const refreshToken = StorageService.getRefreshToken();
        if (!refreshToken) throw new Error('No refresh token');

        const { data } = await axios.post(
          `${CONFIG.BASE_URL}/rider/auth/refresh`,
          { refresh_token: refreshToken }
        );

        const newToken = data.data.accessToken;
        StorageService.setAccessToken(newToken);
        processQueue(null, newToken);

        original.headers!.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch (err) {
        processQueue(err, null);
        StorageService.clearAuth();
        return Promise.reject(err);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);