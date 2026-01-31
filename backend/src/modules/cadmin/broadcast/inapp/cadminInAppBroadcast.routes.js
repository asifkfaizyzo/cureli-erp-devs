// ============================================
// CADMIN IN-APP BROADCAST ROUTES
// ============================================

import express from "express";
import { requireCAdmin } from "../../../../middleware/requireCAdmin.js";
import {
  previewRecipientCountController,
  sendImmediateController,
  createDraftController,
  updateDraftController,
  scheduleBroadcastController,
  cancelOrDeleteController,
  getDraftsController,
  getScheduledController,
  getHistoryController,
  getCampaignByIdController,
} from "./cadminInAppBroadcast.controller.js";
import {
  validatePreview,
  validateSendImmediate,
  validateCreateDraft,
  validateUpdateDraft,
  validateSchedule,
  validatePagination,
} from "./cadminInAppBroadcast.schema.js";

const router = express.Router();

// Preview recipient count
router.post(
  "/broadcast/inapp/preview",
  requireCAdmin,
  validatePreview,
  previewRecipientCountController,
);

// Send immediately (no campaign record)
router.post(
  "/broadcast/inapp/send-now",
  requireCAdmin,
  validateSendImmediate,
  sendImmediateController,
);

// Draft management
router.post(
  "/broadcast/inapp/draft",
  requireCAdmin,
  validateCreateDraft,
  createDraftController,
);

router.put(
  "/broadcast/inapp/:id",
  requireCAdmin,
  validateUpdateDraft,
  updateDraftController,
);

// Schedule a draft
router.post(
  "/broadcast/inapp/:id/schedule",
  requireCAdmin,
  validateSchedule,
  scheduleBroadcastController,
);

// Cancel scheduled or delete draft
router.delete("/broadcast/inapp/:id", requireCAdmin, cancelOrDeleteController);

// List views
router.get(
  "/broadcast/inapp/drafts",
  requireCAdmin,
  validatePagination,
  getDraftsController,
);

router.get(
  "/broadcast/inapp/scheduled",
  requireCAdmin,
  validatePagination,
  getScheduledController,
);

router.get(
  "/broadcast/inapp/history",
  requireCAdmin,
  validatePagination,
  getHistoryController,
);

// Get single campaign
router.get("/broadcast/inapp/:id", requireCAdmin, getCampaignByIdController);

export default router;
