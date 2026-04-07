import { Router } from "express";
import multer from "multer";
import path from "path";
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
  acceptMatch,
  rejectMatch,
  matchToMaster,
  ignoreUnmapped,
  unlinkMedicine,
  handleImageUpload,
  handleImageDelete,
} from "./cadminMasterMedicines.controller.js";

const router = Router();

// All routes require CAdmin authentication
router.use(requireCAdmin);

// ══════════════════════════════════════════════════════════════
// MULTER CONFIG FOR IMAGE UPLOAD
// ══════════════════════════════════════════════════════════════

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Determine upload path based on skuId or masterId
    const skuId = req.body.skuId || "uploads";
    const uploadPath = path.join(
      __dirname, "../../../../static/medicine_images", skuId
    );
    
    // Create directory if doesn't exist
    import("fs").then((fs) => {
      fs.default.mkdirSync(uploadPath, { recursive: true });
      cb(null, uploadPath);
    });
  },
  filename: (req, file, cb) => {
    const timestamp = Date.now();
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `verified_${timestamp}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only JPG, PNG, and WebP images are allowed"));
    }
  },
});

// ══════════════════════════════════════════════════════════════
// CATALOG ROUTES
// ══════════════════════════════════════════════════════════════

// Stats (before parameterized routes)
router.get("/master-medicines/stats", getMasterMedicinesStats);

// Filters
router.get("/master-medicines/filters", getFilters);

// Autocomplete
router.get("/master-medicines/autocomplete", autocomplete);

// Variant by SKU
router.get("/master-medicines/variants/:skuId", getVariant);

// ══════════════════════════════════════════════════════════════
// MAPPING ROUTES
// ══════════════════════════════════════════════════════════════

// Unmapped medicines
router.get("/master-medicines/unmapped", listUnmappedMedicines);

// Needs review
router.get("/master-medicines/review", listNeedsReview);

// Accept review match
router.post("/master-medicines/review/:medicineId/accept", acceptMatch);

// Reject review match
router.post("/master-medicines/review/:medicineId/reject", rejectMatch);

// Match unmapped to master
router.post("/master-medicines/match", matchToMaster);

// Ignore unmapped
router.post("/master-medicines/ignore", ignoreUnmapped);

// ══════════════════════════════════════════════════════════════
// LINKED MEDICINES ROUTES
// ══════════════════════════════════════════════════════════════

// Get linked medicines for a master
router.get("/master-medicines/:id/linked", listLinkedMedicines);

// Unlink a shop medicine
router.post("/master-medicines/unlink/:medicineId", unlinkMedicine);

// ══════════════════════════════════════════════════════════════
// IMAGE ROUTES
// ══════════════════════════════════════════════════════════════

// Upload image
router.post("/master-medicines/:id/images", upload.single("image"), handleImageUpload);

// Delete image
router.delete("/master-medicines/images/:imageId", handleImageDelete);

// ══════════════════════════════════════════════════════════════
// MAIN CRUD ROUTES (must be last - parameterized)
// ══════════════════════════════════════════════════════════════

// List all
router.get("/master-medicines", listMasterMedicines);

// Get single by ID or master_key
router.get("/master-medicines/:id", getMasterMedicine);

export default router;