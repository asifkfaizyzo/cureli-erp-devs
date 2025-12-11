//Q:\PROJECTS\YourZeroesAndOnes\cureli\curely_erp\backend\src\config\multer.js

import multer from "multer";
import path from "path";
import fs from "fs";

// ensure upload directory exists
const uploadDir = "uploads/shop_files";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// storage engine
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.random()
      .toString(36)
      .substring(2)}${ext}`;
    cb(null, name);
  },
});

// file filter
const fileFilter = (req, file, cb) => {
  const allowed = ["application/pdf", "image/jpeg", "image/png"];
  if (!allowed.includes(file.mimetype)) {
    return cb(new Error("Invalid file type. Only PDF/JPG/PNG allowed."));
  }
  cb(null, true);
};

// 5 MB limit
export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});
