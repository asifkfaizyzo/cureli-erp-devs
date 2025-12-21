import express from "express";
import { requireAuth } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import {
  getPlansController,
  getUserDetailsController,
  selectPlanController,
  confirmPaymentController,
  subscriptionStatusController,
  subscriptionHistoryController,
  getMySubscription,
} from "./subscription.controller.js";
import { selectPlanSchema, confirmPaymentSchema } from "./subscription.schema.js";

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

// Get my current subscription
router.get("/my", requireAuth, getMySubscription);

export default router;