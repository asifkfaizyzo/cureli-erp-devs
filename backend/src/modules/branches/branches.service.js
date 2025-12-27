// src/modules/branches/branches.service.js

import prisma from "../../config/prisma.js";

/**
 * ============================================
 * EXISTING FUNCTIONS (keep as-is)
 * ============================================
 */

/**
 * Get all branches for a shop
 */
export async function getBranchesByShop(shop_id, options = {}) {
  const { include_inactive = false } = options;

  const where = { shop_id };

  if (!include_inactive) {
    where.is_active = true;
  }

  const branches = await prisma.branch.findMany({
    where,
    select: {
      branch_id: true,
      branch_name: true,
      branch_type: true,
      address_line_1: true,
      address_line_2: true,
      city: true,
      state: true,
      pincode: true,
      contact_number: true,
      alternate_number: true,
      is_active: true,
      created_at: true,
      _count: {
        select: {
          users: {
            where: { is_active: true },
          },
        },
      },
    },
    orderBy: [
      { branch_type: "asc" },
      { branch_name: "asc" },
    ],
  });

  return branches.map((branch) => ({
    ...branch,
    is_main: branch.branch_type === "main",
    user_count: branch._count.users,
    _count: undefined,
  }));
}

/**
 * Get a single branch by ID
 */
export async function getBranchById(branch_id, shop_id) {
  const branch = await prisma.branch.findFirst({
    where: {
      branch_id,
      shop_id,
    },
    select: {
      branch_id: true,
      branch_name: true,
      branch_type: true,
      address_line_1: true,
      address_line_2: true,
      city: true,
      state: true,
      pincode: true,
      contact_number: true,
      alternate_number: true,
      is_active: true,
      created_at: true,
      updated_at: true,
      _count: {
        select: {
          users: {
            where: { is_active: true },
          },
        },
      },
    },
  });

  if (!branch) return null;

  return {
    ...branch,
    is_main: branch.branch_type === "main",
    user_count: branch._count.users,
    _count: undefined,
  };
}

/**
 * Get branch summary for header dropdown (minimal data)
 */
export async function getBranchesForDropdown(shop_id) {
  const branches = await prisma.branch.findMany({
    where: {
      shop_id,
      is_active: true,
    },
    select: {
      branch_id: true,
      branch_name: true,
      branch_type: true,
      is_active: true,
    },
    orderBy: [
      { branch_type: "asc" },
      { branch_name: "asc" },
    ],
  });

  return branches.map((branch) => ({
    branch_id: branch.branch_id,
    branch_name: branch.branch_name,
    is_main: branch.branch_type === "main",
    is_active: branch.is_active,
  }));
}

/**
 * Validate if user can access a branch
 */
export async function canAccessBranch(user_id, branch_id, shop_id) {
  const user = await prisma.user.findUnique({
    where: { user_id },
    select: {
      role: true,
      shop_id: true,
      branch_id: true,
    },
  });

  if (!user) return false;

  if (user.role === "super_admin" && user.shop_id === shop_id) {
    const branch = await prisma.branch.findFirst({
      where: {
        branch_id,
        shop_id,
        is_active: true,
      },
    });
    return !!branch;
  }

  return user.branch_id === branch_id;
}

/**
 * ============================================
 * NEW FUNCTIONS
 * ============================================
 */

/**
 * Get branch limits (usage vs plan)
 */
export async function getBranchLimits(shop_id) {
  const shop = await prisma.shop.findUnique({
    where: { shop_id },
    include: {
      currentSubscription: true,
      _count: {
        select: {
          branches: {
            where: { is_active: true },
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
      current_count: shop._count.branches,
      max_allowed: 0,
      can_add: false,
      remaining: 0,
    };
  }

  const maxAllowed = subscription.branch_limit_snapshot;
  const currentCount = shop._count.branches;

  // -1 means unlimited
  const canAdd = maxAllowed === -1 || currentCount < maxAllowed;
  const remaining = maxAllowed === -1 ? -1 : Math.max(0, maxAllowed - currentCount);

  return {
    current_count: currentCount,
    max_allowed: maxAllowed,
    can_add: canAdd,
    remaining: remaining,
  };
}

/**
 * Check if branch name is unique within shop
 */
export async function isBranchNameUnique(shop_id, branch_name, exclude_branch_id = null) {
  const where = {
    shop_id,
    branch_name: {
      equals: branch_name.trim(),
      mode: "insensitive",
    },
    is_active: true,
  };

  if (exclude_branch_id) {
    where.branch_id = { not: exclude_branch_id };
  }

  const existing = await prisma.branch.findFirst({
    where,
    select: { branch_id: true },
  });

  return !existing;
}

/**
 * Create a new branch
 */
export async function createBranch(shop_id, data) {
  // Check plan limits
  const limits = await getBranchLimits(shop_id);
  if (!limits.can_add) {
    const err = new Error(
      `Branch limit reached. Your plan allows ${limits.max_allowed} branches.`
    );
    err.code = "BRANCH_LIMIT_EXCEEDED";
    throw err;
  }

  // Check name uniqueness
  const isUnique = await isBranchNameUnique(shop_id, data.branch_name);
  if (!isUnique) {
    const err = new Error("A branch with this name already exists");
    err.code = "BRANCH_NAME_EXISTS";
    throw err;
  }

  // Check if this is the first branch (make it main)
  const existingBranches = await prisma.branch.count({
    where: { shop_id, is_active: true },
  });
  const isFirstBranch = existingBranches === 0;

  // Create branch
  const branch = await prisma.branch.create({
    data: {
      shop_id,
      branch_name: data.branch_name.trim(),
      branch_type: isFirstBranch ? "main" : "branch",
      address_line_1: data.address_line_1 || null,
      address_line_2: data.address_line_2 || null,
      city: data.city || null,
      state: data.state || null,
      pincode: data.pincode || null,
      contact_number: data.contact_number || null,
      alternate_number: data.alternate_number || null,
      is_active: true,
    },
    select: {
      branch_id: true,
      branch_name: true,
      branch_type: true,
      address_line_1: true,
      address_line_2: true,
      city: true,
      state: true,
      pincode: true,
      contact_number: true,
      alternate_number: true,
      is_active: true,
      created_at: true,
    },
  });

  return {
    ...branch,
    is_main: branch.branch_type === "main",
    user_count: 0,
  };
}

/**
 * Update an existing branch
 */
export async function updateBranch(branch_id, shop_id, data) {
  // Get existing branch
  const existingBranch = await prisma.branch.findFirst({
    where: {
      branch_id,
      shop_id,
    },
  });

  if (!existingBranch) {
    const err = new Error("Branch not found");
    err.code = "BRANCH_NOT_FOUND";
    throw err;
  }

  // Check name uniqueness if name is being changed
  if (data.branch_name && data.branch_name.trim().toLowerCase() !== existingBranch.branch_name.toLowerCase()) {
    const isUnique = await isBranchNameUnique(shop_id, data.branch_name, branch_id);
    if (!isUnique) {
      const err = new Error("A branch with this name already exists");
      err.code = "BRANCH_NAME_EXISTS";
      throw err;
    }
  }

  // Build update data
  const updateData = {};

  if (data.branch_name !== undefined) {
    updateData.branch_name = data.branch_name.trim();
  }
  if (data.address_line_1 !== undefined) {
    updateData.address_line_1 = data.address_line_1 || null;
  }
  if (data.address_line_2 !== undefined) {
    updateData.address_line_2 = data.address_line_2 || null;
  }
  if (data.city !== undefined) {
    updateData.city = data.city || null;
  }
  if (data.state !== undefined) {
    updateData.state = data.state || null;
  }
  if (data.pincode !== undefined) {
    updateData.pincode = data.pincode || null;
  }
  if (data.contact_number !== undefined) {
    updateData.contact_number = data.contact_number || null;
  }
  if (data.alternate_number !== undefined) {
    updateData.alternate_number = data.alternate_number || null;
  }

  // Update branch
  const updatedBranch = await prisma.branch.update({
    where: { branch_id },
    data: updateData,
    select: {
      branch_id: true,
      branch_name: true,
      branch_type: true,
      address_line_1: true,
      address_line_2: true,
      city: true,
      state: true,
      pincode: true,
      contact_number: true,
      alternate_number: true,
      is_active: true,
      updated_at: true,
      _count: {
        select: {
          users: {
            where: { is_active: true },
          },
        },
      },
    },
  });

  return {
    ...updatedBranch,
    is_main: updatedBranch.branch_type === "main",
    user_count: updatedBranch._count.users,
    _count: undefined,
  };
}

/**
 * Get active users in a branch
 */
export async function getBranchActiveUsers(branch_id) {
  const users = await prisma.user.findMany({
    where: {
      branch_id,
      is_active: true,
    },
    select: {
      user_id: true,
      full_name: true,
      role: true,
    },
  });

  return users;
}

/**
 * Delete (deactivate) a branch
 */
export async function deleteBranch(branch_id, shop_id) {
  // Get branch
  const branch = await prisma.branch.findFirst({
    where: {
      branch_id,
      shop_id,
    },
    include: {
      _count: {
        select: {
          users: {
            where: { is_active: true },
          },
        },
      },
    },
  });

  if (!branch) {
    const err = new Error("Branch not found");
    err.code = "BRANCH_NOT_FOUND";
    throw err;
  }

  // Cannot delete main branch
  if (branch.branch_type === "main") {
    const err = new Error("Cannot delete the main branch");
    err.code = "CANNOT_DELETE_MAIN";
    throw err;
  }

  // Check for active users
  if (branch._count.users > 0) {
    const err = new Error(
      `Cannot delete branch with active users. Please reassign ${branch._count.users} user(s) first.`
    );
    err.code = "BRANCH_HAS_USERS";
    err.user_count = branch._count.users;
    throw err;
  }

  // Soft delete
  await prisma.branch.update({
    where: { branch_id },
    data: { is_active: false },
  });

  return { success: true };
}

/**
 * Get branches for user reassignment dropdown
 * Returns all active branches except the one being deleted
 */
export async function getBranchesForReassignment(shop_id, exclude_branch_id) {
  const branches = await prisma.branch.findMany({
    where: {
      shop_id,
      is_active: true,
      branch_id: { not: exclude_branch_id },
    },
    select: {
      branch_id: true,
      branch_name: true,
      branch_type: true,
    },
    orderBy: [
      { branch_type: "asc" },
      { branch_name: "asc" },
    ],
  });

  return branches.map((b) => ({
    ...b,
    is_main: b.branch_type === "main",
  }));
}