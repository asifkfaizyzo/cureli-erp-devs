// backend/src/modules/cadmin/master-medicines/cadminMasterMedicines.routes.js

import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { requireCAdmin } from "../../../middleware/requireCAdmin.js";
import { requireCAdminPermission } from "../../../middleware/requireCAdminPermission.js";
import { CADMIN_PERMISSIONS } from "../../../config/cadminPermissions.js";
import {
  listMasterMedicines,
  getMasterMedicine,
  getVariant,
  getMasterMedicinesStats,
  getFilters,
  autocomplete,
  listUnmappedMedicines,
  listNeedsReview,
  listLinkedMedicines,
  listLinkedByVariant,
  acceptMatch,
  rejectMatch,
  matchToVariant,
  matchToMaster,
  ignoreUnmapped,
  unlinkMedicine,
  handleImageUpload,
  handleImageDelete,
  createMasterMed,
} from "./cadminMasterMedicines.controller.js";

const router = Router();

// ── MULTER CONFIG ────────────────────────────────────────────────────────────
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tempPath = path.join(__dirname, "../../../../static/medicine_images/uploads");
    fs.mkdirSync(tempPath, { recursive: true });
    cb(null, tempPath);
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `verified_${timestamp}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPG, PNG, and WebP images are allowed"));
    }
  },
});

// ── ALL ROUTES REQUIRE AUTH ──────────────────────────────────────────────────
router.use(requireCAdmin);

// ── READ ROUTES (master_medicines.view) ──────────────────────────────────────
router.get(
  "/master-medicines/stats",
  requireCAdminPermission(CADMIN_PERMISSIONS.MASTER_MEDICINES_VIEW),
  getMasterMedicinesStats
);

router.get(
  "/master-medicines/filters",
  requireCAdminPermission(CADMIN_PERMISSIONS.MASTER_MEDICINES_VIEW),
  getFilters
);

router.get(
  "/master-medicines/autocomplete",
  requireCAdminPermission(CADMIN_PERMISSIONS.MASTER_MEDICINES_VIEW),
  autocomplete
);

router.get(
  "/master-medicines/variants/:skuId",
  requireCAdminPermission(CADMIN_PERMISSIONS.MASTER_MEDICINES_VIEW),
  getVariant
);

router.get(
  "/master-medicines/variants/:variantId/linked",
  requireCAdminPermission(CADMIN_PERMISSIONS.MASTER_MEDICINES_VIEW),
  listLinkedByVariant
);

// ── MAPPING READ ROUTES (view permission sufficient to read unmapped/review) ─
router.get(
  "/master-medicines/unmapped",
  requireCAdminPermission(CADMIN_PERMISSIONS.MASTER_MEDICINES_VIEW),
  listUnmappedMedicines
);

router.get(
  "/master-medicines/review",
  requireCAdminPermission(CADMIN_PERMISSIONS.MASTER_MEDICINES_VIEW),
  listNeedsReview
);

// ── MAPPING ACTION ROUTES (master_medicines.manage_mapping) ──────────────────
router.post(
  "/master-medicines/review/:medicineId/accept",
  requireCAdminPermission(CADMIN_PERMISSIONS.MASTER_MEDICINES_MANAGE_MAPPING),
  acceptMatch
);

router.post(
  "/master-medicines/review/:medicineId/reject",
  requireCAdminPermission(CADMIN_PERMISSIONS.MASTER_MEDICINES_MANAGE_MAPPING),
  rejectMatch
);

router.post(
  "/master-medicines/match",
  requireCAdminPermission(CADMIN_PERMISSIONS.MASTER_MEDICINES_MANAGE_MAPPING),
  matchToVariant
);

router.post(
  "/master-medicines/ignore",
  requireCAdminPermission(CADMIN_PERMISSIONS.MASTER_MEDICINES_MANAGE_MAPPING),
  ignoreUnmapped
);

router.post(
  "/master-medicines/unlink/:medicineId",
  requireCAdminPermission(CADMIN_PERMISSIONS.MASTER_MEDICINES_MANAGE_MAPPING),
  unlinkMedicine
);

// ── LINKED READ ROUTES (view permission) ─────────────────────────────────────
router.get(
  "/master-medicines/:id/linked",
  requireCAdminPermission(CADMIN_PERMISSIONS.MASTER_MEDICINES_VIEW),
  listLinkedMedicines
);

// ── IMAGE ROUTES (master_medicines.manage_images) ────────────────────────────
router.post(
  "/master-medicines/:id/images",
  requireCAdminPermission(CADMIN_PERMISSIONS.MASTER_MEDICINES_MANAGE_IMAGES),
  upload.single("image"),
  handleImageUpload
);

router.delete(
  "/master-medicines/images/:imageId",
  requireCAdminPermission(CADMIN_PERMISSIONS.MASTER_MEDICINES_MANAGE_IMAGES),
  handleImageDelete
);

// ── CREATE ROUTE (master_medicines.create) ───────────────────────────────────
router.post(
  "/master-medicines",
  requireCAdminPermission(CADMIN_PERMISSIONS.MASTER_MEDICINES_CREATE),
  createMasterMed
);

// ── MAIN READ ROUTES (must be last — catches parameterized :id) ──────────────
router.get(
  "/master-medicines",
  requireCAdminPermission(CADMIN_PERMISSIONS.MASTER_MEDICINES_VIEW),
  listMasterMedicines
);

router.get(
  "/master-medicines/:id",
  requireCAdminPermission(CADMIN_PERMISSIONS.MASTER_MEDICINES_VIEW),
  getMasterMedicine
);

export default router;