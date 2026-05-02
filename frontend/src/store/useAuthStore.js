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
 * AUTH STORE - v2 with Branch Context
 * ============================================
 *
 * ARCHITECTURAL RULES:
 * 1. branchContext.mode is EXPLICIT - never inferred from null
 * 2. GLOBAL mode = aggregated view, NO writes allowed
 * 3. BRANCH mode = single branch, full CRUD allowed
 * 4. Only super_admin can switch modes
 * 5. branch_admin/staff are ALWAYS in BRANCH mode (their assigned branch)
 *
 * State shape:
 * {
 *   isAuthenticated: boolean,
 *   isInitialized: boolean,
 *   isLoading: boolean,
 *   user: { user_id, shop_id, role, status, name } | null,
 *   permissions: string[],
 *   shopName: string | null,
 *   branchContext: {
 *     mode: "GLOBAL" | "BRANCH",
 *     branch_id: string | null,
 *     branch_name: string | null
 *   }
 * }
 */

// ============================================
// CONSTANTS
// ============================================
const BRANCH_MODE = {
  GLOBAL: "GLOBAL",
  BRANCH: "BRANCH",
};

const initialBranchContext = {
  mode: BRANCH_MODE.GLOBAL,
  branch_id: null,
  branch_name: null,
};

const initialState = {
  isAuthenticated: false,
  isInitialized: false,
  isLoading: true,
  user: null,
  permissions: [],
  shopName: null,
  branchContext: { ...initialBranchContext },
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
          const tokenUser = getUserFromToken(token);

          if (tokenUser) {
            const role = tokenUser.role;
            const isSuperAdmin = role === "super_admin";

            // Get persisted state (zustand will have already hydrated)
            const persistedState = get();

            // Determine branch context based on role
            let branchContext;

            if (isSuperAdmin) {
              // SA: Use persisted branchContext if valid, else default to GLOBAL
              if (
                persistedState.branchContext?.mode === BRANCH_MODE.BRANCH &&
                persistedState.branchContext?.branch_id
              ) {
                branchContext = persistedState.branchContext;
              } else {
                branchContext = {
                  mode: BRANCH_MODE.GLOBAL,
                  branch_id: null,
                  branch_name: null,
                };
              }
            } else {
              // branch_admin/staff: ALWAYS BRANCH mode with their assigned branch
              branchContext = {
                mode: BRANCH_MODE.BRANCH,
                branch_id: tokenUser.branch_id || null,
                branch_name: localStorage.getItem("branch_name") || null,
              };
            }

            set({
              isAuthenticated: true,
              isInitialized: true,
              isLoading: false,
              user: {
                user_id: tokenUser.user_id,
                shop_id: tokenUser.shop_id,
                role: tokenUser.role,
                status: tokenUser.status,
                name: localStorage.getItem("user_name") || "",
              },
              shopName: localStorage.getItem("shop_name") || null,
              branchContext,
            });

            
            return;
          }
        }

        // No valid token
        set({
          ...initialState,
          isInitialized: true,
          isLoading: false,
        });

       
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
          shop_name,
          role,
          user_name,
        } = data;

        // Store token and metadata
        localStorage.setItem("access_token", access_token);
        localStorage.setItem("user_id", user_id);
        if (shop_id) localStorage.setItem("shop_id", shop_id);
        if (user_name) localStorage.setItem("user_name", user_name);
        if (branch_name) localStorage.setItem("branch_name", branch_name);
        if (shop_name) localStorage.setItem("shop_name", shop_name);

        // Get complete user info from token
        const tokenUser = getUserFromToken(access_token);
        const isSuperAdmin = role === "super_admin";

        // Determine initial branch context based on role
        let branchContext;

        if (isSuperAdmin) {
          // SA starts in GLOBAL mode (must explicitly select branch for writes)
          branchContext = {
            mode: BRANCH_MODE.GLOBAL,
            branch_id: null,
            branch_name: null,
          };
        } else {
          // branch_admin/staff: locked to their branch
          branchContext = {
            mode: BRANCH_MODE.BRANCH,
            branch_id: branch_id || tokenUser?.branch_id || null,
            branch_name: branch_name || null,
          };
        }

        set({
          isAuthenticated: true,
          isInitialized: true,
          isLoading: false,
          user: {
            user_id,
            shop_id,
            role: role || tokenUser?.role,
            status: tokenUser?.status,
            name: user_name || "",
          },
          shopName: shop_name || null,
          branchContext,
        });

        
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
        localStorage.removeItem("shop_name");

        // Reset state completely
        set({
          ...initialState,
          isInitialized: true,
          isLoading: false,
        });


      },

      /**
       * Set loading state
       */
      setLoading: (isLoading) => set({ isLoading }),

      // ============================================
      // BRANCH CONTEXT MANAGEMENT
      // ============================================

      /**
       * Switch to GLOBAL mode (aggregated view, no writes)
       * Only super_admin can call this
       */
      setGlobalBranch: () => {
        const { user } = get();

        if (!user || user.role !== "super_admin") {
          console.warn(
            " setGlobalBranch: Only super_admin can switch to GLOBAL mode",
          );
          return false;
        }

        set({
          branchContext: {
            mode: BRANCH_MODE.GLOBAL,
            branch_id: null,
            branch_name: null,
          },
        });


        return true;
      },

      /**
       * Switch to BRANCH mode with specific branch
       * @param {string} branch_id - Branch UUID
       * @param {string} branch_name - Branch display name
       */
      setBranch: (branch_id, branch_name) => {
        const { user } = get();

        if (!user) {
          console.warn(" setBranch: No authenticated user");
          return false;
        }

        // Non-SA users can only be set to their assigned branch (handled at login)
        if (user.role !== "super_admin") {
          console.warn(" setBranch: Only super_admin can switch branches");
          return false;
        }

        if (!branch_id) {
          console.warn(" setBranch: branch_id is required for BRANCH mode");
          return false;
        }

        set({
          branchContext: {
            mode: BRANCH_MODE.BRANCH,
            branch_id,
            branch_name: branch_name || null,
          },
        });

        // Also update localStorage for branch_name (for non-SA consistency)
        if (branch_name) {
          localStorage.setItem("branch_name", branch_name);
        }

        return true;
      },

      /**
       * Check if currently in GLOBAL mode
       */
      isGlobalMode: () => {
        const { branchContext } = get();
        return branchContext.mode === BRANCH_MODE.GLOBAL;
      },

      /**
       * Check if currently in BRANCH mode
       */
      isBranchMode: () => {
        const { branchContext } = get();
        return branchContext.mode === BRANCH_MODE.BRANCH;
      },

      /**
       * Check if writes are allowed (must be in BRANCH mode)
       */
      canWrite: () => {
        const { branchContext } = get();
        return (
          branchContext.mode === BRANCH_MODE.BRANCH && !!branchContext.branch_id
        );
      },

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
      // CONVENIENCE GETTERS
      // ============================================

      /**
       * Check if user is super admin
       */
      isSuperAdmin: () => {
        const { user } = get();
        return user?.role === "super_admin";
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
      version: 2, // Bumped version for migration
      // Only persist what's needed
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
        shopName: state.shopName,
        branchContext: state.branchContext, // NEW: Persist branch context
      }),
      // Handle migration from v1 (had branchName) to v2 (has branchContext)
      migrate: (persistedState, version) => {
        if (version === 1) {
          // Migrate from old format
          const oldBranchName = persistedState.branchName;
          delete persistedState.branchName;

          persistedState.branchContext = {
            mode: BRANCH_MODE.GLOBAL,
            branch_id: null,
            branch_name: oldBranchName || null,
          };
        }
        return persistedState;
      },
    },
  ),
);

// ============================================
// SELECTORS (for optimized re-renders)
// ============================================

export const selectIsAuthenticated = (state) => state.isAuthenticated;
export const selectIsInitialized = (state) => state.isInitialized;
export const selectIsLoading = (state) => state.isLoading;
export const selectUser = (state) => state.user;
export const selectUserRole = (state) => state.user?.role;
export const selectIsSuperAdmin = (state) => state.user?.role === "super_admin";
export const selectShopName = (state) => state.shopName;

// NEW: Branch context selectors
export const selectBranchContext = (state) => state.branchContext;
export const selectBranchMode = (state) => state.branchContext.mode;
export const selectBranchId = (state) => state.branchContext.branch_id;
export const selectBranchName = (state) => state.branchContext.branch_name;
export const selectIsGlobalMode = (state) =>
  state.branchContext.mode === "GLOBAL";
export const selectIsBranchMode = (state) =>
  state.branchContext.mode === "BRANCH";
export const selectCanWrite = (state) =>
  state.branchContext.mode === "BRANCH" && !!state.branchContext.branch_id;

// Export constants for use elsewhere
export { BRANCH_MODE };
