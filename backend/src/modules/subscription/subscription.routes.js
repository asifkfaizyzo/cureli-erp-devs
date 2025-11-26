import express from "express";
import { requireAuth } from "../../middleware/auth.js";
import { validateBody } from "../../middleware/validate.js";
import {
  getPlansController,
  selectPlanController,
  subscriptionStatusController,
  subscriptionHistoryController,
  getMySubscription,
} from "./subscription.controller.js";
import { selectPlanSchema } from "./subscription.schema.js";

const router = express.Router();

router.get("/plans", requireAuth, getPlansController);
router.post("/select", requireAuth, validateBody(selectPlanSchema), selectPlanController);
router.get("/status", requireAuth, subscriptionStatusController);
router.get("/history", requireAuth, subscriptionHistoryController);
router.get("/my", requireAuth, getMySubscription);
export default router;
