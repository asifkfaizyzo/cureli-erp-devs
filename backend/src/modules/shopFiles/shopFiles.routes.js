import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { requireAuth } from "../../middleware/auth.js";
import { uploadShopFileController } from "./shopFiles.controller.js";

const router = express.Router();

// ─────────────────────────────────
// Multer storage (local filesystem)
// FIX: Auto-create folder before saving
// ─────────────────────────────────
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join("uploads", "shop-files");

    // Create folder if missing
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }

    cb(null, uploadPath);
  },

  filename: (req, file, cb) => {
    const ext = file.originalname.split(".").pop();
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;
    cb(null, unique);
  }
});

// Multer instance
const upload = multer({ storage });

// ─────────────────────────────────
// ROUTE: Upload a shop file
// ─────────────────────────────────
router.post(
  "/upload",
  requireAuth,
  upload.single("file"),
  uploadShopFileController
);

export default router;
