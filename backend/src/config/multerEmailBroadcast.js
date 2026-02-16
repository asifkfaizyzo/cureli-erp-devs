// backend/src/config/multerEmailBroadcast.js

import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';

// ============================================
// CONFIGURATION
// ============================================

const UPLOAD_DIR = 'uploads/email_attachments';
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB per file
const MAX_FILES = 6; // 1 inline image + 5 attachments

// Allowed MIME types
const ALLOWED_MIME_TYPES = [
  // Images (for inline image)
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  // Documents (for attachments)
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'text/plain',
  'text/csv',
];

// ============================================
// ENSURE UPLOAD DIRECTORY EXISTS
// ============================================

const uploadPath = path.resolve(process.cwd(), UPLOAD_DIR);
if (!fs.existsSync(uploadPath)) {
  fs.mkdirSync(uploadPath, { recursive: true });
  console.log(`[Multer] Created upload directory: ${uploadPath}`);
}

// ============================================
// STORAGE CONFIGURATION
// ============================================

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: email-{timestamp}-{random}.{ext}
    const timestamp = Date.now();
    const random = crypto.randomBytes(8).toString('hex');
    const ext = path.extname(file.originalname).toLowerCase();
    const safeName = `email-${timestamp}-${random}${ext}`;
    cb(null, safeName);
  },
});

// ============================================
// FILE FILTER
// ============================================

const fileFilter = (req, file, cb) => {
  // Check MIME type
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    const error = new Error(`Invalid file type: ${file.mimetype}. Allowed: images, PDF, Word, Excel, CSV, TXT`);
    error.code = 'INVALID_FILE_TYPE';
    return cb(error, false);
  }

  // Check extension for blocked types
  const ext = path.extname(file.originalname).toLowerCase();
  const blockedExtensions = ['.exe', '.sh', '.bat', '.cmd', '.msi', '.dll', '.scr', '.js', '.vbs', '.ps1'];
  if (blockedExtensions.includes(ext)) {
    const error = new Error(`Blocked file extension: ${ext}`);
    error.code = 'BLOCKED_EXTENSION';
    return cb(error, false);
  }

  cb(null, true);
};

// ============================================
// MULTER INSTANCE
// ============================================

export const emailBroadcastUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: MAX_FILE_SIZE,
    files: MAX_FILES,
  },
});

// ============================================
// HELPER FUNCTIONS
// ============================================

/**
 * Get full URL for uploaded file
 */
export function getEmailAttachmentUrl(filename) {
  const baseUrl = process.env.APP_URL || 'http://localhost:5000';
  return `${baseUrl}/uploads/email_attachments/${filename}`;
}

/**
 * Get file path on disk
 */
export function getEmailAttachmentPath(filename) {
  return path.join(uploadPath, filename);
}

/**
 * Check if file is an image (for inline use)
 */
export function isImageFile(mimetype) {
  return mimetype.startsWith('image/');
}

/**
 * Delete file by filename
 */
export function deleteEmailAttachment(filename) {
  const filePath = path.join(uploadPath, filename);
  if (fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
    console.log(`[Multer] Deleted email attachment: ${filename}`);
    return true;
  }
  return false;
}

/**
 * Delete multiple files
 */
export function deleteEmailAttachments(filenames) {
  let deleted = 0;
  for (const filename of filenames) {
    if (deleteEmailAttachment(filename)) {
      deleted++;
    }
  }
  return deleted;
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

export default {
  emailBroadcastUpload,
  getEmailAttachmentUrl,
  getEmailAttachmentPath,
  isImageFile,
  deleteEmailAttachment,
  deleteEmailAttachments,
  formatFileSize,
};