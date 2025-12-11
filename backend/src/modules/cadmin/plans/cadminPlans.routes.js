// src/modules/cadmin/plans/cadminPlans.routes.js

import express from "express";
import { requireCAdmin } from "../../../middleware/requireCAdmin.js";
import {
  listPlansController,
  getPlanByIdController,
  createCustomPlanController,
  updatePlanController,
  togglePlanVisibilityController,
} from "./cadminPlans.controller.js";

const router = express.Router();

router.use(requireCAdmin);

// List all plans
router.get("/plans", listPlansController);

// Get single plan
router.get("/plans/:plan_id", getPlanByIdController);

// Create custom plan
router.post("/plans/custom", createCustomPlanController);

// Update plan
router.patch("/plans/:plan_id", updatePlanController);

// Toggle plan visibility
router.patch("/plans/:plan_id/visibility", togglePlanVisibilityController);

export default router;