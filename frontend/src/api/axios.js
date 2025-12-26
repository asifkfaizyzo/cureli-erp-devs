// Q:\YourZeroesAndOnes\cureli\curely_erp\frontend\src\api\axios.js

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
  // Get the logout function from the store
  const logout = useAuthStore.getState().logout;
  
  // Call logout to clear store state
  logout();
  
  // Redirect to login
  window.location.href = `/login?reason=${reason}`;
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
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

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
          
          // ✅ Also update the store
          useAuthStore.getState().updateToken(newToken);
          
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return API(originalRequest);
        }
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);

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