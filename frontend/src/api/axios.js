// src/api/axios.js

import axios from "axios";
import { useAuthStore } from "../store/useAuthStore";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
  withCredentials: true,
});

// ============================================
// HELPER: Clear auth state
// ============================================
const clearAuthAndRedirect = (reason) => {
  const logout = useAuthStore.getState().logout;
  logout();
  window.location.href = `/login?reason=${reason}`;
};

// ============================================
// HELPER: Handle maintenance mode
// ============================================
const handleMaintenanceMode = (data) => {
  console.log("[Axios] Maintenance mode detected!");

  // Store maintenance info in sessionStorage
  sessionStorage.setItem("maintenance_mode", "true");
  sessionStorage.setItem(
    "maintenance_message",
    data?.message || "System is under maintenance"
  );

  // Redirect to maintenance page (if not already there)
  if (!window.location.pathname.includes("/maintenance")) {
    window.location.replace("/maintenance");
  }
};

// ============================================
// REQUEST INTERCEPTOR - Attach access token
// ============================================
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// ============================================
// RESPONSE INTERCEPTOR - Handle errors
// ============================================
API.interceptors.response.use(
  (response) => {
    // Check maintenance header even on successful responses
    if (response.headers["x-maintenance-mode"] === "true") {
      handleMaintenanceMode({ message: "System is under maintenance" });
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // ✅ Handle maintenance mode (503)
    if (error.response?.status === 503) {
      const data = error.response.data;

      if (data?.error === "maintenance" || data?.data?.maintenance_mode) {
        handleMaintenanceMode(data);
        // Return a pending promise to stop further processing
        return new Promise(() => {});
      }
    }

    // ✅ Handle session invalidation (logged in from another device)
    if (error.response?.data?.data?.code === "SESSION_INVALIDATED") {
      console.warn("🔒 Session invalidated - logged in from another device");
      clearAuthAndRedirect("session_replaced");
      return Promise.reject(error);
    }

    // ✅ Handle token expiration - try to refresh
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/refresh") &&
      !originalRequest.url?.includes("/login")
    ) {
      originalRequest._retry = true;

      try {
        const res = await axios.post(
          "http://localhost:5000/api/auth/refresh",
          {},
          { withCredentials: true }
        );

        const newToken = res.data?.data?.access_token;

        if (newToken) {
          localStorage.setItem("access_token", newToken);
          useAuthStore.getState().updateToken(newToken);
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return API(originalRequest);
        }
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);

        // Check if refresh failed due to maintenance
        if (
          refreshError.response?.status === 503 &&
          refreshError.response?.data?.error === "maintenance"
        ) {
          handleMaintenanceMode(refreshError.response.data);
          return new Promise(() => {});
        }

        // Check if refresh failed due to session invalidation
        if (refreshError.response?.data?.data?.code === "SESSION_INVALIDATED") {
          clearAuthAndRedirect("session_replaced");
        } else {
          clearAuthAndRedirect("session_expired");
        }

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default API;