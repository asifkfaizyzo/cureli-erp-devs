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
// VALIDATION HELPERS
// ============================================

/**
 * Validate folder name against whitelist
 */
function validateFolder(folder) {
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
function validateExtension(filename) {
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
function validateMimeType(folder, mimetype) {
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
function validateFileSize(folder, size) {
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
function formatFileSize(bytes) {
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
 * 
 * @param {Object} params
 * @param {Buffer} params.buffer - File buffer from multer memoryStorage
 * @param {string} params.folder - Target folder (e.g., 'shop_files')
 * @param {string} params.originalName - Original filename
 * @param {string} params.mimetype - MIME type
 * @param {number} params.size - File size in bytes
 * @param {string} [params.customFilename] - Optional custom filename (must include extension)
 * 
 * @returns {Promise<Object>} { filename, path, size, mimetype }
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
 * 
 * @param {Object} params
 * @param {string} params.folder - Folder name
 * @param {string} params.filename - Filename to delete
 * 
 * @returns {Promise<boolean>} true if deleted, false if not found
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
 * 
 * @param {Object} params
 * @param {string} params.folder - Folder name
 * @param {string} params.filename - Filename
 * 
 * @returns {Promise<boolean>}
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
 * 
 * @param {Object} params
 * @param {string} params.folder - Folder name
 * @param {string} params.filename - Filename
 * 
 * @returns {Promise<Object>} { size, created_at, modified_at }
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
 * 
 * @param {Object} params
 * @param {string} params.folder - Folder name
 * @param {string} params.filename - Filename
 * 
 * @returns {string} Absolute file path
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
 * 
 * For LOCAL: Returns path for express.static or custom endpoint
 * For S3: Will return S3 URL or CloudFront URL
 * 
 * @param {Object} params
 * @param {string} params.folder - Folder name
 * @param {string} params.filename - Filename
 * @param {string} [params.provider] - Override storage provider
 * 
 * @returns {string} Public URL
 */
export function getPublicUrl({ folder, filename, provider = STORAGE_PROVIDER }) {
  const validatedFolder = validateFolder(folder);

  if (provider === 'local') {
    // Return path compatible with new /api/files/* endpoint
    return `/api/files/${validatedFolder}/${filename}`;
  }

  if (provider === 's3') {
    // TODO: Implement S3 URL generation
    // For now, return placeholder
    return `https://placeholder-bucket.s3.amazonaws.com/${validatedFolder}/${filename}`;
  }

  throw new Error(`Unknown storage provider: ${provider}`);
}

/**
 * Get signed URL for private file access
 * 
 * For LOCAL: Returns same as getPublicUrl (no signing needed)
 * For S3: Will return presigned URL with expiration
 * 
 * @param {Object} params
 * @param {string} params.folder - Folder name
 * @param {string} params.filename - Filename
 * @param {number} [params.expiresIn] - Expiration in seconds (default: 3600 = 1 hour)
 * @param {string} [params.provider] - Override storage provider
 * 
 * @returns {Promise<string>} Signed URL
 */
export async function getSignedUrl({
  folder,
  filename,
  expiresIn = 3600,
  provider = STORAGE_PROVIDER,
}) {
  const validatedFolder = validateFolder(folder);

  if (provider === 'local') {
    // Local files don't need signing, return public URL
    return getPublicUrl({ folder: validatedFolder, filename, provider: 'local' });
  }

  if (provider === 's3') {
    // TODO: Implement S3 presigned URL generation
    // const s3 = new S3Client({ region: process.env.AWS_REGION });
    // const command = new GetObjectCommand({
    //   Bucket: process.env.AWS_S3_BUCKET,
    //   Key: `${validatedFolder}/${filename}`,
    // });
    // return await getSignedUrl(s3, command, { expiresIn });

    throw new Error('S3 presigned URLs not yet implemented');
  }

  throw new Error(`Unknown storage provider: ${provider}`);
}

// ============================================
// BATCH OPERATIONS
// ============================================

/**
 * Delete multiple files
 * 
 * @param {Array<{folder: string, filename: string}>} files
 * @returns {Promise<{deleted: number, failed: number, errors: Array}>}
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
 * 
 * @param {string} folder - Folder name
 * @returns {Promise<Object>} { total_files, total_size, total_size_formatted }
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
        // Skip files that can't be read
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
// EXPORTS
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
  validateMimeType,
  validateFileSize,
  formatFileSize,
};