// src/modules/branches/branches.service.js

import prisma from "../../config/prisma.js";

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
          users: true,
        },
      },
    },
    orderBy: [
      { branch_type: "asc" }, // "main" comes before other types alphabetically
      { branch_name: "asc" },
    ],
  });

  return branches.map((branch) => ({
    ...branch,
    is_main: branch.branch_type === "main", // Derive is_main from branch_type
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
    },
  });

  if (!branch) return null;

  return {
    ...branch,
    is_main: branch.branch_type === "main", // Derive is_main from branch_type
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
      { branch_type: "asc" }, // "main" comes first
      { branch_name: "asc" },
    ],
  });

  // Transform to add is_main for frontend compatibility
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
  // Get user
  const user = await prisma.user.findUnique({
    where: { user_id },
    select: {
      role: true,
      shop_id: true,
      branch_id: true,
    },
  });

  if (!user) return false;

  // Super admin can access any branch in their shop
  if (user.role === "super_admin" && user.shop_id === shop_id) {
    // Verify branch belongs to shop
    const branch = await prisma.branch.findFirst({
      where: {
        branch_id,
        shop_id,
        is_active: true,
      },
    });
    return !!branch;
  }

  // Other users can only access their assigned branch
  return user.branch_id === branch_id;
}