//backend\src\modules\cadmin\admins\cadminAdmin.routes.js
import express from "express";
import { requireCAdmin } from "../../../middleware/requireCAdmin.js";
import {
  getAdminsController,
  getAdminByIdController,
  createAdminController,
  updateAdminController,
  toggleAdminAccessController,
  getAdminActivityController,
} from "./cadminAdmin.controller.js";
import {
  validateGetAdminsQuery,
  validateCreateAdmin,
  validateUpdateAdmin,
  validateToggleAccess,
  validateGetActivityQuery,
} from "./cadminAdmin.schema.js";

const router = express.Router();

// GET /cadmin/admins - List with pagination/filters
router.get("/admins", requireCAdmin, validateGetAdminsQuery, getAdminsController);

// GET /cadmin/admins/:id - Single admin with details
router.get("/admins/:id", requireCAdmin, getAdminByIdController);

// POST /cadmin/admins - Create new admin
router.post("/admins", requireCAdmin, validateCreateAdmin, createAdminController);

// PATCH /cadmin/admins/:id - Update profile/role
router.patch("/admins/:id", requireCAdmin, validateUpdateAdmin, updateAdminController);

// PATCH /cadmin/admins/:id/access - Toggle is_active
router.patch("/admins/:id/access", requireCAdmin, validateToggleAccess, toggleAdminAccessController);

// GET /cadmin/admins/:id/activity - Activity logs
router.get("/admins/:id/activity", requireCAdmin, validateGetActivityQuery, getAdminActivityController);

export default router;