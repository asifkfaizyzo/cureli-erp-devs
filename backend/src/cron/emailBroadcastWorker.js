// backend/src/cron/emailBroadcastWorker.js

import cron from "node-cron";
import prisma from "../config/prisma.js";
import { withCronLock } from "./cronLock.js";
import {
  shouldPauseSending,
  getRemainingCapacity,
} from "../modules/cadmin/broadcast/email/emailBroadcast.quota.js";

// ============================================
// CONFIGURATION
// ============================================

const STUCK_THRESHOLD_MINUTES = 10;
const MAX_CAMPAIGNS_PER_CYCLE = 3;

const CAMPAIGN_STATUS = {
  DRAFT: "DRAFT",
  SCHEDULED: "SCHEDULED",
  SENDING: "SENDING",
  PAUSED: "PAUSED",
  SENT: "SENT",
  PARTIAL_FAILURE: "PARTIAL_FAILURE",
  FAILED: "FAILED",
  CANCELLED: "CANCELLED",
};

// ============================================
// PHASE 2: ATOMIC CAMPAIGN CLAIMS
//
// Uses PostgreSQL FOR UPDATE SKIP LOCKED to
// guarantee only one instance can claim a
// campaign, even if the cron lock fails.
//
// Defense-in-depth: cron lock is the primary
// gate, atomic claims are the safety net.
// ============================================

/**
 * Atomically claim one SCHEDULED campaign.
 * Returns the claimed campaign or null.
 *
 * FOR UPDATE SKIP LOCKED ensures:
 * - If another transaction holds the row → skip it
 * - Only one instance can claim a given campaign
 * - No duplicate email sends, guaranteed by PostgreSQL
 */
async function claimScheduledCampaign(beforeDate) {
  try {
    const results = await prisma.$queryRaw`
      UPDATE email_broadcast_campaigns
      SET processing = true,
          status = 'SENDING'::"EmailCampaignStatus",
          processing_started_at = NOW(),
          updated_at = NOW()
      WHERE campaign_id = (
        SELECT campaign_id
        FROM email_broadcast_campaigns
        WHERE status = 'SCHEDULED'::"EmailCampaignStatus"
          AND processing = false
          AND scheduled_for <= ${beforeDate}
        ORDER BY scheduled_for ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
      )
      RETURNING campaign_id, subject
    `;

    return results.length > 0 ? results[0] : null;
  } catch (err) {
    console.error("[Email Cron] Atomic claim (scheduled) failed:", err.message);
    return null;
  }
}

/**
 * Atomically claim one PAUSED campaign.
 * Same atomic guarantee as claimScheduledCampaign.
 */
async function claimPausedCampaign() {
  try {
    const results = await prisma.$queryRaw`
      UPDATE email_broadcast_campaigns
      SET processing = true,
          status = 'SENDING'::"EmailCampaignStatus",
          processing_started_at = NOW(),
          updated_at = NOW()
      WHERE campaign_id = (
        SELECT campaign_id
        FROM email_broadcast_campaigns
        WHERE status = 'PAUSED'::"EmailCampaignStatus"
          AND processing = false
        ORDER BY updated_at ASC
        LIMIT 1
        FOR UPDATE SKIP LOCKED
      )
      RETURNING campaign_id, subject
    `;

    return results.length > 0 ? results[0] : null;
  } catch (err) {
    console.error("[Email Cron] Atomic claim (paused) failed:", err.message);
    return null;
  }
}

// ============================================
// MAIN WORKER FUNCTION
// ============================================

/**
 * Main cron job function - runs every minute
 * Wrapped by withCronLock in initializeEmailBroadcastWorker
 */
async function processEmailBroadcasts() {
  const startTime = Date.now();

  try {
    // Step 1: Reset stuck campaigns
    await resetStuckProcessing();

    // Step 2: Check if sending is allowed (quota not exhausted)
    const quotaExhausted = await shouldPauseSending();

    if (quotaExhausted) {
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
    console.error("[Email Cron] Worker cycle failed:", err);
  }
}

// ============================================
// RESET STUCK PROCESSING
// (Unchanged — already safe behind cron lock,
//  and naturally idempotent)
// ============================================

async function resetStuckProcessing() {
  try {
    const threshold = new Date(
      Date.now() - STUCK_THRESHOLD_MINUTES * 60 * 1000,
    );

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

    console.log(
      `[Email Cron] Found ${stuckCampaigns.length} stuck campaign(s)`,
    );

    for (const campaign of stuckCampaigns) {
      let newStatus = CAMPAIGN_STATUS.PAUSED;

      if (
        campaign.delivered_count === 0 &&
        campaign.last_processed_index === 0
      ) {
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

      console.log(
        `[Email Cron] Reset stuck campaign ${campaign.campaign_id} (${campaign.subject}) to ${newStatus}`,
      );
    }
  } catch (err) {
    console.error("[Email Cron] Reset stuck processing failed:", err);
  }
}

// ============================================
// RESUME PAUSED CAMPAIGNS
// (Rewritten with atomic claims)
// ============================================

async function resumePausedCampaigns() {
  try {
    let processed = 0;

    while (processed < MAX_CAMPAIGNS_PER_CYCLE) {
      // Check quota before each claim
      const capacity = await getRemainingCapacity();
      if (capacity.remaining <= 0) {
        console.log("[Email Cron] Quota exhausted, stopping resume cycle");
        break;
      }

      // Atomically claim one paused campaign
      const claimed = await claimPausedCampaign();
      if (!claimed) break; // No more paused campaigns

      try {
        console.log(
          `[Email Cron] Resuming paused campaign: ${claimed.campaign_id} - "${claimed.subject}"`,
        );

        const { processCampaignSending } = await import(
          "../modules/cadmin/broadcast/email/cadminEmailBroadcast.service.js"
        );

        await processCampaignSending(claimed.campaign_id);

        console.log(
          `[Email Cron] ✅ Resumed campaign ${claimed.campaign_id} completed`,
        );
      } catch (err) {
        console.error(
          `[Email Cron] ❌ Failed to resume campaign ${claimed.campaign_id}:`,
          err.message,
        );

        // Reset campaign so it can be retried
        try {
          await prisma.emailBroadcastCampaign.update({
            where: { campaign_id: claimed.campaign_id },
            data: {
              processing: false,
              status: CAMPAIGN_STATUS.PAUSED,
              last_error: `Resume failed: ${err.message}`,
            },
          });
        } catch (_) {
          // resetStuckProcessing will catch it
        }
      }

      processed++;
    }
  } catch (err) {
    console.error("[Email Cron] Resume paused campaigns failed:", err);
  }
}

/**
 * Check if it's a new day (IST) and resume paused campaigns
 */
async function checkAndResumePausedCampaigns() {
  try {
    const capacity = await getRemainingCapacity();

    if (capacity.remaining > 0) {
      console.log(
        `[Email Cron] New day detected (IST: ${capacity.date}), quota available: ${capacity.remaining}`,
      );
      await resumePausedCampaigns();
    }
  } catch (err) {
    console.error("[Email Cron] Check and resume failed:", err);
  }
}

// ============================================
// PROCESS SCHEDULED CAMPAIGNS
// (Rewritten with atomic claims)
// ============================================

async function processScheduledCampaigns() {
  try {
    const now = new Date();
    let processed = 0;

    while (processed < MAX_CAMPAIGNS_PER_CYCLE) {
      // Check quota before each claim
      const capacity = await getRemainingCapacity();
      if (capacity.remaining <= 0) {
        console.log(
          "[Email Cron] Quota exhausted, remaining campaigns will be processed tomorrow",
        );
        break;
      }

      // Atomically claim one scheduled campaign
      const claimed = await claimScheduledCampaign(now);
      if (!claimed) break; // No more due campaigns

      try {
        console.log(
          `[Email Cron] Processing scheduled campaign: ${claimed.campaign_id} - "${claimed.subject}"`,
        );

        const { processCampaignSending } = await import(
          "../modules/cadmin/broadcast/email/cadminEmailBroadcast.service.js"
        );

        const result = await processCampaignSending(claimed.campaign_id);

        if (result?.paused) {
          console.log(
            `[Email Cron] ⏸️ Campaign ${claimed.campaign_id} paused (quota exhausted)`,
          );
        } else {
          console.log(
            `[Email Cron] ✅ Campaign ${claimed.campaign_id} completed - ${result?.delivered || 0} delivered, ${result?.failed || 0} failed`,
          );
        }
      } catch (err) {
        console.error(
          `[Email Cron] ❌ Failed to process campaign ${claimed.campaign_id}:`,
          err.message,
        );

        // Reset campaign so it can be retried
        try {
          await prisma.emailBroadcastCampaign.update({
            where: { campaign_id: claimed.campaign_id },
            data: {
              processing: false,
              status: CAMPAIGN_STATUS.PAUSED,
              last_error: `Processing failed: ${err.message}`,
            },
          });
        } catch (_) {
          // resetStuckProcessing will catch it
        }
      }

      processed++;
    }
  } catch (err) {
    console.error("[Email Cron] Process scheduled campaigns failed:", err);
  }
}

// ============================================
// INITIALIZE CRON JOB
// ============================================

/**
 * Initialize the email broadcast cron job
 * Runs every minute, wrapped with distributed lock
 *
 * REMOVED: setTimeout startup trigger
 * (unnecessary — cron fires within 60 seconds anyway,
 *  and it caused duplicate processing on multi-instance boot)
 */
export function initializeEmailBroadcastWorker() {
  cron.schedule("* * * * *", () =>
    withCronLock("email-broadcast", 5, processEmailBroadcasts),
  );

  console.log(
    "[Email Cron] Email broadcast worker initialized (every 1 minute)",
  );
}

// ============================================
// MANUAL TRIGGERS (for admin use)
// (Unchanged — admin-triggered, not cron-triggered,
//  doesn't need distributed locking)
// ============================================

/**
 * Manually trigger processing of a specific campaign
 */
export async function manuallyProcessCampaign(campaignId) {
  try {
    const campaign = await prisma.emailBroadcastCampaign.findUnique({
      where: { campaign_id: campaignId },
    });

    if (!campaign) {
      throw new Error("Campaign not found");
    }

    if (
      ![CAMPAIGN_STATUS.PAUSED, CAMPAIGN_STATUS.FAILED].includes(
        campaign.status,
      )
    ) {
      throw new Error(
        `Cannot manually process campaign with status: ${campaign.status}`,
      );
    }

    const capacity = await getRemainingCapacity();
    if (capacity.remaining <= 0) {
      throw new Error("Daily quota exhausted. Try again tomorrow.");
    }

    console.log(
      `[Email Cron] Manual processing triggered for campaign ${campaignId}`,
    );

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
      "../modules/cadmin/broadcast/email/cadminEmailBroadcast.service.js"
    );

    const result = await processCampaignSending(campaignId);

    return result;
  } catch (err) {
    console.error(
      `[Email Cron] Manual processing failed for ${campaignId}:`,
      err,
    );
    throw err;
  }
}

/**
 * Get worker status (for monitoring)
 */
export async function getWorkerStatus() {
  const [scheduledCount, pausedCount, sendingCount, capacity] =
    await Promise.all([
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