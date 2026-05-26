// src/services/api.ts
//
// Axios instance for all Cureli Mobile API calls.
//
// Key responsibilities:
//   1. Attach access token to every request automatically
//   2. Detect 401 responses and attempt token refresh
//   3. Retry the original request after a successful refresh
//   4. If refresh fails → clear storage → trigger logout
//   5. Prevent refresh storms (multiple simultaneous 401s → one refresh call)

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
//
// Problem: If 5 requests fire simultaneously and all get 401,
// without this guard we would make 5 refresh calls in parallel.
// Each refresh call would race and potentially invalidate each other.
//
// Solution: Track a single in-flight refresh promise.
// All 401 handlers wait on the SAME promise.
// Only the first one actually calls the refresh endpoint.

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
// Runs before EVERY outgoing request.
// Reads the access token from MMKV and attaches it to Authorization header.
// MMKV is synchronous so no await needed here.

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
// Runs after EVERY response comes back.
// On 401: attempt refresh → retry original request.
// On anything else: pass through unchanged.

api.interceptors.response.use(
  // Success — pass through unchanged
  (response) => response,

  // Error handler
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & {
      _retry?: boolean;
    };

    // Only handle 401 Unauthorized
    // _retry flag prevents infinite loops — if the retry itself 401s,
    // we do not try again
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      // ── Refresh Storm Guard ──────────────────────────────
      if (isRefreshing) {
        // Another request is already refreshing.
        // Queue this request and wait for the refresh to complete.
        return new Promise((resolve, reject) => {
          refreshQueue.push({ resolve, reject });
        }).then((newToken) => {
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
          }
          return api(originalRequest);
        });
      }

      // This is the first 401 — we own the refresh
      isRefreshing = true;

      try {
        const refreshToken = StorageService.getRefreshToken();

        if (!refreshToken) {
          throw new Error("No refresh token stored");
        }

        // Call refresh endpoint directly with axios (not our intercepted
        // instance) to avoid triggering this interceptor recursively
        const { data } = await axios.post(
          `${CONFIG.BASE_URL}/mobile/auth/refresh`,
          { refresh_token: refreshToken },
          { timeout: CONFIG.API_TIMEOUT },
        );

        const newAccessToken: string = data.data.access_token;

        // Persist the new access token
        StorageService.setAccessToken(newAccessToken);

        // Update the Authorization header on the original request
        if (originalRequest.headers) {
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        }

        // Unblock everyone waiting in the queue
        processRefreshQueue(null, newAccessToken);

        // Retry the original request with the new token
        return api(originalRequest);
      } catch (refreshError) {
        // Refresh failed — session is dead
        // Clear all stored auth data
        StorageService.clearAuth();

        // Unblock the queue with the error (they will all reject)
        processRefreshQueue(refreshError, null);

        // Signal the auth store to move to unauthenticated state.
        // We use a custom event rather than importing the store directly
        // to avoid a circular dependency (store → api → store).
        // The _layout.tsx listens for this and redirects to login.
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
// Minimal event emitter to break the circular dependency between
// api.ts and authStore.ts.
//
// Why not import authStore here:
//   authStore imports api (for making auth calls)
//   api would import authStore (to call logout)
//   → circular import → undefined at runtime
//
// Solution: api emits an event, _layout.tsx listens and calls
// the store's logout action.

type AuthEventListener = () => void;

class AuthEventEmitter {
  private listeners: Map<string, AuthEventListener[]> = new Map();

  on(event: string, listener: AuthEventListener): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(listener);

    // Return unsubscribe function
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
// Thin wrappers around the axios instance.
// Controllers and the store call these — never axios directly.

interface ApiSuccessResponse<T> {
  success: true;
  message: string;
  data: T;
}

export const authApi = {
  sendOtp: async (phone: string) => {
    const start = Date.now();

    console.log("📲 [AUTH] Sending OTP request", {
      phone,
      endpoint: "/mobile/auth/send-otp",
      timestamp: new Date().toISOString(),
    });

    try {
      const response = await api.post<
        ApiSuccessResponse<{ expires_in: number }>
      >("/mobile/auth/send-otp", { phone });

      console.log("✅ [AUTH] OTP send success", {
        phone,
        status: response.status,
        expires_in: response.data?.data?.expires_in,
        duration_ms: Date.now() - start,
        timestamp: new Date().toISOString(),
      });

      return response;
    } catch (error) {
      if (axios.isAxiosError(error)) {
        console.error("❌ [AUTH] OTP send failed", {
          phone,
          status: error.response?.status,
          message: error.response?.data,
          duration_ms: Date.now() - start,
          timestamp: new Date().toISOString(),
        });
      } else {
        console.error("❌ [AUTH] OTP send unknown error", {
          phone,
          error,
          duration_ms: Date.now() - start,
          timestamp: new Date().toISOString(),
        });
      }

      throw error;
    }
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
