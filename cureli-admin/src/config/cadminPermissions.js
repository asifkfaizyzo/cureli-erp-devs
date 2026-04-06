// src/config/cadminPermissions.js

/**
 * ============================================
 * CADMIN PERMISSION CONSTANTS
 * ============================================
 *
 * Roles: SUPER_CADMIN, ANALYST, ACCOUNTANT, SALESMAN
 *
 * Permission Matrix:
 * ┌─────────────────┬──────────────┬─────────┬────────────┬──────────┐
 * │ Feature         │ SUPER_CADMIN │ ANALYST │ ACCOUNTANT │ SALESMAN │
 * ├─────────────────┼──────────────┼─────────┼────────────┼──────────┤
 * │ Dashboard       │ ✅ Full      │ ✅ View │ ✅ Finance │ ✅ View  │
 * │ Shops           │ ✅ Full      │ ✅ View │ ✅ View    │ ✅ Edit  │
 * │ Users           │ ✅ Full      │ ✅ View │ ❌         │ ❌       │
 * │ Subscriptions   │ ✅ Full      │ ✅ View │ ✅ Full    │ ❌       │
 * │ Plans           │ ✅ Full      │ ✅ View │ ✅ Edit    │ ❌       │
 * │ Risk Monitor    │ ✅ Full      │ ✅ View │ ✅ Full    │ ❌       │
 * │ Verifications   │ ✅ Full      │ ❌      │ ❌         │ ✅ Full  │
 * │ Broadcast       │ ✅ Full      │ ✅ Full │ ❌         │ ❌       │
 * │ Enquiries       │ ✅ Full      │ ✅ Full │ ❌         │ ✅ Full  │
 * │ Tickets         │ ✅ Full      │ ✅ View │ ❌         │ ✅ Full  │
 * │ Admin Mgmt      │ ✅ Full      │ ❌      │ ❌         │ ❌       │
 * │ Audit           │ ✅ Full      │ ✅ Full │ ✅ View    │ ❌       │
 * │ Orders          │ ✅ Full      │ ✅ View │ ✅ Full    │ ✅ View  │
 * └─────────────────┴──────────────┴─────────┴────────────┴──────────┘
 */

export const CADMIN_PERMISSIONS = {
  // ============================================
  // DASHBOARD
  // ============================================
  DASHBOARD_VIEW: "dashboard:view",
  DASHBOARD_ANALYTICS: "dashboard:analytics",
  DASHBOARD_FINANCIAL: "dashboard:financial",

  // ============================================
  // SHOPS MANAGEMENT
  // ============================================
  SHOPS_VIEW: "shops:view",
  SHOPS_EDIT: "shops:edit",
  SHOPS_DELETE: "shops:delete",
  SHOPS_VERIFY: "shops:verify",
  SHOPS_SUSPEND: "shops:suspend",

  // ============================================
  // USERS MANAGEMENT
  // ============================================
  USERS_VIEW: "users:view",
  USERS_EDIT: "users:edit",
  USERS_DELETE: "users:delete",
  USERS_BLOCK: "users:block",

  // ============================================
  // SUBSCRIPTIONS
  // ============================================
  SUBSCRIPTIONS_VIEW: "subscriptions:view",
  SUBSCRIPTIONS_MANAGE: "subscriptions:manage",
  SUBSCRIPTIONS_EXTEND: "subscriptions:extend",
  SUBSCRIPTIONS_CANCEL: "subscriptions:cancel",

  // ============================================
  // PLANS
  // ============================================
  PLANS_VIEW: "plans:view",
  PLANS_CREATE: "plans:create",
  PLANS_EDIT: "plans:edit",
  PLANS_DELETE: "plans:delete",

  // ============================================
  // RISK MONITOR
  // ============================================
  RISK_VIEW: "risk:view",
  RISK_ACTION: "risk:action",

  // ============================================
  // VERIFICATIONS
  // ============================================
  VERIFICATIONS_VIEW: "verifications:view",
  VERIFICATIONS_APPROVE: "verifications:approve",
  VERIFICATIONS_REJECT: "verifications:reject",

  // ============================================
  // COMMUNICATIONS - BROADCAST
  // ============================================
  BROADCAST_VIEW: "broadcast:view",
  BROADCAST_CREATE: "broadcast:create",
  BROADCAST_SEND: "broadcast:send",
  BROADCAST_DELETE: "broadcast:delete",

  // ============================================
  // COMMUNICATIONS - ENQUIRIES
  // ============================================
  ENQUIRIES_VIEW: "enquiries:view",
  ENQUIRIES_REPLY: "enquiries:reply",
  ENQUIRIES_CLOSE: "enquiries:close",

  // ============================================
  // COMMUNICATIONS - TICKETS
  // ============================================
  TICKETS_VIEW: "tickets:view",
  TICKETS_REPLY: "tickets:reply",
  TICKETS_CLOSE: "tickets:close",
  TICKETS_ESCALATE: "tickets:escalate",

  // ============================================
  // ADMIN MANAGEMENT
  // ============================================
  ADMINS_VIEW: "admins:view",
  ADMINS_CREATE: "admins:create",
  ADMINS_EDIT: "admins:edit",
  ADMINS_DELETE: "admins:delete",

  // ============================================
  // AUDIT
  // ============================================
  AUDIT_VIEW: "audit:view",
  AUDIT_EXPORT: "audit:export",

  // ============================================
  // ORDERS
  // ============================================
  ORDERS_VIEW: "orders:view",
  ORDERS_MANAGE: "orders:manage",
  ORDERS_REFUND: "orders:refund",

  // ============================================
  // MASTER MEDICINES CATALOG
  // ============================================
  MASTER_MEDICINES_VIEW: "master_medicines:view",
  MASTER_MEDICINES_EDIT: "master_medicines:edit",

  // ============================================
  // NOTIFICATIONS
  // ============================================
  NOTIFICATIONS_VIEW: "notifications:view",
};

/**
 * ============================================
 * ROLE → PERMISSIONS MAPPING
 * ============================================
 */
export const CADMIN_ROLE_PERMISSIONS = {
  // ════════════════════════════════════════════
  // SUPER_CADMIN - Full access to everything
  // ════════════════════════════════════════════
  SUPER_CADMIN: ["*"],

  // ════════════════════════════════════════════
  // ANALYST - Analytics, monitoring, communications
  // Dashboard: View
  // Shops: View
  // Users: View
  // Subscriptions: View
  // Plans: View
  // Risk Monitor: View
  // Verifications: ❌
  // Broadcast: Full
  // Enquiries: Full
  // Tickets: View
  // Admin Mgmt: ❌
  // Audit: Full
  // Orders: View
  // ════════════════════════════════════════════
  ANALYST: [
    // Dashboard (view + analytics)
    CADMIN_PERMISSIONS.DASHBOARD_VIEW,
    CADMIN_PERMISSIONS.DASHBOARD_ANALYTICS,

    // Shops (view only)
    CADMIN_PERMISSIONS.SHOPS_VIEW,

    // Users (view only)
    CADMIN_PERMISSIONS.USERS_VIEW,

    // Subscriptions (view only)
    CADMIN_PERMISSIONS.SUBSCRIPTIONS_VIEW,

    // Plans (view only)
    CADMIN_PERMISSIONS.PLANS_VIEW,

    // Master Medicines (view only)
    CADMIN_PERMISSIONS.MASTER_MEDICINES_VIEW,
    // Risk Monitor (view only)
    CADMIN_PERMISSIONS.RISK_VIEW,

    // Broadcast (full access)
    CADMIN_PERMISSIONS.BROADCAST_VIEW,
    CADMIN_PERMISSIONS.BROADCAST_CREATE,
    CADMIN_PERMISSIONS.BROADCAST_SEND,
    CADMIN_PERMISSIONS.BROADCAST_DELETE,

    // Enquiries (full access)
    CADMIN_PERMISSIONS.ENQUIRIES_VIEW,
    CADMIN_PERMISSIONS.ENQUIRIES_REPLY,
    CADMIN_PERMISSIONS.ENQUIRIES_CLOSE,

    // Tickets (view only)
    CADMIN_PERMISSIONS.TICKETS_VIEW,

    // Audit (full access)
    CADMIN_PERMISSIONS.AUDIT_VIEW,
    CADMIN_PERMISSIONS.AUDIT_EXPORT,

    // Orders (view only)
    CADMIN_PERMISSIONS.ORDERS_VIEW,

    // Notifications
    CADMIN_PERMISSIONS.NOTIFICATIONS_VIEW,
  ],

  // ════════════════════════════════════════════
  // ACCOUNTANT - Finance and subscriptions focus
  // Dashboard: Financial
  // Shops: View
  // Users: ❌
  // Subscriptions: Full
  // Plans: View/Edit
  // Risk Monitor: Full
  // Verifications: ❌
  // Broadcast: ❌
  // Enquiries: ❌
  // Tickets: ❌
  // Admin Mgmt: ❌
  // Audit: View
  // Orders: Full
  // ════════════════════════════════════════════
  ACCOUNTANT: [
    // Dashboard (financial focus)
    CADMIN_PERMISSIONS.DASHBOARD_VIEW,
    CADMIN_PERMISSIONS.DASHBOARD_FINANCIAL,

    // Shops (view only - for financial context)
    CADMIN_PERMISSIONS.SHOPS_VIEW,

    // Subscriptions (full access)
    CADMIN_PERMISSIONS.SUBSCRIPTIONS_VIEW,
    CADMIN_PERMISSIONS.SUBSCRIPTIONS_MANAGE,
    CADMIN_PERMISSIONS.SUBSCRIPTIONS_EXTEND,
    CADMIN_PERMISSIONS.SUBSCRIPTIONS_CANCEL,

    // Plans (view and edit)
    CADMIN_PERMISSIONS.PLANS_VIEW,
    CADMIN_PERMISSIONS.PLANS_EDIT,

    // Risk Monitor (full access)
    CADMIN_PERMISSIONS.RISK_VIEW,
    CADMIN_PERMISSIONS.RISK_ACTION,

    // Orders (full access for payments/refunds)
    CADMIN_PERMISSIONS.ORDERS_VIEW,
    CADMIN_PERMISSIONS.ORDERS_MANAGE,
    CADMIN_PERMISSIONS.ORDERS_REFUND,

    // Audit (view only)
    CADMIN_PERMISSIONS.AUDIT_VIEW,

    // Notifications
    CADMIN_PERMISSIONS.NOTIFICATIONS_VIEW,
  ],

  // ════════════════════════════════════════════
  // SALESMAN - Sales and customer support focus
  // Dashboard: View
  // Shops: View/Edit
  // Users: ❌
  // Subscriptions: ❌
  // Plans: ❌
  // Risk Monitor: ❌
  // Verifications: Full
  // Broadcast: ❌
  // Enquiries: Full
  // Tickets: Full
  // Admin Mgmt: ❌
  // Audit: ❌
  // Orders: View
  // ════════════════════════════════════════════
  SALESMAN: [
    // Dashboard (basic view)
    CADMIN_PERMISSIONS.DASHBOARD_VIEW,

    // Shops (view + edit for onboarding)
    CADMIN_PERMISSIONS.SHOPS_VIEW,
    CADMIN_PERMISSIONS.SHOPS_EDIT,

    // Verifications (full access)
    CADMIN_PERMISSIONS.VERIFICATIONS_VIEW,
    CADMIN_PERMISSIONS.VERIFICATIONS_APPROVE,
    CADMIN_PERMISSIONS.VERIFICATIONS_REJECT,

    // Enquiries (full access)
    CADMIN_PERMISSIONS.ENQUIRIES_VIEW,
    CADMIN_PERMISSIONS.ENQUIRIES_REPLY,
    CADMIN_PERMISSIONS.ENQUIRIES_CLOSE,

    // Tickets (full access)
    CADMIN_PERMISSIONS.TICKETS_VIEW,
    CADMIN_PERMISSIONS.TICKETS_REPLY,
    CADMIN_PERMISSIONS.TICKETS_CLOSE,
    CADMIN_PERMISSIONS.TICKETS_ESCALATE,

    // Orders (view only)
    CADMIN_PERMISSIONS.ORDERS_VIEW,

    // Notifications
    CADMIN_PERMISSIONS.NOTIFICATIONS_VIEW,
  ],
};

/**
 * ============================================
 * HELPER FUNCTIONS
 * ============================================
 */

/**
 * Check if a role has a specific permission
 * @param {string} role - CAdmin role (SUPER_CADMIN, ANALYST, ACCOUNTANT, SALESMAN)
 * @param {string} permission - Permission to check
 * @returns {boolean}
 */
export function cadminRoleHasPermission(role, permission) {
  if (!role) return false;

  const normalizedRole = role.toUpperCase();
  const permissions = CADMIN_ROLE_PERMISSIONS[normalizedRole];

  if (!permissions) {
    return false;
  }

  // Wildcard check (SUPER_CADMIN)
  if (permissions.includes("*")) {
    return true;
  }

  return permissions.includes(permission);
}

/**
 * Check if a role has ANY of the specified permissions
 * @param {string} role - CAdmin role
 * @param {string[]} permissions - Array of permissions to check
 * @returns {boolean}
 */
export function cadminRoleHasAnyPermission(role, permissions) {
  if (!role || !permissions?.length) return false;
  return permissions.some((perm) => cadminRoleHasPermission(role, perm));
}

/**
 * Check if a role has ALL of the specified permissions
 * @param {string} role - CAdmin role
 * @param {string[]} permissions - Array of permissions to check
 * @returns {boolean}
 */
export function cadminRoleHasAllPermissions(role, permissions) {
  if (!role || !permissions?.length) return false;
  return permissions.every((perm) => cadminRoleHasPermission(role, perm));
}

/**
 * Get all permissions for a role
 * @param {string} role - CAdmin role
 * @returns {string[]} Array of permission strings
 */
export function getCAdminPermissionsForRole(role) {
  if (!role) return [];

  const normalizedRole = role.toUpperCase();
  const permissions = CADMIN_ROLE_PERMISSIONS[normalizedRole];

  if (!permissions) {
    return [];
  }

  if (permissions.includes("*")) {
    return Object.values(CADMIN_PERMISSIONS);
  }

  return permissions;
}

/**
 * ============================================
 * ROUTE → PERMISSION MAPPING
 * ============================================
 */
export const CADMIN_ROUTE_PERMISSIONS = {
  // Dashboard
  "/dashboard": [CADMIN_PERMISSIONS.DASHBOARD_VIEW],

  // Shops
  "/shops": [CADMIN_PERMISSIONS.SHOPS_VIEW],

  // Users
  "/users": [CADMIN_PERMISSIONS.USERS_VIEW],

  // Subscriptions
  "/subscriptions": [CADMIN_PERMISSIONS.SUBSCRIPTIONS_VIEW],
  "/subscriptions/plans": [CADMIN_PERMISSIONS.PLANS_VIEW],
  "/risk-monitor": [CADMIN_PERMISSIONS.RISK_VIEW],

  // Verifications
  "/verifications": [CADMIN_PERMISSIONS.VERIFICATIONS_VIEW],

  // Communications
  "/communications": [], // Parent route - no specific permission
  "/communications/broadcast": [CADMIN_PERMISSIONS.BROADCAST_VIEW],
  "/communications/enquiries": [CADMIN_PERMISSIONS.ENQUIRIES_VIEW],
  "/communications/tickets": [CADMIN_PERMISSIONS.TICKETS_VIEW],

  // Admin Management
  "/admins": [CADMIN_PERMISSIONS.ADMINS_VIEW],

  // Audit
  "/audit": [CADMIN_PERMISSIONS.AUDIT_VIEW],

  // Orders
  "/orders": [CADMIN_PERMISSIONS.ORDERS_VIEW],

  // Notifications
  "/notifications": [CADMIN_PERMISSIONS.NOTIFICATIONS_VIEW],
};

/**
 * Get required permissions for a route
 * @param {string} route - Route path
 * @returns {string[]} Required permissions
 */
export function getCAdminRoutePermissions(route) {
  return CADMIN_ROUTE_PERMISSIONS[route] || [];
}

/**
 * Check if a role can access a specific route
 * @param {string} role - CAdmin role
 * @param {string} route - Route path
 * @returns {boolean}
 */
export function canAccessCAdminRoute(role, route) {
  const requiredPermissions = getCAdminRoutePermissions(route);

  // No permissions required = accessible to all authenticated admins
  if (requiredPermissions.length === 0) {
    return true;
  }

  return cadminRoleHasAnyPermission(role, requiredPermissions);
}

/**
 * ============================================
 * ROLE DISPLAY HELPERS
 * ============================================
 */

export const CADMIN_ROLE_LABELS = {
  SUPER_CADMIN: "Super Admin",
  ANALYST: "Analyst",
  ACCOUNTANT: "Accountant",
  SALESMAN: "Salesman",
};

export const CADMIN_ROLE_COLORS = {
  SUPER_CADMIN: {
    bg: "bg-purple-100",
    text: "text-purple-700",
    dot: "bg-purple-500",
  },
  ANALYST: { bg: "bg-blue-100", text: "text-blue-700", dot: "bg-blue-500" },
  ACCOUNTANT: {
    bg: "bg-green-100",
    text: "text-green-700",
    dot: "bg-green-500",
  },
  SALESMAN: {
    bg: "bg-orange-100",
    text: "text-orange-700",
    dot: "bg-orange-500",
  },
};

export function getCAdminRoleLabel(role) {
  return CADMIN_ROLE_LABELS[role?.toUpperCase()] || role;
}

export function getCAdminRoleColor(role) {
  return CADMIN_ROLE_COLORS[role?.toUpperCase()] || CADMIN_ROLE_COLORS.SALESMAN;
}
