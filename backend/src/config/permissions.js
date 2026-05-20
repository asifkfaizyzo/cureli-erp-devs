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

// src/config/permissions.js

export const PERMISSIONS = {
  // ============================================
  // BILLING / SALES
  // ============================================
  BILLING_CREATE: "billing:create",
  BILLING_VIEW: "billing:view",
  BILLING_EDIT: "billing:edit",
  BILLING_DELETE: "billing:delete",
  BILLING_REFUND: "billing:refund",

  // ============================================
  // PURCHASE
  // ============================================
  PURCHASE_CREATE: "purchase:create",
  PURCHASE_VIEW: "purchase:view",
  PURCHASE_EDIT: "purchase:edit",
  PURCHASE_DELETE: "purchase:delete",

  // ============================================
  // INVENTORY
  // ============================================
  INVENTORY_VIEW: "inventory:view",
  INVENTORY_ADJUST: "inventory:adjust",
  INVENTORY_TRANSFER: "inventory:transfer",

  // ============================================
  // SUPPLIERS
  // ============================================
  SUPPLIERS_VIEW: "suppliers:view",
  SUPPLIERS_MANAGE: "suppliers:manage",

  // ============================================
  // REPORTS
  // ============================================
  REPORTS_SALES: "reports:sales",
  REPORTS_PURCHASE: "reports:purchase",
  REPORTS_INVENTORY: "reports:inventory",
  REPORTS_FINANCIAL: "reports:financial",

  // ============================================
  // USER MANAGEMENT
  // ============================================
  USERS_VIEW: "users:view",
  USERS_CREATE: "users:create",
  USERS_EDIT: "users:edit",
  USERS_DELETE: "users:delete",
  USERS_MANAGE: "users:manage",
  USERS_RESET_PASSWORD: "users:reset_password",

  // ============================================
  // BRANCH MANAGEMENT
  // ============================================
  BRANCHES_VIEW: "branches:view",
  BRANCHES_CREATE: "branches:create",
  BRANCHES_EDIT: "branches:edit",
  BRANCHES_DELETE: "branches:delete",
  BRANCHES_MANAGE: "branches:manage",
  BRANCHES_SWITCH: "branches:switch",

  // ============================================
  // SETTINGS
  // ============================================
  SETTINGS_VIEW: "settings:view",
  SETTINGS_MANAGE: "settings:manage",

  // ============================================
  // DASHBOARD
  // ============================================
  DASHBOARD_VIEW: "dashboard:view",
  DASHBOARD_ANALYTICS: "dashboard:analytics",

  // ============================================
  // TICKETS (NEW)
  // ============================================
  TICKETS_VIEW: "tickets:view",
  TICKETS_CREATE: "tickets:create",
  TICKETS_CANCEL: "tickets:cancel",
  TICKETS_REOPEN: "tickets:reopen",
};

export const ROLE_PERMISSIONS = {
  // Super Admin - full access
  super_admin: ["*"],

  // Branch Admin - branch-level access
  branch_admin: [
    // Billing
    PERMISSIONS.BILLING_CREATE,
    PERMISSIONS.BILLING_VIEW,
    PERMISSIONS.BILLING_EDIT,
    PERMISSIONS.BILLING_DELETE,
    PERMISSIONS.BILLING_REFUND,

    // Purchase
    PERMISSIONS.PURCHASE_CREATE,
    PERMISSIONS.PURCHASE_VIEW,
    PERMISSIONS.PURCHASE_EDIT,
    PERMISSIONS.PURCHASE_DELETE,

    // Inventory
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.INVENTORY_ADJUST,
    PERMISSIONS.INVENTORY_TRANSFER,

    // Suppliers
    PERMISSIONS.SUPPLIERS_VIEW,
    PERMISSIONS.SUPPLIERS_MANAGE,

    // Reports (no financial)
    PERMISSIONS.REPORTS_SALES,
    PERMISSIONS.REPORTS_PURCHASE,
    PERMISSIONS.REPORTS_INVENTORY,

    // Users
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.USERS_CREATE,
    PERMISSIONS.USERS_EDIT,
    PERMISSIONS.USERS_RESET_PASSWORD,

    // Branches
    PERMISSIONS.BRANCHES_VIEW,
    PERMISSIONS.BRANCHES_EDIT,

    // Settings
    PERMISSIONS.SETTINGS_VIEW,

    // Dashboard
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.DASHBOARD_ANALYTICS,

    // Tickets (NEW)
    PERMISSIONS.TICKETS_VIEW,
    PERMISSIONS.TICKETS_CREATE,
    PERMISSIONS.TICKETS_CANCEL,
    PERMISSIONS.TICKETS_REOPEN,
  ],

  // Staff - limited access (NO TICKETS)
  staff: [
    PERMISSIONS.BILLING_CREATE,
    PERMISSIONS.BILLING_VIEW,
    PERMISSIONS.PURCHASE_VIEW,
    PERMISSIONS.INVENTORY_VIEW,
    PERMISSIONS.SUPPLIERS_VIEW,
    PERMISSIONS.REPORTS_SALES,
    PERMISSIONS.DASHBOARD_VIEW,
  ],
};

// ... rest of the file remains the same (helper functions)

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
 * Maps pharmacy-web routes to required permissions.
 * Used for sidebar visibility and pharmacy-web guards.
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
