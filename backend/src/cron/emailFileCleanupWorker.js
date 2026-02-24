// backend/src/cron/emailFileCleanupWorker.js

import cron from 'node-cron';
import prisma from '../config/prisma.js';
import * as fileStorage from '../services/fileStorage.service.js';  // ✅ ADD THIS
import fs from 'fs';
import path from 'path';

// ============================================
// CONFIGURATION
// ============================================

const EMAIL_ATTACHMENTS_DIR = path.resolve(process.cwd(), 'uploads/email_attachments');
const ORPHAN_FILE_AGE_HOURS = 24;

// ============================================
// FILE CLEANUP FUNCTIONS
// ============================================

/**
 * Clean up orphaned files that are not associated with any campaign
 */
async function cleanupOrphanedFiles() {
  try {
    // Ensure directory exists
    if (!fs.existsSync(EMAIL_ATTACHMENTS_DIR)) {
      return { cleaned: 0, message: 'Upload directory does not exist' };
    }

    // Get all files in directory
    const files = fs.readdirSync(EMAIL_ATTACHMENTS_DIR);
    
    if (files.length === 0) {
      return { cleaned: 0, message: 'No files to clean' };
    }

    // ✅ Get all referenced filenames from NEW TABLE
    const referencedAttachments = await prisma.emailBroadcastAttachment.findMany({
      select: { storage_key: true },
    });

    const referencedFiles = new Set(referencedAttachments.map(att => att.storage_key));

    // Find orphaned files (not referenced and older than threshold)
    const orphanThreshold = Date.now() - (ORPHAN_FILE_AGE_HOURS * 60 * 60 * 1000);
    let cleaned = 0;

    for (const filename of files) {
      // Skip if file is referenced
      if (referencedFiles.has(filename)) {
        continue;
      }

      const filePath = path.join(EMAIL_ATTACHMENTS_DIR, filename);
      
      try {
        const stats = fs.statSync(filePath);
        
        // Only delete if file is older than threshold
        if (stats.mtimeMs < orphanThreshold) {
          // ✅ USE NEW SERVICE
          const deleted = await fileStorage.deleteFile({
            folder: 'email_attachments',
            filename,
          });
          
          if (deleted) {
            cleaned++;
            console.log(`[File Cleanup] Deleted orphaned file: ${filename}`);
          }
        }
      } catch (err) {
        console.error(`[File Cleanup] Failed to process file ${filename}:`, err.message);
      }
    }

    if (cleaned > 0) {
      console.log(`[File Cleanup] Cleaned ${cleaned} orphaned file(s)`);
    }

    return { cleaned, message: `Cleaned ${cleaned} orphaned files` };
  } catch (err) {
    console.error('[File Cleanup] Cleanup failed:', err);
    return { cleaned: 0, error: err.message };
  }
}

/**
 * ✅ UPDATED: Clean up files for cancelled campaigns
 */
async function cleanupCancelledCampaignFiles() {
  try {
    // Find cancelled campaigns with attachments
    const cancelledCampaigns = await prisma.emailBroadcastCampaign.findMany({
      where: {
        status: 'CANCELLED',  // ✅ Use enum value
      },
      include: {
        attachmentFiles: true,  // ✅ Use new relation
      },
    });

    let cleaned = 0;

    for (const campaign of cancelledCampaigns) {
      if (campaign.attachmentFiles.length === 0) continue;

      const filesToDelete = campaign.attachmentFiles.map(att => ({
        folder: 'email_attachments',
        filename: att.storage_key,
      }));

      // Delete files using new service
      const result = await fileStorage.deleteFiles(filesToDelete);
      cleaned += result.deleted;

      // Delete attachment records
      if (result.deleted > 0) {
        await prisma.emailBroadcastAttachment.deleteMany({
          where: { campaign_id: campaign.campaign_id },
        });
      }
    }

    if (cleaned > 0) {
      console.log(`[File Cleanup] Cleaned ${cleaned} file(s) from cancelled campaigns`);
    }

    return { cleaned };
  } catch (err) {
    console.error('[File Cleanup] Cancelled campaign cleanup failed:', err);
    return { cleaned: 0, error: err.message };
  }
}

/**
 * Clean up files for deleted draft campaigns
 */
async function cleanupDeletedDraftFiles() {
  return cleanupOrphanedFiles();
}

/**
 * ✅ UPDATED: Get storage statistics
 */
async function getStorageStats() {
  try {
    return await fileStorage.getFolderStats('email_attachments');
  } catch (err) {
    console.error('[File Cleanup] Get storage stats failed:', err);
    return { error: err.message };
  }
}

// ============================================
// MAIN CLEANUP FUNCTION
// ============================================

async function runFileCleanup() {
  console.log('[File Cleanup] Starting email attachment cleanup...');
  
  try {
    const cancelledResult = await cleanupCancelledCampaignFiles();
    const orphanedResult = await cleanupOrphanedFiles();
    
    const totalCleaned = (cancelledResult.cleaned || 0) + (orphanedResult.cleaned || 0);
    
    if (totalCleaned > 0) {
      console.log(`[File Cleanup] Completed - cleaned ${totalCleaned} total file(s)`);
    }
    
    return {
      cancelled_files: cancelledResult.cleaned || 0,
      orphaned_files: orphanedResult.cleaned || 0,
      total_cleaned: totalCleaned,
    };
  } catch (err) {
    console.error('[File Cleanup] Cleanup failed:', err);
    return { error: err.message };
  }
}

// ============================================
// INITIALIZE CRON JOB
// ============================================

export function initializeFileCleanupWorker() {
  cron.schedule('0 4 * * *', runFileCleanup);
  console.log('[File Cleanup] Email attachment cleanup worker initialized (daily at 4:00 AM)');
}

export {
  runFileCleanup,
  cleanupOrphanedFiles,
  cleanupCancelledCampaignFiles,
  getStorageStats,
};

export default {
  initializeFileCleanupWorker,
  runFileCleanup,
  cleanupOrphanedFiles,
  cleanupCancelledCampaignFiles,
  getStorageStats,
};