// backend/src/cron/emailBroadcastWorker.js

import cron from 'node-cron';
import prisma from '../config/prisma.js';
import {
  shouldPauseSending,
  getCurrentISTDate,
  getRemainingCapacity,
} from '../modules/cadmin/broadcast/email/emailBroadcast.quota.js';

// ============================================
// CONFIGURATION
// ============================================

const STUCK_THRESHOLD_MINUTES = 10;
const MAX_CAMPAIGNS_PER_CYCLE = 3; // Process max 3 campaigns per minute

const CAMPAIGN_STATUS = {
  DRAFT: 'DRAFT',
  SCHEDULED: 'SCHEDULED',
  SENDING: 'SENDING',
  PAUSED: 'PAUSED',
  SENT: 'SENT',
  PARTIAL_FAILURE: 'PARTIAL_FAILURE',
  FAILED: 'FAILED',
  CANCELLED: 'CANCELLED',
};

// ============================================
// MAIN WORKER FUNCTION
// ============================================

/**
 * Main cron job function - runs every minute
 */
async function processEmailBroadcasts() {
  const startTime = Date.now();
  
  try {
    // Step 1: Reset stuck campaigns
    await resetStuckProcessing();

    // Step 2: Check if sending is allowed (quota not exhausted)
    const quotaExhausted = await shouldPauseSending();
    
    if (quotaExhausted) {
      // Don't process new campaigns, but check for day change to resume paused
      await checkAndResumePausedCampaigns();
      return;
    }

    // Step 3: Resume paused campaigns first (they have priority)
    await resumePausedCampaigns();

    // Step 4: Process scheduled campaigns that are due
    await processScheduledCampaigns();

    const duration = Date.now() - startTime;
    if (duration > 5000) {
      console.log(`[Email Cron] Cycle completed in ${duration}ms`);
    }
  } catch (err) {
    console.error('[Email Cron] Worker cycle failed:', err);
  }
}

// ============================================
// RESET STUCK PROCESSING
// ============================================

/**
 * Reset campaigns stuck in processing state for too long
 */
async function resetStuckProcessing() {
  try {
    const threshold = new Date(Date.now() - STUCK_THRESHOLD_MINUTES * 60 * 1000);

    const stuckCampaigns = await prisma.emailBroadcastCampaign.findMany({
      where: {
        processing: true,
        processing_started_at: { lt: threshold },
        status: { in: [CAMPAIGN_STATUS.SENDING] },
      },
      select: {
        campaign_id: true,
        subject: true,
        delivered_count: true,
        failed_count: true,
        last_processed_index: true,
      },
    });

    if (stuckCampaigns.length === 0) return;

    console.log(`[Email Cron] Found ${stuckCampaigns.length} stuck campaign(s)`);

    for (const campaign of stuckCampaigns) {
      // Determine status based on what was sent
      let newStatus = CAMPAIGN_STATUS.PAUSED;
      
      // If nothing was sent, mark as failed
      if (campaign.delivered_count === 0 && campaign.last_processed_index === 0) {
        newStatus = CAMPAIGN_STATUS.FAILED;
      }

      await prisma.emailBroadcastCampaign.update({
        where: { campaign_id: campaign.campaign_id },
        data: {
          processing: false,
          status: newStatus,
          last_error: `Processing stuck for more than ${STUCK_THRESHOLD_MINUTES} minutes - reset to ${newStatus}`,
        },
      });

      console.log(`[Email Cron] Reset stuck campaign ${campaign.campaign_id} (${campaign.subject}) to ${newStatus}`);
    }
  } catch (err) {
    console.error('[Email Cron] Reset stuck processing failed:', err);
  }
}

// ============================================
// RESUME PAUSED CAMPAIGNS
// ============================================

/**
 * Resume paused campaigns (when quota becomes available)
 */
async function resumePausedCampaigns() {
  try {
    // Check if we have quota
    const capacity = await getRemainingCapacity();
    if (capacity.remaining <= 0) {
      return;
    }

    // Find paused campaigns (oldest first)
    const pausedCampaigns = await prisma.emailBroadcastCampaign.findMany({
      where: {
        status: CAMPAIGN_STATUS.PAUSED,
        processing: false,
      },
      orderBy: { updated_at: 'asc' },
      take: MAX_CAMPAIGNS_PER_CYCLE,
    });

    if (pausedCampaigns.length === 0) return;

    console.log(`[Email Cron] Found ${pausedCampaigns.length} paused campaign(s) to resume`);

    for (const campaign of pausedCampaigns) {
      // Check quota before each campaign
      const currentCapacity = await getRemainingCapacity();
      if (currentCapacity.remaining <= 0) {
        console.log('[Email Cron] Quota exhausted, stopping resume cycle');
        break;
      }

      try {
        console.log(`[Email Cron] Resuming paused campaign: ${campaign.campaign_id} - "${campaign.subject}"`);
        
        // Lock the campaign
        await prisma.emailBroadcastCampaign.update({
          where: { campaign_id: campaign.campaign_id },
          data: {
            status: CAMPAIGN_STATUS.SENDING,
            processing: true,
            processing_started_at: new Date(),
          },
        });

        // Import and process
        const { processCampaignSending } = await import(
          '../modules/cadmin/broadcast/email/cadminEmailBroadcast.service.js'
        );

        await processCampaignSending(campaign.campaign_id);
        
        console.log(`[Email Cron] ✅ Resumed campaign ${campaign.campaign_id} completed`);
      } catch (err) {
        console.error(`[Email Cron] ❌ Failed to resume campaign ${campaign.campaign_id}:`, err.message);
      }
    }
  } catch (err) {
    console.error('[Email Cron] Resume paused campaigns failed:', err);
  }
}

/**
 * Check if it's a new day (IST) and resume paused campaigns
 */
async function checkAndResumePausedCampaigns() {
  try {
    const capacity = await getRemainingCapacity();
    
    // If quota is available (new day started), resume paused campaigns
    if (capacity.remaining > 0) {
      console.log(`[Email Cron] New day detected (IST: ${capacity.date}), quota available: ${capacity.remaining}`);
      await resumePausedCampaigns();
    }
  } catch (err) {
    console.error('[Email Cron] Check and resume failed:', err);
  }
}

// ============================================
// PROCESS SCHEDULED CAMPAIGNS
// ============================================

/**
 * Process scheduled campaigns that are due
 */
async function processScheduledCampaigns() {
  try {
    const now = new Date();

    // Find campaigns that are scheduled and due
    const dueCampaigns = await prisma.emailBroadcastCampaign.findMany({
      where: {
        status: CAMPAIGN_STATUS.SCHEDULED,
        scheduled_for: { lte: now },
        processing: false,
      },
      orderBy: { scheduled_for: 'asc' },
      take: MAX_CAMPAIGNS_PER_CYCLE,
    });

    if (dueCampaigns.length === 0) return;

    console.log(`[Email Cron] Found ${dueCampaigns.length} scheduled campaign(s) to send`);

    for (const campaign of dueCampaigns) {
      // Check quota before each campaign
      const capacity = await getRemainingCapacity();
      if (capacity.remaining <= 0) {
        console.log('[Email Cron] Quota exhausted, remaining campaigns will be processed tomorrow');
        
        // Mark remaining as paused
        await prisma.emailBroadcastCampaign.update({
          where: { campaign_id: campaign.campaign_id },
          data: {
            status: CAMPAIGN_STATUS.PAUSED,
            last_error: 'Daily quota exhausted - will resume tomorrow',
          },
        });
        
        break;
      }

      try {
        console.log(`[Email Cron] Processing scheduled campaign: ${campaign.campaign_id} - "${campaign.subject}"`);

        // Lock the campaign
        await prisma.emailBroadcastCampaign.update({
          where: { campaign_id: campaign.campaign_id },
          data: {
            status: CAMPAIGN_STATUS.SENDING,
            processing: true,
            processing_started_at: new Date(),
          },
        });

        // Import and process
        const { processCampaignSending } = await import(
          '../modules/cadmin/broadcast/email/cadminEmailBroadcast.service.js'
        );

        const result = await processCampaignSending(campaign.campaign_id);
        
        if (result?.paused) {
          console.log(`[Email Cron] ⏸️ Campaign ${campaign.campaign_id} paused (quota exhausted)`);
        } else {
          console.log(`[Email Cron] ✅ Campaign ${campaign.campaign_id} completed - ${result?.delivered || 0} delivered, ${result?.failed || 0} failed`);
        }
      } catch (err) {
        console.error(`[Email Cron] ❌ Failed to process campaign ${campaign.campaign_id}:`, err.message);
      }
    }
  } catch (err) {
    console.error('[Email Cron] Process scheduled campaigns failed:', err);
  }
}

// ============================================
// INITIALIZE CRON JOB
// ============================================

/**
 * Initialize the email broadcast cron job
 * Runs every minute
 */
export function initializeEmailBroadcastWorker() {
  // Run every minute
  cron.schedule('* * * * *', processEmailBroadcasts);
  
  console.log('[Email Cron] Email broadcast worker initialized (every 1 minute)');
  
  // Also run immediately on startup to catch any pending campaigns
  setTimeout(() => {
    console.log('[Email Cron] Running initial check...');
    processEmailBroadcasts().catch((err) => {
      console.error('[Email Cron] Initial check failed:', err);
    });
  }, 5000); // Wait 5 seconds for app to fully initialize
}

// ============================================
// MANUAL TRIGGERS (for admin use)
// ============================================

/**
 * Manually trigger processing of a specific campaign
 * Useful for admin retry functionality
 */
export async function manuallyProcessCampaign(campaignId) {
  try {
    const campaign = await prisma.emailBroadcastCampaign.findUnique({
      where: { campaign_id: campaignId },
    });

    if (!campaign) {
      throw new Error('Campaign not found');
    }

    // Can only manually process paused or failed campaigns
    if (![CAMPAIGN_STATUS.PAUSED, CAMPAIGN_STATUS.FAILED].includes(campaign.status)) {
      throw new Error(`Cannot manually process campaign with status: ${campaign.status}`);
    }

    // Check quota
    const capacity = await getRemainingCapacity();
    if (capacity.remaining <= 0) {
      throw new Error('Daily quota exhausted. Try again tomorrow.');
    }

    console.log(`[Email Cron] Manual processing triggered for campaign ${campaignId}`);

    // Reset and reprocess
    await prisma.emailBroadcastCampaign.update({
      where: { campaign_id: campaignId },
      data: {
        status: CAMPAIGN_STATUS.SENDING,
        processing: true,
        processing_started_at: new Date(),
        last_error: null,
      },
    });

    const { processCampaignSending } = await import(
      '../modules/cadmin/broadcast/email/cadminEmailBroadcast.service.js'
    );

    const result = await processCampaignSending(campaignId);
    
    return result;
  } catch (err) {
    console.error(`[Email Cron] Manual processing failed for ${campaignId}:`, err);
    throw err;
  }
}

/**
 * Get worker status (for monitoring)
 */
export async function getWorkerStatus() {
  const [
    scheduledCount,
    pausedCount,
    sendingCount,
    capacity,
  ] = await Promise.all([
    prisma.emailBroadcastCampaign.count({
      where: { status: CAMPAIGN_STATUS.SCHEDULED },
    }),
    prisma.emailBroadcastCampaign.count({
      where: { status: CAMPAIGN_STATUS.PAUSED },
    }),
    prisma.emailBroadcastCampaign.count({
      where: { status: CAMPAIGN_STATUS.SENDING, processing: true },
    }),
    getRemainingCapacity(),
  ]);

  return {
    scheduled_campaigns: scheduledCount,
    paused_campaigns: pausedCount,
    currently_sending: sendingCount,
    quota: {
      date: capacity.date,
      used: capacity.used,
      remaining: capacity.remaining,
      limit: capacity.limit,
    },
    worker_active: true,
  };
}

export default {
  initializeEmailBroadcastWorker,
  processEmailBroadcasts,
  manuallyProcessCampaign,
  getWorkerStatus,
};