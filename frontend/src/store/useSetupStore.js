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
 * - SA is auto-assigned as billing operator for each branch initially
 */

const initialState = {
  // Setup status
  isSetupComplete: false,
  currentStep: 1, // 1=branches, 2=users, 3=operators, 4=review
  
  // Plan limits (fetched from API)
  planLimits: {
    plan_id: null,
    plan_name: "",
    max_branches: 0,
    max_users: 0, // Does NOT include SA
  },
  
  // Created data (stored until review submission)
  branches: [],
  // Shape: { temp_id, branch_name, address, phone, billing_user_id }
  
  users: [],
  // Shape: { temp_id, full_name, phone_number, username, role, branch_temp_id }
  
  // Billing operators per branch (branch_temp_id -> user identifier)
  // "sa" = Super Admin, or user temp_id
  operators: {},
  
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
       */
      initializeSetup: ({ planLimits, superAdmin }) => {
        const state = get();
        
        // Only initialize if not already set up
        if (state.isSetupComplete) return;
        
        set({
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
        const { branches, planLimits, superAdmin } = state;
        
        // Check limit (-1 means unlimited)
        if (planLimits.max_branches !== -1 && branches.length >= planLimits.max_branches) {
          return { success: false, error: "Branch limit reached" };
        }
        
        // Generate temp ID
        const temp_id = `branch_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const newBranch = {
          temp_id,
          branch_name: branchData.branch_name,
          address: branchData.address || "",
          phone: branchData.phone || "",
          billing_user_id: "sa", // Default: Super Admin
        };
        
        // Auto-assign SA as operator
        const newOperators = { ...state.operators, [temp_id]: "sa" };
        
        set({
          branches: [...branches, newBranch],
          operators: newOperators,
          error: null,
        });
        
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
       * Also removes associated users and operator assignment
       */
      removeBranch: (temp_id) => {
        const state = get();
        
        // Remove branch
        const newBranches = state.branches.filter((b) => b.temp_id !== temp_id);
        
        // Remove users assigned to this branch
        const newUsers = state.users.filter((u) => u.branch_temp_id !== temp_id);
        
        // Remove operator assignment
        const newOperators = { ...state.operators };
        delete newOperators[temp_id];
        
        set({
          branches: newBranches,
          users: newUsers,
          operators: newOperators,
        });
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
        const { users, planLimits } = state;
        
        // Check limit (-1 means unlimited)
        // Remember: SA is NOT counted
        if (planLimits.max_users !== -1 && users.length >= planLimits.max_users) {
          return { success: false, error: "User limit reached" };
        }
        
        // Check for duplicate phone
        const phoneExists = users.some((u) => u.phone_number === userData.phone_number);
        if (phoneExists) {
          return { success: false, error: "Phone number already exists" };
        }
        
        // Generate temp ID
        const temp_id = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        // Auto-generate username if not provided
        const username = userData.username || 
          userData.full_name.toLowerCase().replace(/\s+/g, "_") + "_" + Date.now().toString().slice(-4);
        
        const newUser = {
          temp_id,
          full_name: userData.full_name,
          phone_number: userData.phone_number,
          username,
          role: userData.role, // "staff" or "branch_admin"
          branch_temp_id: userData.branch_temp_id,
        };
        
        set({
          users: [...users, newUser],
          error: null,
        });
        
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
       * Also updates operator if this user was assigned
       */
      removeUser: (temp_id) => {
        const state = get();
        
        // Check if this user is an operator for any branch
        const newOperators = { ...state.operators };
        Object.keys(newOperators).forEach((branchId) => {
          if (newOperators[branchId] === temp_id) {
            newOperators[branchId] = "sa"; // Revert to SA
          }
        });
        
        set({
          users: state.users.filter((u) => u.temp_id !== temp_id),
          operators: newOperators,
        });
      },

      // ============================================
      // OPERATOR MANAGEMENT
      // ============================================
      
      /**
       * Set billing operator for a branch
       * @param branch_temp_id - Branch temp ID
       * @param operator_id - "sa" for Super Admin, or user temp_id
       */
      setOperator: (branch_temp_id, operator_id) => {
        const state = get();
        set({
          operators: {
            ...state.operators,
            [branch_temp_id]: operator_id,
          },
        });
      },

      /**
       * Get users available for a specific branch
       * Only users assigned to that branch can be operators
       */
      getUsersForBranch: (branch_temp_id) => {
        const state = get();
        return state.users.filter((u) => u.branch_temp_id === branch_temp_id);
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
          case 3: // Operators (optional)
            return true;
          case 4: // Review
            return state.branches.length >= 1;
          default:
            return false;
        }
      },

      /**
       * Get setup data for submission
       */
      getSubmissionData: () => {
        const state = get();
        return {
          branches: state.branches.map((b) => ({
            branch_name: b.branch_name,
            address: b.address,
            phone: b.phone,
            temp_id: b.temp_id,
          })),
          users: state.users.map((u) => ({
            full_name: u.full_name,
            phone_number: u.phone_number,
            username: u.username,
            role: u.role,
            branch_temp_id: u.branch_temp_id,
          })),
          operators: state.operators,
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
          currentStep: 4,
          error: null,
        });
      },

      /**
       * Reset entire setup (for errors or starting over)
       */
      resetSetup: () => {
        set(initialState);
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
      version: 1,
      // Only persist these fields
      partialize: (state) => ({
        isSetupComplete: state.isSetupComplete,
        currentStep: state.currentStep,
        planLimits: state.planLimits,
        branches: state.branches,
        users: state.users,
        operators: state.operators,
        superAdmin: state.superAdmin,
      }),
    }
  )
);

// Selectors for common use cases
export const selectBranchCount = (state) => state.branches.length;
export const selectUserCount = (state) => state.users.length;
export const selectCanAddBranch = (state) => {
  const { max_branches } = state.planLimits;
  return max_branches === -1 || state.branches.length < max_branches;
};
export const selectCanAddUser = (state) => {
  const { max_users } = state.planLimits;
  return max_users === -1 || state.users.length < max_users;
};