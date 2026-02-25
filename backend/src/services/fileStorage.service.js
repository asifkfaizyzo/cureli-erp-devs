// backend/src/services/fileStorage.service.js

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

// ============================================
// CONSTANTS
// ============================================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get project root (backend folder)
const PROJECT_ROOT = path.resolve(__dirname, '../../');

const STORAGE_PROVIDER = process.env.FILE_STORAGE_PROVIDER || 'local';
const UPLOAD_ROOT = process.env.FILE_STORAGE_ROOT || 'uploads';

// Whitelisted folders (prevent directory traversal)
const ALLOWED_FOLDERS = [
  'shop_files',
  'broadcast_attachments',
  'email_attachments',
  'tickets',
];

// File size limits (bytes)
const MAX_FILE_SIZES = {
  shop_files: 5 * 1024 * 1024,              // 5MB
  broadcast_attachments: 50 * 1024 * 1024,  // 50MB
  email_attachments: 10 * 1024 * 1024,      // 10MB
  tickets: 5 * 1024 * 1024,                 // 5MB
};

// Allowed MIME types per folder
const ALLOWED_MIME_TYPES = {
  shop_files: [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
  ],
  broadcast_attachments: [
    // Images
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'image/bmp',
    'image/tiff',
    // Videos
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/mpeg',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-matroska',
    'video/3gpp',
    'video/3gpp2',
  ],
  email_attachments: [
    // Images
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv',
  ],
  tickets: [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
  ],
};

// Blocked extensions (security)
const BLOCKED_EXTENSIONS = [
  '.exe',
  '.sh',
  '.bat',
  '.cmd',
  '.msi',
  '.dll',
  '.scr',
  '.js',
  '.vbs',
  '.ps1',
  '.app',
  '.deb',
  '.rpm',
];

// ============================================
// VALIDATION HELPERS (NOW EXPORTED)
// ============================================

/**
 * Validate folder name against whitelist
 */
export function validateFolder(folder) {
  if (!folder || typeof folder !== 'string') {
    const err = new Error('Folder name is required');
    err.code = 'INVALID_FOLDER';
    throw err;
  }

  // Remove any path traversal attempts
  const sanitized = folder.replace(/\.\./g, '').replace(/\//g, '').replace(/\\/g, '');

  if (!ALLOWED_FOLDERS.includes(sanitized)) {
    const err = new Error(`Invalid folder: ${folder}. Allowed: ${ALLOWED_FOLDERS.join(', ')}`);
    err.code = 'FOLDER_NOT_ALLOWED';
    throw err;
  }

  return sanitized;
}

/**
 * Validate file extension
 */
export function validateExtension(filename) {
  const ext = path.extname(filename).toLowerCase();

  if (BLOCKED_EXTENSIONS.includes(ext)) {
    const err = new Error(`Blocked file extension: ${ext}`);
    err.code = 'BLOCKED_EXTENSION';
    throw err;
  }

  return ext;
}

/**
 * Validate MIME type for folder
 */
export function validateMimeType(folder, mimetype) {
  const allowed = ALLOWED_MIME_TYPES[folder];

  if (!allowed) {
    // If folder has no MIME restrictions, allow all (except blocked extensions)
    return true;
  }

  if (!allowed.includes(mimetype)) {
    const err = new Error(
      `Invalid file type for ${folder}. Allowed: ${allowed.join(', ')}`
    );
    err.code = 'INVALID_MIME_TYPE';
    throw err;
  }

  return true;
}

/**
 * Validate file size
 */
export function validateFileSize(folder, size) {
  const maxSize = MAX_FILE_SIZES[folder];

  if (!maxSize) {
    // No size limit for this folder
    return true;
  }

  if (size > maxSize) {
    const err = new Error(
      `File too large for ${folder}. Max: ${formatFileSize(maxSize)}, Got: ${formatFileSize(size)}`
    );
    err.code = 'FILE_TOO_LARGE';
    throw err;
  }

  return true;
}

/**
 * Format file size for human readability
 */
export function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Generate unique filename
 */
function generateUniqueFilename(originalName, folder) {
  const ext = path.extname(originalName).toLowerCase();
  const timestamp = Date.now();
  const randomHash = crypto.randomBytes(8).toString('hex');

  // Different naming patterns for different folders
  if (folder === 'email_attachments') {
    return `email-${timestamp}-${randomHash}${ext}`;
  } else if (folder === 'broadcast_attachments') {
    return `broadcast-${timestamp}-${randomHash}${ext}`;
  } else {
    return `${timestamp}-${randomHash}${ext}`;
  }
}

/**
 * Ensure directory exists
 */
function ensureDirectoryExists(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
    console.log(`[FileStorage] Created directory: ${dirPath}`);
  }
}

/**
 * Resolve absolute path safely
 */
function resolveAbsolutePath(folder, filename) {
  const folderPath = path.join(PROJECT_ROOT, UPLOAD_ROOT, folder);
  const fullPath = path.resolve(folderPath, filename);

  // Security: Ensure resolved path is within uploads directory
  const uploadsDir = path.resolve(PROJECT_ROOT, UPLOAD_ROOT);

  if (!fullPath.startsWith(uploadsDir)) {
    const err = new Error('Path traversal attempt detected');
    err.code = 'PATH_TRAVERSAL';
    throw err;
  }

  return fullPath;
}

// ============================================
// CORE FILE OPERATIONS (LOCAL)
// ============================================

/**
 * Upload file to local disk
 */
export async function uploadFile({
  buffer,
  folder,
  originalName,
  mimetype,
  size,
  customFilename = null,
}) {
  try {
    // 1. Validate inputs
    if (!buffer || !Buffer.isBuffer(buffer)) {
      throw new Error('File buffer is required');
    }

    if (!originalName) {
      throw new Error('Original filename is required');
    }

    const validatedFolder = validateFolder(folder);
    validateExtension(originalName);
    validateMimeType(validatedFolder, mimetype);
    validateFileSize(validatedFolder, size);

    // 2. Generate filename
    const filename = customFilename || generateUniqueFilename(originalName, validatedFolder);

    // Validate custom filename extension if provided
    if (customFilename) {
      validateExtension(customFilename);
    }

    // 3. Resolve path
    const folderPath = path.join(PROJECT_ROOT, UPLOAD_ROOT, validatedFolder);
    ensureDirectoryExists(folderPath);

    const filePath = path.join(folderPath, filename);

    // 4. Write file
    await fs.promises.writeFile(filePath, buffer);

    console.log(`[FileStorage] Uploaded: ${validatedFolder}/${filename} (${formatFileSize(size)})`);

    // 5. Return metadata
    return {
      filename,
      folder: validatedFolder,
      size,
      mimetype,
      storage_key: filename, // For DB storage (just filename, not full path)
      uploaded_at: new Date(),
    };
  } catch (error) {
    console.error('[FileStorage] Upload failed:', error.message);
    throw error;
  }
}

/**
 * Delete file from local disk
 */
export async function deleteFile({ folder, filename }) {
  try {
    const validatedFolder = validateFolder(folder);
    const filePath = resolveAbsolutePath(validatedFolder, filename);

    if (!fs.existsSync(filePath)) {
      console.warn(`[FileStorage] File not found for deletion: ${validatedFolder}/${filename}`);
      return false;
    }

    await fs.promises.unlink(filePath);
    console.log(`[FileStorage] Deleted: ${validatedFolder}/${filename}`);

    return true;
  } catch (error) {
    console.error('[FileStorage] Delete failed:', error.message);
    throw error;
  }
}

/**
 * Check if file exists
 */
export async function fileExists({ folder, filename }) {
  try {
    const validatedFolder = validateFolder(folder);
    const filePath = resolveAbsolutePath(validatedFolder, filename);

    return fs.existsSync(filePath);
  } catch (error) {
    console.error('[FileStorage] Existence check failed:', error.message);
    return false;
  }
}

/**
 * Get file metadata
 */
export async function getFileMetadata({ folder, filename }) {
  try {
    const validatedFolder = validateFolder(folder);
    const filePath = resolveAbsolutePath(validatedFolder, filename);

    if (!fs.existsSync(filePath)) {
      const err = new Error('File not found');
      err.code = 'FILE_NOT_FOUND';
      throw err;
    }

    const stats = await fs.promises.stat(filePath);

    return {
      size: stats.size,
      size_formatted: formatFileSize(stats.size),
      created_at: stats.birthtime,
      modified_at: stats.mtime,
    };
  } catch (error) {
    console.error('[FileStorage] Get metadata failed:', error.message);
    throw error;
  }
}

/**
 * Get absolute file path (for internal use, streaming, etc.)
 * ⚠️ DO NOT expose this path to frontend
 */
export function getAbsolutePath({ folder, filename }) {
  const validatedFolder = validateFolder(folder);
  return resolveAbsolutePath(validatedFolder, filename);
}

// ============================================
// URL GENERATION (FUTURE S3-READY)
// ============================================

/**
 * Get public URL for file
 */
export function getPublicUrl({ folder, filename, provider = STORAGE_PROVIDER }) {
  const validatedFolder = validateFolder(folder);

  if (provider === 'local') {
    // Return path compatible with /api/files/* endpoint
    return `/api/files/${validatedFolder}/${filename}`;
  }

  if (provider === 's3') {
    // TODO: Implement S3 URL generation
    return `https://placeholder-bucket.s3.amazonaws.com/${validatedFolder}/${filename}`;
  }

  throw new Error(`Unknown storage provider: ${provider}`);
}

/**
 * Get signed URL for private file access
 */
export async function getSignedUrl({
  folder,
  filename,
  expiresIn = 3600,
  provider = STORAGE_PROVIDER,
}) {
  const validatedFolder = validateFolder(folder);

  if (provider === 'local') {
    return getPublicUrl({ folder: validatedFolder, filename, provider: 'local' });
  }

  if (provider === 's3') {
    throw new Error('S3 presigned URLs not yet implemented');
  }

  throw new Error(`Unknown storage provider: ${provider}`);
}

// ============================================
// BATCH OPERATIONS
// ============================================

/**
 * Delete multiple files
 */
export async function deleteFiles(files) {
  const results = {
    deleted: 0,
    failed: 0,
    errors: [],
  };

  for (const file of files) {
    try {
      const deleted = await deleteFile(file);
      if (deleted) {
        results.deleted++;
      } else {
        results.failed++;
        results.errors.push({
          folder: file.folder,
          filename: file.filename,
          error: 'File not found',
        });
      }
    } catch (error) {
      results.failed++;
      results.errors.push({
        folder: file.folder,
        filename: file.filename,
        error: error.message,
      });
    }
  }

  return results;
}

// ============================================
// STORAGE STATISTICS
// ============================================

/**
 * Get storage statistics for a folder
 */
export async function getFolderStats(folder) {
  try {
    const validatedFolder = validateFolder(folder);
    const folderPath = path.join(PROJECT_ROOT, UPLOAD_ROOT, validatedFolder);

    if (!fs.existsSync(folderPath)) {
      return {
        total_files: 0,
        total_size: 0,
        total_size_formatted: '0 Bytes',
      };
    }

    const files = await fs.promises.readdir(folderPath);
    let totalSize = 0;

    for (const filename of files) {
      try {
        const filePath = path.join(folderPath, filename);
        const stats = await fs.promises.stat(filePath);
        totalSize += stats.size;
      } catch (err) {
        console.warn(`[FileStorage] Could not stat file: ${filename}`);
      }
    }

    return {
      total_files: files.length,
      total_size: totalSize,
      total_size_formatted: formatFileSize(totalSize),
    };
  } catch (error) {
    console.error('[FileStorage] Get folder stats failed:', error.message);
    throw error;
  }
}

// ============================================
// DEFAULT EXPORT (for backwards compatibility)
// ============================================

export default {
  uploadFile,
  deleteFile,
  deleteFiles,
  fileExists,
  getFileMetadata,
  getAbsolutePath,
  getPublicUrl,
  getSignedUrl,
  getFolderStats,
  validateFolder,
  validateExtension,
  validateMimeType,
  validateFileSize,
  formatFileSize,
};