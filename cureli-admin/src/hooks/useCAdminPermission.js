// src/hooks/useCAdminPermission.js

import { useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import {
  cadminRoleHasPermission,
  cadminRoleHasAnyPermission,
  CADMIN_PERMISSIONS,
} from "../config/cadminPermissions";

/**
 * ============================================
 * USE CADMIN PERMISSION HOOK
 * ============================================
 */
export function useCAdminPermission() {
  const { admin } = useAuth();

  const helpers = useMemo(() => {
    const role = admin?.role?.toUpperCase();

    return {
      /**
       * Check if admin has a specific permission
       */
      hasPermission: (permission) => {
        if (!role) return false;
        return cadminRoleHasPermission(role, permission);
      },

      /**
       * Check if admin has ANY of the specified permissions
       */
      hasAnyPermission: (...perms) => {
        if (!role) return false;
        return cadminRoleHasAnyPermission(role, perms);
      },

      /**
       * Check if admin has a specific role
       */
      hasRole: (...roles) => {
        if (!role) return false;
        return roles.map((r) => r.toUpperCase()).includes(role);
      },

      /**
       * Role checks
       */
      isSuperCAdmin: role === "SUPER_CADMIN",
      isAnalyst: role === "ANALYST",
      isAccountant: role === "ACCOUNTANT",
      isSalesman: role === "SALESMAN",

      /**
       * Get current admin's role
       */
      role,

      /**
       * Check if admin can manage other admins
       */
      canManageAdmins: role === "SUPER_CADMIN",

      /**
       * Check if admin can manage financial operations
       */
      canManageFinance: cadminRoleHasAnyPermission(role, [
        CADMIN_PERMISSIONS.SUBSCRIPTIONS_MANAGE,
        CADMIN_PERMISSIONS.ORDERS_REFUND,
        CADMIN_PERMISSIONS.DASHBOARD_FINANCIAL,
      ]),

      /**
       * Check if admin can handle communications
       */
      canHandleCommunications: cadminRoleHasAnyPermission(role, [
        CADMIN_PERMISSIONS.BROADCAST_VIEW,
        CADMIN_PERMISSIONS.ENQUIRIES_VIEW,
        CADMIN_PERMISSIONS.TICKETS_VIEW,
      ]),
    };
  }, [admin]);

  return helpers;
}

/**
 * ============================================
 * USE CADMIN MENU PERMISSIONS HOOK
 * ============================================
 * 
 * Returns visibility/disabled state for sidebar menu items.
 * 
 * Permission Matrix Reference:
 * ┌─────────────────┬──────────────┬─────────┬────────────┬──────────┐
 * │ Feature         │ SUPER_CADMIN │ ANALYST │ ACCOUNTANT │ SALESMAN │
 * ├─────────────────┼──────────────┼─────────┼────────────┼──────────┤
 * │ Dashboard       │ ✅           │ ✅      │ ✅         │ ✅       │
 * │ Shops           │ ✅           │ ✅      │ ✅         │ ✅       │
 * │ Users           │ ✅           │ ✅      │ ❌         │ ❌       │
 * │ Subscriptions   │ ✅           │ ✅      │ ✅         │ ❌       │
 * │ Plans           │ ✅           │ ✅      │ ✅         │ ❌       │
 * │ Risk Monitor    │ ✅           │ ✅      │ ✅         │ ❌       │
 * │ Verifications   │ ✅           │ ❌      │ ❌         │ ✅       │
 * │ Broadcast       │ ✅           │ ✅      │ ❌         │ ❌       │
 * │ Enquiries       │ ✅           │ ✅      │ ❌         │ ✅       │
 * │ Tickets         │ ✅           │ ✅      │ ❌         │ ✅       │
 * │ Admin Mgmt      │ ✅           │ ❌      │ ❌         │ ❌       │
 * │ Audit           │ ✅           │ ✅      │ ✅         │ ❌       │
 * │ Orders          │ ✅           │ ✅      │ ✅         │ ✅       │
 * └─────────────────┴──────────────┴─────────┴────────────┴──────────┘
 */
export function useCAdminMenuPermissions() {
  const { hasPermission, isSuperCAdmin } = useCAdminPermission();

  return useMemo(() => ({
    // ════════════════════════════════════════════════════════════
    // DASHBOARD - All roles can view
    // ════════════════════════════════════════════════════════════
    dashboard: {
      visible: true,
      disabled: !hasPermission(CADMIN_PERMISSIONS.DASHBOARD_VIEW),
    },

    // ════════════════════════════════════════════════════════════
    // SHOPS - All roles can view
    // ════════════════════════════════════════════════════════════
    shops: {
      visible: hasPermission(CADMIN_PERMISSIONS.SHOPS_VIEW),
      disabled: !hasPermission(CADMIN_PERMISSIONS.SHOPS_VIEW),
    },

    // ════════════════════════════════════════════════════════════
    // USERS - SUPER_CADMIN and ANALYST only
    // ════════════════════════════════════════════════════════════
    users: {
      visible: hasPermission(CADMIN_PERMISSIONS.USERS_VIEW),
      disabled: !hasPermission(CADMIN_PERMISSIONS.USERS_VIEW),
    },

    // ════════════════════════════════════════════════════════════
    // SUBSCRIPTIONS (Parent) - SUPER_CADMIN, ANALYST, ACCOUNTANT
    // ════════════════════════════════════════════════════════════
    subscriptions: {
      visible:
        hasPermission(CADMIN_PERMISSIONS.SUBSCRIPTIONS_VIEW) ||
        hasPermission(CADMIN_PERMISSIONS.PLANS_VIEW) ||
        hasPermission(CADMIN_PERMISSIONS.RISK_VIEW),
      disabled: false,
    },

    // Subscriptions submenu
    subscriptionsList: {
      visible: hasPermission(CADMIN_PERMISSIONS.SUBSCRIPTIONS_VIEW),
      disabled: !hasPermission(CADMIN_PERMISSIONS.SUBSCRIPTIONS_VIEW),
    },
    plans: {
      visible: hasPermission(CADMIN_PERMISSIONS.PLANS_VIEW),
      disabled: !hasPermission(CADMIN_PERMISSIONS.PLANS_VIEW),
    },
    riskMonitor: {
      visible: hasPermission(CADMIN_PERMISSIONS.RISK_VIEW),
      disabled: !hasPermission(CADMIN_PERMISSIONS.RISK_VIEW),
    },

    // ════════════════════════════════════════════════════════════
    // VERIFICATIONS - SUPER_CADMIN and SALESMAN only
    // ════════════════════════════════════════════════════════════
    verifications: {
      visible: hasPermission(CADMIN_PERMISSIONS.VERIFICATIONS_VIEW),
      disabled: !hasPermission(CADMIN_PERMISSIONS.VERIFICATIONS_VIEW),
    },

    // ════════════════════════════════════════════════════════════
    // COMMUNICATIONS (Parent) - Based on submenu visibility
    // ════════════════════════════════════════════════════════════
    communications: {
      visible:
        hasPermission(CADMIN_PERMISSIONS.BROADCAST_VIEW) ||
        hasPermission(CADMIN_PERMISSIONS.ENQUIRIES_VIEW) ||
        hasPermission(CADMIN_PERMISSIONS.TICKETS_VIEW),
      disabled: false,
    },

    // Broadcast - SUPER_CADMIN and ANALYST
    broadcast: {
      visible: hasPermission(CADMIN_PERMISSIONS.BROADCAST_VIEW),
      disabled: !hasPermission(CADMIN_PERMISSIONS.BROADCAST_VIEW),
    },

    // Enquiries - SUPER_CADMIN, ANALYST, SALESMAN
    enquiries: {
      visible: hasPermission(CADMIN_PERMISSIONS.ENQUIRIES_VIEW),
      disabled: !hasPermission(CADMIN_PERMISSIONS.ENQUIRIES_VIEW),
    },

    // Tickets - SUPER_CADMIN, ANALYST (view), SALESMAN (full)
    tickets: {
      visible: hasPermission(CADMIN_PERMISSIONS.TICKETS_VIEW),
      disabled: !hasPermission(CADMIN_PERMISSIONS.TICKETS_VIEW),
    },

    // ════════════════════════════════════════════════════════════
    // ADMIN MANAGEMENT - SUPER_CADMIN only
    // ════════════════════════════════════════════════════════════
    admins: {
      visible: isSuperCAdmin,
      disabled: !isSuperCAdmin,
    },

    // ════════════════════════════════════════════════════════════
    // AUDIT - SUPER_CADMIN, ANALYST, ACCOUNTANT
    // ════════════════════════════════════════════════════════════
    audit: {
      visible: hasPermission(CADMIN_PERMISSIONS.AUDIT_VIEW),
      disabled: !hasPermission(CADMIN_PERMISSIONS.AUDIT_VIEW),
    },

    // ════════════════════════════════════════════════════════════
    // ORDERS - All roles can view
    // ════════════════════════════════════════════════════════════
    orders: {
      visible: hasPermission(CADMIN_PERMISSIONS.ORDERS_VIEW),
      disabled: !hasPermission(CADMIN_PERMISSIONS.ORDERS_VIEW),
    },

    // ════════════════════════════════════════════════════════════
    // NOTIFICATIONS - All roles
    // ════════════════════════════════════════════════════════════
    notifications: {
      visible: hasPermission(CADMIN_PERMISSIONS.NOTIFICATIONS_VIEW),
      disabled: !hasPermission(CADMIN_PERMISSIONS.NOTIFICATIONS_VIEW),
    },
  }), [hasPermission, isSuperCAdmin]);
}

export default useCAdminPermission;