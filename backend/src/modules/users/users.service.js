// src/modules/users/users.service.js

import prisma from "../../config/prisma.js";
import { hashPassword } from "../../utils/hash.js";

/**
 * ============================================
 * GET USERS (with filtering & pagination)
 * ============================================
 */
export async function getUsers({
  shop_id,
  branch_id,
  role,
  status,
  search,
  page,
  limit,
  sort_by,
  sort_order,
  requester_role,
  requester_branch_id,
}) {
  // Build where clause
  const where = {
    shop_id,
    // Exclude super_admin from list (they're shop owners, not "users" to manage)
    role: { in: ["branch_admin", "staff"] },
  };

  // Branch filtering
  // SA can filter by any branch or see all
  // BA can only see their own branch
  if (requester_role === "super_admin") {
    if (branch_id) {
      where.branch_id = branch_id;
    }
  } else {
    // BA forced to their own branch
    where.branch_id = requester_branch_id;
  }

  // Role filter
  if (role) {
    where.role = role;
  }

  // Status filter
  if (status === "active") {
    where.is_active = true;
  } else if (status === "inactive") {
    where.is_active = false;
  }

  // Search filter (name, username, phone)
  if (search) {
    where.OR = [
      { full_name: { contains: search, mode: "insensitive" } },
      { username: { contains: search, mode: "insensitive" } },
      { phone_number: { contains: search } },
    ];
  }

  // Get total count
  const total = await prisma.user.count({ where });

  // Get paginated results
  const users = await prisma.user.findMany({
    where,
    select: {
      user_id: true,
      full_name: true,
      first_name: true,
      last_name: true,
      username: true,
      phone_number: true,
      email: true,
      role: true,
      status: true,
      is_active: true,
      branch_id: true,
      created_at: true,
      last_login_at: true,
      branch: {
        select: {
          branch_id: true,
          branch_name: true,
        },
      },
    },
    orderBy: { [sort_by]: sort_order },
    skip: (page - 1) * limit,
    take: limit,
  });

  // Transform results
  const transformedUsers = users.map((user) => ({
    user_id: user.user_id,
    full_name: user.full_name,
    first_name: user.first_name,
    last_name: user.last_name,
    username: user.username,
    phone_number: user.phone_number,
    email: user.email,
    role: user.role,
    status: user.status,
    is_active: user.is_active,
    branch_id: user.branch_id,
    branch_name: user.branch?.branch_name || null,
    created_at: user.created_at,
    last_login_at: user.last_login_at,
  }));

  return {
    users: transformedUsers,
    pagination: {
      page,
      limit,
      total,
      total_pages: Math.ceil(total / limit),
    },
  };
}

/**
 * ============================================
 * GET SINGLE USER
 * ============================================
 */
export async function getUserById(user_id, shop_id) {
  const user = await prisma.user.findFirst({
    where: {
      user_id,
      shop_id,
    },
    select: {
      user_id: true,
      full_name: true,
      first_name: true,
      last_name: true,
      username: true,
      phone_number: true,
      email: true,
      role: true,
      status: true,
      is_active: true,
      branch_id: true,
      created_at: true,
      updated_at: true,
      last_login_at: true,
      branch: {
        select: {
          branch_id: true,
          branch_name: true,
        },
      },
    },
  });

  if (!user) return null;

  return {
    user_id: user.user_id,
    full_name: user.full_name,
    first_name: user.first_name,
    last_name: user.last_name,
    username: user.username,
    phone_number: user.phone_number,
    email: user.email,
    role: user.role,
    status: user.status,
    is_active: user.is_active,
    branch_id: user.branch_id,
    branch_name: user.branch?.branch_name || null,
    created_at: user.created_at,
    updated_at: user.updated_at,
    last_login_at: user.last_login_at,
  };
}

/**
 * ============================================
 * GET USER LIMITS (usage vs plan)
 * ============================================
 */
export async function getUserLimits(shop_id) {
  // Get shop with subscription
  const shop = await prisma.shop.findUnique({
    where: { shop_id },
    include: {
      currentSubscription: true,
      _count: {
        select: {
          users: {
            where: {
              is_active: true,
              role: { in: ["staff", "branch_admin"] },
            },
          },
        },
      },
    },
  });

  if (!shop) {
    throw new Error("Shop not found");
  }

  const subscription = shop.currentSubscription;

  if (!subscription) {
    return {
      current_count: shop._count.users,
      max_allowed: 0,
      can_add: false,
      remaining: 0,
    };
  }

  const maxAllowed = subscription.user_limit_snapshot;
  const currentCount = shop._count.users;

  // -1 means unlimited
  const canAdd = maxAllowed === -1 || currentCount < maxAllowed;
  const remaining =
    maxAllowed === -1 ? -1 : Math.max(0, maxAllowed - currentCount);

  return {
    current_count: currentCount,
    max_allowed: maxAllowed,
    can_add: canAdd,
    remaining: remaining,
  };
}

/**
 * ============================================
 * CHECK USERNAME AVAILABILITY
 * ============================================
 */
export async function checkUsernameAvailability(
  username,
  exclude_user_id = null
) {
  const where = {
    username: username.toLowerCase(),
  };

  if (exclude_user_id) {
    where.user_id = { not: exclude_user_id };
  }

  const existingUser = await prisma.user.findFirst({
    where,
    select: { user_id: true },
  });

  return {
    available: !existingUser,
    username: username.toLowerCase(),
  };
}

/**
 * ============================================
 * CHECK PHONE AVAILABILITY
 * ============================================
 */
export async function checkPhoneAvailability(
  phone_number,
  exclude_user_id = null
) {
  const where = {
    phone_number,
  };

  if (exclude_user_id) {
    where.user_id = { not: exclude_user_id };
  }

  const existingUser = await prisma.user.findFirst({
    where,
    select: { user_id: true },
  });

  return {
    available: !existingUser,
    phone_number,
  };
}

/**
 * ============================================
 * CHECK IF BRANCH HAS BRANCH ADMIN
 * ============================================
 * Returns the existing BA if found, null otherwise
 */
export async function branchHasBranchAdmin(branch_id, exclude_user_id = null) {
  const where = {
    branch_id,
    role: "branch_admin",
    is_active: true,
  };

  if (exclude_user_id) {
    where.user_id = { not: exclude_user_id };
  }

  const existingBA = await prisma.user.findFirst({
    where,
    select: { user_id: true, full_name: true },
  });

  return existingBA;
}

/**
 * ============================================
 * CREATE USER
 * ============================================
 */
export async function createUser({
  shop_id,
  branch_id,
  full_name,
  phone_number,
  username,
  password,
  role,
  email,
}) {
  // Validate branch belongs to shop
  const branch = await prisma.branch.findFirst({
    where: {
      branch_id,
      shop_id,
      is_active: true,
    },
  });

  if (!branch) {
    const err = new Error("Branch not found or inactive");
    err.code = "INVALID_BRANCH";
    throw err;
  }

  // Check plan limits
  const limits = await getUserLimits(shop_id);
  if (!limits.can_add) {
    const err = new Error(
      `User limit reached. Your plan allows ${limits.max_allowed} users.`
    );
    err.code = "USER_LIMIT_EXCEEDED";
    throw err;
  }

  // ============================================
  // CHECK: Only one Branch Admin per branch
  // ============================================
  if (role === "branch_admin") {
    const existingBA = await branchHasBranchAdmin(branch_id);
    if (existingBA) {
      const err = new Error(
        `This branch already has a Branch Admin (${existingBA.full_name}). Only one Branch Admin is allowed per branch.`
      );
      err.code = "BRANCH_ADMIN_EXISTS";
      throw err;
    }
  }

  // Check username availability
  const usernameCheck = await checkUsernameAvailability(username);
  if (!usernameCheck.available) {
    const err = new Error("Username is already taken");
    err.code = "USERNAME_TAKEN";
    throw err;
  }

  // Check phone availability
  const phoneCheck = await checkPhoneAvailability(phone_number);
  if (!phoneCheck.available) {
    const err = new Error("Phone number is already registered");
    err.code = "PHONE_TAKEN";
    throw err;
  }

  // Hash password
  const password_hash = await hashPassword(password);

  // Parse name
  const nameParts = full_name.trim().split(/\s+/);
  const first_name = nameParts[0];
  const last_name = nameParts.slice(1).join(" ") || "";

  // Create user
  const user = await prisma.user.create({
    data: {
      shop_id,
      branch_id,
      first_name,
      last_name,
      full_name: full_name.trim(),
      username: username.toLowerCase(),
      phone_number,
      email: email || null,
      password_hash,
      login_provider: "password",
      role,
      status: "verified",
      is_active: true,
      onboarding_step: 12, // Completed
    },
    select: {
      user_id: true,
      full_name: true,
      username: true,
      phone_number: true,
      email: true,
      role: true,
      branch_id: true,
      is_active: true,
      created_at: true,
    },
  });

  return user;
}

/**
 * ============================================
 * UPDATE USER
 * ============================================
 */
export async function updateUser(user_id, shop_id, updates) {
  // Get existing user
  const existingUser = await prisma.user.findFirst({
    where: {
      user_id,
      shop_id,
    },
  });

  if (!existingUser) {
    const err = new Error("User not found");
    err.code = "USER_NOT_FOUND";
    throw err;
  }

  // Cannot update super_admin
  if (existingUser.role === "super_admin") {
    const err = new Error("Cannot modify super admin through this endpoint");
    err.code = "CANNOT_MODIFY_SA";
    throw err;
  }

  // Build update data
  const updateData = {};

  // Name update
  if (updates.full_name) {
    const nameParts = updates.full_name.trim().split(/\s+/);
    updateData.first_name = nameParts[0];
    updateData.last_name = nameParts.slice(1).join(" ") || "";
    updateData.full_name = updates.full_name.trim();
  }

  // Phone update
  if (
    updates.phone_number &&
    updates.phone_number !== existingUser.phone_number
  ) {
    const phoneCheck = await checkPhoneAvailability(
      updates.phone_number,
      user_id
    );
    if (!phoneCheck.available) {
      const err = new Error("Phone number is already registered");
      err.code = "PHONE_TAKEN";
      throw err;
    }
    updateData.phone_number = updates.phone_number;
  }

  // Username update
  if (updates.username && updates.username !== existingUser.username) {
    const usernameCheck = await checkUsernameAvailability(
      updates.username,
      user_id
    );
    if (!usernameCheck.available) {
      const err = new Error("Username is already taken");
      err.code = "USERNAME_TAKEN";
      throw err;
    }
    updateData.username = updates.username.toLowerCase();
  }

  // Email update
  if (updates.email !== undefined) {
    updateData.email = updates.email || null;
  }

  // ============================================
  // Role update (SA only - with BA limit check)
  // ============================================
  if (updates.role && updates.role !== existingUser.role) {
    // If changing TO branch_admin, check if branch already has one
    if (updates.role === "branch_admin") {
      const targetBranchId = updates.branch_id || existingUser.branch_id;
      const existingBA = await branchHasBranchAdmin(targetBranchId, user_id);
      if (existingBA) {
        const err = new Error(
          `This branch already has a Branch Admin (${existingBA.full_name}). Only one Branch Admin is allowed per branch.`
        );
        err.code = "BRANCH_ADMIN_EXISTS";
        throw err;
      }
    }
    updateData.role = updates.role;
  }

  // Branch update (SA only)
  if (updates.branch_id && updates.branch_id !== existingUser.branch_id) {
    // Validate branch
    const branch = await prisma.branch.findFirst({
      where: {
        branch_id: updates.branch_id,
        shop_id,
        is_active: true,
      },
    });

    if (!branch) {
      const err = new Error("Branch not found or inactive");
      err.code = "INVALID_BRANCH";
      throw err;
    }

    // If user is/will be branch_admin, check target branch
    const finalRole = updates.role || existingUser.role;
    if (finalRole === "branch_admin") {
      const existingBA = await branchHasBranchAdmin(updates.branch_id, user_id);
      if (existingBA) {
        const err = new Error(
          `Target branch already has a Branch Admin (${existingBA.full_name}). Only one Branch Admin is allowed per branch.`
        );
        err.code = "BRANCH_ADMIN_EXISTS";
        throw err;
      }
    }

    updateData.branch_id = updates.branch_id;
  }

  // Active status update (SA only)
  if (updates.is_active !== undefined) {
    updateData.is_active = updates.is_active;

    // If reactivating, set status back to verified
    if (updates.is_active === true) {
      updateData.status = "verified";
    } else {
      updateData.status = "inactive";
    }
  }

  // Perform update
  const updatedUser = await prisma.user.update({
    where: { user_id },
    data: updateData,
    select: {
      user_id: true,
      full_name: true,
      username: true,
      phone_number: true,
      email: true,
      role: true,
      branch_id: true,
      is_active: true,
      updated_at: true,
      branch: {
        select: {
          branch_name: true,
        },
      },
    },
  });

  return {
    ...updatedUser,
    branch_name: updatedUser.branch?.branch_name || null,
  };
}

/**
 * ============================================
 * DELETE (DEACTIVATE) USER
 * ============================================
 */
export async function deleteUser(user_id, shop_id, requester_user_id) {
  // Get user
  const user = await prisma.user.findFirst({
    where: {
      user_id,
      shop_id,
    },
    include: {
      shop: {
        select: {
          owner_user_id: true,
        },
      },
    },
  });

  if (!user) {
    const err = new Error("User not found");
    err.code = "USER_NOT_FOUND";
    throw err;
  }

  // Cannot delete self
  if (user_id === requester_user_id) {
    const err = new Error("Cannot deactivate your own account");
    err.code = "CANNOT_DELETE_SELF";
    throw err;
  }

  // Cannot delete shop owner
  if (user.shop.owner_user_id === user_id) {
    const err = new Error("Cannot deactivate shop owner");
    err.code = "CANNOT_DELETE_OWNER";
    throw err;
  }

  // Cannot delete super_admin
  if (user.role === "super_admin") {
    const err = new Error("Cannot deactivate super admin");
    err.code = "CANNOT_DELETE_SA";
    throw err;
  }

  // Soft delete
  await prisma.user.update({
    where: { user_id },
    data: {
      is_active: false,
      status: "inactive",
    },
  });

  // Invalidate all sessions
  await prisma.userSession.updateMany({
    where: {
      user_id,
      is_active: true,
    },
    data: {
      is_active: false,
      ended_at: new Date(),
      ended_reason: "admin_force",
    },
  });

  return { success: true };
}

/**
 * ============================================
 * REACTIVATE USER
 * ============================================
 */
export async function reactivateUser(user_id, shop_id) {
  const user = await prisma.user.findFirst({
    where: {
      user_id,
      shop_id,
    },
  });

  if (!user) {
    const err = new Error("User not found");
    err.code = "USER_NOT_FOUND";
    throw err;
  }

  if (user.is_active) {
    const err = new Error("User is already active");
    err.code = "ALREADY_ACTIVE";
    throw err;
  }

  // If user is branch_admin, check if branch already has one
  if (user.role === "branch_admin") {
    const existingBA = await branchHasBranchAdmin(user.branch_id, user_id);
    if (existingBA) {
      const err = new Error(
        `Cannot reactivate. Branch already has a Branch Admin (${existingBA.full_name}).`
      );
      err.code = "BRANCH_ADMIN_EXISTS";
      throw err;
    }
  }

  // Check plan limits
  const limits = await getUserLimits(shop_id);
  if (!limits.can_add) {
    const err = new Error(
      `Cannot reactivate. User limit reached (${limits.max_allowed} users).`
    );
    err.code = "USER_LIMIT_EXCEEDED";
    throw err;
  }

  const updatedUser = await prisma.user.update({
    where: { user_id },
    data: {
      is_active: true,
      status: "verified",
    },
    select: {
      user_id: true,
      full_name: true,
      is_active: true,
    },
  });

  return updatedUser;
}

/**
 * ============================================
 * RESET PASSWORD
 * ============================================
 */
export async function resetUserPassword(user_id, shop_id, new_password) {
  // Get user
  const user = await prisma.user.findFirst({
    where: {
      user_id,
      shop_id,
    },
  });

  if (!user) {
    const err = new Error("User not found");
    err.code = "USER_NOT_FOUND";
    throw err;
  }

  // Cannot reset super_admin password through this endpoint
  if (user.role === "super_admin") {
    const err = new Error(
      "Cannot reset super admin password through this endpoint"
    );
    err.code = "CANNOT_RESET_SA";
    throw err;
  }

  // Hash new password
  const password_hash = await hashPassword(new_password);

  // Update password
  await prisma.user.update({
    where: { user_id },
    data: { password_hash },
  });

  // Invalidate all sessions (force re-login)
  await prisma.userSession.updateMany({
    where: {
      user_id,
      is_active: true,
    },
    data: {
      is_active: false,
      ended_at: new Date(),
      ended_reason: "admin_force",
    },
  });

  return { success: true };
}

/**
 * ============================================
 * HELPER: Check if user belongs to branch
 * ============================================
 */
export async function userBelongsToBranch(user_id, branch_id) {
  const user = await prisma.user.findFirst({
    where: {
      user_id,
      branch_id,
    },
    select: { user_id: true },
  });

  return !!user;
}