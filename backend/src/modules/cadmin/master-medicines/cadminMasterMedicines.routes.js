// backend/src/modules/cadmin/master-medicines/cadminMasterMedicines.routes.js
// REPLACE the entire multer config section

import { Router } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import { requireCAdmin } from "../../../middleware/requireCAdmin.js";
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
router.use(requireCAdmin);

// ── MULTER CONFIG ──
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use memory storage first, then save in the controller where we know the skuId
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // At this point req.body may or may not have skuId parsed yet
    // Use a temp directory, the controller will handle final placement
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

// ── ROUTES ──

// Stats (before parameterized routes)
router.get("/master-medicines/stats", getMasterMedicinesStats);
router.get("/master-medicines/filters", getFilters);
router.get("/master-medicines/autocomplete", autocomplete);
router.get("/master-medicines/variants/:skuId", getVariant);
router.get("/master-medicines/variants/:variantId/linked", listLinkedByVariant);

// Mapping
router.get("/master-medicines/unmapped", listUnmappedMedicines);
router.get("/master-medicines/review", listNeedsReview);
router.post("/master-medicines/review/:medicineId/accept", acceptMatch);
router.post("/master-medicines/review/:medicineId/reject", rejectMatch);
router.post("/master-medicines/match", matchToVariant);
router.post("/master-medicines/ignore", ignoreUnmapped);

// Linked
router.get("/master-medicines/:id/linked", listLinkedMedicines);
router.post("/master-medicines/unlink/:medicineId", unlinkMedicine);

// Images
router.post("/master-medicines/:id/images", upload.single("image"), handleImageUpload);
router.delete("/master-medicines/images/:imageId", handleImageDelete);

// Create (before parameterized :id)
router.post("/master-medicines", createMasterMed);

// Main CRUD (must be last)
router.get("/master-medicines", listMasterMedicines);
router.get("/master-medicines/:id", getMasterMedicine);

export default router;