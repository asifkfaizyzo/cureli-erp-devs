// backend/src/modules/cadmin/admins/cadminAdmin.service.js

import prisma from "../../../config/prisma.js";
import { hashPassword } from "../../../utils/hash.js";
import * as audit from "../../audit/index.js";

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function createError(message, status = 400) {
  const err = new Error(message);
  err.status = status;
  return err;
}

function formatStatus(isActive) {
  return isActive ? "Active" : "Inactive";
}

function formatDateTime(dt) {
  if (!dt) return "Never";
  const d       = new Date(dt);
  const day     = String(d.getDate()).padStart(2, "0");
  const month   = String(d.getMonth() + 1).padStart(2, "0");
  const year    = d.getFullYear();
  let hours     = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const ampm    = hours >= 12 ? "PM" : "AM";
  hours         = hours % 12 || 12;
  return `${day}/${month}/${year} ${hours}:${minutes} ${ampm}`;
}

function formatDate(dt) {
  if (!dt) return "";
  const d     = new Date(dt);
  const day   = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year  = d.getFullYear();
  return `${day}/${month}/${year}`;
}

/**
 * Derive a display label for an admin from their role assignments.
 * Returns the primary role name if set, otherwise the first assigned role,
 * or "Super Admin" for is_super_cadmin, or "No Role" if nothing assigned.
 */
function deriveDisplayRole(admin) {
  if (admin.is_super_cadmin) return "Super Admin";

  const assignments = admin.roleAssignments ?? [];
  if (assignments.length === 0) return "No Role";

  const primary = assignments.find((a) => a.is_primary && !a.role.is_deleted);
  if (primary) return primary.role.name;

  const first = assignments.find((a) => !a.role.is_deleted);
  return first ? first.role.name : "No Role";
}

// ─────────────────────────────────────────────────────────────────────────────
// STANDARD ADMIN SELECT — used across list + detail queries
// ─────────────────────────────────────────────────────────────────────────────

const ADMIN_BASE_SELECT = {
  cadmin_id:       true,
  name:            true,
  username:        true,
  phone_number:    true,
  email:           true,
  is_active:       true,
  is_super_cadmin: true,
  last_login_at:   true,
  created_at:      true,
  updated_at:      true,
  roleAssignments: {
    where: { role: { is_deleted: false } },
    select: {
      is_primary: true,
      assigned_at: true,
      role: {
        select: {
          role_id:    true,
          name:       true,
          is_deleted: true,
        },
      },
    },
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// SERVICES
// ─────────────────────────────────────────────────────────────────────────────

export async function getAdminsService(query) {
  const { page, limit, search, status, role, sort, order } = query;
  const skip = (page - 1) * limit;

  const where = {};

  if (status === "active")   where.is_active = true;
  if (status === "inactive") where.is_active = false;

  // Role filter: match by role name in assignments or is_super_cadmin
  if (role) {
    const normalized = role.toLowerCase().replace(/\s+/g, "_");
    if (normalized === "super_cadmin" || normalized === "super_admin") {
      where.is_super_cadmin = true;
    } else {
      where.roleAssignments = {
        some: {
          role: {
            name:       { contains: role, mode: "insensitive" },
            is_deleted: false,
          },
        },
      };
    }
  }

  if (search) {
    where.OR = [
      { name:     { contains: search, mode: "insensitive" } },
      { username: { contains: search, mode: "insensitive" } },
      { email:    { contains: search, mode: "insensitive" } },
    ];
  }

  // Sort — role sorting is no longer a DB-level sort (it's derived from relations)
  // Fall back to created_at for role sort
  const SORT_MAP = {
    name:          "name",
    username:      "username",
    last_login_at: "last_login_at",
    created_at:    "created_at",
  };
  const sortField = SORT_MAP[sort] ?? "created_at";
  const orderBy   = { [sortField]: order ?? "desc" };

  const [total, admins] = await Promise.all([
    prisma.cAdmin.count({ where }),
    prisma.cAdmin.findMany({
      where,
      orderBy,
      skip,
      take:   limit,
      select: ADMIN_BASE_SELECT,
    }),
  ]);

  const totalPages = Math.max(Math.ceil(total / limit), 1);

  const data = admins.map((a) => ({
    id:          a.cadmin_id,
    name:        a.name,
    username:    a.username,
    phone:       a.phone_number,
    email:       a.email || "",
    role:        deriveDisplayRole(a),           // display label from assignments
    roles:       a.roleAssignments.map((r) => ({ // full list for detail view
      role_id:    r.role.role_id,
      name:       r.role.name,
      is_primary: r.is_primary,
    })),
    is_super_cadmin: a.is_super_cadmin,
    status:      formatStatus(a.is_active),
    lastLogin:   formatDateTime(a.last_login_at),
    createdAt:   formatDate(a.created_at),
  }));

  return {
    admins: data,
    meta: { total, page, limit, totalPages },
  };
}

export async function getAdminByIdService(id) {
  const admin = await prisma.cAdmin.findUnique({
    where:   { cadmin_id: id },
    select:  {
      ...ADMIN_BASE_SELECT,
      activityLogs: {
        orderBy: { created_at: "desc" },
        take:    50,
      },
    },
  });

  if (!admin) throw createError("Admin not found", 404);

  return {
    id:              admin.cadmin_id,
    name:            admin.name,
    username:        admin.username,
    phone:           admin.phone_number,
    email:           admin.email || "",
    role:            deriveDisplayRole(admin),
    roles:           admin.roleAssignments.map((r) => ({
      role_id:     r.role.role_id,
      name:        r.role.name,
      is_primary:  r.is_primary,
      assigned_at: r.assigned_at,
    })),
    is_super_cadmin: admin.is_super_cadmin,
    status:          formatStatus(admin.is_active),
    isActive:        admin.is_active,
    lastLogin:       formatDateTime(admin.last_login_at),
    createdAt:       formatDate(admin.created_at),
    updatedAt:       formatDate(admin.updated_at),
    activityLogs:    admin.activityLogs.map((log) => ({
      id:          log.id,
      action:      log.action,
      description: log.description,
      changes:     log.changes,
      meta:        log.meta,
      ipAddress:   log.ip_address,
      userAgent:   log.user_agent,
      createdAt:   log.created_at,
    })),
  };
}

/**
 * Create a new CAdmin account.
 *
 * Role assignment is SEPARATE — after creation, use PUT /admins/:id/roles
 * to assign roles. This keeps the create flow simple and consistent
 * with how the Roles tab works.
 *
 * Exception: if role_ids + primary_role_id are provided in the creation payload,
 * we assign them inline within the same transaction for UX convenience.
 */
export async function createAdminService(data, auditContext = {}) {
  const {
    name, username, phone, email, password, status,
    role_ids, primary_role_id,   // optional — assign roles at creation time
  } = data;

  // ── Uniqueness checks ──────────────────────────────────────────────────────
  const existingUsername = await prisma.cAdmin.findFirst({
    where: { username: { equals: username, mode: "insensitive" } },
  });
  if (existingUsername) throw createError("Username already exists", 409);

  const existingEmail = await prisma.cAdmin.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
  });
  if (existingEmail) throw createError("Email already exists", 409);

  // ── Validate roles if provided ─────────────────────────────────────────────
  if (role_ids && role_ids.length > 0) {
    if (!primary_role_id) {
      throw createError("primary_role_id is required when role_ids are provided", 400);
    }
    if (!role_ids.includes(primary_role_id)) {
      throw createError("primary_role_id must be one of the role_ids provided", 400);
    }

    const validRoles = await prisma.cAdminCustomRole.findMany({
      where: { role_id: { in: role_ids }, is_deleted: false },
      select: { role_id: true },
    });
    if (validRoles.length !== role_ids.length) {
      throw createError("One or more roles not found or have been deleted", 404);
    }
  }

  const password_hash = await hashPassword(password);

  const result = await prisma.$transaction(async (tx) => {
    const admin = await tx.cAdmin.create({
      data: {
        name,
        username:     username.toLowerCase(),
        phone_number: phone,
        email:        email.toLowerCase(),
        password_hash,
        is_active:    status === "Active",
        is_super_cadmin: false,             // never set via API — only via seed
      },
      select: {
        cadmin_id:       true,
        name:            true,
        username:        true,
        phone_number:    true,
        email:           true,
        is_active:       true,
        is_super_cadmin: true,
        created_at:      true,
      },
    });

    // Assign roles inline if provided
    if (role_ids && role_ids.length > 0) {
      await tx.cAdminRoleAssignment.createMany({
        data: role_ids.map((role_id) => ({
          cadmin_id:   admin.cadmin_id,
          role_id,
          is_primary:  role_id === primary_role_id,
          assigned_by: auditContext.actor_id || null,
        })),
      });
    }

    // Activity log
    await tx.cAdminActivityLog.create({
      data: {
        cadmin_id:       admin.cadmin_id,
        performed_by_id: auditContext.actor_id,
        action:          "admin_created",
        description:     "Admin account created",
        ip_address:      auditContext.ip_address,
        user_agent:      auditContext.user_agent,
      },
    });

    await audit.log({
      action:      audit.AuditAction.CADMIN_CREATED,
      entity_type: audit.EntityType.CADMIN,
      entity_id:   admin.cadmin_id,
      ...auditContext,
      reason_code: audit.AuditReasonCode.ADMIN_ACTION,
      metadata: {
        username:               admin.username,
        email:                  admin.email,
        role_ids_assigned:      role_ids ?? [],
        created_by_cadmin_id:   auditContext.actor_id,
      },
    }, { tx });

    return admin;
  });

  return {
    id:              result.cadmin_id,
    name:            result.name,
    username:        result.username,
    phone:           result.phone_number,
    email:           result.email || "",
    is_super_cadmin: result.is_super_cadmin,
    role:            "No Role",   // roles are set separately or via role_ids above
    status:          formatStatus(result.is_active),
    lastLogin:       "Never",
    createdAt:       formatDate(result.created_at),
  };
}

/**
 * Update admin profile fields (name, username, phone, email).
 * Role changes are handled exclusively through PUT /admins/:id/roles.
 */
export async function updateAdminService(id, data, auditContext = {}) {
  const existing = await prisma.cAdmin.findUnique({
    where: { cadmin_id: id },
  });
  if (!existing) throw createError("Admin not found", 404);

  const updateData = {};
  const changes    = {};

  if (data.name !== undefined && data.name !== existing.name) {
    changes.name     = { from: existing.name, to: data.name };
    updateData.name  = data.name;
  }

  if (data.username !== undefined) {
    const newUsername = data.username.toLowerCase();
    if (newUsername !== existing.username) {
      const dup = await prisma.cAdmin.findFirst({
        where: {
          username: { equals: newUsername, mode: "insensitive" },
          NOT:      { cadmin_id: id },
        },
      });
      if (dup) throw createError("Username already exists", 409);
      changes.username     = { from: existing.username, to: newUsername };
      updateData.username  = newUsername;
    }
  }

  if (data.phone !== undefined && data.phone !== existing.phone_number) {
    changes.phone         = { from: existing.phone_number, to: data.phone };
    updateData.phone_number = data.phone;
  }

  if (data.email !== undefined) {
    const newEmail = data.email.toLowerCase();
    if (newEmail !== existing.email) {
      const dup = await prisma.cAdmin.findFirst({
        where: {
          email: { equals: newEmail, mode: "insensitive" },
          NOT:   { cadmin_id: id },
        },
      });
      if (dup) throw createError("Email already exists", 409);
      changes.email     = { from: existing.email, to: newEmail };
      updateData.email  = newEmail;
    }
  }

  // NOTE: role changes are intentionally not handled here
  // Use PUT /cadmin/admins/:id/roles for role assignment changes

  if (Object.keys(updateData).length === 0) {
    throw createError("No changes detected", 400);
  }

  const changedFields = Object.keys(changes).join(", ");

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.cAdmin.update({
      where:  { cadmin_id: id },
      data:   updateData,
      select: ADMIN_BASE_SELECT,
    });

    await tx.cAdminActivityLog.create({
      data: {
        cadmin_id:       id,
        performed_by_id: auditContext.actor_id,
        action:          "profile_updated",
        description:     `Updated: ${changedFields}`,
        changes,
        ip_address:      auditContext.ip_address,
        user_agent:      auditContext.user_agent,
      },
    });

    await audit.log({
      action:      audit.AuditAction.CADMIN_PROFILE_UPDATED,
      entity_type: audit.EntityType.CADMIN,
      entity_id:   id,
      ...auditContext,
      reason_code: audit.AuditReasonCode.ADMIN_ACTION,
      metadata: {
        changed_fields:       Object.keys(changes),
        before:               Object.fromEntries(Object.entries(changes).map(([k, v]) => [k, v.from])),
        after:                Object.fromEntries(Object.entries(changes).map(([k, v]) => [k, v.to])),
        changed_by_cadmin_id: auditContext.actor_id,
      },
    }, { tx });

    return updated;
  });

  return {
    id:              result.cadmin_id,
    name:            result.name,
    username:        result.username,
    phone:           result.phone_number,
    email:           result.email || "",
    role:            deriveDisplayRole(result),
    roles:           result.roleAssignments.map((r) => ({
      role_id:    r.role.role_id,
      name:       r.role.name,
      is_primary: r.is_primary,
    })),
    is_super_cadmin: result.is_super_cadmin,
    status:          formatStatus(result.is_active),
    lastLogin:       formatDateTime(result.last_login_at),
    createdAt:       formatDate(result.created_at),
    updatedAt:       formatDate(result.updated_at),
  };
}

/**
 * Toggle admin active status.
 *
 * SUPER_CADMIN deactivation: requires secret code in auditContext
 * (validated at controller level before calling this service)
 */
export async function toggleAdminAccessService(id, isActive, auditContext = {}) {
  // Prevent self-deactivation
  if (auditContext.actor_id === id && !isActive) {
    throw createError("Cannot deactivate your own account", 403);
  }

  const existing = await prisma.cAdmin.findUnique({
    where:  { cadmin_id: id },
    select: {
      cadmin_id:       true,
      name:            true,
      username:        true,
      is_active:       true,
      is_super_cadmin: true,
    },
  });
  if (!existing) throw createError("Admin not found", 404);

  // Guard: last active super admin cannot be deactivated
  if (!isActive && existing.is_super_cadmin) {
    const activeSuperAdmins = await prisma.cAdmin.count({
      where: { is_super_cadmin: true, is_active: true },
    });
    if (activeSuperAdmins <= 1) {
      throw createError(
        "Cannot deactivate the last active Super Admin",
        400
      );
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.cAdmin.update({
      where:  { cadmin_id: id },
      data:   { is_active: isActive },
      select: {
        cadmin_id:       true,
        name:            true,
        username:        true,
        is_active:       true,
        is_super_cadmin: true,
      },
    });

    await tx.cAdminActivityLog.create({
      data: {
        cadmin_id:       id,
        performed_by_id: auditContext.actor_id,
        action:          "status_changed",
        description:     isActive ? "Admin activated" : "Admin suspended",
        changes:         { is_active: { from: existing.is_active, to: isActive } },
        meta:            { performed_by: auditContext.actor_id },
        ip_address:      auditContext.ip_address,
        user_agent:      auditContext.user_agent,
      },
    });

    await audit.log({
      action:      isActive
        ? audit.AuditAction.CADMIN_ACTIVATED
        : audit.AuditAction.CADMIN_SUSPENDED,
      entity_type: audit.EntityType.CADMIN,
      entity_id:   id,
      ...auditContext,
      reason_code: audit.AuditReasonCode.ADMIN_ACTION,
      metadata: {
        username:             updated.username,
        is_super_cadmin:      updated.is_super_cadmin,
        reason:               isActive ? "activated_by_admin" : "suspended_by_admin",
        changed_by_cadmin_id: auditContext.actor_id,
      },
    }, { tx });

    return updated;
  });

  return {
    id:       result.cadmin_id,
    name:     result.name,
    status:   formatStatus(result.is_active),
    isActive: result.is_active,
  };
}

export async function getAdminActivityService(adminId, query) {
  const { page, limit, action } = query;
  const skip = (page - 1) * limit;

  const admin = await prisma.cAdmin.findUnique({
    where:  { cadmin_id: adminId },
    select: { cadmin_id: true },
  });
  if (!admin) throw createError("Admin not found", 404);

  const where = { cadmin_id: adminId };
  if (action) where.action = action;

  const [total, activities] = await Promise.all([
    prisma.cAdminActivityLog.count({ where }),
    prisma.cAdminActivityLog.findMany({
      where,
      orderBy: { created_at: "desc" },
      skip,
      take:    limit,
    }),
  ]);

  const totalPages = Math.max(Math.ceil(total / limit), 1);

  return {
    activities: activities.map((a) => ({
      id:          a.id,
      action:      a.action,
      description: a.description,
      changes:     a.changes,
      meta:        a.meta,
      ipAddress:   a.ip_address,
      userAgent:   a.user_agent,
      createdAt:   a.created_at,
    })),
    meta: { total, page, limit, totalPages },
  };
}