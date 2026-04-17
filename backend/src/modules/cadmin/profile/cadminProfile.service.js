// backend/src/modules/cadmin/profile/cadminProfile.service.js

import prisma from "../../../config/prisma.js";

// ─────────────────────────────────────────────────────────────────────────────
// GET MY PROFILE
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Returns the full profile shape the frontend needs to:
 * 1. Display the admin's identity (name, username, email, phone)
 * 2. Know if they are a super admin (is_super_cadmin)
 * 3. Load their effective permissions[] into AuthContext
 * 4. Show their primary role label in the navbar
 * 5. Show pending action counts for dashboard badges
 *
 * Shape returned:
 * {
 *   profile: {
 *     id, name, username, email, phone,
 *     is_super_cadmin,
 *     primary_role,        ← display label (e.g. "Operations")
 *     roles[],             ← all assigned roles with is_primary flag
 *     permissions[],       ← flat union of all role permissions
 *                            empty array if is_super_cadmin (frontend checks flag instead)
 *     isActive,
 *     lastLogin,
 *     createdAt,
 *   },
 *   pendingCounts: { ... }
 * }
 */
export async function getMyProfileService(cadminId) {
  const cadmin = await prisma.cAdmin.findUnique({
    where: { cadmin_id: cadminId },
    select: {
      cadmin_id:       true,
      name:            true,
      username:        true,
      email:           true,
      phone_number:    true,
      is_active:       true,
      is_super_cadmin: true,
      last_login_at:   true,
      created_at:      true,
      roleAssignments: {
        where: {
          role: { is_deleted: false },
        },
        select: {
          is_primary: true,
          role: {
            select: {
              role_id:     true,
              name:        true,
              permissions: true,
            },
          },
        },
        orderBy: { assigned_at: "desc" },
      },
    },
  });

  if (!cadmin) {
    const err = new Error("Admin not found");
    err.status = 404;
    throw err;
  }

  // ── Compute effective permissions ─────────────────────────────────────────
  // SUPER_CADMIN: return empty array — frontend uses is_super_cadmin flag
  // to bypass all permission checks, so the array is never read
  let permissions = [];

  if (!cadmin.is_super_cadmin) {
    const permissionSet = new Set();
    for (const assignment of cadmin.roleAssignments) {
      for (const perm of assignment.role.permissions) {
        permissionSet.add(perm);
      }
    }
    permissions = Array.from(permissionSet);
  }

  // ── Derive primary role label ─────────────────────────────────────────────
  let primary_role = "Super Admin";

  if (!cadmin.is_super_cadmin) {
    const primaryAssignment = cadmin.roleAssignments.find((a) => a.is_primary);
    if (primaryAssignment) {
      primary_role = primaryAssignment.role.name;
    } else if (cadmin.roleAssignments.length > 0) {
      primary_role = cadmin.roleAssignments[0].role.name;
    } else {
      primary_role = "No Role";
    }
  }

  // ── Build roles list ──────────────────────────────────────────────────────
  const roles = cadmin.roleAssignments.map((a) => ({
    role_id:    a.role.role_id,
    name:       a.role.name,
    is_primary: a.is_primary,
  }));

  // ── Pending counts ────────────────────────────────────────────────────────
  const pendingCounts = await getPendingCountsService();

  return {
    profile: {
      id:              cadmin.cadmin_id,
      name:            cadmin.name,
      username:        cadmin.username,
      email:           cadmin.email,
      phone:           cadmin.phone_number,
      is_super_cadmin: cadmin.is_super_cadmin,
      primary_role,
      roles,
      permissions,
      isActive:        cadmin.is_active,
      lastLogin:       cadmin.last_login_at,
      createdAt:       cadmin.created_at,
    },
    pendingCounts,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// GET PENDING COUNTS
// ─────────────────────────────────────────────────────────────────────────────

export async function getPendingCountsService() {
  const now             = new Date();
  const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [
    pendingDocuments,
    rejectedDocuments,
    expiringSubscriptions,
    pendingShops,
    overduePayments,
  ] = await Promise.all([
    prisma.shopFile.count({ where: { status: "uploaded" } }),
    prisma.shopFile.count({ where: { status: "rejected" } }),
    prisma.shopSubscription.count({
      where: {
        is_active: true,
        end_date:  { gte: now, lte: sevenDaysFromNow },
      },
    }),
    prisma.shop.count({ where: { verification_status: "pending_review" } }),
    prisma.paymentTransaction.count({
      where: { status: { in: ["failed", "pending"] } },
    }),
  ]);

  const totalPending =
    pendingDocuments + expiringSubscriptions + pendingShops + overduePayments;

  return {
    total: totalPending,
    documents: {
      pending:  pendingDocuments,
      rejected: rejectedDocuments,
      total:    pendingDocuments + rejectedDocuments,
    },
    subscriptions: { expiringSoon: expiringSubscriptions },
    shops:         { pendingVerification: pendingShops },
    payments:      { overdue: overduePayments },
  };
}