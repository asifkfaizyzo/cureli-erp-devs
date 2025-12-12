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

router.use(requireCAdmin);

// List shops for verification
router.get("/files", validateVerificationQuery, listFilesController);

// Get shop verification detail (unique path to avoid conflict with cadminShops)
router.get("/files/shop/:shop_id", getShopDetailController);

// Get single file details
router.get("/files/:file_id", getFileController);

// Verify a document
router.patch("/files/:file_id/verify", verifyFileController);

// Reject a document
router.patch("/files/:file_id/reject", validateBody(rejectSchema), rejectFileController);

export default router;