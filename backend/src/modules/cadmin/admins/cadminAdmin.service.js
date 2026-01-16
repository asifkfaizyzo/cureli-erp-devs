// src/modules/cadmin/admins/cadminAdmin.service.js

import prisma from "../../../config/prisma.js";
import { hashPassword } from "../../../utils/hash.js";
import * as audit from "../../audit/index.js";

// ============================================
// HELPERS
// ============================================

function formatRole(role) {
  if (!role) return "Super Admin";
  const map = {
    SUPER_ADMIN: "Super Admin",
    ANALYST: "Analyst",
    ACCOUNTING: "Accounting",
  };
  return map[role] || role;
}

function formatStatus(isActive) {
  return isActive ? "Active" : "Inactive";
}

function formatDateTime(dt) {
  if (!dt) return "Never";
  const d = new Date(dt);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${day}/${month}/${year} ${hours}:${minutes} ${ampm}`;
}

function formatDate(dt) {
  if (!dt) return "";
  const d = new Date(dt);
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function mapRoleToDb(role) {
  if (!role) return null;
  const r = role.toLowerCase().replace(/\s+/g, "_");
  const map = {
    super_admin: "SUPER_ADMIN",
    analyst: "ANALYST",
    accounting: "ACCOUNTING",
  };
  return map[r] || role.toUpperCase();
}

function createError(message, status = 400) {
  const err = new Error(message);
  err.status = status;
  return err;
}

// ============================================
// SERVICES
// ============================================

export async function getAdminsService(query) {
  const { page, limit, search, status, role, sort, order } = query;
  const skip = (page - 1) * limit;

  const where = {};

  if (status === "active") where.is_active = true;
  else if (status === "inactive") where.is_active = false;

  if (role) {
    where.role = mapRoleToDb(role);
  }

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { username: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  const sortField = sort === "name" ? "name" : sort === "username" ? "username" : sort === "role" ? "role" : sort === "last_login_at" ? "last_login_at" : "created_at";
  const orderBy = { [sortField]: order };

  const [total, admins] = await Promise.all([
    prisma.cAdmin.count({ where }),
    prisma.cAdmin.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      select: {
        cadmin_id: true,
        name: true,
        username: true,
        phone_number: true,
        email: true,
        role: true,
        is_active: true,
        last_login_at: true,
        created_at: true,
      },
    }),
  ]);

  const totalPages = Math.max(Math.ceil(total / limit), 1);

  const data = admins.map((a) => ({
    id: a.cadmin_id,
    name: a.name,
    username: a.username,
    phone: a.phone_number,
    email: a.email || "",
    role: formatRole(a.role),
    status: formatStatus(a.is_active),
    lastLogin: formatDateTime(a.last_login_at),
    createdAt: formatDate(a.created_at),
  }));

  return {
    admins: data,
    meta: {
      total,
      page,
      limit,
      totalPages,
    },
  };
}

export async function getAdminByIdService(id) {
  const admin = await prisma.cAdmin.findUnique({
    where: { cadmin_id: id },
    include: {
      activityLogs: {
        orderBy: { created_at: "desc" },
        take: 50,
      },
    },
  });

  if (!admin) {
    throw createError("Admin not found", 404);
  }

  const activityLogs = admin.activityLogs.map((log) => ({
    id: log.id,
    action: log.action,
    description: log.description,
    changes: log.changes,
    meta: log.meta,
    ipAddress: log.ip_address,
    userAgent: log.user_agent,
    createdAt: log.created_at,
  }));

  return {
    id: admin.cadmin_id,
    name: admin.name,
    username: admin.username,
    phone: admin.phone_number,
    email: admin.email || "",
    role: formatRole(admin.role),
    rawRole: admin.role,
    status: formatStatus(admin.is_active),
    isActive: admin.is_active,
    lastLogin: formatDateTime(admin.last_login_at),
    createdAt: formatDate(admin.created_at),
    updatedAt: formatDate(admin.updated_at),
    activityLogs,
  };
}

export async function createAdminService(data, auditContext = {}) {
  const { name, username, phone, email, password, role, status } = data;

  // Check unique username
  const existingUsername = await prisma.cAdmin.findFirst({
    where: { username: { equals: username, mode: "insensitive" } },
  });
  if (existingUsername) {
    throw createError("Username already exists", 409);
  }

  // Check unique email
  const existingEmail = await prisma.cAdmin.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
  });
  if (existingEmail) {
    throw createError("Email already exists", 409);
  }

  const password_hash = await hashPassword(password);

  const result = await prisma.$transaction(async (tx) => {
    const admin = await tx.cAdmin.create({
      data: {
        name,
        username: username.toLowerCase(),
        phone_number: phone,
        email: email.toLowerCase(),
        password_hash,
        role: role || "SUPER_ADMIN",
        is_active: status === "Active",
      },
      select: {
        cadmin_id: true,
        name: true,
        username: true,
        phone_number: true,
        email: true,
        role: true,
        is_active: true,
        created_at: true,
      },
    });

    // Legacy activity log
    await tx.cAdminActivityLog.create({
      data: {
        cadmin_id: admin.cadmin_id,
        performed_by_id: auditContext.actor_id,
        action: "admin_created",
        description: "Admin account created",
        ip_address: auditContext.ip_address,
        user_agent: auditContext.user_agent,
      },
    });

    // ✅ AUDIT LOG: CAdmin created
    await audit.log({
      action: audit.AuditAction.CADMIN_CREATED,
      entity_type: audit.EntityType.CADMIN,
      entity_id: admin.cadmin_id,
      ...auditContext,
      reason_code: audit.AuditReasonCode.ADMIN_ACTION,
      metadata: {
        username: admin.username,
        role: admin.role,
        email: admin.email,
        created_by_cadmin_id: auditContext.actor_id,
      },
    }, { tx });

    return admin;
  });

  return {
    id: result.cadmin_id,
    name: result.name,
    username: result.username,
    phone: result.phone_number,
    email: result.email || "",
    role: formatRole(result.role),
    status: formatStatus(result.is_active),
    lastLogin: "Never",
    createdAt: formatDate(result.created_at),
  };
}

export async function updateAdminService(id, data, auditContext = {}) {
  const existing = await prisma.cAdmin.findUnique({
    where: { cadmin_id: id },
  });
  if (!existing) {
    throw createError("Admin not found", 404);
  }

  const updateData = {};
  const changes = {};

  if (data.name !== undefined && data.name !== existing.name) {
    changes.name = { from: existing.name, to: data.name };
    updateData.name = data.name;
  }

  if (data.username !== undefined) {
    const newUsername = data.username.toLowerCase();
    if (newUsername !== existing.username) {
      const dup = await prisma.cAdmin.findFirst({
        where: {
          username: { equals: newUsername, mode: "insensitive" },
          NOT: { cadmin_id: id },
        },
      });
      if (dup) throw createError("Username already exists", 409);
      changes.username = { from: existing.username, to: newUsername };
      updateData.username = newUsername;
    }
  }

  if (data.phone !== undefined && data.phone !== existing.phone_number) {
    changes.phone = { from: existing.phone_number, to: data.phone };
    updateData.phone_number = data.phone;
  }

  if (data.email !== undefined) {
    const newEmail = data.email.toLowerCase();
    if (newEmail !== existing.email) {
      const dup = await prisma.cAdmin.findFirst({
        where: {
          email: { equals: newEmail, mode: "insensitive" },
          NOT: { cadmin_id: id },
        },
      });
      if (dup) throw createError("Email already exists", 409);
      changes.email = { from: existing.email, to: newEmail };
      updateData.email = newEmail;
    }
  }

  if (data.role !== undefined && data.role !== existing.role) {
    changes.role = { from: existing.role, to: data.role };
    updateData.role = data.role;
  }

  if (Object.keys(updateData).length === 0) {
    throw createError("No changes detected", 400);
  }

  const hasRoleChange = !!changes.role;
  const action = hasRoleChange ? "role_updated" : "profile_updated";
  const changedFields = Object.keys(changes).join(", ");
  const description = hasRoleChange
    ? `Role changed from ${formatRole(changes.role.from)} to ${formatRole(changes.role.to)}`
    : `Updated: ${changedFields}`;

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.cAdmin.update({
      where: { cadmin_id: id },
      data: updateData,
      select: {
        cadmin_id: true,
        name: true,
        username: true,
        phone_number: true,
        email: true,
        role: true,
        is_active: true,
        last_login_at: true,
        created_at: true,
        updated_at: true,
      },
    });

    // Legacy activity log
    await tx.cAdminActivityLog.create({
      data: {
        cadmin_id: id,
        performed_by_id: auditContext.actor_id,
        action,
        description,
        changes,
        ip_address: auditContext.ip_address,
        user_agent: auditContext.user_agent,
      },
    });

    // ✅ AUDIT LOG: CAdmin profile updated
    await audit.log({
      action: audit.AuditAction.CADMIN_PROFILE_UPDATED,
      entity_type: audit.EntityType.CADMIN,
      entity_id: id,
      ...auditContext,
      reason_code: audit.AuditReasonCode.ADMIN_ACTION,
      metadata: {
        changed_fields: Object.keys(changes),
        before: Object.fromEntries(Object.entries(changes).map(([k, v]) => [k, v.from])),
        after: Object.fromEntries(Object.entries(changes).map(([k, v]) => [k, v.to])),
        changed_by_cadmin_id: auditContext.actor_id,
      },
    }, { tx });

    // ✅ AUDIT LOG: Role changed (if applicable)
    if (hasRoleChange) {
      await audit.log({
        action: audit.AuditAction.CADMIN_ROLE_CHANGED,
        entity_type: audit.EntityType.CADMIN,
        entity_id: id,
        ...auditContext,
        reason_code: audit.AuditReasonCode.ADMIN_ACTION,
        metadata: {
          previous_role: changes.role.from,
          new_role: changes.role.to,
          changed_by_cadmin_id: auditContext.actor_id,
        },
      }, { tx });
    }

    return updated;
  });

  return {
    id: result.cadmin_id,
    name: result.name,
    username: result.username,
    phone: result.phone_number,
    email: result.email || "",
    role: formatRole(result.role),
    status: formatStatus(result.is_active),
    lastLogin: formatDateTime(result.last_login_at),
    createdAt: formatDate(result.created_at),
    updatedAt: formatDate(result.updated_at),
  };
}

export async function toggleAdminAccessService(id, isActive, auditContext = {}) {
  // Prevent self-deactivation
  if (auditContext.actor_id === id && !isActive) {
    throw createError("Cannot deactivate your own account", 403);
  }

  const existing = await prisma.cAdmin.findUnique({
    where: { cadmin_id: id },
  });
  if (!existing) {
    throw createError("Admin not found", 404);
  }

  // Prevent deactivating last Super Admin
  if (!isActive && existing.role === "SUPER_ADMIN") {
    const activeSuperAdmins = await prisma.cAdmin.count({
      where: { role: "SUPER_ADMIN", is_active: true },
    });
    if (activeSuperAdmins <= 1) {
      throw createError("Cannot deactivate the last active Super Admin", 400);
    }
  }

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.cAdmin.update({
      where: { cadmin_id: id },
      data: { is_active: isActive },
      select: {
        cadmin_id: true,
        name: true,
        username: true,
        role: true,
        is_active: true,
      },
    });

    // Legacy activity log
    await tx.cAdminActivityLog.create({
      data: {
        cadmin_id: id,
        performed_by_id: auditContext.actor_id,
        action: "status_changed",
        description: isActive ? "Admin activated" : "Admin suspended",
        changes: { is_active: { from: existing.is_active, to: isActive } },
        meta: { performed_by: auditContext.actor_id },
        ip_address: auditContext.ip_address,
        user_agent: auditContext.user_agent,
      },
    });

    // ✅ AUDIT LOG: Activated or Suspended
    const auditAction = isActive 
      ? audit.AuditAction.CADMIN_ACTIVATED 
      : audit.AuditAction.CADMIN_SUSPENDED;

    await audit.log({
      action: auditAction,
      entity_type: audit.EntityType.CADMIN,
      entity_id: id,
      ...auditContext,
      reason_code: audit.AuditReasonCode.ADMIN_ACTION,
      metadata: {
        username: updated.username,
        role: updated.role,
        reason: isActive ? "activated_by_admin" : "suspended_by_admin",
        changed_by_cadmin_id: auditContext.actor_id,
      },
    }, { tx });

    return updated;
  });

  return {
    id: result.cadmin_id,
    name: result.name,
    status: formatStatus(result.is_active),
    isActive: result.is_active,
  };
}

export async function getAdminActivityService(adminId, query) {
  const { page, limit, action } = query;
  const skip = (page - 1) * limit;

  const admin = await prisma.cAdmin.findUnique({
    where: { cadmin_id: adminId },
    select: { cadmin_id: true },
  });
  if (!admin) {
    throw createError("Admin not found", 404);
  }

  const where = { cadmin_id: adminId };
  if (action) {
    where.action = action;
  }

  const [total, activities] = await Promise.all([
    prisma.cAdminActivityLog.count({ where }),
    prisma.cAdminActivityLog.findMany({
      where,
      orderBy: { created_at: "desc" },
      skip,
      take: limit,
    }),
  ]);

  const totalPages = Math.max(Math.ceil(total / limit), 1);

  const data = activities.map((a) => ({
    id: a.id,
    action: a.action,
    description: a.description,
    changes: a.changes,
    meta: a.meta,
    ipAddress: a.ip_address,
    userAgent: a.user_agent,
    createdAt: a.created_at,
  }));

  return {
    activities: data,
    meta: {
      total,
      page,
      limit,
      totalPages,
    },
  };
}