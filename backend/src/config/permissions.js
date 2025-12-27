// Q:\PROJECTS\YourZeroesAndOnes\cureli\curely_erp\backend\src\config\permissions.js

/**
 * ============================================
 * PERMISSION CONSTANTS
 * ============================================
 * 
 * Naming convention: RESOURCE_ACTION
 * Format: "resource:action"
 * 
 * To add a new permission:
 * 1. Add constant here
 * 2. Add to appropriate role(s) in ROLE_PERMISSIONS
 * 3. Use in routes with requirePermission("permission:name")
 */

export const PERMISSIONS = {
  // ============================================
  // BILLING / SALES
  // ============================================
  BILLING_CREATE: "billing:create",     // Create new sales bills
  BILLING_VIEW: "billing:view",         // View sales history/invoices
  BILLING_EDIT: "billing:edit",         // Edit/modify existing bills
  BILLING_DELETE: "billing:delete",     // Delete/cancel bills
  BILLING_REFUND: "billing:refund",     // Process refunds

  // ============================================
  // PURCHASE
  // ============================================
  PURCHASE_CREATE: "purchase:create",   // Create purchase orders
  PURCHASE_VIEW: "purchase:view",       // View purchase history
  PURCHASE_EDIT: "purchase:edit",       // Edit purchase orders
  PURCHASE_DELETE: "purchase:delete",   // Delete purchase orders

  // ============================================
  // INVENTORY
  // ============================================
  INVENTORY_VIEW: "inventory:view",     // View stock levels
  INVENTORY_ADJUST: "inventory:adjust", // Manual stock adjustments
  INVENTORY_TRANSFER: "inventory:transfer", // Transfer between branches

  // ============================================
  // SUPPLIERS
  // ============================================
  SUPPLIERS_VIEW: "suppliers:view",     // View supplier list
  SUPPLIERS_MANAGE: "suppliers:manage", // Add/edit/delete suppliers

  // ============================================
  // REPORTS
  // ============================================
  REPORTS_SALES: "reports:sales",       // View sales reports
  REPORTS_PURCHASE: "reports:purchase", // View purchase reports
  REPORTS_INVENTORY: "reports:inventory", // View inventory reports
  REPORTS_FINANCIAL: "reports:financial", // View financial reports

  // ============================================
  // USER MANAGEMENT
  // ============================================
  USERS_VIEW: "users:view",             // View user list
  USERS_CREATE: "users:create",         // Create new users
  USERS_EDIT: "users:edit",             // Edit existing users
  USERS_DELETE: "users:delete",         // Deactivate/delete users
  USERS_MANAGE: "users:manage",         // Legacy: full user management (SA only)
  USERS_RESET_PASSWORD: "users:reset_password", // Reset other users' passwords

  // ============================================
  // BRANCH MANAGEMENT
  // ============================================
  BRANCHES_VIEW: "branches:view",       // View branch list
  BRANCHES_CREATE: "branches:create",   // Create new branches
  BRANCHES_EDIT: "branches:edit",       // Edit branch details
  BRANCHES_DELETE: "branches:delete",   // Deactivate/delete branches
  BRANCHES_MANAGE: "branches:manage",   // Legacy: full branch management
  BRANCHES_SWITCH: "branches:switch",   // Switch between branches (SA only)

  // ============================================
  // SETTINGS
  // ============================================
  SETTINGS_VIEW: "settings:view",       // View settings
  SETTINGS_MANAGE: "settings:manage",   // Modify settings

  // ============================================
  // DASHBOARD
  // ============================================
  DASHBOARD_VIEW: "dashboard:view",     // View dashboard
  DASHBOARD_ANALYTICS: "dashboard:analytics", // View detailed analytics
};

/**
 * ============================================
 * ROLE → PERMISSIONS MAPPING
 * ============================================
 * 
 * Roles:
 * - super_admin: Shop owner, full access to everything across all branches
 * - branch_admin: Branch manager, full access within their assigned branch
 *                 Can create/edit STAFF only (not other branch_admins)
 *                 Can reset password for staff in own branch only
 * - staff: Limited access, primarily billing within their branch
 *          No user/branch management access
 * 
 * Special values:
 * - "*" means ALL permissions (wildcard)
 * - Array of specific permissions for granular control
 * 
 * To modify permissions:
 * Just edit the arrays below. Changes take effect immediately.
 */

export const ROLE_PERMISSIONS = {
  // ============================================
  // SUPER ADMIN — Full access to everything
  // ============================================
  super_admin: ["*"], // Wildcard: all permissions granted

  // ============================================
  // BRANCH ADMIN — Full access within branch
  // ============================================
  branch_admin: [
    // Billing - full access
    PERMISSIONS.BILLING_CREATE,
    PERMISSIONS.BILLING_VIEW,
    PERMISSIONS.BILLING_EDIT,
    PERMISSIONS.BILLING_DELETE,
    PERMISSIONS.BILLING_REFUND,

    // Purchase - full access
    PERMISSIONS.PURCHASE_CREATE,
    PERMISSIONS.PURCHASE_VIEW,
    PERMISSIONS.PURCHASE_EDIT,
    PERMISSIONS.PURCHASE_DELETE,

    // Inventory - full access
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.INVENTORY_ADJUST,
    PERMISSIONS.INVENTORY_TRANSFER,

    // Suppliers - full access
    PERMISSIONS.SUPPLIERS_VIEW,
    PERMISSIONS.SUPPLIERS_MANAGE,

    // Reports - view all except financial
    PERMISSIONS.REPORTS_SALES,
    PERMISSIONS.REPORTS_PURCHASE,
    PERMISSIONS.REPORTS_INVENTORY,
    // Note: No REPORTS_FINANCIAL for branch_admin

    // Users - can view, create staff, edit staff, reset staff password
    // NOTE: Backend enforces "staff only" and "own branch only" restrictions
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.USERS_CREATE,         // Can only create 'staff' role
    PERMISSIONS.USERS_EDIT,           // Can only edit staff in own branch
    PERMISSIONS.USERS_RESET_PASSWORD, // Can only reset staff passwords in own branch

    // Branches - view all, edit own only
    // NOTE: Backend enforces "own branch only" for edit
    PERMISSIONS.BRANCHES_VIEW,
    PERMISSIONS.BRANCHES_EDIT,        // Can only edit own branch

    // Settings - view only
    PERMISSIONS.SETTINGS_VIEW,

    // Dashboard - full
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.DASHBOARD_ANALYTICS,
  ],

  // ============================================
  // STAFF — Limited access (billing focused)
  // ============================================
  staff: [
    // Billing - create and view only
    PERMISSIONS.BILLING_CREATE,
    PERMISSIONS.BILLING_VIEW,
    // Note: No edit, delete, or refund

    // Purchase - view only
    PERMISSIONS.PURCHASE_VIEW,

    // Inventory - view only
    PERMISSIONS.INVENTORY_VIEW,

    // Suppliers - view only
    PERMISSIONS.SUPPLIERS_VIEW,

    // Reports - sales only
    PERMISSIONS.REPORTS_SALES,

    // Dashboard - view only
    PERMISSIONS.DASHBOARD_VIEW,

    // Note: No user management permissions
    // Note: No branch management permissions
    // Note: No settings permissions
  ],
};

/**
 * ============================================
 * HELPER FUNCTIONS
 * ============================================
 */

/**
 * Check if a role has a specific permission
 * @param {string} role - User role (super_admin, branch_admin, staff)
 * @param {string} permission - Permission to check (e.g., "billing:create")
 * @returns {boolean}
 */
export function roleHasPermission(role, permission) {
  const permissions = ROLE_PERMISSIONS[role];

  if (!permissions) {
    return false;
  }

  // Wildcard check
  if (permissions.includes("*")) {
    return true;
  }

  return permissions.includes(permission);
}

/**
 * Check if a role has ANY of the specified permissions
 * @param {string} role - User role
 * @param {string[]} permissions - Array of permissions to check
 * @returns {boolean}
 */
export function roleHasAnyPermission(role, permissions) {
  return permissions.some((perm) => roleHasPermission(role, perm));
}

/**
 * Check if a role has ALL of the specified permissions
 * @param {string} role - User role
 * @param {string[]} permissions - Array of permissions to check
 * @returns {boolean}
 */
export function roleHasAllPermissions(role, permissions) {
  return permissions.every((perm) => roleHasPermission(role, perm));
}

/**
 * Get all permissions for a role
 * @param {string} role - User role
 * @returns {string[]} Array of permission strings
 */
export function getPermissionsForRole(role) {
  const permissions = ROLE_PERMISSIONS[role];

  if (!permissions) {
    return [];
  }

  // If wildcard, return all permissions
  if (permissions.includes("*")) {
    return Object.values(PERMISSIONS);
  }

  return permissions;
}

/**
 * ============================================
 * ROUTE → PERMISSION MAPPING
 * ============================================
 * 
 * Maps frontend routes to required permissions.
 * Used for sidebar visibility and frontend guards.
 */

export const ROUTE_PERMISSIONS = {
  // Dashboard
  "/dashboard": [PERMISSIONS.DASHBOARD_VIEW],
  
  // Sales
  "/Salesbilling": [PERMISSIONS.BILLING_CREATE],
  "/Salesinvoice": [PERMISSIONS.BILLING_VIEW],
  
  // Purchase
  "/purchase-billing": [PERMISSIONS.PURCHASE_CREATE],
  "/purchase-invoices": [PERMISSIONS.PURCHASE_VIEW],
  
  // Inventory
  "/inventory": [PERMISSIONS.INVENTORY_VIEW],
  
  // Suppliers
  "/suppliers": [PERMISSIONS.SUPPLIERS_VIEW],
  
  // Reports
  "/reports-sales": [PERMISSIONS.REPORTS_SALES],
  "/reports-purchase": [PERMISSIONS.REPORTS_PURCHASE],
  "/reports-inventory": [PERMISSIONS.REPORTS_INVENTORY],
  "/reports-finance": [PERMISSIONS.REPORTS_FINANCIAL],
  
  // Settings - Users (SA + BA)
  "/settings/users": [PERMISSIONS.USERS_VIEW],
  
  // Settings - Branches (SA only for full access, BA for view)
  "/settings/branches": [PERMISSIONS.BRANCHES_VIEW],
  
  // Settings - Profile (no specific permission, just auth)
  "/settings/profile": [],
  
  // Settings - Upgrade (SA only - handled by role check)
  "/settings/upgrade": [],
  
  // Legacy routes
  "/pending-users": [PERMISSIONS.USERS_MANAGE],
};

/**
 * Get required permissions for a route
 * @param {string} route - Route path
 * @returns {string[]} Array of required permissions
 */
export function getRoutePermissions(route) {
  return ROUTE_PERMISSIONS[route] || [];
}