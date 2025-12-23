import prisma from "../../../config/prisma.js";
import { hashPassword } from "../../../utils/hash.js";

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

  // Build where clause
  const where = {};

  // Status filter
  if (status === "active") where.is_active = true;
  else if (status === "inactive") where.is_active = false;

  // Role filter
  if (role) {
    where.role = mapRoleToDb(role);
  }

  // Search (OR across name, username, email)
  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { username: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
    ];
  }

  // Sorting
  const sortField = sort === "name" ? "name" : sort === "username" ? "username" : sort === "role" ? "role" : sort === "last_login_at" ? "last_login_at" : "created_at";
  const orderBy = { [sortField]: order };

  // Query
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

export async function createAdminService(data, actorMeta) {
  const { name, username, phone, email, password, role, status } = data;

  // Check unique username (case-insensitive)
  const existingUsername = await prisma.cAdmin.findFirst({
    where: { username: { equals: username, mode: "insensitive" } },
  });
  if (existingUsername) {
    throw createError("Username already exists", 409);
  }

  // Check unique email (case-insensitive)
  const existingEmail = await prisma.cAdmin.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
  });
  if (existingEmail) {
    throw createError("Email already exists", 409);
  }

  // Hash password
  const password_hash = await hashPassword(password);

  // Create admin
  const admin = await prisma.cAdmin.create({
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

  // Log activity
  await prisma.cAdminActivityLog.create({
    data: {
      cadmin_id: admin.cadmin_id,
      performed_by_id: actorMeta.cadmin_id,
      action: "admin_created",
      description: "Admin account created",
      ip_address: actorMeta.ip_address,
      user_agent: actorMeta.user_agent,
    },
  });

  return {
    id: admin.cadmin_id,
    name: admin.name,
    username: admin.username,
    phone: admin.phone_number,
    email: admin.email || "",
    role: formatRole(admin.role),
    status: formatStatus(admin.is_active),
    lastLogin: "Never",
    createdAt: formatDate(admin.created_at),
  };
}

export async function updateAdminService(id, data, actorMeta) {
  // Fetch existing
  const existing = await prisma.cAdmin.findUnique({
    where: { cadmin_id: id },
  });
  if (!existing) {
    throw createError("Admin not found", 404);
  }

  // Build update data and track changes
  const updateData = {};
  const changes = {};

  if (data.name !== undefined && data.name !== existing.name) {
    changes.name = { from: existing.name, to: data.name };
    updateData.name = data.name;
  }

  if (data.username !== undefined) {
    const newUsername = data.username.toLowerCase();
    if (newUsername !== existing.username) {
      // Check uniqueness
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
      // Check uniqueness
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

  // Update
  const updated = await prisma.cAdmin.update({
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

  // Determine action type
  const hasRoleChange = !!changes.role;
  const action = hasRoleChange ? "role_updated" : "profile_updated";
  const changedFields = Object.keys(changes).join(", ");
  const description = hasRoleChange
    ? `Role changed from ${formatRole(changes.role.from)} to ${formatRole(changes.role.to)}`
    : `Updated: ${changedFields}`;

  // Log activity
  await prisma.cAdminActivityLog.create({
    data: {
      cadmin_id: id,
      performed_by_id: actorMeta.cadmin_id,
      action,
      description,
      changes,
      ip_address: actorMeta.ip_address,
      user_agent: actorMeta.user_agent,
    },
  });

  return {
    id: updated.cadmin_id,
    name: updated.name,
    username: updated.username,
    phone: updated.phone_number,
    email: updated.email || "",
    role: formatRole(updated.role),
    status: formatStatus(updated.is_active),
    lastLogin: formatDateTime(updated.last_login_at),
    createdAt: formatDate(updated.created_at),
    updatedAt: formatDate(updated.updated_at),
  };
}

export async function toggleAdminAccessService(id, isActive, actorMeta) {
  // Prevent self-deactivation
  if (actorMeta.cadmin_id === id && !isActive) {
    throw createError("Cannot deactivate your own account", 403);
  }

  const existing = await prisma.cAdmin.findUnique({
    where: { cadmin_id: id },
  });
  if (!existing) {
    throw createError("Admin not found", 404);
  }

  // If deactivating a SUPER_ADMIN, check it's not the last one
  if (!isActive && existing.role === "SUPER_ADMIN") {
    const activeSuperAdmins = await prisma.cAdmin.count({
      where: {
        role: "SUPER_ADMIN",
        is_active: true,
      },
    });
    if (activeSuperAdmins <= 1) {
      throw createError("Cannot deactivate the last active Super Admin", 400);
    }
  }

  // Update
  const updated = await prisma.cAdmin.update({
    where: { cadmin_id: id },
    data: { is_active: isActive },
    select: {
      cadmin_id: true,
      name: true,
      is_active: true,
    },
  });

  // Log activity
  await prisma.cAdminActivityLog.create({
    data: {
      cadmin_id: id,
      performed_by_id: actorMeta.cadmin_id,
      action: "status_changed",
      description: isActive ? "Admin activated" : "Admin suspended",
      changes: { is_active: { from: existing.is_active, to: isActive } },
      meta: { performed_by: actorMeta.cadmin_id },
      ip_address: actorMeta.ip_address,
      user_agent: actorMeta.user_agent,
    },
  });

  return {
    id: updated.cadmin_id,
    name: updated.name,
    status: formatStatus(updated.is_active),
    isActive: updated.is_active,
  };
}

export async function getAdminActivityService(adminId, query) {
  const { page, limit, action } = query;
  const skip = (page - 1) * limit;

  // Verify admin exists
  const admin = await prisma.cAdmin.findUnique({
    where: { cadmin_id: adminId },
    select: { cadmin_id: true },
  });
  if (!admin) {
    throw createError("Admin not found", 404);
  }

  // Build where
  const where = { cadmin_id: adminId };
  if (action) {
    where.action = action;
  }

  // Query
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