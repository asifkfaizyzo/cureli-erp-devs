//Q:\PROJECTS\YourZeroesAndOnes\cureli\curely_erp\cureli-admin\src\api\axios.js
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL ;
const CAdminAPI = axios.create({
  baseURL: `${API_URL}/cadmin`,
  withCredentials: true,
});
// Helper to decode JWT and check expiry
function isTokenExpired(token) {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    const exp = payload.exp * 1000; // Convert to milliseconds
    // Consider expired if less than 1 minute remaining
    return Date.now() >= exp - 60000;
  } catch {
    return true;
  }
}
// Helper to refresh token
async function refreshAccessToken() {
  try {
    console.log("🔄 Attempting to refresh access token...");
    const response = await axios.get(`${API_URL}/cadmin/refresh`, {
      withCredentials: true,
    });
    const newToken = response.data?.data?.access_token;
    if (newToken) {
      localStorage.setItem("cadmin_access_token", newToken);
      console.log("✅ Access token refreshed successfully");
      return newToken;
    }
    throw new Error("No token in response");
  } catch (error) {
    console.error("❌ Token refresh failed:", error.message);
    localStorage.removeItem("cadmin_access_token");
    throw error;
  }
}
// Flag to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let refreshPromise = null;
// Request interceptor - check token before each request
CAdminAPI.interceptors.request.use(
  async (config) => {
    // Skip token check for auth endpoints
    const skipUrls = ["/login", "/verify-otp", "/refresh", "/logout", "/forgot-password", "/reset-password"];
    const shouldSkip = skipUrls.some((url) => config.url?.includes(url));

    if (shouldSkip) {
      return config;
    }

    let token = localStorage.getItem("cadmin_access_token");

    // Check if token is expired or about to expire
    if (isTokenExpired(token)) {
      console.log("⚠️ Token expired or expiring soon, refreshing...");

      if (!isRefreshing) {
        isRefreshing = true;
        refreshPromise = refreshAccessToken()
          .finally(() => {
            isRefreshing = false;
            refreshPromise = null;
          });
      }

      try {
        token = await refreshPromise;
      } catch (error) {
        // Redirect to login if refresh fails
        window.location.href = "/";
        return Promise.reject(error);
      }
    }

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);
// Response interceptor - handle 401 errors
CAdminAPI.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Skip for auth endpoints
    const skipUrls = ["/login", "/verify-otp", "/refresh", "/logout"];
    const shouldSkip = skipUrls.some((url) => originalRequest.url?.includes(url));

    if (error.response?.status === 401 && !originalRequest._retry && !shouldSkip) {
      originalRequest._retry = true;

      try {
        const newToken = await refreshAccessToken();
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return CAdminAPI(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem("cadmin_access_token");
        window.location.href = "/";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);
export default CAdminAPI;