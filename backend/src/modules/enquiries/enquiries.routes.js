import { Router } from "express";
import { validate } from "../../middleware/validate.js";
import { requireCAdmin } from "../../middleware/requireCAdmin.js";
import {
  createEnquirySchema,
  replyEnquirySchema,
  updateEnquiryStatusSchema,
  listEnquiriesSchema,
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

// ============================================
// PUBLIC ROUTES (No Auth)
// ============================================

// POST /api/enquiries - Submit new enquiry
router.post("/", validate(createEnquirySchema), submitEnquiry);

// ============================================
// ADMIN ROUTES (Requires CAdmin Auth)
// ============================================

// GET /api/enquiries/admin/list - List all enquiries
router.get(
  "/admin/list",
  requireCAdmin,
  validate(listEnquiriesSchema),
  listEnquiries
);

// GET /api/enquiries/admin/stats - Get enquiry statistics
router.get("/admin/stats", requireCAdmin, getEnquiryStats);

// GET /api/enquiries/admin/:enquiryId - Get enquiry details
router.get("/admin/:enquiryId", requireCAdmin, getEnquiryDetails);

// POST /api/enquiries/admin/:enquiryId/reply - Reply to enquiry
router.post(
  "/admin/:enquiryId/reply",
  requireCAdmin,
  validate(replyEnquirySchema),
  replyToEnquiry
);

// PATCH /api/enquiries/admin/:enquiryId/status - Update status
router.patch(
  "/admin/:enquiryId/status",
  requireCAdmin,
  validate(updateEnquiryStatusSchema),
  updateEnquiryStatus
);

// DELETE /api/enquiries/admin/:enquiryId - Delete enquiry
router.delete("/admin/:enquiryId", requireCAdmin, deleteEnquiry);

export default router;