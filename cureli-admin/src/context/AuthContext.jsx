import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getMyProfile, logoutAdmin } from "../api/cadminProfile";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [admin, setAdmin] = useState(null);
  const [pendingCounts, setPendingCounts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  // Fetch profile on mount
  const fetchProfile = useCallback(async () => {
    const token = localStorage.getItem("cadmin_access_token");
    
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const response = await getMyProfile();
      const { profile, pendingCounts: counts } = response.data.data;
      
      setAdmin(profile);
      setPendingCounts(counts);
      setError(null);
    } catch (err) {
      console.error("Failed to fetch profile:", err);
      
      // If unauthorized, clear token and redirect
      if (err.response?.status === 401) {
        localStorage.removeItem("cadmin_access_token");
        navigate("/");
      }
      
      setError(err.response?.data?.message || "Failed to load profile");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  // Initial fetch
  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Refresh pending counts periodically (every 2 minutes)
  useEffect(() => {
    if (!admin) return;

    const interval = setInterval(async () => {
      try {
        const response = await getMyProfile();
        setPendingCounts(response.data.data.pendingCounts);
      } catch (err) {
        console.error("Failed to refresh counts:", err);
      }
    }, 2 * 60 * 1000);

    return () => clearInterval(interval);
  }, [admin]);

  // Logout function
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

  // Refresh profile (call after updates)
  const refreshProfile = useCallback(async () => {
    await fetchProfile();
  }, [fetchProfile]);

  const value = {
    admin,
    pendingCounts,
    loading,
    error,
    logout,
    refreshProfile,
    isAuthenticated: !!admin,
  };

  return (
    <AuthContext.Provider value={value}>
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