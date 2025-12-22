// src/store/useSetupStore.js
import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Setup Wizard Store
 * Manages the post-plan setup flow state with localStorage persistence
 * 
 * IMPORTANT RULES:
 * - Super Admin (SA) is NOT counted in user limits
 * - Each Staff/Branch Admin belongs to exactly ONE branch
 * - 3 Steps: Branches → Users → Review
 */

const initialState = {
  // Setup status
  isSetupComplete: false,
  isInitialized: false, // NEW: Track if we've fetched limits
  currentStep: 1, // 1=branches, 2=users, 3=review
  
  // Plan limits (fetched from API)
  planLimits: {
    plan_id: null,
    plan_name: "",
    max_branches: 1, // Default to 1, will be overwritten by API
    max_users: 1,    // Default to 1, will be overwritten by API
  },
  
  // Created data (stored until review submission)
  branches: [],
  // Shape: { temp_id, branch_name, address_line_1, city, state, pincode, contact_number }
  
  users: [],
  // Shape: { temp_id, full_name, phone_number, username, password, role, branch_temp_id }
  
  // Super Admin info (for display)
  superAdmin: {
    user_id: null,
    name: "",
  },
  
  // Error state
  error: null,
};

export const useSetupStore = create(
  persist(
    (set, get) => ({
      ...initialState,

      // ============================================
      // INITIALIZATION
      // ============================================
      
      /**
       * Initialize setup with plan limits and SA info
       * This should be called every time setup pages load to ensure fresh data
       */
      initializeSetup: ({ planLimits, superAdmin, forceRefresh = false }) => {
        const state = get();
        
        // If setup is already complete, don't reinitialize
        if (state.isSetupComplete && !forceRefresh) return;
        
        console.log("📦 Initializing setup store with:", { planLimits, superAdmin });
        
        set({
          isInitialized: true,
          planLimits: {
            plan_id: planLimits.plan_id,
            plan_name: planLimits.plan_name,
            max_branches: planLimits.max_branches,
            max_users: planLimits.max_users,
          },
          superAdmin: {
            user_id: superAdmin.user_id,
            name: superAdmin.name,
          },
          error: null,
        });
      },

      /**
       * Check if store is properly initialized
       */
      isStoreReady: () => {
        const state = get();
        return state.isInitialized && state.planLimits.plan_id !== null;
      },

      /**
       * Set current step
       */
      setCurrentStep: (step) => set({ currentStep: step }),

      // ============================================
      // BRANCH MANAGEMENT
      // ============================================
      
      /**
       * Add a new branch
       * Returns: { success: boolean, error?: string }
       */
      addBranch: (branchData) => {
        const state = get();
        const { branches, planLimits, isInitialized } = state;
        
        // Safety check - ensure store is initialized
        if (!isInitialized) {
          console.error("❌ Store not initialized!");
          return { success: false, error: "Setup not initialized. Please refresh the page." };
        }
        
        console.log("📊 Branch limit check:", { 
          current: branches.length, 
          max: planLimits.max_branches,
          isUnlimited: planLimits.max_branches === -1 
        });
        
        // Check limit (-1 means unlimited)
        if (planLimits.max_branches !== -1 && branches.length >= planLimits.max_branches) {
          return { success: false, error: `Branch limit reached (${planLimits.max_branches} max)` };
        }
        
        // Generate temp ID
        const temp_id = `branch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const newBranch = {
          temp_id,
          branch_name: branchData.branch_name,
          address_line_1: branchData.address_line_1 || "",
          city: branchData.city || "",
          state: branchData.state || "",
          pincode: branchData.pincode || "",
          contact_number: branchData.contact_number || "",
        };
        
        set({
          branches: [...branches, newBranch],
          error: null,
        });
        
        console.log("✅ Branch added:", newBranch.branch_name);
        return { success: true, branch: newBranch };
      },

      /**
       * Update a branch
       */
      updateBranch: (temp_id, updates) => {
        const state = get();
        set({
          branches: state.branches.map((b) =>
            b.temp_id === temp_id ? { ...b, ...updates } : b
          ),
        });
      },

      /**
       * Remove a branch
       * Also removes associated users
       */
      removeBranch: (temp_id) => {
        const state = get();
        
        // Remove branch
        const newBranches = state.branches.filter((b) => b.temp_id !== temp_id);
        
        // Remove users assigned to this branch
        const newUsers = state.users.filter((u) => u.branch_temp_id !== temp_id);
        
        set({
          branches: newBranches,
          users: newUsers,
        });
      },

      /**
       * Check if can add more branches
       */
      canAddBranch: () => {
        const state = get();
        const { max_branches } = state.planLimits;
        if (max_branches === -1) return true;
        return state.branches.length < max_branches;
      },

      // ============================================
      // USER MANAGEMENT
      // ============================================
      
      /**
       * Add a new user (Staff or Branch Admin)
       * Returns: { success: boolean, error?: string }
       */
      addUser: (userData) => {
        const state = get();
        const { users, planLimits, isInitialized } = state;
        
        // Safety check - ensure store is initialized
        if (!isInitialized) {
          console.error("❌ Store not initialized!");
          return { success: false, error: "Setup not initialized. Please refresh the page." };
        }
        
        console.log("📊 User limit check:", { 
          current: users.length, 
          max: planLimits.max_users,
          isUnlimited: planLimits.max_users === -1 
        });
        
        // Check limit (-1 means unlimited)
        // Remember: SA is NOT counted
        if (planLimits.max_users !== -1 && users.length >= planLimits.max_users) {
          return { success: false, error: `User limit reached (${planLimits.max_users} max)` };
        }
        
        // Check for duplicate phone
        const phoneExists = users.some((u) => u.phone_number === userData.phone_number);
        if (phoneExists) {
          return { success: false, error: "Phone number already exists" };
        }

        // Check for duplicate username
        const usernameExists = users.some((u) => u.username.toLowerCase() === userData.username.toLowerCase());
        if (usernameExists) {
          return { success: false, error: "Username already exists" };
        }
        
        // Generate temp ID
        const temp_id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const newUser = {
          temp_id,
          full_name: userData.full_name,
          phone_number: userData.phone_number,
          username: userData.username.toLowerCase(),
          password: userData.password, // Stored temporarily, sent to backend
          role: userData.role, // "staff" or "branch_admin"
          branch_temp_id: userData.branch_temp_id,
        };
        
        set({
          users: [...users, newUser],
          error: null,
        });
        
        console.log("✅ User added:", newUser.full_name);
        return { success: true, user: newUser };
      },

      /**
       * Update a user
       */
      updateUser: (temp_id, updates) => {
        const state = get();
        set({
          users: state.users.map((u) =>
            u.temp_id === temp_id ? { ...u, ...updates } : u
          ),
        });
      },

      /**
       * Remove a user
       */
      removeUser: (temp_id) => {
        const state = get();
        set({
          users: state.users.filter((u) => u.temp_id !== temp_id),
        });
      },

      /**
       * Check if can add more users
       */
      canAddUser: () => {
        const state = get();
        const { max_users } = state.planLimits;
        if (max_users === -1) return true;
        return state.users.length < max_users;
      },

      // ============================================
      // COMPUTED VALUES
      // ============================================
      
      /**
       * Get remaining branch slots
       */
      getRemainingBranches: () => {
        const state = get();
        const { max_branches } = state.planLimits;
        if (max_branches === -1) return Infinity;
        return Math.max(0, max_branches - state.branches.length);
      },

      /**
       * Get remaining user slots (SA not counted)
       */
      getRemainingUsers: () => {
        const state = get();
        const { max_users } = state.planLimits;
        if (max_users === -1) return Infinity;
        return Math.max(0, max_users - state.users.length);
      },

      /**
       * Check if can proceed to next step
       */
      canProceed: (step) => {
        const state = get();
        switch (step) {
          case 1: // Branches
            return state.branches.length >= 1;
          case 2: // Users (optional)
            return true;
          case 3: // Review
            return state.branches.length >= 1;
          default:
            return false;
        }
      },

      /**
       * Get users for a specific branch
       */
      getUsersForBranch: (branch_temp_id) => {
        const state = get();
        return state.users.filter((u) => u.branch_temp_id === branch_temp_id);
      },

      /**
       * Get setup data for submission
       */
      getSubmissionData: () => {
        const state = get();
        return {
          branches: state.branches.map((b) => ({
            temp_id: b.temp_id,
            branch_name: b.branch_name,
            address_line_1: b.address_line_1 || null,
            city: b.city || null,
            state: b.state || null,
            pincode: b.pincode || null,
            contact_number: b.contact_number || null,
          })),
          users: state.users.map((u) => ({
            temp_id: u.temp_id,
            full_name: u.full_name,
            phone_number: u.phone_number,
            username: u.username,
            password: u.password,
            role: u.role,
            branch_temp_id: u.branch_temp_id,
          })),
        };
      },

      // ============================================
      // SETUP COMPLETION
      // ============================================
      
      /**
       * Mark setup as complete and clear temporary data
       */
      completeSetup: () => {
        set({
          isSetupComplete: true,
          currentStep: 3,
          error: null,
        });
      },

      /**
       * Reset entire setup (for errors or starting over)
       */
      resetSetup: () => {
        set({
          ...initialState,
          isInitialized: false,
        });
      },

      /**
       * Clear only the branches and users data (keep plan limits)
       */
      clearSetupData: () => {
        set({
          branches: [],
          users: [],
          currentStep: 1,
          error: null,
        });
      },

      /**
       * Set error message
       */
      setError: (error) => set({ error }),

      /**
       * Clear error
       */
      clearError: () => set({ error: null }),
    }),
    {
      name: "cureli-setup-storage",
      version: 3, // Bumped version to clear old data
      // Only persist these fields
      partialize: (state) => ({
        isSetupComplete: state.isSetupComplete,
        isInitialized: state.isInitialized,
        currentStep: state.currentStep,
        planLimits: state.planLimits,
        branches: state.branches,
        users: state.users,
        superAdmin: state.superAdmin,
      }),
    }
  )
);

// Selectors for common use cases
export const selectBranchCount = (state) => state.branches.length;
export const selectUserCount = (state) => state.users.length;
export const selectIsInitialized = (state) => state.isInitialized;
export const selectCanAddBranch = (state) => {
  const { max_branches } = state.planLimits;
  return max_branches === -1 || state.branches.length < max_branches;
};
export const selectCanAddUser = (state) => {
  const { max_users } = state.planLimits;
  return max_users === -1 || state.users.length < max_users;
};