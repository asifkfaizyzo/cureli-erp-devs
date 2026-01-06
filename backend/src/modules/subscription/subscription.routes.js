// backend/src/modules/subscription/subscription.routes.js

import express from "express";
import { requireAuth } from "../../middleware/auth.js";
import { requireRole } from "../../middleware/rbac.js";
import { validateBody } from "../../middleware/validate.js";
import {
  getPlansController,
  getUserDetailsController,
  selectPlanController,
  confirmPaymentController,
  subscriptionStatusController,
  subscriptionHistoryController,
  getMySubscription,
  changePlanController,
  previewPlanChangeController,
  getDowngradeComplianceController,
} from "./subscription.controller.js";
import {
  selectPlanSchema,
  confirmPaymentSchema,
  changePlanSchema,
} from "./subscription.schema.js";

const router = express.Router();

// Get all available plans
router.get("/plans", requireAuth, getPlansController);

// Get user details for Razorpay prefill
router.get("/user-details", requireAuth, getUserDetailsController);

// Select a plan (creates order for paid, activates for free)
router.post(
  "/select",
  requireAuth,
  validateBody(selectPlanSchema),
  selectPlanController
);

// Confirm payment after Razorpay checkout
router.post(
  "/confirm",
  requireAuth,
  validateBody(confirmPaymentSchema),
  confirmPaymentController
);

// Get current subscription status
router.get("/status", requireAuth, subscriptionStatusController);

// Get subscription history
router.get("/history", requireAuth, subscriptionHistoryController);

// Get my current subscription (enhanced with state)
router.get("/my", requireAuth, getMySubscription);

// Change subscription plan (upgrade or downgrade) - SA only
router.post(
  "/change",
  requireAuth,
  requireRole("super_admin"),
  validateBody(changePlanSchema),
  changePlanController
);

// Preview plan change
router.get(
  "/change/preview/:plan_id",
  requireAuth,
  requireRole("super_admin"),
  previewPlanChangeController
);

// Get compliance data for downgrade
router.get(
  "/downgrade/compliance/:plan_id",
  requireAuth,
  requireRole("super_admin"),
  getDowngradeComplianceController
);

export default router;