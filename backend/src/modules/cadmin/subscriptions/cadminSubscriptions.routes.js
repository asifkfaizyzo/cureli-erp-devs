// src/modules/cadmin/subscriptions/cadminSubscriptions.routes.js

import express from "express";
import { requireCAdmin } from "../../../middleware/requireCAdmin.js";

import {
  getAtRiskController,
  getSubscriptionByIdController,
  sendReminderController,
  extendGraceController,
  forceSuspendController,
  reactivateController,
} from "./cadminSubscriptions.controller.js";

const router = express.Router();

// All routes require CAdmin authentication
router.use(requireCAdmin);

// ============================================
// GET ROUTES
// ============================================

// Get at-risk subscriptions overview (expiring, grace, suspended)
router.get("/subscriptions/at-risk", getAtRiskController);

// Get single subscription with full details
router.get("/subscriptions/:subscription_id", getSubscriptionByIdController);

// ============================================
// ACTION ROUTES
// ============================================

// Send payment reminder (email/sms)
router.post("/subscriptions/:subscription_id/remind", sendReminderController);

// Extend grace period
router.post("/subscriptions/:subscription_id/extend-grace", extendGraceController);

// Force suspend subscription
router.post("/subscriptions/:subscription_id/suspend", forceSuspendController);

// Reactivate suspended subscription
router.post("/subscriptions/:subscription_id/reactivate", reactivateController);

export default router;