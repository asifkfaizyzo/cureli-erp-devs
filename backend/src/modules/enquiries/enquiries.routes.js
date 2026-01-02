import { Router } from "express";
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

// PUBLIC ROUTES
router.post("/", validate(createEnquirySchema, "body"), submitEnquiry);

// ADMIN ROUTES
router.get("/admin/list", requireCAdmin, validate(listEnquiriesSchema, "query"), listEnquiries);
router.get("/admin/stats", requireCAdmin, getEnquiryStats);
router.get("/admin/:enquiryId", requireCAdmin, validate(enquiryIdParamSchema, "params"), getEnquiryDetails);
router.post("/admin/:enquiryId/reply", requireCAdmin, validate(enquiryIdParamSchema, "params"), validate(replyEnquirySchema, "body"), replyToEnquiry);
router.patch("/admin/:enquiryId/status", requireCAdmin, validate(enquiryIdParamSchema, "params"), validate(updateEnquiryStatusSchema, "body"), updateEnquiryStatus);
router.delete("/admin/:enquiryId", requireCAdmin, validate(enquiryIdParamSchema, "params"), deleteEnquiry);

export default router;