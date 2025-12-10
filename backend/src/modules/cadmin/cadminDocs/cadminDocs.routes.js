// backend/src/modules/cadmin/cadminDocs/cadminDocs.routes.js

import express from "express";
import { requireCAdmin } from "../../../middleware/requireCAdmin.js";
import { validateBody } from "../../../middleware/validate.js";
import {
  listFilesController,
  getShopDetailController,
  getFileController,
  verifyFileController,
  rejectFileController,
} from "./cadminDocs.controller.js";
import { rejectSchema, validateVerificationQuery } from "./cadminDocs.schema.js";

const router = express.Router();

// All routes require admin authentication
router.use(requireCAdmin);

/**
 * GET /cadmin/files
 * List shops for verification with filters, sorting, pagination
 */
router.get("/files", validateVerificationQuery, listFilesController);

/**
 * GET /cadmin/shops/:shop_id
 * Get shop details with all files for verification modal
 * This is the main endpoint used when clicking on a shop row
 */
router.get("/shops/:shop_id", getShopDetailController);

/**
 * GET /cadmin/files/:file_id
 * Get single file details (optional - for individual file view)
 */
router.get("/files/:file_id", getFileController);

/**
 * PATCH /cadmin/files/:file_id/verify
 * Approve a document
 */
router.patch("/files/:file_id/verify", verifyFileController);

/**
 * PATCH /cadmin/files/:file_id/reject
 * Reject a document with required reason
 */
router.patch("/files/:file_id/reject", validateBody(rejectSchema), rejectFileController);

export default router;