// Q:\PROJECTS\YourZeroesAndOnes\cureli\curely_erp\frontend\src\api\axios.js

import axios from "axios";

const API = axios.create({
  baseURL: "http://localhost:5000/api",
  withCredentials: true, // Required for refresh token cookie
});

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
      
      // Clear local storage
      localStorage.removeItem("access_token");
      
      // Redirect to login with message
      window.location.href = "/login?reason=session_replaced";
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
          originalRequest.headers.Authorization = `Bearer ${newToken}`;
          return API(originalRequest);
        }
      } catch (refreshError) {
        console.error("Token refresh failed:", refreshError);

        // Check if refresh failed due to session invalidation
        if (refreshError.response?.data?.data?.code === "SESSION_INVALIDATED") {
          localStorage.removeItem("access_token");
          window.location.href = "/login?reason=session_replaced";
        } else {
          localStorage.removeItem("access_token");
          window.location.href = "/login?reason=session_expired";
        }
        
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default API;