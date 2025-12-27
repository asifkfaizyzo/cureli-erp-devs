// src/config/permissions.js

/**
 * ============================================
 * PERMISSION CONSTANTS
 * ============================================
 * 
 * This file mirrors the backend permissions.
 * Keep in sync with: backend/src/config/permissions.js
 * 
 * Used for:
 * - Sidebar item visibility
 * - Route guards
 * - UI element disabling
 */

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
};

/**
 * ============================================
 * ROLE → PERMISSIONS MAPPING
 * ============================================
 * 
 * Keep in sync with backend!
 * Used for offline/quick permission checks.
 */

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
    
    // Users (staff in own branch only - enforced by backend)
    PERMISSIONS.USERS_VIEW,
    PERMISSIONS.USERS_CREATE,
    PERMISSIONS.USERS_EDIT,
    PERMISSIONS.USERS_RESET_PASSWORD,
    
    // Branches (own branch only - enforced by backend)
    PERMISSIONS.BRANCHES_VIEW,
    PERMISSIONS.BRANCHES_EDIT,
    
    // Settings
    PERMISSIONS.SETTINGS_VIEW,
    
    // Dashboard
    PERMISSIONS.DASHBOARD_VIEW,
    PERMISSIONS.DASHBOARD_ANALYTICS,
  ],

  // Staff - limited access
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

/**
 * ============================================
 * ROUTE → PERMISSION MAPPING
 * ============================================
 * 
 * Maps routes to required permissions.
 * Used by PermissionGuard and Sidebar.
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
  
  // Settings
  "/settings/users": [PERMISSIONS.USERS_VIEW],
  "/settings/branches": [PERMISSIONS.BRANCHES_VIEW],
  "/settings/profile": [],
  "/settings/upgrade": [],
  
  // Legacy
  "/pending-users": [PERMISSIONS.USERS_MANAGE],
};

/**
 * ============================================
 * HELPER FUNCTIONS
 * ============================================
 */

/**
 * Check if a role has a specific permission
 * @param {string} role - User role
 * @param {string} permission - Permission to check
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
 * @param {string[]} permissions - Permissions to check
 * @returns {boolean}
 */
export function roleHasAnyPermission(role, permissions) {
  return permissions.some((perm) => roleHasPermission(role, perm));
}

/**
 * Get required permission for a route
 * @param {string} route - Route path
 * @returns {string[]} Required permissions
 */
export function getRoutePermissions(route) {
  // Try exact match first
  if (ROUTE_PERMISSIONS[route]) {
    return ROUTE_PERMISSIONS[route];
  }

  // Try to match with leading slash removed/added
  const normalized = route.startsWith("/") ? route : `/${route}`;
  return ROUTE_PERMISSIONS[normalized] || [];
}

/**
 * Check if a role can access a specific route
 * @param {string} role - User role
 * @param {string} route - Route path
 * @returns {boolean}
 */
export function canAccessRoute(role, route) {
  const requiredPermissions = getRoutePermissions(route);

  // No permissions required = public route
  if (requiredPermissions.length === 0) {
    return true;
  }

  // Check if user has any of the required permissions
  return roleHasAnyPermission(role, requiredPermissions);
}