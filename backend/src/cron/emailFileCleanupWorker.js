// backend/src/cron/emailFileCleanupWorker.js

import cron from 'node-cron';
import prisma from '../config/prisma.js';
import fs from 'fs';
import path from 'path';

// ============================================
// CONFIGURATION
// ============================================

const EMAIL_ATTACHMENTS_DIR = path.resolve(process.cwd(), 'uploads/email_attachments');
const ORPHAN_FILE_AGE_HOURS = 24; // Files older than 24 hours without campaign association

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

    // Get all campaigns (to find referenced files)
    const campaigns = await prisma.emailBroadcastCampaign.findMany({
      select: {
        campaign_id: true,
        inline_image: true,
        attachments: true,
        status: true,
      },
    });

    // Build set of all referenced filenames
    const referencedFiles = new Set();
    
    for (const campaign of campaigns) {
      // Inline image
      if (campaign.inline_image?.filename) {
        referencedFiles.add(campaign.inline_image.filename);
      }
      
      // Attachments
      if (campaign.attachments && Array.isArray(campaign.attachments)) {
        campaign.attachments.forEach((att) => {
          if (att.filename) {
            referencedFiles.add(att.filename);
          }
        });
      }
    }

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
          fs.unlinkSync(filePath);
          cleaned++;
          console.log(`[File Cleanup] Deleted orphaned file: ${filename}`);
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
 * Clean up files for cancelled campaigns
 * (Called after campaign cancellation, but also runs periodically as safety net)
 */
async function cleanupCancelledCampaignFiles() {
  try {
    // Find cancelled campaigns that might have files
    const cancelledCampaigns = await prisma.emailBroadcastCampaign.findMany({
      where: {
        status: 'cancelled',
        OR: [
          { inline_image: { not: null } },
          { attachments: { not: null } },
        ],
      },
      select: {
        campaign_id: true,
        inline_image: true,
        attachments: true,
      },
    });

    let cleaned = 0;

    for (const campaign of cancelledCampaigns) {
      const filesToDelete = [];

      // Inline image
      if (campaign.inline_image?.filename) {
        filesToDelete.push(campaign.inline_image.filename);
      }

      // Attachments
      if (campaign.attachments && Array.isArray(campaign.attachments)) {
        campaign.attachments.forEach((att) => {
          if (att.filename) {
            filesToDelete.push(att.filename);
          }
        });
      }

      // Delete files
      for (const filename of filesToDelete) {
        const filePath = path.join(EMAIL_ATTACHMENTS_DIR, filename);
        
        if (fs.existsSync(filePath)) {
          try {
            fs.unlinkSync(filePath);
            cleaned++;
          } catch (err) {
            console.error(`[File Cleanup] Failed to delete ${filename}:`, err.message);
          }
        }
      }

      // Clear file references from campaign
      if (filesToDelete.length > 0) {
        await prisma.emailBroadcastCampaign.update({
          where: { campaign_id: campaign.campaign_id },
          data: {
            inline_image: null,
            attachments: [],
          },
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
 * Note: This is a safety net - files should be deleted when draft is deleted
 */
async function cleanupDeletedDraftFiles() {
  // This is handled by the delete draft function
  // This function serves as a safety net to catch any missed files
  return cleanupOrphanedFiles();
}

/**
 * Get storage statistics
 */
async function getStorageStats() {
  try {
    if (!fs.existsSync(EMAIL_ATTACHMENTS_DIR)) {
      return {
        total_files: 0,
        total_size: 0,
        total_size_formatted: '0 Bytes',
      };
    }

    const files = fs.readdirSync(EMAIL_ATTACHMENTS_DIR);
    let totalSize = 0;

    for (const filename of files) {
      const filePath = path.join(EMAIL_ATTACHMENTS_DIR, filename);
      try {
        const stats = fs.statSync(filePath);
        totalSize += stats.size;
      } catch (err) {
        // Ignore errors for individual files
      }
    }

    return {
      total_files: files.length,
      total_size: totalSize,
      total_size_formatted: formatFileSize(totalSize),
    };
  } catch (err) {
    console.error('[File Cleanup] Get storage stats failed:', err);
    return { error: err.message };
  }
}

/**
 * Format file size for display
 */
function formatFileSize(bytes) {
  if (!bytes || bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// ============================================
// MAIN CLEANUP FUNCTION
// ============================================

/**
 * Run all cleanup tasks
 */
async function runFileCleanup() {
  console.log('[File Cleanup] Starting email attachment cleanup...');
  
  try {
    // Clean cancelled campaign files
    const cancelledResult = await cleanupCancelledCampaignFiles();
    
    // Clean orphaned files
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

/**
 * Initialize the file cleanup cron job
 * Runs daily at 4:00 AM IST
 */
export function initializeFileCleanupWorker() {
  // Run at 4:00 AM IST (22:30 UTC previous day due to IST being UTC+5:30)
  // For simplicity, we'll use 4:00 AM server time
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