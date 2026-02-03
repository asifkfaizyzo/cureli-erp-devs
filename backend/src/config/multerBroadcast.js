// backend/src/config/multerBroadcast.js

import multer from "multer";
import path from "path";
import fs from "fs";

// Ensure upload directory exists
const uploadDir = "uploads/broadcast_attachments";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Storage engine
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename: timestamp-random.extension
    const ext = path.extname(file.originalname).toLowerCase();
    const name = `broadcast-${Date.now()}-${Math.random()
      .toString(36)
      .substring(2, 10)}${ext}`;
    cb(null, name);
  },
});

// File filter - allow images and videos only
const fileFilter = (req, file, cb) => {
  const allowedImageTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
    "image/svg+xml",
    "image/bmp",
    "image/tiff",
  ];

  const allowedVideoTypes = [
    "video/mp4",
    "video/webm",
    "video/ogg",
    "video/mpeg",
    "video/quicktime", // .mov
    "video/x-msvideo", // .avi
    "video/x-matroska", // .mkv
    "video/3gpp",
    "video/3gpp2",
  ];

  const allAllowed = [...allowedImageTypes, ...allowedVideoTypes];

  if (allAllowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Invalid file type: ${file.mimetype}. Only images and videos are allowed.`
      ),
      false
    );
  }
};

// 50 MB limit
export const broadcastUpload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

// Helper to determine if file is image or video
export function getFileCategory(mimetype) {
  if (mimetype.startsWith("image/")) return "image";
  if (mimetype.startsWith("video/")) return "video";
  return "unknown";
}

// Helper to get public URL for uploaded file
export function getBroadcastFileUrl(filename) {
  return `/uploads/broadcast_attachments/${filename}`;
}