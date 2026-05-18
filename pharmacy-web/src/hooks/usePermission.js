// src/hooks/usePermission.js

import { useMemo } from "react";
import { useAuthStore } from "../store/useAuthStore";
import {
  roleHasPermission,
  roleHasAnyPermission,
  PERMISSIONS,
} from "../config/permissions";

/**
 * ============================================
 * USE PERMISSION HOOK
 * ============================================
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

        if (permissions.length > 0) {
          if (permissions.includes("*")) return true;
          return permissions.includes(permission);
        }

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
 * Updated:
 * - Staff: NO settings access at all
 * - Branch Admin: Users only (no profile, no branches, no upgrade)
 * - Super Admin: Full settings access
 */

export function useMenuPermissions() {
  const { hasPermission, isSuperAdmin, isBranchAdmin, isStaff } =
    usePermission();

  return useMemo(
    () => ({
      // ════════════════════════════════════════════════════════════
      // DASHBOARD
      // ════════════════════════════════════════════════════════════
      dashboard: {
        visible: true,
        disabled: !hasPermission(PERMISSIONS.DASHBOARD_VIEW),
      },

      // ════════════════════════════════════════════════════════════
      // SALES
      // ════════════════════════════════════════════════════════════
      salesBilling: {
        visible: true,
        disabled: !hasPermission(PERMISSIONS.BILLING_CREATE),
      },
      salesInvoices: {
        visible: true,
        disabled: !hasPermission(PERMISSIONS.BILLING_VIEW),
      },

      // ════════════════════════════════════════════════════════════
      // PURCHASE
      // ════════════════════════════════════════════════════════════
      purchaseBilling: {
        visible: true,
        disabled: !hasPermission(PERMISSIONS.PURCHASE_CREATE),
      },
      purchaseInvoices: {
        visible: true,
        disabled: !hasPermission(PERMISSIONS.PURCHASE_VIEW),
      },

      // ════════════════════════════════════════════════════════════
      // INVENTORY
      // ════════════════════════════════════════════════════════════
      inventory: {
        visible: true,
        disabled: !hasPermission(PERMISSIONS.INVENTORY_VIEW),
      },

      // ════════════════════════════════════════════════════════════
      // SUPPLIERS
      // ════════════════════════════════════════════════════════════
      suppliers: {
        visible: true,
        disabled: !hasPermission(PERMISSIONS.SUPPLIERS_VIEW),
      },

      // ════════════════════════════════════════════════════════════
      // REPORTS
      // ════════════════════════════════════════════════════════════
      salesReport: {
        visible: true,
        disabled: !hasPermission(PERMISSIONS.REPORTS_SALES),
      },
      purchaseReport: {
        visible: true,
        disabled: !hasPermission(PERMISSIONS.REPORTS_PURCHASE),
      },
      inventoryReport: {
        visible: true,
        disabled: !hasPermission(PERMISSIONS.REPORTS_INVENTORY),
      },
      financeReport: {
        visible: true,
        disabled: !hasPermission(PERMISSIONS.REPORTS_FINANCIAL),
      },

      // ════════════════════════════════════════════════════════════
      // SETTINGS (Parent)
      // Staff: NO access
      // BA: Only Users submenu
      // SA: Full access
      // ════════════════════════════════════════════════════════════
      settings: {
        visible: !isStaff, // Hide entire settings from staff
        disabled: isStaff,
      },

      // ════════════════════════════════════════════════════════════
      // SETTINGS > USERS
      // SA and BA can access
      // ════════════════════════════════════════════════════════════
      settingsUsers: {
        visible: isSuperAdmin || isBranchAdmin,
        disabled: !hasPermission(PERMISSIONS.USERS_VIEW),
      },

      // ════════════════════════════════════════════════════════════
      // SETTINGS > BRANCHES
      // SA only
      // ════════════════════════════════════════════════════════════
      settingsBranches: {
        visible: isSuperAdmin,
        disabled: !isSuperAdmin,
      },

      // ════════════════════════════════════════════════════════════
      // SETTINGS > PROFILE
      // SA only (BA and Staff don't need it)
      // ════════════════════════════════════════════════════════════
      settingsProfile: {
        visible: isSuperAdmin,
        disabled: !isSuperAdmin,
      },

      // ════════════════════════════════════════════════════════════
      // SETTINGS > UPGRADE PLAN
      // SA only
      // ════════════════════════════════════════════════════════════
      settingsUpgrade: {
        visible: isSuperAdmin,
        disabled: !isSuperAdmin,
      },

      // ════════════════════════════════════════════════════════════
      // LEGACY - Pending Users (SA only)
      // ════════════════════════════════════════════════════════════
      pendingUsers: {
        visible: isSuperAdmin,
        disabled: !hasPermission(PERMISSIONS.USERS_MANAGE),
      },
      // ════════════════════════════════════════════════════════════
      // MARKETPLACE MENU ITEMS
      // All visible to all authenticated users for now.
      // RBAC to be added later.
      // ════════════════════════════════════════════════════════════
      marketplaceDashboard: {
        visible: true,
        disabled: false,
      },
      marketplaceOrders: {
        visible: true,
        disabled: false,
      },
      marketplaceListings: {
        visible: true,
        disabled: false,
      },
      marketplaceStorefront: {
        visible: true,
        disabled: false,
      },
    }),
    [hasPermission, isSuperAdmin, isBranchAdmin, isStaff],
  );
}

export default usePermission;

// // src/hooks/usePermission.js

// import { useMemo } from "react";
// import { useAuthStore } from "../store/useAuthStore";
// import { roleHasPermission, roleHasAnyPermission, PERMISSIONS } from "../config/permissions";

// /**
//  * ============================================
//  * USE PERMISSION HOOK
//  * ============================================
//  */

// export function usePermission() {
//   const user = useAuthStore((state) => state.user);
//   const permissions = useAuthStore((state) => state.permissions);

//   const helpers = useMemo(() => {
//     const role = user?.role;

//     return {
//       /**
//        * Check if user has a specific permission
//        */
//       hasPermission: (permission) => {
//         if (!role) return false;

//         if (permissions.length > 0) {
//           if (permissions.includes("*")) return true;
//           return permissions.includes(permission);
//         }

//         return roleHasPermission(role, permission);
//       },

//       /**
//        * Check if user has ANY of the specified permissions
//        */
//       hasAnyPermission: (...perms) => {
//         if (!role) return false;

//         if (permissions.length > 0) {
//           if (permissions.includes("*")) return true;
//           return perms.some((p) => permissions.includes(p));
//         }

//         return roleHasAnyPermission(role, perms);
//       },

//       /**
//        * Check if user has a specific role
//        */
//       hasRole: (...roles) => {
//         if (!role) return false;
//         return roles.includes(role);
//       },

//       /**
//        * Check if user is super admin
//        */
//       isSuperAdmin: role === "super_admin",

//       /**
//        * Check if user is branch admin
//        */
//       isBranchAdmin: role === "branch_admin",

//       /**
//        * Check if user is staff
//        */
//       isStaff: role === "staff",

//       /**
//        * Get current user's role
//        */
//       role,

//       /**
//        * Get current user's branch ID
//        */
//       branchId: user?.branch_id,

//       /**
//        * Check if user can switch branches (SA only)
//        */
//       canSwitchBranches: role === "super_admin",
//     };
//   }, [user, permissions]);

//   return helpers;
// }

// /**
//  * ============================================
//  * USE MENU PERMISSIONS HOOK
//  * ============================================
//  *
//  * Returns visibility/disabled state for menu items.
//  * Used by Sidebar component.
//  */

// export function useMenuPermissions() {
//   const { hasPermission, isSuperAdmin, isBranchAdmin } = usePermission();

//   return useMemo(() => ({
//     // ════════════════════════════════════════════════════════════
//     // DASHBOARD
//     // ════════════════════════════════════════════════════════════
//     dashboard: {
//       visible: true,
//       disabled: !hasPermission(PERMISSIONS.DASHBOARD_VIEW),
//     },

//     // ════════════════════════════════════════════════════════════
//     // SALES
//     // ════════════════════════════════════════════════════════════
//     salesBilling: {
//       visible: true,
//       disabled: !hasPermission(PERMISSIONS.BILLING_CREATE),
//     },
//     salesInvoices: {
//       visible: true,
//       disabled: !hasPermission(PERMISSIONS.BILLING_VIEW),
//     },

//     // ════════════════════════════════════════════════════════════
//     // PURCHASE
//     // ════════════════════════════════════════════════════════════
//     purchaseBilling: {
//       visible: true,
//       disabled: !hasPermission(PERMISSIONS.PURCHASE_CREATE),
//     },
//     purchaseInvoices: {
//       visible: true,
//       disabled: !hasPermission(PERMISSIONS.PURCHASE_VIEW),
//     },

//     // ════════════════════════════════════════════════════════════
//     // INVENTORY
//     // ════════════════════════════════════════════════════════════
//     inventory: {
//       visible: true,
//       disabled: !hasPermission(PERMISSIONS.INVENTORY_VIEW),
//     },

//     // ════════════════════════════════════════════════════════════
//     // SUPPLIERS
//     // ════════════════════════════════════════════════════════════
//     suppliers: {
//       visible: true,
//       disabled: !hasPermission(PERMISSIONS.SUPPLIERS_VIEW),
//     },

//     // ════════════════════════════════════════════════════════════
//     // REPORTS
//     // ════════════════════════════════════════════════════════════
//     salesReport: {
//       visible: true,
//       disabled: !hasPermission(PERMISSIONS.REPORTS_SALES),
//     },
//     purchaseReport: {
//       visible: true,
//       disabled: !hasPermission(PERMISSIONS.REPORTS_PURCHASE),
//     },
//     inventoryReport: {
//       visible: true,
//       disabled: !hasPermission(PERMISSIONS.REPORTS_INVENTORY),
//     },
//     financeReport: {
//       visible: true,
//       disabled: !hasPermission(PERMISSIONS.REPORTS_FINANCIAL),
//     },

//     // ════════════════════════════════════════════════════════════
//     // SETTINGS (Parent)
//     // Visible if user has access to at least one submenu item
//     // ════════════════════════════════════════════════════════════
//     settings: {
//       visible: true,
//       // Not disabled - let submenu filtering handle access
//       disabled: false,
//     },

//     // ════════════════════════════════════════════════════════════
//     // SETTINGS > USERS
//     // SA and BA can access (BA with restrictions enforced by backend)
//     // ════════════════════════════════════════════════════════════
//     settingsUsers: {
//       visible: isSuperAdmin || isBranchAdmin,
//       disabled: !hasPermission(PERMISSIONS.USERS_VIEW),
//     },

//     // ════════════════════════════════════════════════════════════
//     // SETTINGS > BRANCHES
//     // SA only - BA can view but we hide for cleaner UX
//     // ════════════════════════════════════════════════════════════
//     settingsBranches: {
//       visible: isSuperAdmin,
//       disabled: !isSuperAdmin,
//     },

//     // ════════════════════════════════════════════════════════════
//     // SETTINGS > PROFILE
//     // All authenticated users can access
//     // ════════════════════════════════════════════════════════════
//     settingsProfile: {
//       visible: true,
//       disabled: false,
//     },

//     // ════════════════════════════════════════════════════════════
//     // SETTINGS > UPGRADE PLAN
//     // SA only
//     // ════════════════════════════════════════════════════════════
//     settingsUpgrade: {
//       visible: isSuperAdmin,
//       disabled: !isSuperAdmin,
//     },

//     // ════════════════════════════════════════════════════════════
//     // LEGACY - Pending Users (if still needed)
//     // ════════════════════════════════════════════════════════════
//     pendingUsers: {
//       visible: isSuperAdmin,
//       disabled: !hasPermission(PERMISSIONS.USERS_MANAGE),
//     },
//   }), [hasPermission, isSuperAdmin, isBranchAdmin]);
// }

// export default usePermission;
