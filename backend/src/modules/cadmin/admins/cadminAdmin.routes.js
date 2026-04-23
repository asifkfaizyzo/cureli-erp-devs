// backend/src/modules/cadmin/admins/cadminAdmin.routes.js

import express from "express";
import { requireCAdmin } from "../../../middleware/requireCAdmin.js";
import { requireCAdminPermission } from "../../../middleware/requireCAdminPermission.js";
import { CADMIN_PERMISSIONS } from "../../../config/cadminPermissions.js";
import {
  getAdminsController,
  getAdminByIdController,
  createAdminController,
  updateAdminController,
  createSuperAdminController,
  toggleSuperAdminAccessController,
  toggleAdminAccessController,
  getAdminActivityController,
} from "./cadminAdmin.controller.js";
import {
  validateGetAdminsQuery,
  validateCreateAdmin,
  validateUpdateAdmin,
  validateCreateSuperAdmin,
  validateToggleSuperAdminAccess,
  validateToggleAccess,
  validateGetActivityQuery,
} from "./cadminAdmin.schema.js";

const router = express.Router();

// GET /cadmin/admins
router.get(
  "/admins",
  requireCAdmin,
  requireCAdminPermission(CADMIN_PERMISSIONS.ADMINS_VIEW),
  validateGetAdminsQuery,
  getAdminsController,
);

// GET /cadmin/admins/:id
router.get(
  "/admins/:id",
  requireCAdmin,
  requireCAdminPermission(CADMIN_PERMISSIONS.ADMINS_VIEW_DETAIL),
  getAdminByIdController,
);

// POST /cadmin/admins
router.post(
  "/admins",
  requireCAdmin,
  requireCAdminPermission(CADMIN_PERMISSIONS.ADMINS_CREATE),
  validateCreateAdmin,
  createAdminController,
);

// PATCH /cadmin/admins/:id
router.patch(
  "/admins/:id",
  requireCAdmin,
  requireCAdminPermission(CADMIN_PERMISSIONS.ADMINS_EDIT),
  validateUpdateAdmin,
  updateAdminController,
);

// PATCH /cadmin/admins/:id/access
router.patch(
  "/admins/:id/access",
  requireCAdmin,
  requireCAdminPermission(CADMIN_PERMISSIONS.ADMINS_TOGGLE_ACCESS),
  validateToggleAccess,
  toggleAdminAccessController,
);

// GET /cadmin/admins/:id/activity
router.get(
  "/admins/:id/activity",
  requireCAdmin,
  requireCAdminPermission(CADMIN_PERMISSIONS.ADMINS_VIEW_ACTIVITY),
  validateGetActivityQuery,
  getAdminActivityController,
);
// POST /cadmin/admins/super
// Create a new Super Admin — only callable by existing Super Admins
// Note: this route MUST be defined before /admins/:id to avoid
// Express matching "super" as the :id param
router.post(
  "/admins/super",
  requireCAdmin,
  validateCreateSuperAdmin,
  createSuperAdminController,
);

// PATCH /cadmin/admins/:id/super-access
// Toggle Super Admin active status — requires secret
router.patch(
  "/admins/:id/super-access",
  requireCAdmin,
  validateToggleSuperAdminAccess,
  toggleSuperAdminAccessController,
);
export default router;
