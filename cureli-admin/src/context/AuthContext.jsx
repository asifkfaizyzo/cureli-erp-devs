// src/context/AuthContext.jsx

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";
import { getMyProfile, logoutAdmin } from "../api/cadminProfile";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [pendingCounts, setPendingCounts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  const fetchProfile = useCallback(async () => {
    const token = localStorage.getItem("cadmin_access_token");

    console.log("🔍 [AuthContext] fetchProfile called");
    console.log("🔑 [AuthContext] Token exists:", !!token);

    if (!token) {
      console.log("⚠️ [AuthContext] No token found, stopping");
      setLoading(false);
      return;
    }

    try {
      console.log("📡 [AuthContext] Calling getMyProfile()...");
      const response = await getMyProfile();
      console.log(
        "✅ [AuthContext] Profile fetched successfully:",
        response.data,
      );

      const { profile, pendingCounts: counts } = response.data.data;

      setAdmin(profile);
      setPendingCounts(counts);
      setError(null);
    } catch (err) {
      console.error("❌ [AuthContext] Profile fetch failed:", err);
      console.error("❌ [AuthContext] Error response:", err.response);
      console.error("❌ [AuthContext] Error status:", err.response?.status);
      console.error("❌ [AuthContext] Error data:", err.response?.data);

      if (err.response?.status === 401) {
        console.log("🚪 [AuthContext] 401 detected — redirecting to login");
        console.log("🚪 [AuthContext] Failed URL:", err.config?.url);
        localStorage.removeItem("cadmin_access_token");
        navigate("/");
      }

      setError(err.response?.data?.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // Fetch on mount
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Refresh pending counts every 2 minutes
  useEffect(() => {
    if (!admin) return;

    const interval = setInterval(
      async () => {
        try {
          const response = await getMyProfile();
          setPendingCounts(response.data.data.pendingCounts);
        } catch (err) {
          console.error("Failed to refresh pending counts:", err);
        }
      },
      2 * 60 * 1000,
    );

    return () => clearInterval(interval);
  }, [admin]);

  const logout = useCallback(async () => {
    try {
      await logoutAdmin();
    } catch (err) {
      console.error("Logout error:", err);
    } finally {
      localStorage.removeItem("cadmin_access_token");
      setAdmin(null);
      setPendingCounts(null);
      navigate("/");
    }
  }, [navigate]);

  const refreshProfile = useCallback(async () => {
    await fetchProfile();
  }, [fetchProfile]);

  return (
    <AuthContext.Provider
      value={{
        admin,
        pendingCounts,
        loading,
        error,
        logout,
        refreshProfile,
        isAuthenticated: !!admin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

export default AuthContext;
