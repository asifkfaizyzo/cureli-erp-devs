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
} from "./shopFiles.controller.js";

const router = express.Router();

// existing multer storage (same as you have)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join("uploads", "shop-files");
    if (!fs.existsSync(uploadPath)) fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const ext = file.originalname.split(".").pop();
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}.${ext}`;
    cb(null, unique);
  }
});
const upload = multer({ storage });

// Upload (existing)
router.post("/upload", requireAuth, upload.single("file"), uploadShopFileController);

// New: list rejected for owner
router.get("/files/rejected", requireAuth, listRejectedController);

// New: resubmit (owner uploads new file)
router.post("/files/:file_id/resubmit", requireAuth, upload.single("file"), resubmitController);

// New: owner message to admin
router.post("/files/:file_id/message", requireAuth, messageController);

export default router;
