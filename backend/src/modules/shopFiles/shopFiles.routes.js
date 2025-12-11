// backend/src/modules/shopFiles/shopFiles.routes.js

import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { requireAuth } from "../../middleware/auth.js";
import {
  uploadShopFileController,
  listRejectedController,
  resubmitController,
  messageController,
  getVerificationStatusController, // ADD THIS
} from "./shopFiles.controller.js";

const router = express.Router();

// Multer storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join("uploads", "shop_files");
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = file.originalname.split(".").pop();
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;
    cb(null, unique);
  },
});

const upload = multer({ storage });

// Routes
router.get("/verification-status", requireAuth, getVerificationStatusController); // ADD THIS
router.get("/rejected", requireAuth, listRejectedController);
router.post("/upload", requireAuth, upload.single("file"), uploadShopFileController);
router.post("/:file_id/resubmit", requireAuth, upload.single("file"), resubmitController);
router.post("/:file_id/message", requireAuth, messageController);

export default router;