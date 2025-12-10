//Q:\PROJECTS\YourZeroesAndOnes\cureli\curely_erp\backend\src\modules\cadmin\users\cadminUser.service.js

import prisma from "../../../config/prisma.js";
import { generateResetToken, hashToken } from "../../../utils/resetToken.js";
import { hashPassword } from "../../../utils/hash.js";
import { sendMail } from "../../../utils/email.js";

export async function getUsersService(query = {}) {
  const page = Math.max(Number(query.page) || 1, 1);
  const limit = Math.min(Number(query.limit) || 10, 200); // cap limit
  const skip = (page - 1) * limit;

  // Build where clause
  const where = {};

  if (query.status) {
    if (query.status.toLowerCase() === "active") where.is_active = true;
    else if (query.status.toLowerCase() === "inactive") where.is_active = false;
  }

  if (query.role) {
    // Accept values as provided by frontend (e.g., "Super Admin", "Staff")
    // Map to DB role if necessary; assume DB role is stored similarly or normalized.
    // If your DB uses snake_case roles (e.g., super_admin) extend mapping here.
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
    // Filter by exact date (server timezone UTC). user sends YYYY-MM-DD
    // We'll match last_login_at between start and end of that day.
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

  // Sorting mapping
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

  // Total count
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
    role: formatRole(u.role), // convert DB role to label expected by UI
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

export async function getUserByIdService(id) {
  // fetch core user with relations needed for modal
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
    const e = new Error("User not found");
    e.status = 404;
    throw e;
  }

  // find currentSubscription (if shop.current_subscription_id present)
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
    // fallback to latest subscription in included subscriptions
    currentSubscription = u.shop.subscriptions[0] || null;
  }

  // format activity logs to match frontend shape
  const activityLogs = (u.activityLogs || []).map((a) => ({
    id: a.activity_id,
    action: a.action,
    description: a.description,
    ip_address: a.ip_address,
    user_agent: a.user_agent,
    created_at: a.created_at,
  }));

  // shop users mapping (for UsersTab)
  const shopUsers = (u.shop?.users || []).map((su) => ({
    user_id: su.user_id,
    full_name: su.full_name,
    email: su.email,
    role: formatRole(su.role),
    status: su.status,
  }));

  // branches mapping
  const branches = (u.shop?.branches || []).map((b) => ({
    branch_id: b.branch_id,
    branch_name: b.branch_name,
    branch_type: b.branch_type,
    city: b.city,
    is_active: b.is_active,
  }));

  // shopFiles formatted
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

  // basic shop summary counts
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

    // relations (flat)
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

/**
 * updateUserService
 * allowed updates: first_name, last_name, full_name, username, role
 * role changes create activity log (only if actually changed)
 */
export async function updateUserService(id, payload = {}, actorCAdmin = null) {
  const allowed = {};
  if (payload.first_name != null) allowed.first_name = payload.first_name;
  if (payload.last_name != null) allowed.last_name = payload.last_name;
  if (payload.full_name != null) allowed.full_name = payload.full_name;
  if (payload.username != null) allowed.username = payload.username;
  if (payload.role != null) allowed.role = mapRoleToDb(payload.role);

  if (Object.keys(allowed).length === 0) {
    const e = new Error("No valid fields provided for update");
    e.status = 400;
    throw e;
  }

  // fetch existing user for diff and validations
  const existing = await prisma.user.findUnique({ where: { user_id: id } });
  if (!existing) {
    const e = new Error("User not found");
    e.status = 404;
    throw e;
  }

  // Prevent role demotion of a Super Admin via cadmin (optional rule)
  // If you want that restriction, enforce here. For now allow but ensure mapping.

  const updated = await prisma.user.update({
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
    },
  });

  // create activity log entries for fields changed
  const changes = [];
  if (allowed.first_name && allowed.first_name !== existing.first_name)
    changes.push("first_name");
  if (allowed.last_name && allowed.last_name !== existing.last_name)
    changes.push("last_name");
  if (allowed.username && allowed.username !== existing.username)
    changes.push("username");
  if (allowed.role && allowed.role !== existing.role) changes.push("role");

  if (changes.length > 0) {
    await prisma.activityLog.create({
      data: {
        activity_id: cryptoRandomUUID(),
        user_id: id,
        action: changes.includes("role") ? "role_change" : "profile_update",
        description: `Fields changed: ${changes.join(", ")}`,
        ip_address: actorCAdmin?.ip_address || null,
        user_agent: actorCAdmin?.user_agent || null,
      },
    });
  }

  return {
    id: updated.user_id,
    first_name: updated.first_name,
    last_name: updated.last_name,
    name: updated.full_name,
    username: updated.username,
    email: updated.email,
    role: formatRole(updated.role),
    is_active: updated.is_active,
    lastLogin: updated.last_login_at
      ? formatDateDDMMYYYY(updated.last_login_at)
      : "Never",
    created_at: updated.created_at,
    updated_at: updated.updated_at,
  };
}

/**
 * toggleUserAccessService
 * toggle is_active boolean and log the action
 */
export async function toggleUserAccessService(
  id,
  is_active,
  actorCAdmin = null
) {
  const existing = await prisma.user.findUnique({ where: { user_id: id } });
  if (!existing) {
    const e = new Error("User not found");
    e.status = 404;
    throw e;
  }

  const updated = await prisma.user.update({
    where: { user_id: id },
    data: { is_active },
    select: {
      user_id: true,
      is_active: true,
      full_name: true,
      username: true,
    },
  });

  // create log
  await prisma.activityLog.create({
    data: {
      activity_id: cryptoRandomUUID(),
      user_id: id,
      action: is_active ? "status_change" : "status_change",
      description: is_active ? "Activated by cadmin" : "Suspended by cadmin",
      ip_address: actorCAdmin?.ip_address || null,
      user_agent: actorCAdmin?.user_agent || null,
    },
  });

  return {
    id: updated.user_id,
    is_active: updated.is_active,
    name: updated.full_name,
    username: updated.username,
  };
}

/**
 * resetUserPasswordService
 * - generate reset token, save hashed token and expiry on user
 * - send email using sendMail util and HTML template
 */
export async function resetUserPasswordService(userId, actorCAdmin = null) {
  const user = await prisma.user.findUnique({ where: { user_id: userId } });
  if (!user) {
    const e = new Error("User not found");
    e.status = 404;
    throw e;
  }
  if (!user.email) {
    const e = new Error("User has no email");
    e.status = 400;
    throw e;
  }

  const resetToken = generateResetToken(); // plain token
  const hashed = hashToken(resetToken); // stored hashed
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  await prisma.user.update({
    where: { user_id: userId },
    data: {
      reset_token: hashed,
      reset_token_expires: expiresAt,
    },
  });

  const resetUrl = `${
    process.env.ERP_FRONTEND_ORIGIN || process.env.ADMIN_FRONTEND_ORIGIN
  }/reset-password?token=${resetToken}&uid=${userId}`;

  // Build email HTML (small template)
  const html = `
    <div style="font-family: Arial, sans-serif; padding: 20px; background:#f6f7fb;">
      <div style="max-width:600px;margin:0 auto;background:white;padding:24px;border-radius:12px;">
        <h2 style="color:#000060">Reset your password</h2>
        <p>Hello ${user.full_name || user.email},</p>
        <p>We received a request to reset your password. Click the button below to set a new password. This link will expire in 15 minutes.</p>
        <div style="text-align:center;margin:24px 0;">
          <a href="${resetUrl}" style="background:#000060;color:white;padding:12px 20px;border-radius:8px;text-decoration:none;">Reset Password</a>
        </div>
        <p style="font-size:12px;color:#666">If you did not request this, ignore this email.</p>
      </div>
    </div>
  `;

  await sendMail(user.email, "Reset your password", html);

  // create activity log
  await prisma.activityLog.create({
    data: {
      activity_id: cryptoRandomUUID(),
      user_id: userId,
      action: "password_change",
      description: "Password reset link generated by cadmin",
      ip_address: actorCAdmin?.ip_address || null,
      user_agent: actorCAdmin?.user_agent || null,
    },
  });

  return { success: true, email: user.email };
}

/* ----------------- helpers ----------------- */

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

// cryptoRandomUUID shim to avoid Node < 14 mismatch
function cryptoRandomUUID() {
  if (typeof crypto !== "undefined" && crypto.randomUUID)
    return crypto.randomUUID();
  // fallback
  return require("crypto").randomUUID();
}
