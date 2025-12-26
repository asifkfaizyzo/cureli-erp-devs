// src/hooks/usePermission.js

import { useMemo } from "react";
import { useAuthStore } from "../store/useAuthStore";
import { roleHasPermission, roleHasAnyPermission } from "../config/permissions";

/**
 * ============================================
 * USE PERMISSION HOOK
 * ============================================
 * 
 * Provides permission checking utilities for components.
 * 
 * Usage:
 *   const { hasPermission, canAccess, isSuperAdmin } = usePermission();
 *   
 *   if (hasPermission("billing:create")) { ... }
 *   if (canAccess("/purchase-billing")) { ... }
 */

export function usePermission() {
  const user = useAuthStore((state) => state.user);
  const permissions = useAuthStore((state) => state.permissions);

  const helpers = useMemo(() => {
    const role = user?.role;

    return {
      /**
       * Check if user has a specific permission
       */
      hasPermission: (permission) => {
        if (!role) return false;
        
        // Check cached permissions first
        if (permissions.length > 0) {
          if (permissions.includes("*")) return true;
          return permissions.includes(permission);
        }
        
        // Fallback to role-based check
        return roleHasPermission(role, permission);
      },

      /**
       * Check if user has ANY of the specified permissions
       */
      hasAnyPermission: (...perms) => {
        if (!role) return false;
        
        if (permissions.length > 0) {
          if (permissions.includes("*")) return true;
          return perms.some((p) => permissions.includes(p));
        }
        
        return roleHasAnyPermission(role, perms);
      },

      /**
       * Check if user has a specific role
       */
      hasRole: (...roles) => {
        if (!role) return false;
        return roles.includes(role);
      },

      /**
       * Check if user is super admin
       */
      isSuperAdmin: role === "super_admin",

      /**
       * Check if user is branch admin
       */
      isBranchAdmin: role === "branch_admin",

      /**
       * Check if user is staff
       */
      isStaff: role === "staff",

      /**
       * Get current user's role
       */
      role,

      /**
       * Get current user's branch ID
       */
      branchId: user?.branch_id,

      /**
       * Check if user can switch branches (SA only)
       */
      canSwitchBranches: role === "super_admin",
    };
  }, [user, permissions]);

  return helpers;
}

/**
 * ============================================
 * USE MENU PERMISSIONS HOOK
 * ============================================
 * 
 * Returns visibility/disabled state for menu items.
 * Used by Sidebar component.
 * 
 * Permission Structure:
 * - visible: Whether the item should be rendered
 * - disabled: Whether the user lacks permission (used to filter out inaccessible items)
 */

export function useMenuPermissions() {
  const { hasPermission, hasAnyPermission, isSuperAdmin, isBranchAdmin } = usePermission();

  // ════════════════════════════════════════════════════════════
  // Helper: Check if user can access "Add" menu items
  // Super Admin & Branch Admin have access
  // ════════════════════════════════════════════════════════════
  const canAccessAddMenu = isSuperAdmin || isBranchAdmin;

  return useMemo(() => ({
    // ════════════════════════════════════════════════════════════
    // DASHBOARD
    // ════════════════════════════════════════════════════════════
    dashboard: {
      visible: true,
      disabled: !hasPermission("dashboard:view"),
    },
    
    // ════════════════════════════════════════════════════════════
    // SALES
    // ════════════════════════════════════════════════════════════
    salesBilling: {
      visible: true,
      disabled: !hasPermission("billing:create"),
    },
    salesInvoices: {
      visible: true,
      disabled: !hasPermission("billing:view"),
    },
    
    // ════════════════════════════════════════════════════════════
    // PURCHASE
    // ════════════════════════════════════════════════════════════
    purchaseBilling: {
      visible: true,
      disabled: !hasPermission("purchase:create"),
    },
    purchaseInvoices: {
      visible: true,
      disabled: !hasPermission("purchase:view"),
    },
    
    // ════════════════════════════════════════════════════════════
    // INVENTORY
    // ════════════════════════════════════════════════════════════
    inventory: {
      visible: true,
      disabled: !hasPermission("inventory:view"),
    },
    
    // ════════════════════════════════════════════════════════════
    // SUPPLIERS
    // ════════════════════════════════════════════════════════════
    suppliers: {
      visible: true,
      disabled: !hasPermission("suppliers:view"),
    },
    
    // ════════════════════════════════════════════════════════════
    // REPORTS
    // ════════════════════════════════════════════════════════════
    salesReport: {
      visible: true,
      disabled: !hasPermission("reports:sales"),
    },
    purchaseReport: {
      visible: true,
      disabled: !hasPermission("reports:purchase"),
    },
    inventoryReport: {
      visible: true,
      disabled: !hasPermission("reports:inventory"),
    },
    financeReport: {
      visible: true,
      disabled: !hasPermission("reports:financial"),
    },
    
    // ════════════════════════════════════════════════════════════
    // ADD MENU (Super Admin & Branch Admin Only)
    // ════════════════════════════════════════════════════════════
    addUser: {
      visible: true,
      disabled: !canAccessAddMenu, // ✅ Super Admin & Branch Admin can add users
    },
    addBranch: {
      visible: true,
      disabled: !canAccessAddMenu, // ✅ Super Admin & Branch Admin can add branches
    },
    
    // ════════════════════════════════════════════════════════════
    // USERS MANAGEMENT
    // ════════════════════════════════════════════════════════════
    pendingUsers: {
      visible: true,
      disabled: !hasPermission("users:manage"),
    },
    
    // ════════════════════════════════════════════════════════════
    // SETTINGS
    // ════════════════════════════════════════════════════════════
    settings: {
      visible: true,
      disabled: !hasPermission("settings:view"),
    },
  }), [hasPermission, hasAnyPermission, canAccessAddMenu]);
}

export default usePermission;