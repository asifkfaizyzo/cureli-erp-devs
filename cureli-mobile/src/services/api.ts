// src/services/api.ts

import axios, {
  AxiosError,
  AxiosRequestConfig,
  InternalAxiosRequestConfig,
} from "axios";
import { CONFIG } from "../constants/config";
import { StorageService } from "./storage";

// ── Axios Instance ────────────────────────────────────────────

export const api = axios.create({
  baseURL: CONFIG.BASE_URL,
  timeout: CONFIG.API_TIMEOUT,
  headers: {
    "Content-Type": "application/json",
  },
});

// ── Refresh Token Storm Prevention ────────────────────────────

let isRefreshing = false;
let refreshQueue: Array<{
  resolve: (token: string) => void;
  reject: (err: unknown) => void;
}> = [];

function processRefreshQueue(error: unknown, token: string | null) {
  refreshQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token!);
    }
  });
  refreshQueue = [];
}

// ── Request Interceptor ───────────────────────────────────────

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = StorageService.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response Interceptor ──────────────────────────────────────

api.interceptors.response.use(
  (response) => response,

  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
    };

    if (!originalRequest) {
      return Promise.reject(error);
    }

    // ── DO NOT trigger token refresh on auth endpoints ────────
    // If /login, /register, etc. return 401, it is a business logic
    // error (e.g. invalid credentials), NOT an expired session.
    const url = originalRequest.url ?? "";
    const isAuthEndpoint =
      url.includes("/mobile/auth/login") ||
      url.includes("/mobile/auth/register") ||
      url.includes("/mobile/auth/verify-otp") ||
      url.includes("/mobile/auth/refresh") ||
      url.includes("/mobile/auth/send-otp") ||
      url.includes("/mobile/auth/send-reset-otp") ||
      url.includes("/mobile/auth/reset-password");

    // Only handle 401 on protected app endpoints
    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;

      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        }).then((newToken) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }
          return api(originalRequest);
        });
      }

      isRefreshing = true;

      try {
        const refreshToken = StorageService.getRefreshToken();

        if (!refreshToken) {
          throw new Error("No refresh token stored");
        }

        const { data } = await axios.post(
          `${CONFIG.BASE_URL}/mobile/auth/refresh`,
          { refresh_token: refreshToken },
          { timeout: CONFIG.API_TIMEOUT },
        );

        const newAccessToken: string = data.data.access_token;

        StorageService.setAccessToken(newAccessToken);

        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }

        processRefreshQueue(null, newAccessToken);

        return api(originalRequest);
      } catch (refreshError) {
        StorageService.clearAuth();
        processRefreshQueue(refreshError, null);
        authEventEmitter.emit("logout");

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  },
);

// ── Auth Event Emitter ────────────────────────────────────────

type AuthEventListener = () => void;

class AuthEventEmitter {
  private listeners: Map<string, AuthEventListener[]> = new Map();

  on(event: string, listener: AuthEventListener): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(listener);

    return () => {
      const arr = this.listeners.get(event) ?? [];
      this.listeners.set(
        event,
        arr.filter((l) => l !== listener),
      );
    };
  }

  emit(event: string): void {
    (this.listeners.get(event) ?? []).forEach((l) => l());
  }
}

export const authEventEmitter = new AuthEventEmitter();

// ── Typed API Helpers ─────────────────────────────────────────

interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
}

export const authApi = {
  // ── Registration OTP-verified Auth ───────────────────────

  sendRegisterOtp: (phone: string) =>
    api.post<
      ApiSuccessResponse<{ expires_in: number }>
    >("/mobile/auth/register/send-otp", { phone }),

  registerVerify: (
    phone: string,
    password: string,
    otp: string,
    full_name?: string,
    email?: string,
    device_info?: import("../types/auth").DeviceInfo,
  ) =>
    api.post<
      ApiSuccessResponse<{
        access_token: string;
        refresh_token: string;
        expires_in: number;
        token_type: "Bearer";
        is_new_user: boolean;
        user: import("../types/auth").MobileUser;
      }>
    >("/mobile/auth/register/verify", {
      phone,
      password,
      otp,
      full_name,
      email,
      device_info,
    }),

  // ── Password Login ───────────────────────────────────────

  login: (
    identifier: string,
    password: string,
    device_info?: import("../types/auth").DeviceInfo,
  ) =>
    api.post<
      ApiSuccessResponse<{
        access_token: string;
        refresh_token: string;
        expires_in: number;
        token_type: "Bearer";
        is_new_user: boolean;
        user: import("../types/auth").MobileUser;
      }>
    >("/mobile/auth/login", { identifier, password, device_info }),

  // ── Password Reset / Set ─────────────────────────────────

  sendResetOtp: (phone: string) =>
    api.post<
      ApiSuccessResponse<{ expires_in: number }>
    >("/mobile/auth/send-reset-otp", { phone }),

  resetPassword: (phone: string, otp: string, new_password: string) =>
    api.post<
      ApiSuccessResponse<Record<string, never>>
    >("/mobile/auth/reset-password", { phone, otp, new_password }),

  // ── Legacy OTP Auth ──────────────────────────────────────

  sendOtp: async (phone: string) => {
    return await api.post<
      ApiSuccessResponse<{ expires_in: number }>
    >("/mobile/auth/send-otp", { phone });
  },

  verifyOtp: (
    phone: string,
    otp: string,
    device_info?: import("../types/auth").DeviceInfo,
  ) =>
    api.post<
      ApiSuccessResponse<{
        access_token: string;
        refresh_token: string;
        expires_in: number;
        token_type: "Bearer";
        is_new_user: boolean;
        user: import("../types/auth").MobileUser;
      }>
    >("/mobile/auth/verify-otp", { phone, otp, device_info }),

  // ── Session ──────────────────────────────────────────────

  refresh: (refresh_token: string) =>
    api.post<
      ApiSuccessResponse<{
        access_token: string;
        expires_in: number;
        token_type: "Bearer";
      }>
    >("/mobile/auth/refresh", { refresh_token }),

  me: () =>
    api.get<
      ApiSuccessResponse<{
        user: import("../types/auth").MobileUser & { address_count: number };
      }>
    >("/mobile/auth/me"),

  logout: () =>
    api.post<ApiSuccessResponse<Record<string, never>>>("/mobile/auth/logout"),

  logoutAll: () =>
    api.post<ApiSuccessResponse<Record<string, never>>>(
      "/mobile/auth/logout-all",
    ),
};