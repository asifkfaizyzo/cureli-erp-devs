// backend/src/modules/enquiries/enquiries.routes.js
import { Router } from "express";
import rateLimit from "express-rate-limit";
import { validate } from "../../middleware/validate.js";
import { requireCAdmin } from "../../middleware/requireCAdmin.js";
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

// Rate limiter for public enquiry submission - 5 per 15 minutes
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
  // Use default keyGenerator (handles IPv6 properly) or remove this entirely
  // The default already uses req.ip with proper IPv6 handling
});

// Stricter limiter for spam prevention - 10 per hour
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
  // Use default keyGenerator (handles IPv6 properly) or remove this entirely
});

// PUBLIC ROUTES
router.post(
  "/",
  strictEnquiryLimiter,
  enquirySubmitLimiter,
  validate(createEnquirySchema, "body"),
  submitEnquiry
);

// ADMIN ROUTES
router.get(
  "/admin/list",
  requireCAdmin,
  validate(listEnquiriesSchema, "query"),
  listEnquiries
);

router.get("/admin/stats", requireCAdmin, getEnquiryStats);

router.get(
  "/admin/:enquiryId",
  requireCAdmin,
  validate(enquiryIdParamSchema, "params"),
  getEnquiryDetails
);

router.post(
  "/admin/:enquiryId/reply",
  requireCAdmin,
  validate(enquiryIdParamSchema, "params"),
  validate(replyEnquirySchema, "body"),
  replyToEnquiry
);

router.patch(
  "/admin/:enquiryId/status",
  requireCAdmin,
  validate(enquiryIdParamSchema, "params"),
  validate(updateEnquiryStatusSchema, "body"),
  updateEnquiryStatus
);

router.delete(
  "/admin/:enquiryId",
  requireCAdmin,
  validate(enquiryIdParamSchema, "params"),
  deleteEnquiry
);

export default router;