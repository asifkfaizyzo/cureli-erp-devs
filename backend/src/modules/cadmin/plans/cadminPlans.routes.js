// Q:\PROJECTS\YourZeroesAndOnes\cureli\curely_erp\backend\src\modules\cadmin\plans\cadminPlans.routes.js


import express from "express";
import { requireCAdmin } from "../../../middleware/requireCAdmin.js";
import { validate } from "../../../middleware/validate.js";
import {
  createPlanSchema,
  updatePlanSchema,
  clonePlanSchema,
  listPlansQuerySchema,
} from "./cadminPlans.schema.js";
import {
  listPlansController,
  getPlanStatsController,
  getPlanByIdController,
  createPlanController,
  updatePlanController,
  activatePlanController,
  suspendPlanController,
  reactivatePlanController,
  clonePlanController,
  deletePlanController,
} from "./cadminPlans.controller.js";

const router = express.Router();

// All routes require admin authentication
router.use(requireCAdmin);

// ============================================
// READ OPERATIONS
// ============================================

// GET /cadmin/plans/stats
// Returns count of plans by status
// Must be before /:plan_id to avoid route conflict
router.get("/plans/stats", getPlanStatsController);

// GET /cadmin/plans
// List plans with filters, search, pagination
router.get(
  "/plans",
  validate(listPlansQuerySchema, "query"),
  listPlansController
);

// GET /cadmin/plans/:plan_id
// Get single plan with full details and subscriber count
router.get("/plans/:plan_id", getPlanByIdController);

// ============================================
// CREATE OPERATIONS
// ============================================

// POST /cadmin/plans
// Create new plan (always starts as DRAFT)
router.post(
  "/plans",
  validate(createPlanSchema),
  createPlanController
);

// ============================================
// UPDATE OPERATIONS
// ============================================

// PATCH /cadmin/plans/:plan_id
// Update plan details (DRAFT plans only)
router.patch(
  "/plans/:plan_id",
  validate(updatePlanSchema),
  updatePlanController
);

// ============================================
// LIFECYCLE TRANSITIONS
// ============================================

// POST /cadmin/plans/:plan_id/activate
// Transition: DRAFT -> ACTIVE
// Makes plan live and immutable
router.post("/plans/:plan_id/activate", activatePlanController);

// POST /cadmin/plans/:plan_id/suspend
// Transition: ACTIVE -> DEPRECATED (if has subscribers) or SUSPENDED (if no subscribers)
// Stops new subscriptions
router.post("/plans/:plan_id/suspend", suspendPlanController);

// POST /cadmin/plans/:plan_id/reactivate
// Transition: SUSPENDED -> ACTIVE
// Only if no active subscribers and name is available
router.post("/plans/:plan_id/reactivate", reactivatePlanController);

// POST /cadmin/plans/:plan_id/clone
// Creates a new DRAFT plan with copied values
// Works for any status
router.post(
  "/plans/:plan_id/clone",
  validate(clonePlanSchema),
  clonePlanController
);

// ============================================
// DELETE OPERATIONS
// ============================================

// DELETE /cadmin/plans/:plan_id
// Soft delete (DRAFT plans only)
router.delete("/plans/:plan_id", deletePlanController);

export default router;