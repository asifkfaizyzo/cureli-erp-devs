// src/store/useAuthStore.js

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { decodeJWT, isTokenExpired, getUserFromToken } from "../utils/jwt";
import {
  roleHasPermission,
  roleHasAnyPermission,
  canAccessRoute,
} from "../config/permissions";

/**
 * ============================================
 * AUTH STORE
 * ============================================
 *
 * Centralized authentication state management.
 *
 * State shape:
 * {
 *   isAuthenticated: boolean,
 *   isInitialized: boolean,    // Has the store been hydrated?
 *   isLoading: boolean,        // Loading state for async operations
 *   user: {
 *     user_id: string,
 *     shop_id: string | null,
 *     branch_id: string | null,
 *     role: "super_admin" | "branch_admin" | "staff",
 *     status: string,
 *     name: string,
 *   } | null,
 *   permissions: string[],     // Cached permissions from backend
 * }
 */

const initialState = {
  isAuthenticated: false,
  isInitialized: false,
  isLoading: true,
  user: null,
  permissions: [],

  // Additional user info (from login response)
  branchName: null,
};

export const useAuthStore = create(
  persist(
    (set, get) => ({
      ...initialState,

      // ============================================
      // INITIALIZATION
      // ============================================

      /**
       * Initialize auth state from stored token
       * Call this on app load (in App.jsx or main.jsx)
       */
      initialize: () => {
        const token = localStorage.getItem("access_token");

        
        if (token && !isTokenExpired(token)) {
          const user = getUserFromToken(token);

          if (user) {
            set({
              isAuthenticated: true,
              isInitialized: true,
              isLoading: false,
              user: {
                ...user,
                name: localStorage.getItem("user_name") || "",
              },
              branchName: localStorage.getItem("branch_name") || null,
            });

            console.log("🔐 Auth initialized from token:", user.role);
            return;
          }
        }

        // No valid token
        set({
          isAuthenticated: false,
          isInitialized: true,
          isLoading: false,
          user: null,
          permissions: [],
        });

        console.log("🔓 Auth initialized: No valid token");
      },

      // ============================================
      // LOGIN / LOGOUT
      // ============================================

      /**
       * Set auth state after successful login
       * @param {Object} data - Login response data
       */
      setAuth: (data) => {
        const {
          access_token,
          user_id,
          shop_id,
          branch_id,
          branch_name,
          role,
          user_name,
        } = data;

        // Store token
        localStorage.setItem("access_token", access_token);
        localStorage.setItem("user_id", user_id);
        if (shop_id) localStorage.setItem("shop_id", shop_id);
        if (user_name) localStorage.setItem("user_name", user_name);
        if (branch_name) localStorage.setItem("branch_name", branch_name);

        // Get user from token for complete info
        const tokenUser = getUserFromToken(access_token);

        set({
          isAuthenticated: true,
          isInitialized: true,
          isLoading: false,
          user: {
            user_id,
            shop_id,
            branch_id: branch_id || tokenUser?.branch_id || null,
            role: role || tokenUser?.role,
            status: tokenUser?.status,
            name: user_name || "",
          },
          branchName: branch_name || null,
        });

        console.log("🔐 Auth set:", role);
      },

      /**
       * Update permissions from backend
       * @param {string[]} permissions - Array of permission strings
       */
      setPermissions: (permissions) => {
        set({ permissions });
      },

      /**
       * Clear auth state (logout)
       */
      logout: () => {
        // Clear localStorage
        localStorage.removeItem("access_token");
        localStorage.removeItem("user_id");
        localStorage.removeItem("shop_id");
        localStorage.removeItem("user_name");
        localStorage.removeItem("branch_name");

        // Reset state
        set({
          isAuthenticated: false,
          isLoading: false,
          user: null,
          permissions: [],
          branchName: null,
        });

        console.log("🔓 Logged out");
      },

      /**
       * Set loading state
       */
      setLoading: (isLoading) => set({ isLoading }),

      // ============================================
      // PERMISSION CHECKS
      // ============================================

      /**
       * Check if current user has a specific permission
       * @param {string} permission - Permission to check
       * @returns {boolean}
       */
      hasPermission: (permission) => {
        const { user, permissions } = get();

        if (!user) return false;

        // If we have cached permissions from backend, use those
        if (permissions.length > 0) {
          if (permissions.includes("*")) return true;
          return permissions.includes(permission);
        }

        // Fallback to role-based check
        return roleHasPermission(user.role, permission);
      },

      /**
       * Check if current user has ANY of the specified permissions
       * @param {string[]} perms - Permissions to check
       * @returns {boolean}
       */
      hasAnyPermission: (...perms) => {
        const { user, permissions } = get();

        if (!user) return false;

        // If we have cached permissions
        if (permissions.length > 0) {
          if (permissions.includes("*")) return true;
          return perms.some((p) => permissions.includes(p));
        }

        // Fallback to role-based check
        return roleHasAnyPermission(user.role, perms);
      },

      /**
       * Check if current user has a specific role
       * @param  {...string} roles - Roles to check
       * @returns {boolean}
       */
      hasRole: (...roles) => {
        const { user } = get();
        if (!user) return false;
        return roles.includes(user.role);
      },

      /**
       * Check if current user can access a route
       * @param {string} route - Route path
       * @returns {boolean}
       */
      canAccess: (route) => {
        const { user } = get();
        if (!user) return false;
        return canAccessRoute(user.role, route);
      },

      // ============================================
      // BRANCH CONTEXT
      // ============================================

      /**
       * Check if user is super admin
       */
      isSuperAdmin: () => {
        const { user } = get();
        return user?.role === "super_admin";
      },

      /**
       * Get current branch context
       * SA can switch branches, others are locked to their branch
       */
      getBranchContext: () => {
        const { user, branchName } = get();

        if (!user) return null;

        return {
          branch_id: user.branch_id,
          branch_name: branchName,
          canSwitch: user.role === "super_admin",
        };
      },

      /**
       * Update branch context (for SA branch switching)
       * @param {string} branch_id
       * @param {string} branch_name
       */
      setBranchContext: (branch_id, branch_name) => {
        const { user } = get();

        if (!user || user.role !== "super_admin") {
          console.warn("Only super_admin can switch branches");
          return;
        }

        set({
          user: { ...user, branch_id },
          branchName: branch_name,
        });

        localStorage.setItem("branch_name", branch_name);
      },

      // ============================================
      // TOKEN MANAGEMENT
      // ============================================

      /**
       * Update access token (after refresh)
       * @param {string} newToken
       */
      updateToken: (newToken) => {
        localStorage.setItem("access_token", newToken);

        const tokenUser = getUserFromToken(newToken);
        if (tokenUser) {
          set((state) => ({
            user: {
              ...state.user,
              ...tokenUser,
            },
          }));
        }
      },

      /**
       * Check if current token is valid
       * @returns {boolean}
       */
      isTokenValid: () => {
        const token = localStorage.getItem("access_token");
        return token && !isTokenExpired(token);
      },

      /**
       * Get current access token
       * @returns {string|null}
       */
      getToken: () => {
        return localStorage.getItem("access_token");
      },
    }),
    {
      name: "cureli-auth-storage",
      version: 1,
      // Only persist minimal state - token is in localStorage
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        branchName: state.branchName,
      }),
    }
  )
);

// ============================================
// SELECTORS (for optimized re-renders)
// ============================================

export const selectIsAuthenticated = (state) => state.isAuthenticated;
export const selectIsInitialized = (state) => state.isInitialized;
export const selectIsLoading = (state) => state.isLoading;
export const selectUser = (state) => state.user;
export const selectUserRole = (state) => state.user?.role;
export const selectBranchId = (state) => state.user?.branch_id;
export const selectIsSuperAdmin = (state) => state.user?.role === "super_admin";
