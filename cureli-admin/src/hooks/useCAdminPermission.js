// frontend/src/hooks/useCAdminPermission.js

import { useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { CADMIN_PERMISSIONS } from "../config/cadminPermissions";

/**
 * =============================================================================
 * useCAdminPermission
 * =============================================================================
 *
 * Reads the admin's permission state from AuthContext and exposes
 * clean helper functions for components to use.
 *
 * SOURCE OF TRUTH:
 * - admin.is_super_cadmin → if true, all permission checks return true
 * - admin.permissions[]   → flat array of permission strings from backend
 *
 * These come from GET /cadmin/me which is called on mount in AuthContext.
 *
 * USAGE:
 * const { hasPermission, isSuperCAdmin } = useCAdminPermission();
 * if (hasPermission(CADMIN_PERMISSIONS.SHOPS_EDIT)) { ... }
 * =============================================================================
 */
export function useCAdminPermission() {
  const { admin } = useAuth();

  return useMemo(() => {
    const isSuperCAdmin = admin?.is_super_cadmin === true;
    const permissions   = admin?.permissions ?? []; // string[]
    const primary_role  = admin?.primary_role ?? null;

    return {
      /**
       * Check if the admin has a specific permission string.
       * SUPER_CADMIN always returns true.
       * @param {string} permission - e.g. CADMIN_PERMISSIONS.SHOPS_VIEW
       */
      hasPermission: (permission) => {
        if (!admin)        return false;
        if (isSuperCAdmin) return true;
        return permissions.includes(permission);
      },

      /**
       * Check if the admin has ANY of the provided permissions.
       * SUPER_CADMIN always returns true.
       * @param {...string} perms
       */
      hasAnyPermission: (...perms) => {
        if (!admin)        return false;
        if (isSuperCAdmin) return true;
        return perms.some((p) => permissions.includes(p));
      },

      /**
       * Check if the admin has ALL of the provided permissions.
       * SUPER_CADMIN always returns true.
       * @param {...string} perms
       */
      hasAllPermissions: (...perms) => {
        if (!admin)        return false;
        if (isSuperCAdmin) return true;
        return perms.every((p) => permissions.includes(p));
      },

      // ── Identity helpers ────────────────────────────────────────────────
      isSuperCAdmin,
      primary_role,
      permissions, // raw array — use hasPermission() instead where possible

      // ── Convenience checks ──────────────────────────────────────────────
      canManageAdmins: isSuperCAdmin,

      canManageFinance:
        isSuperCAdmin ||
        [
          CADMIN_PERMISSIONS.SUBSCRIPTIONS_EXTEND_GRACE,
          CADMIN_PERMISSIONS.SUBSCRIPTIONS_FORCE_SUSPEND,
          CADMIN_PERMISSIONS.SUBSCRIPTIONS_REACTIVATE,
          CADMIN_PERMISSIONS.PLANS_CREATE,
          CADMIN_PERMISSIONS.PLANS_EDIT,
        ].some((p) => permissions.includes(p)),

      canHandleCommunications:
        isSuperCAdmin ||
        [
          CADMIN_PERMISSIONS.TICKETS_VIEW,
          CADMIN_PERMISSIONS.TICKETS_UPDATE_STATUS,
          CADMIN_PERMISSIONS.ENQUIRIES_VIEW,
          CADMIN_PERMISSIONS.ENQUIRIES_REPLY,
          CADMIN_PERMISSIONS.BROADCAST_EMAIL_SEND,
          CADMIN_PERMISSIONS.BROADCAST_INAPP_SEND,
        ].some((p) => permissions.includes(p)),
    };
  }, [admin]);
}

/**
 * =============================================================================
 * useCAdminMenuPermissions
 * =============================================================================
 *
 * Returns sidebar visibility state for each menu item.
 * Each entry: { visible: boolean, disabled: boolean }
 *
 * visible  = whether to show the menu item at all
 * disabled = whether to grey it out (currently unused but kept for future use)
 *
 * Rule: if the admin has no permission for a section, hide it entirely.
 * SUPER_CADMIN sees everything.
 * =============================================================================
 */
export function useCAdminMenuPermissions() {
  const { hasPermission, hasAnyPermission, isSuperCAdmin } =
    useCAdminPermission();

  return useMemo(() => {
    const show = (permission) => ({
      visible:  hasPermission(permission),
      disabled: false,
    });

    const showAny = (...perms) => ({
      visible:  hasAnyPermission(...perms),
      disabled: false,
    });

    return {
      // ── Top-level items ────────────────────────────────────────────────
      dashboard: show(CADMIN_PERMISSIONS.DASHBOARD_VIEW),

      shops: show(CADMIN_PERMISSIONS.SHOPS_VIEW),

      users: show(CADMIN_PERMISSIONS.USERS_VIEW),

      // ── Subscriptions parent + children ───────────────────────────────
      subscriptions: showAny(
        CADMIN_PERMISSIONS.SUBSCRIPTIONS_VIEW_AT_RISK,
        CADMIN_PERMISSIONS.SUBSCRIPTIONS_VIEW_DETAIL,
        CADMIN_PERMISSIONS.PLANS_VIEW,
      ),
      subscriptionsList: show(CADMIN_PERMISSIONS.SUBSCRIPTIONS_VIEW_AT_RISK),
      plans:             show(CADMIN_PERMISSIONS.PLANS_VIEW),
      riskMonitor:       show(CADMIN_PERMISSIONS.SUBSCRIPTIONS_VIEW_AT_RISK),

      // ── Verifications ─────────────────────────────────────────────────
      verifications: show(CADMIN_PERMISSIONS.DOCUMENTS_VIEW),

      // ── Communications parent + children ──────────────────────────────
      // Parent is visible if ANY child section is accessible
      communications: showAny(
        CADMIN_PERMISSIONS.TICKETS_VIEW,
        CADMIN_PERMISSIONS.ENQUIRIES_VIEW,
        CADMIN_PERMISSIONS.BROADCAST_EMAIL_SEND,
        CADMIN_PERMISSIONS.BROADCAST_EMAIL_VIEW_HISTORY,
        CADMIN_PERMISSIONS.BROADCAST_EMAIL_MANAGE_DRAFTS,
        CADMIN_PERMISSIONS.BROADCAST_EMAIL_SCHEDULE,
        CADMIN_PERMISSIONS.BROADCAST_INAPP_SEND,
        CADMIN_PERMISSIONS.BROADCAST_INAPP_VIEW_HISTORY,
        CADMIN_PERMISSIONS.BROADCAST_INAPP_MANAGE_DRAFTS,
        CADMIN_PERMISSIONS.BROADCAST_INAPP_SCHEDULE,
      ),

      // Tickets
      tickets: show(CADMIN_PERMISSIONS.TICKETS_VIEW),

      // Enquiries — visible if admin can at minimum list enquiries
      enquiries: show(CADMIN_PERMISSIONS.ENQUIRIES_VIEW),

      // Broadcast parent — visible if admin has any broadcast permission
      broadcast: showAny(
        CADMIN_PERMISSIONS.BROADCAST_EMAIL_SEND,
        CADMIN_PERMISSIONS.BROADCAST_EMAIL_VIEW_HISTORY,
        CADMIN_PERMISSIONS.BROADCAST_EMAIL_MANAGE_DRAFTS,
        CADMIN_PERMISSIONS.BROADCAST_EMAIL_SCHEDULE,
        CADMIN_PERMISSIONS.BROADCAST_INAPP_SEND,
        CADMIN_PERMISSIONS.BROADCAST_INAPP_VIEW_HISTORY,
        CADMIN_PERMISSIONS.BROADCAST_INAPP_MANAGE_DRAFTS,
        CADMIN_PERMISSIONS.BROADCAST_INAPP_SCHEDULE,
      ),

      // Broadcast children
      broadcastEmail: showAny(
        CADMIN_PERMISSIONS.BROADCAST_EMAIL_SEND,
        CADMIN_PERMISSIONS.BROADCAST_EMAIL_VIEW_HISTORY,
        CADMIN_PERMISSIONS.BROADCAST_EMAIL_MANAGE_DRAFTS,
        CADMIN_PERMISSIONS.BROADCAST_EMAIL_SCHEDULE,
      ),
      broadcastInApp: showAny(
        CADMIN_PERMISSIONS.BROADCAST_INAPP_SEND,
        CADMIN_PERMISSIONS.BROADCAST_INAPP_VIEW_HISTORY,
        CADMIN_PERMISSIONS.BROADCAST_INAPP_MANAGE_DRAFTS,
        CADMIN_PERMISSIONS.BROADCAST_INAPP_SCHEDULE,
      ),

      // ── Admin management ───────────────────────────────────────────────
      admins: show(CADMIN_PERMISSIONS.ADMINS_VIEW),

      // ── Audit ─────────────────────────────────────────────────────────
      audit: show(CADMIN_PERMISSIONS.AUDIT_VIEW),

      // ── Master medicines ──────────────────────────────────────────────
      masterMedicines: show(CADMIN_PERMISSIONS.MASTER_MEDICINES_VIEW),

      // ── Always visible to all authenticated admins ─────────────────────
      notifications: { visible: true, disabled: false },
      settings:      show(CADMIN_PERMISSIONS.SETTINGS_VIEW),
    };
  }, [hasPermission, hasAnyPermission, isSuperCAdmin]);
}

export default useCAdminPermission;