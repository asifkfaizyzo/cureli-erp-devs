import express from "express";
import { requireAuth } from "../../middleware/auth.js";
import { upload } from "../../config/multer.js";
import { uploadSingleFile } from "./shopFile.controller.js";

const router = express.Router();

/**
 * POST /api/shop-files/:file_type
 * Example: /api/shop-files/pharmacy_license
 */
router.post(
  "/:file_type",
  requireAuth,
  upload.single("file"),
  uploadSingleFile
);

export default router;
