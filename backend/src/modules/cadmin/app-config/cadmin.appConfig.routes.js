// backend/src/modules/cadmin/app-config/cadmin.appConfig.routes.js

import { Router } from "express";
import { requireCAdmin } from "../../../middleware/requireCAdmin.js";
import { requireCAdminPermission } from "../../../middleware/requireCAdminPermission.js";
import { CADMIN_PERMISSIONS } from "../../../config/cadminPermissions.js";
import { uploadCategoryImage } from "./cadmin.appConfig.upload.js";
import {
  handleListCategories,
  handleUploadCategoryImage,
  handleDeleteCategoryImage,
  handleSetVisibility,
} from "./cadmin.appConfig.controller.js";

const router = Router();

// All routes require a valid CAdmin session
router.use(requireCAdmin);

// ── GET /cadmin/app-config/categories ─────────────────────────────────────────
// View permission — read-only list of all 12 categories with current overrides
router.get(
  "/app-config/categories",
  requireCAdminPermission(CADMIN_PERMISSIONS.APP_CONFIG_VIEW),
  handleListCategories
);

// ── POST /cadmin/app-config/categories/:key/image ─────────────────────────────
// Upload or replace the image for a category
// :key must be URI-encoded when it contains spaces (e.g. "PAIN%20ANALGESICS")
router.post(
  "/app-config/categories/:key/image",
  requireCAdminPermission(CADMIN_PERMISSIONS.APP_CONFIG_MANAGE_CATEGORY_IMAGES),
  uploadCategoryImage.single("file"),
  handleUploadCategoryImage
);

// ── DELETE /cadmin/app-config/categories/:key/image ───────────────────────────
// Remove the image for a category (falls back to icon on mobile)
router.delete(
  "/app-config/categories/:key/image",
  requireCAdminPermission(CADMIN_PERMISSIONS.APP_CONFIG_MANAGE_CATEGORY_IMAGES),
  handleDeleteCategoryImage
);

// ── PATCH /cadmin/app-config/categories/:key/visibility ───────────────────────
// Body: { isHidden: boolean }
router.patch(
  "/app-config/categories/:key/visibility",
  requireCAdminPermission(CADMIN_PERMISSIONS.APP_CONFIG_MANAGE_CATEGORY_IMAGES),
  handleSetVisibility
);

export default router;