// src/modules/branches/branches.controller.js

import { success, fail } from "../../utils/response.js";
import {
  getBranchesByShop,
  getBranchById,
  getBranchesForDropdown,
  canAccessBranch,
} from "./branches.service.js";

/**
 * GET /api/branches
 * Get all branches for the user's shop
 */
export async function getBranchesController(req, res) {
  try {
    const { shop_id, role, branch_id } = req.user;
    const { include_inactive } = req.query;

    if (!shop_id) {
      return fail(res, "Shop ID not found", 400);
    }

    // Super admin gets all branches
    if (role === "super_admin") {
      const branches = await getBranchesByShop(shop_id, {
        include_inactive: include_inactive === "true",
      });

      return success(res, {
        branches,
        total: branches.length,
      });
    }

    // Other roles only see their own branch
    if (!branch_id) {
      return success(res, {
        branches: [],
        total: 0,
      });
    }

    const branch = await getBranchById(branch_id, shop_id);

    return success(res, {
      branches: branch ? [branch] : [],
      total: branch ? 1 : 0,
    });
  } catch (error) {
    console.error("Get branches error:", error);
    return fail(res, "Failed to fetch branches", 500);
  }
}

/**
 * GET /api/branches/dropdown
 * Get minimal branch data for dropdown (Super Admin only)
 */
export async function getBranchesDropdownController(req, res) {
  try {
    const { shop_id, role } = req.user;

    if (!shop_id) {
      return fail(res, "Shop ID not found", 400);
    }

    if (role !== "super_admin") {
      return fail(res, "Access denied", 403);
    }

    const branches = await getBranchesForDropdown(shop_id);

    return success(res, { branches });
  } catch (error) {
    console.error("Get branches dropdown error:", error);
    return fail(res, "Failed to fetch branches", 500);
  }
}

/**
 * GET /api/branches/:branch_id
 * Get a single branch by ID
 */
export async function getBranchController(req, res) {
  try {
    const { branch_id } = req.params;
    const { shop_id, role, branch_id: userBranchId } = req.user;

    // Check access
    if (role !== "super_admin" && userBranchId !== branch_id) {
      return fail(res, "Access denied to this branch", 403);
    }

    const branch = await getBranchById(branch_id, shop_id);

    if (!branch) {
      return fail(res, "Branch not found", 404);
    }

    return success(res, { branch });
  } catch (error) {
    console.error("Get branch error:", error);
    return fail(res, "Failed to fetch branch", 500);
  }
}

/**
 * POST /api/branches/switch
 * Switch branch context (Super Admin only)
 */
export async function switchBranchController(req, res) {
  try {
    const { branch_id } = req.validated || req.body;
    const { user_id, shop_id, role } = req.user;

    // Only super admin can switch branches
    if (role !== "super_admin") {
      return fail(res, "Only Super Admin can switch branches", 403);
    }

    // Validate branch access
    const hasAccess = await canAccessBranch(user_id, branch_id, shop_id);

    if (!hasAccess) {
      return fail(res, "Cannot access this branch", 403);
    }

    // Get branch details
    const branch = await getBranchById(branch_id, shop_id);

    if (!branch) {
      return fail(res, "Branch not found", 404);
    }

    if (!branch.is_active) {
      return fail(res, "Cannot switch to inactive branch", 400);
    }

    return success(
      res,
      {
        branch_id: branch.branch_id,
        branch_name: branch.branch_name,
        is_main: branch.is_main,
      },
      "Branch switched successfully"
    );
  } catch (error) {
    console.error("Switch branch error:", error);
    return fail(res, "Failed to switch branch", 500);
  }
}

/**
 * GET /api/branches/current
 * Get current branch context
 */
export async function getCurrentBranchController(req, res) {
  try {
    const { shop_id, branch_id } = req.user;

    if (!branch_id) {
      return success(res, {
        branch: null,
        message: "No branch selected",
      });
    }

    const branch = await getBranchById(branch_id, shop_id);

    return success(res, { branch });
  } catch (error) {
    console.error("Get current branch error:", error);
    return fail(res, "Failed to fetch current branch", 500);
  }
}