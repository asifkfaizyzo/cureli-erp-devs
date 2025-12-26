// src/modules/branches/branches.routes.js

import { Router } from "express";
import { requireAuth } from "../../middleware/auth.js";
import { requirePermission } from "../../middleware/rbac.js";
import { validate } from "../../middleware/validate.js";
import { PERMISSIONS } from "../../config/permissions.js";
import {
  getBranchesController,
  getBranchesDropdownController,
  getBranchController,
  switchBranchController,
  getCurrentBranchController,
} from "./branches.controller.js";
import { switchBranchSchema } from "./branches.schema.js";

const router = Router();

// All routes require authentication
router.use(requireAuth);

/**
 * GET /api/branches
 * Get all branches (filtered by role)
 */
router.get(
  "/",
  requirePermission(PERMISSIONS.BRANCHES_VIEW),
  getBranchesController
);

/**
 * GET /api/branches/dropdown
 * Get branches for dropdown (Super Admin only)
 */
router.get(
  "/dropdown",
  requirePermission(PERMISSIONS.BRANCHES_SWITCH),
  getBranchesDropdownController
);

/**
 * GET /api/branches/current
 * Get current branch context
 */
router.get("/current", getCurrentBranchController);

/**
 * POST /api/branches/switch
 * Switch branch context (Super Admin only)
 */
router.post(
  "/switch",
  requirePermission(PERMISSIONS.BRANCHES_SWITCH),
  validate(switchBranchSchema),
  switchBranchController
);

/**
 * GET /api/branches/:branch_id
 * Get single branch
 */
router.get(
  "/:branch_id",
  requirePermission(PERMISSIONS.BRANCHES_VIEW),
  getBranchController
);

export default router;