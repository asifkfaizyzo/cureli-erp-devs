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
 */

export function useMenuPermissions() {
  const { hasPermission, hasAnyPermission } = usePermission();

  return useMemo(() => ({
    dashboard: {
      visible: true, // Everyone can see dashboard
      disabled: !hasPermission("dashboard:view"),
    },
    
    // Sales
    salesBilling: {
      visible: true,
      disabled: !hasPermission("billing:create"),
    },
    salesInvoices: {
      visible: true,
      disabled: !hasPermission("billing:view"),
    },
    
    // Purchase
    purchaseBilling: {
      visible: true,
      disabled: !hasPermission("purchase:create"),
    },
    purchaseInvoices: {
      visible: true,
      disabled: !hasPermission("purchase:view"),
    },
    
    // Inventory
    inventory: {
      visible: true,
      disabled: !hasPermission("inventory:view"),
    },
    
    // Suppliers
    suppliers: {
      visible: true,
      disabled: !hasPermission("suppliers:view"),
    },
    
    // Reports
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
    
    // Users (SA only)
    pendingUsers: {
      visible: true,
      disabled: !hasPermission("users:manage"),
    },
    
    // Settings
    settings: {
      visible: true,
      disabled: !hasPermission("settings:view"),
    },
  }), [hasPermission, hasAnyPermission]);
}

export default usePermission;