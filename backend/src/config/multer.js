// backend/src/config/multer.js
// ============================================
// UNIVERSAL MULTER CONFIGURATION
// Uses fileStorage.service.js for all validation
// ============================================

import multer from "multer";
import * as fileStorage from "../services/fileStorage.service.js";

// ============================================
// UNIVERSAL STORAGE (MEMORY)
// ============================================

/**
 * All files go to memory first, then fileStorage handles actual storage
 */
const storage = multer.memoryStorage();

// ============================================
// FILE FILTER FACTORY
// ============================================

/**
 * Create a file filter for a specific folder
 * @param {string} folder - Folder name (e.g., 'tickets', 'shop_files')
 */
function createFileFilter(folder) {
  return (req, file, cb) => {
    try {
      // Validate using fileStorage service
      fileStorage.validateFolder(folder);
      fileStorage.validateExtension(file.originalname);
      fileStorage.validateMimeType(folder, file.mimetype);

      // If all pass, accept file
      cb(null, true);
    } catch (error) {
      // If validation fails, reject file
      cb(error, false);
    }
  };
}

// ============================================
// MULTER INSTANCE FACTORY
// ============================================

/**
 * Create a multer instance for a specific folder
 * @param {string} folder - Folder name
 * @param {object} options - Additional multer options
 */
export function createUploader(folder, options = {}) {
  const {
    maxFileSize = null, // If null, uses folder default from fileStorage
    maxFiles = 1,
    fieldName = "file",
  } = options;

  // Get max size from fileStorage or use custom
  const limits = {
    fileSize: maxFileSize || getMaxFileSize(folder),
  };

  const upload = multer({
    storage,
    fileFilter: createFileFilter(folder),
    limits,
  });

  // Return appropriate upload method based on maxFiles
  if (maxFiles === 1) {
    return upload.single(fieldName);
  } else {
    return upload.array(fieldName, maxFiles);
  }
}

// ============================================
// HELPER: Get max file size from fileStorage
// ============================================

function getMaxFileSize(folder) {
  const MAX_FILE_SIZES = {
    shop_files: 5 * 1024 * 1024, // 5MB
    broadcast_attachments: 50 * 1024 * 1024, // 50MB
    email_attachments: 10 * 1024 * 1024, // 10MB
    tickets: 5 * 1024 * 1024, // 5MB
  };

  return MAX_FILE_SIZES[folder] || 10 * 1024 * 1024; // Default 10MB
}

// ============================================
// PRE-CONFIGURED UPLOADERS (for convenience)
// ============================================

export const shopFilesUpload = createUploader("shop_files", {
  fieldName: "file",
  maxFiles: 1,
});

export const ticketsUpload = createUploader("tickets", {
  fieldName: "files",
  maxFiles: 5,
});

export const broadcastUpload = createUploader("broadcast_attachments", {
  fieldName: "file",
  maxFiles: 1,
});

export const emailAttachmentUpload = createUploader("email_attachments", {
  fieldName: "file",
  maxFiles: 1,
});

export const prescriptionUpload = createUploader('order_prescriptions', {
  fieldName: 'files',
  maxFiles: 5,
  maxFileSize: 10 * 1024 * 1024,
});

// ============================================
//  NEW: GENERIC MULTER INSTANCE (for backwards compatibility)
// ============================================

/**
 * Generic multer instance with memory storage
 * Use this when you need custom field names or no folder validation
 */
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB default
  },
});

// ============================================
// MULTER ERROR HANDLER MIDDLEWARE
// ============================================

/**
 * Universal error handler for all multer uploads
 */
export function handleMulterError(err, req, res, next) {
  if (!err) {
    return next();
  }

  console.error("[Multer] Upload error:", err.message);

  // Multer errors
  if (err.code === "LIMIT_FILE_SIZE") {
    return res.status(400).json({
      success: false,
      message: "File too large",
      error: `Maximum file size exceeded. ${err.message}`,
    });
  }

  if (err.code === "LIMIT_FILE_COUNT") {
    return res.status(400).json({
      success: false,
      message: "Too many files",
      error: err.message,
    });
  }

  if (err.code === "LIMIT_UNEXPECTED_FILE") {
    return res.status(400).json({
      success: false,
      message: "Unexpected field",
      error: "Invalid file field name",
    });
  }

  // fileStorage validation errors
  if (err.code === "BLOCKED_EXTENSION") {
    return res.status(400).json({
      success: false,
      message: "Invalid file type",
      error: err.message,
    });
  }

  if (err.code === "INVALID_MIME_TYPE") {
    return res.status(400).json({
      success: false,
      message: "Invalid file type",
      error: err.message,
    });
  }

  if (err.code === "FILE_TOO_LARGE") {
    return res.status(400).json({
      success: false,
      message: "File too large",
      error: err.message,
    });
  }

  // Generic error
  return res.status(500).json({
    success: false,
    message: "File upload failed",
    error: err.message,
  });
}

// ============================================
// DEFAULT EXPORT
// ============================================

export default {
  createUploader,
  upload, //  Added for backwards compatibility
  shopFilesUpload,
  ticketsUpload,
  broadcastUpload,
  emailAttachmentUpload,
  handleMulterError,
};
