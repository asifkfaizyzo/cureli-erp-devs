// backend/src/modules/enquiries/enquiries.routes.js
import { Router } from "express";
import rateLimit from "express-rate-limit";
import { validate } from "../../middleware/validate.js";
import { requireCAdmin } from "../../middleware/requireCAdmin.js";
import { requireCAdminPermission } from "../../middleware/requireCAdminPermission.js";
import { CADMIN_PERMISSIONS } from "../../config/cadminPermissions.js";
import {
  createEnquirySchema,
  replyEnquirySchema,
  updateEnquiryStatusSchema,
  listEnquiriesSchema,
  enquiryIdParamSchema,
} from "./enquiries.schema.js";
import {
  submitEnquiry,
  listEnquiries,
  getEnquiryDetails,
  replyToEnquiry,
  updateEnquiryStatus,
  getEnquiryStats,
  deleteEnquiry,
} from "./enquiries.controller.js";

const router = Router();

// Rate limiters
const enquirySubmitLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: "Too many enquiries submitted. Please try again in 15 minutes.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path.startsWith("/admin"),
});

const strictEnquiryLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: "Enquiry limit reached. Please try again later.",
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => req.path.startsWith("/admin"),
});

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC ROUTES
// No auth required — anyone can submit an enquiry
// ─────────────────────────────────────────────────────────────────────────────
router.post(
  "/",
  strictEnquiryLimiter,
  enquirySubmitLimiter,
  validate(createEnquirySchema, "body"),
  submitEnquiry
);

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN ROUTES
// All require: authenticated CAdmin + specific permission
// ─────────────────────────────────────────────────────────────────────────────
router.get(
  "/admin/list",
  requireCAdmin,
  requireCAdminPermission(CADMIN_PERMISSIONS.ENQUIRIES_VIEW),
  validate(listEnquiriesSchema, "query"),
  listEnquiries
);

router.get(
  "/admin/stats",
  requireCAdmin,
  requireCAdminPermission(CADMIN_PERMISSIONS.ENQUIRIES_VIEW_STATS),
  getEnquiryStats
);

router.get(
  "/admin/:enquiryId",
  requireCAdmin,
  requireCAdminPermission(CADMIN_PERMISSIONS.ENQUIRIES_VIEW_DETAIL),
  validate(enquiryIdParamSchema, "params"),
  getEnquiryDetails
);

router.post(
  "/admin/:enquiryId/reply",
  requireCAdmin,
  requireCAdminPermission(CADMIN_PERMISSIONS.ENQUIRIES_REPLY),
  validate(enquiryIdParamSchema, "params"),
  validate(replyEnquirySchema, "body"),
  replyToEnquiry
);

router.patch(
  "/admin/:enquiryId/status",
  requireCAdmin,
  requireCAdminPermission(CADMIN_PERMISSIONS.ENQUIRIES_UPDATE_STATUS),
  validate(enquiryIdParamSchema, "params"),
  validate(updateEnquiryStatusSchema, "body"),
  updateEnquiryStatus
);

router.delete(
  "/admin/:enquiryId",
  requireCAdmin,
  requireCAdminPermission(CADMIN_PERMISSIONS.ENQUIRIES_DELETE),
  validate(enquiryIdParamSchema, "params"),
  deleteEnquiry
);

export default router;