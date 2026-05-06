// backend/src/middleware/requireCAdmin.js

import jwt from "jsonwebtoken";
import { ADMIN_ACCESS_SECRET } from "../config/cadmin_jwt.js";
import { fail } from "../utils/response.js";
import prisma from "../config/prisma.js";

/**
 * =============================================================================
 * CADMIN AUTHENTICATION + PERMISSION LOADER MIDDLEWARE
 * =============================================================================
 *
 * This middleware does THREE things in sequence:
 *
 * 1. AUTHENTICATE — Validates the JWT Bearer token
 *
 * 2. LOAD FROM DB — Fetches the CAdmin record to get:
 *    - is_active (if account was deactivated after token was issued)
 *    - is_super_cadmin (determines if permission checks are bypassed)
 *    - All role assignments + their permissions (for non-super admins)
 *
 * 3. COMPUTE PERMISSIONS — Builds a flat array of effective permissions
 *    by taking the union of all assigned roles' permissions
 *    (only for non-super admins — super admins bypass all permission checks)
 *
 * After this middleware, req.cadmin is available to all downstream handlers:
 * {
 *   cadmin_id:      string   — UUID of the admin
 *   username:       string   — username
 *   is_super_cadmin:boolean  — if true, all permission checks are bypassed
 *   permissions:    string[] — effective permission strings (union of all roles)
 *                              empty array if is_super_cadmin = true (not needed)
 * }
 *
 * PERFORMANCE NOTE:
 * This makes one DB query per request (with a join to role assignments).
 * This is intentional — it ensures deactivated accounts and permission changes
 * take effect immediately without requiring token re-issue.
 * If this becomes a bottleneck at scale, add Redis caching per cadmin_id
 * with a short TTL (e.g. 60 seconds) and invalidate on role change.
 * =============================================================================
 */

export const requireCAdmin = async (req, res, next) => {
  // ─────────────────────────────────────────────────────────────────────────
  // STEP 1: Validate JWT
  // ─────────────────────────────────────────────────────────────────────────
  const auth = req.headers.authorization;

  if (!auth || !auth.startsWith("Bearer ")) {
    return fail(res, "Missing authorization", 401);
  }

  const token = auth.split(" ")[1];

  let payload;
  try {
    payload = jwt.verify(token, ADMIN_ACCESS_SECRET);
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return fail(res, "Token expired", 401, { code: "TOKEN_EXPIRED" });
    }
    return fail(res, "Invalid or expired token", 401);
  }

  const { cadmin_id, username } = payload;

  if (!cadmin_id) {
    return fail(res, "Invalid token payload", 401);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 2: Load CAdmin from DB
  // Single query — fetches admin + all active role assignments + permissions
  // ─────────────────────────────────────────────────────────────────────────
  let cadmin;
  try {
    cadmin = await prisma.cAdmin.findUnique({
      where: { cadmin_id },
      select: {
        cadmin_id:       true,
        username:        true,
        is_active:       true,
        is_super_cadmin: true,
        roleAssignments: {
          select: {
            is_primary: true,
            role: {
              select: {
                role_id:     true,
                name:        true,
                permissions: true, // String[]
                is_deleted:  true,
              },
            },
          },
        },
      },
    });
  } catch (err) {
    console.error("requireCAdmin: DB error loading admin:", err);
    return fail(res, "Internal server error", 500);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 3: Validate account exists and is active
  // ─────────────────────────────────────────────────────────────────────────
  if (!cadmin) {
    return fail(res, "Admin account not found", 401);
  }

  if (!cadmin.is_active) {
    return fail(res, "Account has been deactivated", 403, {
      code: "ACCOUNT_DEACTIVATED",
    });
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 4: Compute effective permissions
  //
  // SUPER_CADMIN: skip permission computation entirely
  //               downstream requireCAdminPermission will bypass checks
  //
  // Others: union of permissions from all assigned roles
  //         exclude soft-deleted roles (is_deleted = true)
  // ─────────────────────────────────────────────────────────────────────────
  let effectivePermissions = [];

  if (!cadmin.is_super_cadmin) {
    const permissionSet = new Set();

    for (const assignment of cadmin.roleAssignments) {
      // Skip soft-deleted roles — they no longer grant permissions
      if (assignment.role.is_deleted) continue;

      for (const permission of assignment.role.permissions) {
        permissionSet.add(permission);
      }
    }

    effectivePermissions = Array.from(permissionSet);
  }

  // ─────────────────────────────────────────────────────────────────────────
  // STEP 5: Attach to request
  // All downstream middleware and controllers use req.cadmin
  // ─────────────────────────────────────────────────────────────────────────
  req.cadmin = {
    cadmin_id:       cadmin.cadmin_id,
    username:        cadmin.username,
    is_super_cadmin: cadmin.is_super_cadmin,
    permissions:     effectivePermissions,
  };

  return next();
};