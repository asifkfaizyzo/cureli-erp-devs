// ============================================
// backend\src\modules\cadmin\users\cadminUser.service.js
// ============================================

import prisma from "../../../config/prisma.js";
import { generateResetToken, hashToken } from "../../../utils/resetToken.js";
import { notify } from "../../notifications/index.js";
import { NOTIFICATION_EVENTS } from "../../notifications/notification.events.js";
import * as audit from "../../audit/index.js";

// ============================================
// HELPER FUNCTIONS
// ============================================

function formatDateDDMMYYYY(dt) {
  const d = new Date(dt);
  const day = `${d.getDate()}`.padStart(2, "0");
  const month = `${d.getMonth() + 1}`.padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function formatRole(role) {
  if (!role) return "Staff";
  const r = role.toLowerCase();
  if (r === "super_admin" || r === "super admin") return "Super Admin";
  if (r === "branch_admin" || r === "branch admin") return "Branch Admin";
  if (r === "staff") return "Staff";
  return role
    .split(/[_\s]+/)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

function mapRoleToDb(roleLabel) {
  if (!roleLabel) return null;
  const r = roleLabel.toLowerCase();
  if (r === "super admin" || r === "super_admin") return "super_admin";
  if (r === "branch admin" || r === "branch_admin") return "branch_admin";
  if (r === "staff") return "staff";
  return roleLabel;
}

function cryptoRandomUUID() {
  if (typeof crypto !== "undefined" && crypto.randomUUID)
    return crypto.randomUUID();
  return require("crypto").randomUUID();
}

function createError(message, code) {
  const err = new Error(message);
  err.code = code;
  return err;
}

// ============================================
// GET USERS
// ============================================

export async function getUsersService(query = {}) {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Number(query.limit) || 10, 200);
  const skip = (page - 1) * limit;

  const where = {};

  if (query.status) {
    if (query.status.toLowerCase() === "active") where.is_active = true;
    else if (query.status.toLowerCase() === "inactive") where.is_active = false;
  }

  if (query.role) {
    const roleVal = mapRoleToDb(query.role);
    if (roleVal) where.role = roleVal;
    else where.role = query.role;
  }

  if (query.search) {
    const q = query.search.trim();
    where.OR = [
      { full_name: { contains: q, mode: "insensitive" } },
      { username: { contains: q, mode: "insensitive" } },
      { email: { contains: q, mode: "insensitive" } },
    ];
  }

  if (query.last_login) {
    const d = new Date(query.last_login);
    if (!isNaN(d)) {
      const start = new Date(
        Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0)
      );
      const end = new Date(
        Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999)
      );
      where.last_login_at = { gte: start, lte: end };
    }
  }

  const sortKey = (query.sort || "created_at").toLowerCase();
  let orderBy = { created_at: "desc" };

  const dir = (query.order || "desc").toLowerCase() === "asc" ? "asc" : "desc";

  if (sortKey === "name" || sortKey === "full_name") {
    orderBy = { full_name: dir };
  } else if (sortKey === "username") {
    orderBy = { username: dir };
  } else if (sortKey === "last_login" || sortKey === "last_login_at") {
    orderBy = { last_login_at: dir };
  } else if (sortKey === "created_at") {
    orderBy = { created_at: dir };
  }

  const [total, users] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      select: {
        user_id: true,
        full_name: true,
        username: true,
        email: true,
        role: true,
        is_active: true,
        last_login_at: true,
        created_at: true,
      },
    }),
  ]);

  const totalPages = Math.max(Math.ceil(total / limit), 1);

  const data = users.map((u) => ({
    id: u.user_id,
    name: u.full_name,
    username: u.username,
    email: u.email,
    role: formatRole(u.role),
    is_active: u.is_active,
    lastLogin: u.last_login_at ? formatDateDDMMYYYY(u.last_login_at) : "Never",
    created_at: u.created_at,
  }));

  return {
    data,
    meta: {
      total,
      page,
      limit,
      totalPages,
    },
  };
}

// ============================================
// GET USER BY ID
// ============================================

export async function getUserByIdService(id) {
  const u = await prisma.user.findUnique({
    where: { user_id: id },
    include: {
      shop: {
        include: {
          branches: true,
          users: {
            select: {
              user_id: true,
              full_name: true,
              email: true,
              role: true,
              status: true,
            },
          },
          subscriptions: {
            include: {
              plan: true,
            },
            orderBy: { created_at: "desc" },
            take: 1,
          },
        },
      },
      branch: true,
      shopFiles: true,
      activityLogs: {
        orderBy: { created_at: "desc" },
        take: 50,
      },
    },
  });

  if (!u) {
    throw createError("User not found", "NOT_FOUND");
  }

  let currentSubscription = null;
  if (u.shop && u.shop.current_subscription_id) {
    const sub = await prisma.shopSubscription.findUnique({
      where: { subscription_id: u.shop.current_subscription_id },
      include: { plan: true },
    });
    currentSubscription = sub || null;
  } else if (
    u.shop &&
    u.shop.subscriptions &&
    u.shop.subscriptions.length > 0
  ) {
    currentSubscription = u.shop.subscriptions[0] || null;
  }

  const activityLogs = (u.activityLogs || []).map((a) => ({
    id: a.activity_id,
    action: a.action,
    description: a.description,
    ip_address: a.ip_address,
    user_agent: a.user_agent,
    created_at: a.created_at,
  }));

  const shopUsers = (u.shop?.users || []).map((su) => ({
    user_id: su.user_id,
    full_name: su.full_name,
    email: su.email,
    role: formatRole(su.role),
    status: su.status,
  }));

  const branches = (u.shop?.branches || []).map((b) => ({
    branch_id: b.branch_id,
    branch_name: b.branch_name,
    branch_type: b.branch_type,
    city: b.city,
    is_active: b.is_active,
  }));

  const shopFiles = (u.shopFiles || []).map((f) => ({
    file_id: f.file_id,
    shop_id: f.shop_id,
    file_type: f.file_type,
    storage_key: f.storage_key,
    original_name: f.original_name,
    mime_type: f.mime_type,
    file_size: f.file_size,
    status: f.status,
    verification_notes: f.verification_notes,
    resubmission_count: f.resubmission_count,
    uploaded_by: f.uploaded_by,
    uploaded_at: f.uploaded_at,
    verified_at: f.verified_at,
  }));

  let shopCounts = {};
  if (u.shop) {
    const counts = await prisma.shop.findUnique({
      where: { shop_id: u.shop.shop_id },
      select: {
        _count: {
          select: {
            branches: true,
            users: true,
          },
        },
      },
    });
    shopCounts = counts?._count || {};
  }

  return {
    user_id: u.user_id,
    first_name: u.first_name,
    last_name: u.last_name,
    full_name: u.full_name,
    username: u.username,
    email: u.email,
    phone_number: u.phone_number,
    role: formatRole(u.role),
    raw_role: u.role,
    status: u.status,
    is_active: u.is_active,
    onboarding_step: u.onboarding_step,
    login_provider: u.login_provider,
    last_login_at: u.last_login_at,
    created_at: u.created_at,
    updated_at: u.updated_at,

    shop: u.shop
      ? {
          shop_id: u.shop.shop_id,
          business_name: u.shop.business_name,
          legal_name: u.shop.legal_name,
          gst_number: u.shop.gst_number,
          business_type: u.shop.business_type,
          address_line_1: u.shop.address_line_1,
          address_line_2: u.shop.address_line_2,
          city: u.shop.city,
          state: u.shop.state,
          pincode: u.shop.pincode,
          verification_status: u.shop.verification_status,
          verification_notes: u.shop.verification_notes,
          created_at: u.shop.created_at,
          updated_at: u.shop.updated_at,
          users: shopUsers,
          branches,
          currentSubscription,
          _count: shopCounts,
        }
      : null,

    branch: u.branch
      ? {
          branch_id: u.branch.branch_id,
          branch_name: u.branch.branch_name,
          branch_type: u.branch.branch_type,
          address_line_1: u.branch.address_line_1,
          address_line_2: u.branch.address_line_2,
          city: u.branch.city,
          state: u.branch.state,
          pincode: u.branch.pincode,
          contact_number: u.branch.contact_number,
          alternate_number: u.branch.alternate_number,
          is_active: u.branch.is_active,
        }
      : null,

    shopFiles,
    activityLogs,
  };
}

// ============================================
// UPDATE USER
// ============================================

export async function updateUserService(id, payload = {}, cadmin_id, auditContext = {}) {
  const allowed = {};
  if (payload.first_name != null) allowed.first_name = payload.first_name;
  if (payload.last_name != null) allowed.last_name = payload.last_name;
  if (payload.full_name != null) allowed.full_name = payload.full_name;
  if (payload.username != null) allowed.username = payload.username;
  if (payload.role != null) allowed.role = mapRoleToDb(payload.role);

  if (Object.keys(allowed).length === 0) {
    throw createError("No valid fields provided for update", "VALIDATION_ERROR");
  }

  const existing = await prisma.user.findUnique({ 
    where: { user_id: id },
    select: {
      user_id: true,
      first_name: true,
      last_name: true,
      username: true,
      role: true,
      shop_id: true,
    },
  });

  if (!existing) {
    throw createError("User not found", "NOT_FOUND");
  }

  // Track changes
  const changes = {};
  for (const [key, newValue] of Object.entries(allowed)) {
    const oldValue = existing[key];
    if (oldValue !== newValue) {
      changes[key] = { old: oldValue, new: newValue };
    }
  }

  if (Object.keys(changes).length === 0) {
    // No actual changes
    const formatted = await prisma.user.findUnique({
      where: { user_id: id },
      select: {
        user_id: true,
        first_name: true,
        last_name: true,
        full_name: true,
        username: true,
        email: true,
        role: true,
        is_active: true,
        last_login_at: true,
        created_at: true,
        updated_at: true,
      },
    });
    return formatUserResponse(formatted);
  }

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { user_id: id },
      data: allowed,
      select: {
        user_id: true,
        first_name: true,
        last_name: true,
        full_name: true,
        username: true,
        email: true,
        role: true,
        is_active: true,
        last_login_at: true,
        created_at: true,
        updated_at: true,
        shop_id: true,
      },
    });

    // Legacy activity log
    const changedFields = Object.keys(changes);
    const isRoleChange = changedFields.includes("role");

    await tx.activityLog.create({
      data: {
        activity_id: cryptoRandomUUID(),
        user_id: id,
        action: isRoleChange ? "role_change" : "profile_update",
        description: `Fields changed by admin: ${changedFields.join(", ")}`,
        ip_address: null,
        user_agent: null,
      },
    });

    // ✅ AUDIT: Determine action based on changes
    let auditAction;
    if (isRoleChange) {
      auditAction = audit.AuditAction.USER_ROLE_CHANGED_BY_ADMIN;
    } else {
      auditAction = audit.AuditAction.USER_PROFILE_UPDATED_BY_ADMIN;
    }

    await audit.log({
      action: auditAction,
      entity_type: audit.EntityType.USER,
      entity_id: id,
      shop_id: updated.shop_id || null,
      ...auditContext,
      reason_code: audit.AuditReasonCode.ADMIN_ACTION,
      metadata: {
        changed_fields: changedFields,
        before: Object.fromEntries(
          Object.entries(changes).map(([k, v]) => [k, v.old])
        ),
        after: Object.fromEntries(
          Object.entries(changes).map(([k, v]) => [k, v.new])
        ),
        updated_by_cadmin_id: cadmin_id,
        ...(isRoleChange && {
          previous_role: changes.role.old,
          new_role: changes.role.new,
        }),
      },
    }, { tx });

    return updated;
  });

  return formatUserResponse(result);
}

// ============================================
// TOGGLE USER ACCESS
// ============================================

export async function toggleUserAccessService(id, is_active, cadmin_id, auditContext = {}) {
  const existing = await prisma.user.findUnique({ 
    where: { user_id: id },
    select: {
      user_id: true,
      is_active: true,
      shop_id: true,
      full_name: true,
    },
  });

  if (!existing) {
    throw createError("User not found", "NOT_FOUND");
  }

  if (existing.is_active === is_active) {
    // No change needed
    return {
      id: existing.user_id,
      is_active: existing.is_active,
      name: existing.full_name,
      username: existing.username,
    };
  }

  const result = await prisma.$transaction(async (tx) => {
    const updated = await tx.user.update({
      where: { user_id: id },
      data: { is_active },
      select: {
        user_id: true,
        is_active: true,
        full_name: true,
        username: true,
        shop_id: true,
      },
    });

    // Legacy activity log
    await tx.activityLog.create({
      data: {
        activity_id: cryptoRandomUUID(),
        user_id: id,
        action: "status_change",
        description: is_active ? "Activated by cadmin" : "Suspended by cadmin",
        ip_address: null,
        user_agent: null,
      },
    });

    // ✅ AUDIT: User activated or suspended by admin
    const auditAction = is_active
      ? audit.AuditAction.USER_ACTIVATED_BY_ADMIN
      : audit.AuditAction.USER_SUSPENDED_BY_ADMIN;

    await audit.log({
      action: auditAction,
      entity_type: audit.EntityType.USER,
      entity_id: id,
      shop_id: updated.shop_id || null,
      ...auditContext,
      reason_code: audit.AuditReasonCode.ADMIN_ACTION,
      metadata: {
        activated_by_cadmin_id: is_active ? cadmin_id : undefined,
        reason: is_active ? "Activated by admin" : "Suspended by admin",
        suspended_by_cadmin_id: !is_active ? cadmin_id : undefined,
      },
    }, { tx });

    return updated;
  });

  return {
    id: result.user_id,
    is_active: result.is_active,
    name: result.full_name,
    username: result.username,
  };
}

// ============================================
// RESET USER PASSWORD
// ============================================

export async function resetUserPasswordService(userId, cadmin_id, auditContext = {}) {
  const user = await prisma.user.findUnique({ 
    where: { user_id: userId },
    select: {
      user_id: true,
      email: true,
      full_name: true,
      shop_id: true,
    },
  });

  if (!user) {
    throw createError("User not found", "NOT_FOUND");
  }

  if (!user.email) {
    throw createError("User has no email", "NO_EMAIL");
  }

  const resetToken = generateResetToken();
  const hashed = hashToken(resetToken);
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

  await prisma.$transaction(async (tx) => {
    await tx.user.update({
      where: { user_id: userId },
      data: {
        reset_token: hashed,
        reset_token_expires: expiresAt,
      },
    });

    // Legacy activity log
    await tx.activityLog.create({
      data: {
        activity_id: cryptoRandomUUID(),
        user_id: userId,
        action: "password_change",
        description: "Password reset link generated by cadmin",
        ip_address: null,
        user_agent: null,
      },
    });

    // ✅ AUDIT: Password reset by admin
    await audit.log({
      action: audit.AuditAction.USER_PASSWORD_RESET_BY_ADMIN,
      entity_type: audit.EntityType.USER,
      entity_id: userId,
      shop_id: user.shop_id || null,
      ...auditContext,
      reason_code: audit.AuditReasonCode.SECURITY_ACTION,
      metadata: {
        reset_by_cadmin_id: cadmin_id,
        method: 'email_link',
        expires_in_minutes: 15,
      },
    }, { tx });
  });

  const resetUrl = `${
    process.env.ERP_FRONTEND_ORIGIN || process.env.ADMIN_FRONTEND_ORIGIN
  }/reset-password?token=${resetToken}&uid=${userId}`;

  // Send notification
  await notify({
    type: NOTIFICATION_EVENTS.PASSWORD_RESET_REQUESTED,
    context: {
      email: user.email,
      name: user.full_name || user.email,
      resetUrl,
      expires_in_minutes: 15,
    },
  });

  return { success: true, email: user.email };
}

// ============================================
// FORMAT HELPERS
// ============================================

function formatUserResponse(u) {
  return {
    id: u.user_id,
    first_name: u.first_name,
    last_name: u.last_name,
    name: u.full_name,
    username: u.username,
    email: u.email,
    role: formatRole(u.role),
    is_active: u.is_active,
    lastLogin: u.last_login_at
      ? formatDateDDMMYYYY(u.last_login_at)
      : "Never",
    created_at: u.created_at,
    updated_at: u.updated_at,
  };
}