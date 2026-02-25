// backend/src/cron/jobs.js

import cron from "node-cron";
import prisma from "../config/prisma.js";
import { withCronLock, getInstanceId } from "./cronLock.js";
import { transitionDeprecatedPlans } from "../modules/cadmin/plans/cadminPlans.service.js";
import { cleanupExpiredSessions } from "../utils/session.js";
import {
  cleanupOldPendingUsers,
  cleanupIncompleteUsers,
  cleanupOldDeletionLogs,
} from "../utils/cleanup.js";
import { initializeEmailBroadcastWorker } from "./emailBroadcastWorker.js";
import { initializeFileCleanupWorker } from "./emailFileCleanupWorker.js";

// Subscription imports
import {
  transitionExpiredToGrace,
  suspendExpiredGrace,
  transitionPendingToOverdue,
  getSubscriptionsDueForReminders,
} from "../modules/subscription/subscription.service.js";

// Inventory imports
import inventoryService from "../modules/inventory/inventory.service.js";

import {
  notifyAsync,
  NOTIFICATION_EVENTS,
} from "../modules/notifications/index.js";

// ============================================
// CRON 5: SCHEDULED BROADCASTS - Every 5 minutes
// ============================================

async function processScheduledBroadcasts() {
  console.log("[CRON] Checking for scheduled broadcasts...");

  try {
    const now = new Date();

    const dueBroadcasts = await prisma.broadcastCampaign.findMany({
      where: {
        status: "scheduled",
        scheduled_for: {
          lte: now,
        },
      },
      orderBy: {
        scheduled_for: "asc",
      },
    });

    if (dueBroadcasts.length === 0) {
      console.log("[CRON] No scheduled broadcasts due for sending");
      return;
    }

    console.log(`[CRON] Found ${dueBroadcasts.length} broadcast(s) to send`);

    let sent = 0;
    let failed = 0;

    for (const campaign of dueBroadcasts) {
      try {
        console.log(
          `[CRON] Sending broadcast: ${campaign.campaign_id} - "${campaign.title}"`,
        );

        const { sendScheduled } = await import(
          "../modules/cadmin/broadcast/inapp/cadminInAppBroadcast.service.js"
        );

        const result = await sendScheduled(campaign.campaign_id);

        console.log(
          `[CRON] ✅ Broadcast ${campaign.campaign_id} sent to ${result.sent} recipients`,
        );
        sent++;
      } catch (err) {
        console.error(
          `[CRON] ❌ Failed to send broadcast ${campaign.campaign_id}:`,
          err.message,
        );
        failed++;
      }
    }

    console.log(
      `[CRON] Scheduled broadcasts complete: ${sent} sent, ${failed} failed`,
    );
  } catch (err) {
    console.error("[CRON] Scheduled broadcasts job failed:", err);
  }
}

function initializeScheduledBroadcastsJob() {
  cron.schedule("*/5 * * * *", () =>
    withCronLock("scheduled-broadcasts", 10, processScheduledBroadcasts),
  );
  console.log("[CRON] Scheduled broadcasts job initialized (every 5 minutes)");
}

// ============================================
// SESSION CLEANUP - Every hour
// ============================================

async function runSessionCleanup() {
  try {
    const count = await cleanupExpiredSessions();
    if (count > 0) {
      console.log(`[CRON] Cleaned up ${count} expired sessions`);
    }
  } catch (err) {
    console.error("[CRON] Session cleanup failed:", err);
  }
}

// ============================================
// PLAN STATUS TRANSITION - Daily at 2:00 AM
// ============================================

function initializePlanTransitionJob() {
  cron.schedule("0 2 * * *", () =>
    withCronLock("plan-transition", 30, async () => {
      console.log("[CRON] Starting plan status transition check...");

      try {
        const result = await transitionDeprecatedPlans();

        console.log(`[CRON] Plan transition complete:`);
        console.log(`  - Checked: ${result.checked} deprecated plans`);
        console.log(
          `  - Transitioned: ${result.transitioned} plans to SUSPENDED`,
        );

        if (result.transitioned > 0) {
          console.log(
            `  - Plans: ${result.plans.map((p) => p.name).join(", ")}`,
          );
        }
      } catch (err) {
        console.error("[CRON] Plan transition job failed:", err);
      }
    }),
  );

  console.log("[CRON] Plan transition job scheduled (daily at 2:00 AM)");
}

// ============================================
// CRON 1: SUBSCRIPTION LIFECYCLE (Every hour)
// ============================================

function initializeSubscriptionLifecycleJob() {
  cron.schedule("0 * * * *", () =>
    withCronLock("subscription-lifecycle", 30, async () => {
      console.log("[CRON] Starting subscription lifecycle check...");

      try {
        // 1. Expired → Grace Period
        const graceResult = await transitionExpiredToGrace();
        if (graceResult.transitioned > 0) {
          console.log(
            `[CRON] Expired → Grace: ${graceResult.transitioned} subscriptions`,
          );

          for (const r of graceResult.results) {
            console.log(
              `       - ${r.shop_name}: grace until ${r.grace_period_until.toISOString().split("T")[0]}`,
            );

            notifyAsync({
              type: NOTIFICATION_EVENTS.SUBSCRIPTION_GRACE_STARTED,
              context: {
                shop_id: r.shop_id,
                shop_name: r.shop_name,
                end_date: r.end_date,
                grace_period_until: r.grace_period_until,
              },
            });
          }
        }

        // 2. Grace Expired → Suspended
        const suspendResult = await suspendExpiredGrace();
        if (suspendResult.suspended > 0) {
          console.log(
            `[CRON] Grace → Suspended: ${suspendResult.suspended} subscriptions`,
          );

          for (const r of suspendResult.results) {
            console.log(`       - ${r.shop_name} (${r.shop_id}): SUSPENDED`);

            notifyAsync({
              type: NOTIFICATION_EVENTS.SUBSCRIPTION_SUSPENDED,
              context: {
                shop_id: r.shop_id,
                shop_name: r.shop_name,
              },
            });
          }
        }

        console.log(`[CRON] Subscription lifecycle complete`);
        console.log(
          `       Grace: ${graceResult.transitioned} | Suspended: ${suspendResult.suspended}`,
        );
      } catch (err) {
        console.error("[CRON] Subscription lifecycle job failed:", err);
      }
    }),
  );

  console.log("[CRON] Subscription lifecycle job scheduled (every hour)");
}

// ============================================
// CRON 2: PAYMENT STATUS SYNC - Daily at 1:00 AM
// ============================================

function initializePaymentStatusSyncJob() {
  cron.schedule("0 1 * * *", () =>
    withCronLock("payment-sync", 30, async () => {
      console.log("[CRON] Starting payment status sync...");

      try {
        const result = await transitionPendingToOverdue();

        if (result.updated > 0) {
          console.log(
            `[CRON] Pending → Overdue: ${result.updated} subscriptions`,
          );
        }

        console.log(`[CRON] Payment status sync complete`);
      } catch (err) {
        console.error("[CRON] Payment status sync failed:", err);
      }
    }),
  );

  console.log("[CRON] Payment status sync job scheduled (daily at 1:00 AM)");
}

// ============================================
// CRON 3: REMINDERS & FINAL WARNINGS - Daily at 9:00 AM
// ============================================

function initializeReminderJob() {
  cron.schedule("0 9 * * *", () =>
    withCronLock("reminder-emails", 60, async () => {
      console.log("[CRON] Starting reminder emails...");

      try {
        const reminders = await getSubscriptionsDueForReminders();

        // 7 DAYS BEFORE EXPIRY
        if (reminders.expiring7Days.length > 0) {
          console.log(
            `[CRON] Expiring in 7 days: ${reminders.expiring7Days.length} shops`,
          );
          for (const sub of reminders.expiring7Days) {
            notifyAsync({
              type: NOTIFICATION_EVENTS.SUBSCRIPTION_EXPIRING_7_DAYS,
              context: {
                shop_id: sub.shop_id,
                shop_name: sub.shop.business_name,
                end_date: sub.end_date,
                plan_name: sub.plan?.name || "Standard",
                daysLeft: 7,
              },
            });
          }
        }

        // 3 DAYS BEFORE EXPIRY
        if (reminders.expiring3Days.length > 0) {
          console.log(
            `[CRON] Expiring in 3 days: ${reminders.expiring3Days.length} shops`,
          );
          for (const sub of reminders.expiring3Days) {
            notifyAsync({
              type: NOTIFICATION_EVENTS.SUBSCRIPTION_EXPIRING_3_DAYS,
              context: {
                shop_id: sub.shop_id,
                shop_name: sub.shop.business_name,
                end_date: sub.end_date,
                plan_name: sub.plan?.name || "Standard",
                daysLeft: 3,
              },
            });
          }
        }

        // GRACE ENDING TOMORROW
        if (reminders.graceEndingSoon.length > 0) {
          console.log(
            `[CRON] Grace ending tomorrow: ${reminders.graceEndingSoon.length} shops`,
          );
          for (const sub of reminders.graceEndingSoon) {
            notifyAsync({
              type: NOTIFICATION_EVENTS.SUBSCRIPTION_GRACE_ENDING,
              context: {
                shop_id: sub.shop_id,
                shop_name: sub.shop.business_name,
                grace_period_until: sub.grace_period_until,
              },
            });
          }
        }

        console.log("[CRON] All reminder emails dispatched");
      } catch (err) {
        console.error("[CRON] Reminder job failed:", err);
      }
    }),
  );

  console.log("[CRON] Reminder job scheduled (daily at 9:00 AM)");
}

// ============================================
// CRON 4: INVENTORY EXPIRY CHECKS - Daily at 6:00 AM
// ============================================

function initializeInventoryExpiryJob() {
  cron.schedule("0 6 * * *", () =>
    withCronLock("inventory-expiry", 60, async () => {
      console.log("[CRON] Starting inventory expiry checks...");

      try {
        const shops = await prisma.shop.findMany({
          where: { is_active: true },
          select: { shop_id: true, business_name: true },
        });

        let totalExpired = 0;
        let totalNearExpiry = 0;

        for (const shop of shops) {
          try {
            const expiredResult = await inventoryService.markExpiredItems(
              shop.shop_id,
            );
            totalExpired += expiredResult.count || 0;

            if (expiredResult.count > 0) {
              console.log(
                `       - ${shop.business_name}: ${expiredResult.count} items expired`,
              );
            }

            const nearExpiryResult =
              await inventoryService.sendNearExpiryAlerts(shop.shop_id, 30);
            totalNearExpiry += nearExpiryResult.sent || 0;

            if (nearExpiryResult.sent > 0) {
              console.log(
                `       - ${shop.business_name}: ${nearExpiryResult.sent} near-expiry alerts sent`,
              );
            }
          } catch (shopErr) {
            console.error(
              `       - ${shop.business_name} failed:`,
              shopErr.message,
            );
          }
        }

        console.log(`[CRON] Inventory expiry checks complete`);
        console.log(
          `       Expired: ${totalExpired} | Near-expiry alerts: ${totalNearExpiry}`,
        );
      } catch (err) {
        console.error("[CRON] Inventory expiry job failed:", err);
      }
    }),
  );

  console.log("[CRON] Inventory expiry job scheduled (daily at 6:00 AM)");
}

// ============================================
// INITIALIZE ALL CRON JOBS
// ============================================

export function initializeCronJobs() {
  console.log("Initializing cron jobs...");
  console.log(`[CRON] Instance ID: ${getInstanceId()}`);
  console.log("[CRON] Distributed locking: ENABLED");

  // Email broadcast worker (has its own lock + atomic claims)
  initializeEmailBroadcastWorker();
  initializeFileCleanupWorker();
  console.log("   - Email broadcast worker: Every 1 minute");
  console.log("   - Email file cleanup: Daily at 4:00 AM");

  // Session cleanup (every hour)
  setInterval(
    () => withCronLock("session-cleanup", 10, runSessionCleanup),
    60 * 60 * 1000,
  );
  // Run once on startup
  withCronLock("session-cleanup", 10, runSessionCleanup);

  // Scheduled jobs
  initializePlanTransitionJob();
  initializeSubscriptionLifecycleJob();
  initializePaymentStatusSyncJob();
  initializeReminderJob();
  initializeInventoryExpiryJob();
  initializeScheduledBroadcastsJob();

  // Cleanup jobs
  cron.schedule("0 3 * * *", () =>
    withCronLock("cleanup-pending-users", 15, async () => {
      console.log("🧹 [CRON] Running pending users cleanup...");
      try {
        await cleanupOldPendingUsers();
        console.log("✅ [CRON] Pending users cleanup completed");
      } catch (err) {
        console.error("❌ [CRON] Pending users cleanup failed:", err);
      }
    }),
  );

  cron.schedule("15 3 * * *", () =>
    withCronLock("cleanup-incomplete-users", 15, async () => {
      console.log("🧹 [CRON] Running incomplete users cleanup...");
      try {
        const result = await cleanupIncompleteUsers();
        console.log(
          `✅ [CRON] Incomplete users cleanup completed: ${result.deleted} deleted`,
        );
      } catch (err) {
        console.error("❌ [CRON] Incomplete users cleanup failed:", err);
      }
    }),
  );

  cron.schedule("30 3 * * *", () =>
    withCronLock("cleanup-deletion-logs", 15, async () => {
      console.log("🧹 [CRON] Running deletion logs cleanup...");
      try {
        const count = await cleanupOldDeletionLogs();
        console.log(
          `✅ [CRON] Deletion logs cleanup completed: ${count} old logs removed`,
        );
      } catch (err) {
        console.error("❌ [CRON] Deletion logs cleanup failed:", err);
      }
    }),
  );

  console.log("All cron jobs initialized:");
  console.log("   - Session cleanup: Every hour");
  console.log("   - Plan transition: Daily at 2:00 AM");
  console.log("   - Subscription lifecycle + emails: Every hour");
  console.log("   - Payment status sync: Daily at 1:00 AM");
  console.log("   - Inventory expiry checks + alerts: Daily at 6:00 AM");
  console.log("   - Reminder emails (7d/3d/final): Daily at 9:00 AM");
  console.log("   - Pending users cleanup: Daily at 3:00 AM");
  console.log("   - Incomplete users cleanup: Daily at 3:15 AM");
  console.log("   - Deletion logs cleanup: Daily at 3:30 AM");
  console.log("   - Scheduled broadcasts: Every 5 minutes");
}