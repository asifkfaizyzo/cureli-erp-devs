// backend/src/modules/files/files.controller.js

import fs from 'fs';
import path from 'path';
import { success, fail } from '../../utils/response.js';
import * as fileStorage from '../../services/fileStorage.service.js';

// ============================================
// ALLOWED ORIGINS (for CORS)
// ============================================
const allowedOrigins = [
  process.env.USER_FRONTEND_ORIGIN || 'http://localhost:5173',
  process.env.ADMIN_FRONTEND_ORIGIN || 'http://localhost:5174',
].filter(Boolean);

// ============================================
// SERVE FILE
// ============================================

/**
 * GET /api/files/:folder/:filename
 * Stream file with proper headers
 */
export async function serveFile(req, res) {
  try {
    const { folder, filename } = req.params;

    // Validate folder and filename
    const validatedFolder = fileStorage.validateFolder(folder);

    // Check if file exists
    const exists = await fileStorage.fileExists({
      folder: validatedFolder,
      filename,
    });

    if (!exists) {
      return fail(res, 'File not found', 404);
    }

    // Get absolute path
    const filePath = fileStorage.getAbsolutePath({
      folder: validatedFolder,
      filename,
    });

    // Get file stats
    const stats = fs.statSync(filePath);
    const ext = path.extname(filename).toLowerCase();

    // Set CORS headers
    const origin = req.headers.origin;
    if (allowedOrigins.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Access-Control-Allow-Credentials', 'true');
    }

    // Set security headers
    res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
    res.removeHeader('X-Frame-Options');

    // Set content type
    const mimeTypes = {
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
      '.svg': 'image/svg+xml',
      '.mp4': 'video/mp4',
      '.webm': 'video/webm',
      '.mov': 'video/quicktime',
    };

    const contentType = mimeTypes[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Length', stats.size);

    // For images and PDFs, display inline
    if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.pdf'].includes(ext)) {
      res.setHeader('Content-Disposition', 'inline');
    }

    // For PDFs, enable byte-range requests (for PDF viewers)
    if (ext === '.pdf') {
      res.setHeader('Accept-Ranges', 'bytes');
    }

    // Stream file
    const readStream = fs.createReadStream(filePath);
    
    readStream.on('error', (err) => {
      console.error('[Files] Stream error:', err);
      if (!res.headersSent) {
        return fail(res, 'Error reading file', 500);
      }
    });

    readStream.pipe(res);
  } catch (error) {
    console.error('[Files] Serve file error:', error);

    if (error.code === 'FOLDER_NOT_ALLOWED') {
      return fail(res, 'Invalid folder', 400);
    }

    if (error.code === 'PATH_TRAVERSAL') {
      return fail(res, 'Access denied', 403);
    }

    return fail(res, 'Failed to serve file', 500);
  }
}

// ============================================
// DOWNLOAD FILE
// ============================================

/**
 * GET /api/files/:folder/:filename/download
 * Force file download with custom filename
 */
export async function downloadFile(req, res) {
  try {
    const { folder, filename } = req.params;
    const customName = req.query.name || filename;

    // Validate folder
    const validatedFolder = fileStorage.validateFolder(folder);

    // Check if file exists
    const exists = await fileStorage.fileExists({
      folder: validatedFolder,
      filename,
    });

    if (!exists) {
      return fail(res, 'File not found', 404);
    }

    // Get absolute path
    const filePath = fileStorage.getAbsolutePath({
      folder: validatedFolder,
      filename,
    });

    // Set download headers
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${encodeURIComponent(customName)}"`
    );

    // Send file
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error('[Files] Download error:', err);
        if (!res.headersSent) {
          return fail(res, 'Failed to download file', 500);
        }
      }
    });
  } catch (error) {
    console.error('[Files] Download file error:', error);

    if (error.code === 'FOLDER_NOT_ALLOWED') {
      return fail(res, 'Invalid folder', 400);
    }

    if (error.code === 'PATH_TRAVERSAL') {
      return fail(res, 'Access denied', 403);
    }

    return fail(res, 'Failed to download file', 500);
  }
}

// ============================================
// GET FILE METADATA
// ============================================

/**
 * GET /api/files/:folder/:filename/metadata
 * Get file metadata without downloading
 */
export async function getFileMetadata(req, res) {
  try {
    const { folder, filename } = req.params;

    // Validate folder
    const validatedFolder = fileStorage.validateFolder(folder);

    // Check if file exists
    const exists = await fileStorage.fileExists({
      folder: validatedFolder,
      filename,
    });

    if (!exists) {
      return fail(res, 'File not found', 404);
    }

    // Get metadata
    const metadata = await fileStorage.getFileMetadata({
      folder: validatedFolder,
      filename,
    });

    return success(res, {
      folder: validatedFolder,
      filename,
      ...metadata,
      url: fileStorage.getPublicUrl({ folder: validatedFolder, filename }),
    });
  } catch (error) {
    console.error('[Files] Get metadata error:', error);

    if (error.code === 'FOLDER_NOT_ALLOWED') {
      return fail(res, 'Invalid folder', 400);
    }

    if (error.code === 'FILE_NOT_FOUND') {
      return fail(res, 'File not found', 404);
    }

    return fail(res, 'Failed to get file metadata', 500);
  }
}

// ============================================
// GET FOLDER STATS (ADMIN ONLY)
// ============================================

/**
 * GET /api/files/stats/:folder
 * Get storage statistics for a folder
 */
export async function getFolderStats(req, res) {
  try {
    const { folder } = req.params;

    // Validate folder
    const validatedFolder = fileStorage.validateFolder(folder);

    // Get stats
    const stats = await fileStorage.getFolderStats(validatedFolder);

    return success(res, {
      folder: validatedFolder,
      ...stats,
    });
  } catch (error) {
    console.error('[Files] Get folder stats error:', error);

    if (error.code === 'FOLDER_NOT_ALLOWED') {
      return fail(res, 'Invalid folder', 400);
    }

    return fail(res, 'Failed to get folder stats', 500);
  }
}